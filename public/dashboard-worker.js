import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  addDoc,
  getDocs,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import { storage } from "./firebase-config.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";

/* =========================
   Helpers (no rompe si falta un ID)
========================= */
function $(id) {
  return document.getElementById(id);
}
function safeText(el, value) {
  if (el) el.textContent = value;
}
function safeHTML(el, value) {
  if (el) el.innerHTML = value;
}
function safeSrc(el, value) {
  if (el) el.src = value;
}
function safeAddClass(el, cls) {
  if (el) el.classList.add(cls);
}
function safeRemoveClass(el, cls) {
  if (el) el.classList.remove(cls);
}
function safeOn(el, evt, fn) {
  if (el) el.addEventListener(evt, fn);
}

/* =========================
   State
========================= */
let myAppliedJobIds = new Set();
let workerUid = null;
let currentUid = null;
let currentAvailable = false;
let latestJobs = [];
let currentWorkerName = "";


/* =========================
   DOM
========================= */
// Topbar
const who = $("who");
const availabilityBadge = $("availabilityBadge");
const toggleAvail = $("toggleAvail");
const logoutBtn = $("logoutBtn");
const myAppsList = document.getElementById("myAppsList");
const workerHistoryList = document.getElementById("workerHistoryList");

// Turnos
const jobsList = $("jobsList");
const contactReqList = document.getElementById("contactReqList");

//Contacto
const shareContactModal = document.getElementById("shareContactModal");
const closeShareContact = document.getElementById("closeShareContact");
const shareContactForm = document.getElementById("shareContactForm");
const shareReqId = document.getElementById("shareReqId");
const shareWhatsapp = document.getElementById("shareWhatsapp");
const sharePhone = document.getElementById("sharePhone");
const shareEmail = document.getElementById("shareEmail");
const shareContactMsg = document.getElementById("shareContactMsg");


// Card "Mi perfil"
const profilePhoto = $("profilePhoto");
const pName = $("pName");
const pRole = $("pRole");
const pLocation = $("pLocation");
const pBio = $("pBio");
const pDays = $("pDays");
const pHours = $("pHours");

// Editar perfil (modal)
const profileForm = $("profileForm");
const editName = $("editName");
const editLocation = $("editLocation");
const editBio = $("editBio");
const editHours = $("editHours");

const openEditProfile = $("openEditProfile");
const editProfileModal = $("editProfileModal");
const closeEditProfile = $("closeEditProfile");

const editPhotoFile = $("editPhotoFile");
const photoPreview = $("photoPreview");
const uploadHint = $("uploadHint");
const profileMsg = $("profileMsg");

// Días (checkboxes) - ojo: si el modal no existe, esto puede venir vacío y no rompe
const dayChks = Array.from(document.querySelectorAll(".dayChk"));

function formatDateEU(dateStr) {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;

  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
}

function formatHourRange(from, to) {
  if (!from && !to) return "";
  return `${from || ""} - ${to || ""}`;
}



//Funciones contacto
function openShareModal(reqId) {
  shareReqId.value = reqId;
  shareWhatsapp.value = "";
  sharePhone.value = "";
  shareEmail.value = "";
  shareContactMsg.textContent = "";
  shareContactModal.classList.remove("hidden");
}
function closeShareModal() {
  shareContactModal.classList.add("hidden");
}

closeShareContact.addEventListener("click", closeShareModal);
shareContactModal.addEventListener("click", (e) => {
  if (e.target === shareContactModal) closeShareModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeShareModal();
});


function getSelectedDays() {
  return dayChks.filter((c) => c.checked).map((c) => c.value);
}

function setSelectedDays(days = []) {
  const set = new Set(days);
  dayChks.forEach((c) => (c.checked = set.has(c.value)));
}

/* =========================
   UI helpers
========================= */
function setAvailUI(isAvailable) {
  if (!availabilityBadge) return;

  if (isAvailable) {
    safeRemoveClass(availabilityBadge, "off");
    safeAddClass(availabilityBadge, "on");
    safeText(availabilityBadge, "🟢 Disponible");
  } else {
    safeRemoveClass(availabilityBadge, "on");
    safeAddClass(availabilityBadge, "off");
    safeText(availabilityBadge, "🔴 No disponible");
  }
}

/* =========================
   Modal Edit Profile
========================= */
function openProfileModal() {
  safeRemoveClass(editProfileModal, "hidden");
}
function closeProfileModal() {
  safeAddClass(editProfileModal, "hidden");
}

safeOn(openEditProfile, "click", openProfileModal);
safeOn(closeEditProfile, "click", closeProfileModal);

// cerrar clic afuera
safeOn(editProfileModal, "click", (e) => {
  if (e.target === editProfileModal) closeProfileModal();
});

// cerrar con ESC
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeProfileModal();
});

/* =========================
  Jobs render
========================= */
function renderAvailableJobs(jobs) {
  if (!jobsList) return;
  jobsList.innerHTML = "";

  const available = jobs.filter(j => !myAppliedJobIds.has(j.id));

  if (!available.length) {
    jobsList.innerHTML = `<div class="meta">No hay turnos disponibles.</div>`;
    return;
  }

  available.forEach((j) => {
    const el = document.createElement("div");
    el.className = "item";
          el.innerHTML = `
          <div class="title">${(j.role || "Turno").toUpperCase()} - ${(j.zone || "").toUpperCase()}</div>
          <div class="sub">📅 ${formatDateEU(j.date)}</div>
          <div class="sub">🕒 ${formatHourRange(j.from, j.to)}</div>
          <div class="sub">💶 €${j.pay ?? ""}/h</div>
          ${j.notes ? `<div class="sub">📝 ${j.notes}</div>` : ""}
          <div class="row" style="margin-top:10px;">
            <button class="btn primary applyBtn" data-jobid="${j.id}">Postularme</button>
          </div>
        `;
    jobsList.appendChild(el);
  });
}

function renderMyApplications(jobs) {
  if (!myAppsList) return;
  myAppsList.innerHTML = "";

  const mine = jobs.filter(j => myAppliedJobIds.has(j.id));

  if (!mine.length) {
    myAppsList.innerHTML = `<div class="meta">Todavía no tenés postulaciones.</div>`;
    return;
  }

  mine.forEach((j) => {
    const el = document.createElement("div");
    el.className = "item";
        el.innerHTML = `
          <div class="title">${(j.role || "Turno").toUpperCase()} - ${(j.zone || "").toUpperCase()}</div>
          <div class="sub">📅 ${formatDateEU(j.date)}</div>
          <div class="sub">🕒 ${formatHourRange(j.from, j.to)}</div>
          <div class="sub">💶 €${j.pay ?? ""}/h</div>
          ${j.notes ? `<div class="sub">📝 ${j.notes}</div>` : ""}
          <div class="row" style="margin-top:10px; gap:10px;">
            <button class="btn danger withdrawBtn" data-jobid="${j.id}">Despostularme</button>
            <span class="badge on">Postulado ✅</span>
          </div>
        `;
    myAppsList.appendChild(el);
  });
}

function rerenderLists() {
  renderAvailableJobs(latestJobs);
  renderMyApplications(latestJobs);
}


/* =========================
Delegación: Postularme
========================= */
safeOn(jobsList, "click", async (e) => {
  const btn = e.target.closest(".applyBtn");
  if (!btn) return;

  if (!workerUid) return alert("No hay sesión.");
  const jobId = btn.dataset.jobid;
  if (!jobId) return;

  // ya postulado
  if (myAppliedJobIds.has(jobId)) {
    btn.disabled = true;
    btn.textContent = "Postulado ✅";
    return;
  }

  btn.disabled = true;
  btn.textContent = "Postulando...";

  try {
    await addDoc(collection(db, "applications"), {
      jobId,
      workerUid,
      createdAt: serverTimestamp(),
      status: "applied",
      workerName: currentWorkerName || "Trabajador",
    });

    // actualizamos set en vivo (sin esperar snapshot)
    myAppliedJobIds.add(jobId);
    btn.textContent = "Postulado ✅";
  } catch (err) {
    console.error(err);
    btn.disabled = false;
    btn.textContent = "Postularme";
    alert(err.message);
  }
});
//Despostularme
myAppsList.addEventListener("click", async (e) => {
  const btn = e.target.closest(".withdrawBtn");
  if (!btn) return;

  const jobId = btn.dataset.jobid;
  if (!jobId || !workerUid) return;

  btn.disabled = true;
  btn.textContent = "Quitando...";

  try {
    const q = query(
      collection(db, "applications"),
      where("workerUid", "==", workerUid),
      where("jobId", "==", jobId)
    );

    const snap = await getDocs(q);
    for (const d of snap.docs) {
      await deleteDoc(doc(db, "applications", d.id));
    }

    // actualizamos UI local
    myAppliedJobIds.delete(jobId);
    rerenderLists();
  } catch (err) {
    console.error(err);
    btn.disabled = false;
    btn.textContent = "Despostularme";
    alert(err.message);
  }
});


/* =========================
   Preview foto local
========================= */
safeOn(editPhotoFile, "change", () => {
  const file = editPhotoFile.files?.[0];
  if (!file) return;
  safeSrc(photoPreview, URL.createObjectURL(file));
  safeText(uploadHint, `Seleccionado: ${file.name}`);
});

/* =========================
   AUTH + Load data
========================= */
onAuthStateChanged(auth, async (user) => {
  if (!user) return (window.location.href = "./index.html");

  workerUid = user.uid;
  currentUid = user.uid;

  const qWHist = query(
  collection(db, "worker_history"),
  where("workerUid", "==", workerUid)
);

onSnapshot(qWHist, (snap) => {
  if (!workerHistoryList) return;

  const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

  workerHistoryList.innerHTML = "";

  if (!items.length) {
    workerHistoryList.innerHTML = `<div class="meta">Todavía no tenés historial.</div>`;
    return;
  }

  items.forEach(h => {
    const el = document.createElement("div");
    el.className = "item";
    el.innerHTML = `
      <div class="title">${(h.role || "Turno").toUpperCase()} · ${h.zone || ""}</div>
      <div class="sub">📅 ${h.date || ""} · 🕒 ${h.from || ""}–${h.to || ""} · 💶 €${h.pay ?? ""}/h</div>
    `;
    workerHistoryList.appendChild(el);
  });
});


  // Perfil user
  const snap = await getDoc(doc(db, "users", user.uid));
  const profile = snap.exists() ? snap.data() : {};
  currentWorkerName = profile.name || "Trabajador";

  // seguridad simple
  if (profile.role !== "worker") return (window.location.href = "./index.html");

  safeText(who, "Panel Trabajador");

  // Disponibilidad
  currentAvailable = !!profile.availableNow;
  setAvailUI(currentAvailable);

  // Card perfil
  safeText(pName, profile.name || "—");
  safeText(pRole, `Rol: ${profile.role || "worker"}`);
  safeSrc(profilePhoto, profile.photoUrl || "https://via.placeholder.com/64?text=AD");
  safeText(pLocation, profile.location ? `📍 ${profile.location}` : "📍 (sin locación)");
  safeText(pBio, profile.bio ? `📝 ${profile.bio}` : "📝 (sin descripción)");
  safeText(pDays, profile.availableDays?.length ? `📅 Días: ${profile.availableDays.join(", ")}` : "📅 Días: (sin definir)");
  safeText(pHours, profile.availableHours ? `⏰ Horario: ${profile.availableHours}` : "⏰ Horario: (sin definir)");

  // Editor (modal)
  if (editName) editName.value = profile.name || "";
  if (editLocation) editLocation.value = profile.location || "";
  if (editBio) editBio.value = profile.bio || "";
  if (editHours) editHours.value = profile.availableHours || "";
  setSelectedDays(profile.availableDays || []);
  safeSrc(photoPreview, profile.photoUrl || "https://via.placeholder.com/72?text=AD");
  safeText(uploadHint, profile.photoUrl ? "Foto actual cargada ✅" : "Subí una imagen (jpg/png)");

  /* =========================
     Snapshots Firestore
  ========================= */

  // Mis postulaciones
  const qMyApps = query(collection(db, "applications"), where("workerUid", "==", workerUid));
  onSnapshot(qMyApps, (appsSnap) => {
    myAppliedJobIds = new Set(appsSnap.docs.map((d) => d.data().jobId));
    rerenderLists();
    // Re-render rápido para que actualice botones si ya hay jobs cargados
    // Si jobsList está vacío aún, no hace nada.
    // (No guardamos jobs globales para mantener simple)
  });

  // Jobs (sin filtro por ahora para evitar que quede vacío)
  const qJobs = query(collection(db, "jobs"), where("status", "==", "open"));
  onSnapshot(qJobs, (jobsSnap) => {
    const jobs = jobsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    jobs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    latestJobs = jobs;
rerenderLists();

  });
  const qReq = query(
  collection(db, "contact_requests"),
  where("workerUid", "==", workerUid),
  where("status", "==", "pending")
);

onSnapshot(qReq, async (snap) => {
  console.log("Solicitudes pendientes para worker:", workerUid, "cantidad:", snap.size);
  snap.docs.forEach((d) => console.log("REQ:", d.id, d.data()));
  if (!contactReqList) return;
  contactReqList.innerHTML = "";

  if (snap.size === 0) {
    contactReqList.innerHTML = `<div class="meta">No tenés solicitudes pendientes.</div>`;
    return;
  }

for (const d of snap.docs) {
  const r = d.data();

  // Empresa
  const bSnap = await getDoc(doc(db, "users", r.businessUid));
  const b = bSnap.exists() ? bSnap.data() : {};

  // 🔥 NUEVO: traer datos del turno
  let jobText = "Quiere tu contacto (sin turno)";

  if (r.jobId) {
    const jobSnap = await getDoc(doc(db, "jobs", r.jobId));
    const job = jobSnap.exists() ? jobSnap.data() : null;

    if (job) {
      jobText = `
        <div class="sub">Quiere tu contacto para este turno:</div>
        <div class="sub">📅 ${formatDateEU(job.date)}</div>
        <div class="sub">🕒 ${formatHourRange(job.from, job.to)}</div>
        <div class="sub">💼 ${(job.role || "Turno").toUpperCase()} - ${(job.zone || "").toUpperCase()}</div>
      `;
    }
  }

  const row = document.createElement("div");
  row.className = "item";
  row.innerHTML = `
    <div class="title">${b.companyName || "Empresa"}</div>
    ${jobText}
    <div class="row" style="margin-top:10px; gap:10px;">
      <button class="btn primary shareContactBtn" data-id="${d.id}">Compartir contacto</button>
      <button class="btn danger declineContactBtn" data-id="${d.id}">Rechazar</button>
    </div>
  `;

  contactReqList.appendChild(row);
}
});
});

/* =========================
   Guardar perfil
========================= */
safeOn(profileForm, "submit", async (e) => {
  e.preventDefault();
  if (!currentUid) return;

  safeText(profileMsg, "Guardando...");

  try {
    // subir foto si hay
    let photoUrlToSave = null;
    const file = editPhotoFile?.files?.[0];

    if (file) {
      safeText(profileMsg, "Subiendo foto...");
      const fileRef = ref(storage, `users/${currentUid}/profile.jpg`);
      await uploadBytes(fileRef, file);
      photoUrlToSave = await getDownloadURL(fileRef);
    }

    const updatePayload = {
      name: editName?.value?.trim?.() || "",
      location: editLocation?.value?.trim?.() || "",
      bio: editBio?.value?.trim?.() || "",
      availableDays: getSelectedDays(),
      availableHours: editHours?.value?.trim?.() || "",
    };
    if (photoUrlToSave) updatePayload.photoUrl = photoUrlToSave;

    await updateDoc(doc(db, "users", currentUid), updatePayload);

    // UI live
    safeText(pName, updatePayload.name || "—");
    safeText(pLocation, updatePayload.location ? `📍 ${updatePayload.location}` : "📍 (sin locación)");
    safeText(pBio, updatePayload.bio ? `📝 ${updatePayload.bio}` : "📝 (sin descripción)");
    safeText(pDays, updatePayload.availableDays.length ? `📅 Días: ${updatePayload.availableDays.join(", ")}` : "📅 Días: (sin definir)");
    safeText(pHours, updatePayload.availableHours ? `⏰ Horario: ${updatePayload.availableHours}` : "⏰ Horario: (sin definir)");

    if (photoUrlToSave) {
      safeSrc(profilePhoto, photoUrlToSave);
      safeSrc(photoPreview, photoUrlToSave);
      safeText(uploadHint, "Foto subida ✅");
    }

    safeText(profileMsg, "Perfil actualizado ✅");
    closeProfileModal();
  } catch (err) {
    console.error(err);
    safeText(profileMsg, err.message);
  }
});

/* =========================
   Toggle disponible
========================= */
safeOn(toggleAvail, "click", async () => {
  if (!currentUid) return;
  currentAvailable = !currentAvailable;
  setAvailUI(currentAvailable);
  await updateDoc(doc(db, "users", currentUid), { availableNow: currentAvailable });
});

/* =========================
   Salir
========================= */
safeOn(logoutBtn, "click", async () => {
  await signOut(auth);
  window.location.href = "./index.html";
});
contactReqList.addEventListener("click", async (e) => {
  const shareBtn = e.target.closest(".shareContactBtn");
  const declineBtn = e.target.closest(".declineContactBtn");

  if (shareBtn) {
    openShareModal(shareBtn.dataset.id);
    return;
  }

  if (declineBtn) {
    const id = declineBtn.dataset.id;
    if (!confirm("¿Rechazar solicitud?")) return;
    await updateDoc(doc(db, "contact_requests", id), { status: "declined" });
    return;
  }
});
if (shareContactForm) {
  shareContactForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = shareReqId?.value;
    if (!id) return;

    const whatsapp = (shareWhatsapp?.value || "").trim();
    const phone = (sharePhone?.value || "").trim();
    const email = (shareEmail?.value || "").trim();

    // al menos uno
    if (!whatsapp && !phone && !email) {
      if (shareContactMsg) shareContactMsg.textContent = "Poné al menos un contacto (WhatsApp, teléfono o email).";
      return;
    }

    if (shareContactMsg) shareContactMsg.textContent = "Compartiendo...";

    try {
      await updateDoc(doc(db, "contact_requests", id), {
        status: "shared",
        contact: { whatsapp, phone, email },
        sharedAt: serverTimestamp(),
      });

      if (shareContactMsg) shareContactMsg.textContent = "Contacto compartido ✅";
      setTimeout(() => closeShareModal?.(), 500);
    } catch (err) {
      console.error(err);
      if (shareContactMsg) shareContactMsg.textContent = err.message;
    }
  });
}
