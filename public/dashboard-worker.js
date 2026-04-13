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
let currentUid = null;
let currentAvailable = false;
let latestJobs = [];
let currentWorkerName = "";


const workerTranslations = {
  ca: {
    worker_toggle_status:"Canviar estat",
    common_history: "Historial",
    worker_my_applications: "Les meves postulacions",
    worker_profile_title: "El meu perfil",
    worker_contact_requests: "Sol-licituds de contacte",
    worker_panel: "Panell Treballador",
    available: "🟢 Disponible",
    unavailable: "🔴 No disponible",
    worker_default_name: "Treballador",
    no_available_jobs: "No hi ha torns disponibles.",
    no_my_applications: "Encara no tens postulacions.",
    applied: "Postulat ✅",
    apply: "Postular-me",
    withdrawing: "Traient...",
    withdraw: "Despostular-me",
    applying: "Postulant...",
    no_session: "No hi ha sessió.",

    no_history: "Encara no tens historial.",
    no_contact_requests: "No tens sol·licituds pendents.",
    company: "Empresa",
    wants_contact_no_job: "Vol el teu contacte (sense torn)",

    contact_for_shift_intro: "Vol el teu contacte per a aquest torn:",
    share_contact: "Compartir contacte",
    decline: "Rebutjar",
    reject_request_confirm: "Vols rebutjar la sol·licitud?",
    worker_available_jobs: "Torns disponibles",
    pending_contact: "Pendent de compartir...",
    no_contact_yet: "(encara no sol·licitat)",
    contact_rejected: "Rebutjat pel treballador",
    contact_label: "📩 Contacte:",

    save_profile: "Guardant...",
    profile_updated: "Perfil actualitzat ✅",
    current_photo_loaded: "Foto actual carregada ✅",
    upload_photo_hint: "Puja una imatge (jpg/png)",
    selected_file: "Seleccionat:",

    share_contact_title: "Compartint...",
    share_contact_done: "Contacte compartit ✅",
    share_contact_error: "Posa almenys un contacte (WhatsApp, telèfon o email).",

    location_empty: "📍 (sense ubicació)",
    bio_empty: "📝 (sense descripció)",
    days_empty: "📅 Dies: (sense definir)",
    hours_empty: "⏰ Horari: (sense definir)",
    role_label: "Rol:",

    no_location: "(sense ubicació)",
    no_description: "(sense descripció)",
    no_days: "(sense dies)",
    no_hours: "(sense horari)",

    job_default: "Torn",
    uploading_photo: "Pujant foto...",
    photo_uploaded: "Foto pujada ✅",
    worker_save_changes: "Desar canvis",
    lang_label: "CA",
  },
  es: {
    worker_toggle_status:"Cambiar estado",
    common_history: "Historial",
    worker_my_applications: "Mis postulaciones",
    worker_profile_title: "Mi perfil",
    worker_contact_requests: "Solicitud de contacto",
    worker_available_jobs: "Turnos disponibles",
    worker_panel: "Panel Trabajador",
    available: "🟢 Disponible",
    unavailable: "🔴 No disponible",
    worker_default_name: "Trabajador",
    no_available_jobs: "No hay turnos disponibles.",
    no_my_applications: "Todavía no tenés postulaciones.",
    applied: "Postulado ✅",
    apply: "Postularme",
    withdrawing: "Quitando...",
    withdraw: "Despostularme",
    applying: "Postulando...",
    no_session: "No hay sesión.",

    no_history: "Todavía no tenés historial.",
    no_contact_requests: "No tenés solicitudes pendientes.",
    company: "Empresa",
    wants_contact_no_job: "Quiere tu contacto (sin turno)",

    contact_for_shift_intro: "Quiere tu contacto para este turno:",
    share_contact: "Compartir contacto",
    decline: "Rechazar",
    reject_request_confirm: "¿Rechazar solicitud?",

    pending_contact: "Pendiente de compartir...",
    no_contact_yet: "(todavía no solicitado)",
    contact_rejected: "Rechazado por el trabajador",
    contact_label: "📩 Contacto:",

    save_profile: "Guardando...",
    profile_updated: "Perfil actualizado ✅",
    current_photo_loaded: "Foto actual cargada ✅",
    upload_photo_hint: "Subí una imagen (jpg/png)",
    selected_file: "Seleccionado:",

    share_contact_title: "Compartiendo...",
    share_contact_done: "Contacto compartido ✅",
    share_contact_error: "Poné al menos un contacto (WhatsApp, teléfono o email).",

    location_empty: "📍 (sin locación)",
    bio_empty: "📝 (sin descripción)",
    days_empty: "📅 Días: (sin definir)",
    hours_empty: "⏰ Horario: (sin definir)",
    role_label: "Rol:",

    no_location: "(sin locación)",
    no_description: "(sin descripción)",
    no_days: "(sin días)",
    no_hours: "(sin horario)",

    job_default: "Turno",
    uploading_photo: "Subiendo foto...",
    photo_uploaded: "Foto subida ✅",
    worker_save_changes: "Guardar cambios",
    lang_label: "ES",
  }
};

function getWorkerLang() {
  return localStorage.getItem("adwork_lang") || "ca";
}

function tw(key) {
  const lang = getWorkerLang();
  return workerTranslations[lang]?.[key] || key;
}


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

//traductor
const langToggle = $("langToggle");
const langMenu = $("langMenu");
const currentLang = $("currentLang");

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

function applyWorkerTranslations() {
  const lang = getWorkerLang();

  document.documentElement.lang = lang;

  if (currentLang) {
    currentLang.textContent = lang.toUpperCase();
  }

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    const text = tw(key);
    if (text && text !== key) {
      el.textContent = text;
    }
  });

  setAvailUI(currentAvailable);
  rerenderLists();
}

//listeners
safeOn(langToggle, "click", (e) => {
  e.stopPropagation();
  langMenu?.classList.toggle("hidden");
});

document.querySelectorAll(".lang-option").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const newLang = btn.dataset.lang;
    if (!newLang) return;

    localStorage.setItem("adwork_lang", newLang);
    applyWorkerTranslations();

    // refrescar textos dinámicos ya pintados
    setAvailUI(currentAvailable);
    rerenderLists();

    safeAddClass(langMenu, "hidden");
  });
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".lang-switcher")) {
    langMenu?.classList.add("hidden");
  }
});
applyWorkerTranslations();

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
    safeText(availabilityBadge, tw("available"));
  } else {
    safeRemoveClass(availabilityBadge, "on");
    safeAddClass(availabilityBadge, "off");
    safeText(availabilityBadge, tw("unavailable"));
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
    jobsList.innerHTML = `<div class="meta">${tw("no_available_jobs")}</div>`;
    return;
  }

  available.forEach((j) => {
    const el = document.createElement("div");
    el.className = "item";
          el.innerHTML = `
          <div class="title">${(j.role || tw("job_default")).toUpperCase()} - ${(j.zone || "").toUpperCase()}</div>
          <div class="sub">📅 ${formatDateEU(j.date)}</div>
          <div class="sub">🕒 ${formatHourRange(j.from, j.to)}</div>
          <div class="sub">💶 €${j.pay ?? ""}/h</div>
          ${j.notes ? `<div class="sub">📝 ${j.notes}</div>` : ""}
          <div class="row" style="margin-top:10px;">
            <button class="btn primary applyBtn" data-jobid="${j.id}">${tw("apply")}</button>
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
    myAppsList.innerHTML = `<div class="meta">${tw("no_my_applications")}</div>`;
    return;
  }

  mine.forEach((j) => {
    const el = document.createElement("div");
    el.className = "item";
        el.innerHTML = `
          <div class="title">${(j.role || tw("job_default")).toUpperCase()} - ${(j.zone || "").toUpperCase()}</div>
          <div class="sub">📅 ${formatDateEU(j.date)}</div>
          <div class="sub">🕒 ${formatHourRange(j.from, j.to)}</div>
          <div class="sub">💶 €${j.pay ?? ""}/h</div>
          ${j.notes ? `<div class="sub">📝 ${j.notes}</div>` : ""}
          <div class="row" style="margin-top:10px; gap:10px;">
            <button class="btn danger withdrawBtn" data-jobid="${j.id}">${tw("withdraw")}</button>
            <span class="badge on">${tw("applied")}</span>
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

  if (!currentUid) return alert(tw("no_session"));
  const jobId = btn.dataset.jobid;
  if (!jobId) return;

  // ya postulado
  if (myAppliedJobIds.has(jobId)) {
    btn.disabled = true;
    btn.textContent = tw("applied");
    return;
  }

  btn.disabled = true;
  btn.textContent = tw("applying");

  try {
    await addDoc(collection(db, "applications"), {
      jobId,
      workerUid: currentUid,
      createdAt: serverTimestamp(),
      status: "applied",
      workerName: currentWorkerName || tw("worker_default_name"),
    });

    // actualizamos set en vivo (sin esperar snapshot)
    myAppliedJobIds.add(jobId);
    btn.textContent = tw("applied");
  } catch (err) {
    console.error(err);
    btn.disabled = false;
    btn.textContent = tw("apply");
    alert(err.message);
  }
});

//Despostularme
myAppsList.addEventListener("click", async (e) => {
  const btn = e.target.closest(".withdrawBtn");
  if (!btn) return;

  const jobId = btn.dataset.jobid;
  if (!jobId || !currentUid) return;

  btn.disabled = true;
  btn.textContent = tw("withdrawing");

  try {
    const q = query(
      collection(db, "applications"),
      where("workerUid", "==", currentUid),
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
    btn.textContent = tw("withdraw");
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
  safeText(uploadHint, `${tw("selected_file")} ${file.name}`);
});

/* =========================
    AUTH + Load data
========================= */
onAuthStateChanged(auth, async (user) => {
  if (!user) return (window.location.href = "./index.html");

  currentUid = user.uid;

  const qWHist = query(
  collection(db, "worker_history"),
  where("workerUid", "==", currentUid)
);

onSnapshot(qWHist, (snap) => {
  if (!workerHistoryList) return;

  const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

  workerHistoryList.innerHTML = "";

  if (!items.length) {
    workerHistoryList.innerHTML = `<div class="meta">${tw("no_history")}</div>`;
    return;
  }

  items.forEach(h => {
    const el = document.createElement("div");
    el.className = "item";
    el.innerHTML = `
      <div class="title">${(h.role || tw("job_default")).toUpperCase()} - ${(h.zone || "").toUpperCase()}</div>
      <div class="sub">📅 ${formatDateEU(h.date)} · 🕒 ${h.from || ""}–${h.to || ""} · 💶 €${h.pay ?? ""}/h</div>
    `;
    workerHistoryList.appendChild(el);
  });
});


  // Perfil user
  const snap = await getDoc(doc(db, "users", user.uid));
  const profile = snap.exists() ? snap.data() : {};
  currentWorkerName = profile.name || tw("worker_default_name");

  // seguridad simple
  if (profile.role !== "worker") return (window.location.href = "./index.html");

  safeText(who, tw("worker_panel"));

  // Disponibilidad
  currentAvailable = !!profile.availableNow;
  setAvailUI(currentAvailable);

  // Card perfil
  safeText(pName, profile.name || "—");
  safeText(pRole, `${tw("role_label")} ${profile.role || "worker"}`);
  safeSrc(profilePhoto, profile.photoUrl || "icons/default-user.png");
  safeText(pLocation, profile.location ? `📍 ${profile.location}` : tw("location_empty"));
  safeText(pBio, profile.bio ? `📝 ${profile.bio}` : tw("bio_empty"));
  safeText(pDays, profile.availableDays?.length ? `📅 ${profile.availableDays.join(", ")}` : tw("days_empty"));
  safeText(pHours, profile.availableHours ? `⏰ ${profile.availableHours}` : tw("hours_empty"));

  // Editor (modal)
  if (editName) editName.value = profile.name || "";
  if (editLocation) editLocation.value = profile.location || "";
  if (editBio) editBio.value = profile.bio || "";
  if (editHours) editHours.value = profile.availableHours || "";
  setSelectedDays(profile.availableDays || []);
  safeSrc(photoPreview, profile.photoUrl || "icons/default-user.png");
  safeText(uploadHint, profile.photoUrl ? tw("current_photo_loaded") : tw("upload_photo_hint"));

  /* =========================
      Snapshots Firestore
  ========================= */

  // Mis postulaciones
  const qMyApps = query(collection(db, "applications"), where("workerUid", "==", currentUid));
  onSnapshot(qMyApps, (appsSnap) => {
    myAppliedJobIds = new Set(appsSnap.docs.map((d) => d.data().jobId));
    rerenderLists();
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
    where("workerUid", "==", currentUid),
    where("status", "==", "pending")
  );

  onSnapshot(qReq, async (snap) => {
    if (!contactReqList) return;
    contactReqList.innerHTML = "";

    if (snap.size === 0) {
      contactReqList.innerHTML = `<div class="meta">${tw("no_contact_requests")}</div>`;
      return;
    }

    for (const d of snap.docs) {
      const r = d.data();

      // Empresa
      const bSnap = await getDoc(doc(db, "users", r.businessUid));
      const b = bSnap.exists() ? bSnap.data() : {};

      let jobText = tw("wants_contact_no_job");

      if (r.jobId) {
        const jobSnap = await getDoc(doc(db, "jobs", r.jobId));
        const job = jobSnap.exists() ? jobSnap.data() : null;

        if (job) {
          jobText = `
            <div class="sub">${tw("contact_for_shift_intro")}</div>
            <div class="sub">📅 ${formatDateEU(job.date)}</div>
            <div class="sub">🕒 ${formatHourRange(job.from, job.to)}</div>
            <div class="sub">💼 ${(job.role || tw("job_default")).toUpperCase()} - ${(job.zone || "").toUpperCase()}</div>
          `;
        }
      }

      const row = document.createElement("div");
      row.className = "item";
      row.innerHTML = `
        <div class="title">${b.companyName || tw("company")}</div>
        ${jobText}
        <div class="row" style="margin-top:10px; gap:10px;">
          <button class="btn primary shareContactBtn" data-id="${d.id}">${tw("share_contact")}</button>
          <button class="btn danger declineContactBtn" data-id="${d.id}">${tw("decline")}</button>
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

  safeText(profileMsg, tw("save_profile"));

  try {
    // subir foto si hay
    let photoUrlToSave = null;
    const file = editPhotoFile?.files?.[0];

    if (file) {
      safeText(profileMsg, tw("uploading_photo"));
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
    safeText(pLocation, updatePayload.location ? `📍 ${updatePayload.location}` : tw("location_empty"));
    safeText(pBio, updatePayload.bio ? `📝 ${updatePayload.bio}` : tw("bio_empty"));
    safeText(pDays, updatePayload.availableDays.length ? `📅 ${updatePayload.availableDays.join(", ")}` : tw("days_empty"));
    safeText(pHours, updatePayload.availableHours ? `⏰ ${updatePayload.availableHours}` : tw("hours_empty"));

    if (photoUrlToSave) {
      safeSrc(profilePhoto, photoUrlToSave);
      safeSrc(photoPreview, photoUrlToSave);
      safeText(uploadHint, tw("photo_uploaded"));
    }

    safeText(profileMsg, tw("profile_updated"));
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
    if (!confirm(tw("reject_request_confirm"))) return;
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
      if (shareContactMsg) shareContactMsg.textContent = tw("share_contact_error");
      return;
    }

    if (shareContactMsg) shareContactMsg.textContent = tw("share_contact_title");

    try {
      await updateDoc(doc(db, "contact_requests", id), {
        status: "shared",
        contact: { whatsapp, phone, email },
        sharedAt: serverTimestamp(),
      });

      if (shareContactMsg) shareContactMsg.textContent = tw("share_contact_done");
      setTimeout(() => closeShareModal?.(), 500);
    } catch (err) {
      console.error(err);
      if (shareContactMsg) shareContactMsg.textContent = err.message;
    }
  });
}
