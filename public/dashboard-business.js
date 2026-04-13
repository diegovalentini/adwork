import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  getDocs,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// Empresa modal
const openEditCompany = document.getElementById("openEditCompany");
const editCompanyModal = document.getElementById("editCompanyModal");
const closeEditCompany = document.getElementById("closeEditCompany");

// Modal postulados
const appsModal = document.getElementById("appsModal");
const closeAppsModal = document.getElementById("closeAppsModal");
const appsModalTitle = document.getElementById("appsModalTitle");
const appsModalSub = document.getElementById("appsModalSub");
const appsModalList = document.getElementById("appsModalList");

const who = document.getElementById("who");
const logoutBtn = document.getElementById("logoutBtn");
const form = document.getElementById("jobForm");
const msg = document.getElementById("msg");
const businessHistoryList = document.getElementById("businessHistoryList");

// Perfil empresa 
const bCompanyName = document.getElementById("bCompanyName");
const bCompanyType = document.getElementById("bCompanyType");
const bCompanyLocation = document.getElementById("bCompanyLocation");
const bRating = document.getElementById("bRating");

// Edit empresa 
const businessProfileForm = document.getElementById("businessProfileForm");
const editCompanyName = document.getElementById("editCompanyName");
const editCompanyType = document.getElementById("editCompanyType");
const editCompanyLocation = document.getElementById("editCompanyLocation");
const editCompanyBio = document.getElementById("editCompanyBio");
const businessProfileMsg = document.getElementById("businessProfileMsg");

// Listas
const workersList = document.getElementById("workersList");
const myJobsList = document.getElementById("myJobsList");
const contactsList = document.getElementById("contactsList");

// Bloquear fechas pasadas en el formulario de turno
const dateInput = document.getElementById("date");
if (dateInput) {
  dateInput.min = new Date().toISOString().split("T")[0];
}

/* =========================
  State
========================= */
let businessUid = null;
let myContactWorkerIds = new Set();

// modal postulados
let currentJobId = null;
let appsUnsub = null; // para cortar snapshot del modal
let reqUnsubs = [];   // para cortar snapshots de contact_requests dentro del modal

// modal editar empresa
function openCompanyModal() {
  editCompanyModal.classList.remove("hidden");
}
function closeCompanyModal() {
  editCompanyModal.classList.add("hidden");
}
openEditCompany?.addEventListener("click", openCompanyModal);
closeEditCompany?.addEventListener("click", closeCompanyModal);
editCompanyModal?.addEventListener("click", (e) => {
  if (e.target === editCompanyModal) closeCompanyModal();
});

// modal postulados
function openAppsModalFn() {
  appsModal.classList.remove("hidden");
}
function closeAppsModalFn() {
  appsModal.classList.add("hidden");
  appsModalTitle.textContent = "Postulados";
  appsModalSub.textContent = "";
  appsModalList.innerHTML = "";
  currentJobId = null;

  //  cortar snapshot de applications
  if (appsUnsub) {
    appsUnsub();
    appsUnsub = null;
  }

  //  cortar snapshots de contact_requests
  reqUnsubs.forEach((fn) => {
    try { fn(); } catch {}
  });
  reqUnsubs = [];
}

closeAppsModal?.addEventListener("click", closeAppsModalFn);
appsModal?.addEventListener("click", (e) => {
  if (e.target === appsModal) closeAppsModalFn();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeCompanyModal();
    closeAppsModalFn();
  }
});

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


/* =========================
   Render
========================= */

function renderMyJobs(jobs) {
  myJobsList.innerHTML = "";
  if (!jobs.length) {
    myJobsList.innerHTML = `<div class="meta">Todavía no publicaste turnos.</div>`;
    return;
  }

  jobs.forEach((j) => {
    const el = document.createElement("div");
    el.className = "item";
      el.innerHTML = `
        <div class="title">${(j.role || "Turno").toUpperCase()} - ${(j.zone || "").toUpperCase()}</div>
        <div class="sub">📅 ${formatDateEU(j.date)}</div>
        <div class="sub">🕒 ${formatHourRange(j.from, j.to)}</div>
        <div class="sub">💶 €${j.pay ?? ""}/h</div>
        <div class="sub">Estado: ${j.status || "open"}</div>
        ${j.notes ? `<div class="sub">📝 ${j.notes}</div>` : ""}
        
        <div class="row" style="margin-top:10px; gap:10px;">
          <button class="btn primary" data-action="apps" data-id="${j.id}">Postulados</button>
          <button class="btn" data-action="close" data-id="${j.id}">Cerrar</button>
          <button class="btn danger" data-action="delete" data-id="${j.id}">Eliminar</button>
        </div>
      `;
    myJobsList.appendChild(el);
  });
}
function renderWorkers(workers) {
  workersList.innerHTML = "";

  if (!workers.length) {
    workersList.innerHTML = `<div class="meta">No hay trabajadores disponibles ahora.</div>`;
    return;
  }

  workers.forEach((w) => {
    const photo = w.photoUrl && w.photoUrl.trim() ? w.photoUrl : "icons/default-user.png";
    const daysText = w.availableDays?.length ? `📅 ${w.availableDays.join(", ")}` : "";
    const hoursText = w.availableHours ? `⏰ ${w.availableHours}` : "";
    const bioText = w.bio ? `📝 ${w.bio}` : "";
    const locationText = w.location ? `📍 ${w.location}` : "";

    const workerId = w.uid || w.id;

    const el = document.createElement("div");
    el.className = "item";
    el.innerHTML = `
      <div class="worker-card">
        <div class="worker-top">
          <img class="worker-photo" src="${photo}" alt="${w.name || "Trabajador"}" />

          <div class="worker-actions">
            ${
              myContactWorkerIds.has(workerId)
                ? `<button class="btn" disabled>Ya es contacto</button>`
                : `<button class="btn primary reqContactWorkerBtn" data-workeruid="${workerId}" disabled>
                    Solicitar contacto
                  </button>`
            }
          </div>
        </div>

        <div class="worker-info">
          <div class="title">${w.name || "Trabajador"}</div>
          ${locationText ? `<div class="sub">${locationText}</div>` : ""}
          ${bioText ? `<div class="sub">${bioText}</div>` : ""}
          ${daysText ? `<div class="sub">${daysText}</div>` : ""}
          ${hoursText ? `<div class="sub">${hoursText}</div>` : ""}
        </div>
      </div>
    `;

    workersList.appendChild(el);
  });

  workersList.querySelectorAll(".reqContactWorkerBtn").forEach((b) => {
    b.disabled = false;
  });
}
/* =========================
   Workers disponibles
========================= */
const qWorkers = query(
  collection(db, "users"),
  where("role", "==", "worker"),
  where("availableNow", "==", true)
);

onSnapshot(qWorkers, (snap) => {
  const workers = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  renderWorkers(workers);
});

/* =========================
   Auth
========================= */
onAuthStateChanged(auth, async (user) => {
  if (!user) return (window.location.href = "./index.html");
  businessUid = user.uid;

  const snap = await getDoc(doc(db, "users", user.uid));
  const profile = snap.exists() ? snap.data() : {};

  if (profile.role !== "business") return (window.location.href = "./index.html");
  workersList.querySelectorAll(".reqContactWorkerBtn").forEach(b => b.disabled = false);


  // UI empresa
  bCompanyName.textContent = profile.companyName || "—";
  bCompanyType.textContent = profile.companyType ? `🏷️ ${profile.companyType}` : "🏷️ (sin rubro)";
  bCompanyLocation.textContent = profile.companyLocation ? `📍 ${profile.companyLocation}` : "📍 (sin locación)";
  bRating.textContent = `⭐ ${profile.ratingAvg || 0} (${profile.ratingCount || 0})`;

  editCompanyName.value = profile.companyName || "";
  editCompanyType.value = profile.companyType || "hotel";
  editCompanyLocation.value = profile.companyLocation || "";
  editCompanyBio.value = profile.companyBio || "";

  who.textContent = `Panel Negocio`;


  // Contactos compartidos con este negocio
const qContacts = query(
  collection(db, "contact_requests"),
  where("businessUid", "==", businessUid),
  where("status", "==", "shared")
);

onSnapshot(qContacts, async (snapC) => {
  myContactWorkerIds = new Set();
  if (contactsList) contactsList.innerHTML = "";

if (snapC.empty) {
  if (contactsList) {
    contactsList.innerHTML = `<div class="meta">Todavía no tenés contactos compartidos.</div>`;
  }

  const workersSnapshot = await getDocs(qWorkers);
  const workers = workersSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  renderWorkers(workers);
  return;
}

  for (const d of snapC.docs) {
    const cReq = d.data();
    const workerId = cReq.workerUid;
    if (!workerId) continue;

    myContactWorkerIds.add(workerId);

    const wSnap = await getDoc(doc(db, "users", workerId));
    const w = wSnap.exists() ? wSnap.data() : {};

    const photo = w.photoUrl && w.photoUrl.trim()
      ? w.photoUrl
      : "icons/default-user.png";

    const isAvailable = !!w.availableNow;
    const availabilityHtml = isAvailable
      ? `<span class="badge on">Disponible</span>`
      : `<span class="badge off">No disponible</span>`;

    const contact = cReq.contact || {};

    const el = document.createElement("div");
    el.className = "item";
el.innerHTML = `
  <div class="row" style="gap:12px; align-items:flex-start;">
    <img src="${photo}"
        style="width:52px;height:52px;border-radius:14px;object-fit:cover;border:1px solid rgba(255,255,255,0.10);background: rgba(255,255,255,0.04);" />

    <div style="flex:1;">
      <div class="row" style="justify-content:space-between; align-items:center; gap:10px;">
        <div class="title">${w.name || "Trabajador"}</div>
        ${availabilityHtml}
      </div>

      ${w.location ? `<div class="sub">📍 ${w.location}</div>` : ""}
      ${w.bio ? `<div class="sub">📝 ${w.bio}</div>` : ""}
      ${w.availableDays?.length ? `<div class="sub">📅 ${w.availableDays.join(", ")}</div>` : ""}
      ${w.availableHours ? `<div class="sub">⏰ ${w.availableHours}</div>` : ""}

      ${contact.whatsapp ? `<div class="sub">🟢 WhatsApp: <b>${contact.whatsapp}</b></div>` : ""}
      ${contact.phone ? `<div class="sub">📞 Teléfono: <b>${contact.phone}</b></div>` : ""}
      ${contact.email ? `<div class="sub">✉️ Email: <b>${contact.email}</b></div>` : ""}

      <div class="row" style="margin-top:10px; gap:10px;">
        <button class="btn danger deleteContactBtn" data-id="${d.id}">
          Eliminar contacto
        </button>
      </div>
    </div>
  </div>
`;

    if (contactsList) contactsList.appendChild(el);
  }

// Re-render para que en "Trabajadores disponibles" cambie a "Ya es contacto"
const workersSnapshot = await getDocs(qWorkers);
const workers = workersSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
renderWorkers(workers);
});

  // Mis jobs del negocio
  const qJobs = query(
    collection(db, "jobs"),
    where("businessUid", "==", businessUid),
    orderBy("createdAt", "desc")
  );

  onSnapshot(qJobs, (jobsSnap) => {
    const jobs = jobsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderMyJobs(jobs);
  });

  // Historial negocio
  const qHist = query(
    collection(db, "business_history"),
    where("businessUid", "==", businessUid)
  );

  onSnapshot(qHist, (snapH) => {
    businessHistoryList.innerHTML = "";

    const items = snapH.docs.map(d => ({ id: d.id, ...d.data() }));
    items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

    if (items.length === 0) {
      businessHistoryList.innerHTML = `<div class="meta">Todavía no tenés historial.</div>`;
      return;
    }

    items.forEach((h) => {
      const el = document.createElement("div");
      el.className = "item";
      el.innerHTML = `
        <div class="title">${(h.role || "Turno").toUpperCase()} · ${h.zone || ""}</div>
        <div class="sub">📅 ${formatDateEU(h.date)} · 🕒 ${h.from || ""}–${h.to || ""} · 💶 €${h.pay ?? ""}/h</div>
        ${h.workerName ? `<div class="sub">👤 ${h.workerName}</div>` : ""}
      `;
      businessHistoryList.appendChild(el);
    });
  });
});

const roleSelect = document.getElementById("role");
const otherRoleContainer = document.getElementById("otherRoleContainer");
const otherRoleInput = document.getElementById("otherRole");

if (roleSelect && otherRoleContainer) {
  roleSelect.addEventListener("change", () => {
    if (roleSelect.value === "otros") {
      otherRoleContainer.style.display = "block";
    } else {
      otherRoleContainer.style.display = "none";
      if (otherRoleInput) otherRoleInput.value = "";
    }
  });
}

/* =========================
    Logout
========================= */
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "./index.html";
});

/* =========================
   Publicar turno
========================= */
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!businessUid) return;

  msg.textContent = "Publicando...";

  let roleValue = document.getElementById("role").value;

  if (roleValue === "otros") {
    const other = document.getElementById("otherRole").value.trim();

    if (!other) {
      msg.textContent = "Especificá el puesto.";
      return;
    }

    roleValue = other;
  }

  const payValue = Number(document.getElementById("pay").value);
if (!payValue || payValue <= 0) {
  msg.textContent = "El pago debe ser mayor a 0.";
  return;
}

  const data = {
    businessUid,
    role: roleValue,
    date: document.getElementById("date").value,
    from: document.getElementById("from").value,
    to: document.getElementById("to").value,
    pay: payValue,
    zone: document.getElementById("zone").value.trim(),
    notes: document.getElementById("notes").value.trim(),
    status: "open",
    createdAt: serverTimestamp(),
  };

  try {
    await addDoc(collection(db, "jobs"), data);
      msg.textContent = "Turno publicado ✅";
      setTimeout(() => { msg.textContent = ""; }, 3000);
      form.reset();

    const otherRoleContainer = document.getElementById("otherRoleContainer");
    if (otherRoleContainer) otherRoleContainer.style.display = "none";
  } catch (err) {
    msg.textContent = err.message;
  }
});

/* =========================
   Guardar perfil empresa
========================= */
businessProfileForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!businessUid) return;

  businessProfileMsg.textContent = "Guardando...";

  try {
    const payload = {
      companyName: editCompanyName.value.trim(),
      companyType: editCompanyType.value,
      companyLocation: editCompanyLocation.value.trim(),
      companyBio: editCompanyBio.value.trim(),
    };

    await updateDoc(doc(db, "users", businessUid), payload);

    bCompanyName.textContent = payload.companyName || "—";
    bCompanyType.textContent = payload.companyType ? `🏷️ ${payload.companyType}` : "🏷️ (sin rubro)";
    bCompanyLocation.textContent = payload.companyLocation ? `📍 ${payload.companyLocation}` : "📍 (sin locación)";

    businessProfileMsg.textContent = "Actualizado ✅";
    closeCompanyModal();
  } catch (err) {
    console.error(err);
    businessProfileMsg.textContent = err.message;
  }
});

/* =========================
    Clicks en Mis turnos (Postulados / Cerrar / Eliminar)
========================= */
myJobsList.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;

  const id = btn.dataset.id;
  const action = btn.dataset.action;
  if (!id) return;

  // POSTULADOS
  if (action === "apps") {
    currentJobId = id;

    openAppsModalFn();
    appsModalTitle.textContent = "Postulados";
    appsModalSub.textContent = "Cargando...";
    appsModalList.innerHTML = "";

    // cortar listener anterior
    if (appsUnsub) {
      appsUnsub();
      appsUnsub = null;
    }

    // cortar listeners de requests anteriores
    reqUnsubs.forEach((fn) => { try { fn(); } catch {} });
    reqUnsubs = [];

    const qApps = query(collection(db, "applications"), where("jobId", "==", currentJobId));

    appsUnsub = onSnapshot(qApps, async (snap) => {
      appsModalSub.textContent = `Total: ${snap.size}`;
      appsModalList.innerHTML = "";

      if (snap.size === 0) {
        appsModalList.innerHTML = `<div class="meta">Todavía nadie se postuló.</div>`;
        return;
      }

      for (const d of snap.docs) {
        const a = d.data();

        const uSnap = await getDoc(doc(db, "users", a.workerUid));
        const u = uSnap.exists() ? uSnap.data() : {};

        const row = document.createElement("div");
        row.className = "item";

        const requestId = `${currentJobId}_${a.workerUid}`;
        const appStatus = a.status || "applied";

        row.innerHTML = `
          <div class="row" style="gap:12px; align-items:flex-start;">
            src="${u.photoUrl || "icons/default-user.png"}"
                style="width:56px;height:56px;border-radius:14px;object-fit:cover;border:1px solid rgba(255,255,255,0.10);" />

            <div style="flex:1;">
              <div class="title">${u.name || "Trabajador"}</div>
              <div class="sub">📍 ${u.location || "(sin locación)"}</div>
              <div class="sub">📝 ${u.bio || "(sin descripción)"}</div>
              <div class="sub">📅 ${u.availableDays?.length ? u.availableDays.join(", ") : "(sin días)"}</div>
              <div class="sub">⏰ ${u.availableHours || "(sin horario)"}</div>

              <div class="contactBox" style="margin-top:10px;"></div>

              <div class="row actionsRow" style="margin-top:10px; gap:10px;">
                ${
                  appStatus === "applied"
                    ? `<button class="btn primary acceptBtn" data-jobid="${currentJobId}" data-workeruid="${a.workerUid}">Aceptar</button>`
                    : ``
                }
                <span class="badge on">${appStatus === "accepted" ? "Aceptado ✅" : appStatus === "rejected" ? "Rechazado ❌" : "Postulado ✅"}</span>
              </div>
            </div>
          </div>
        `;

        appsModalList.appendChild(row);

        const contactBox = row.querySelector(".contactBox");
        const actionsRow = row.querySelector(".actionsRow");

        const unsubReq = onSnapshot(doc(db, "contact_requests", requestId), (reqSnap) => {
          const req = reqSnap.exists() ? reqSnap.data() : null;
          const status = req?.status || "none";
          const c = req?.contact || {};

          let contactHTML = `<div class="sub">📩 Contacto: <span class="meta">(todavía no solicitado)</span></div>`;

          if (status === "pending") {
            contactHTML = `<div class="sub">📩 Contacto: <span class="meta">Pendiente de compartir…</span></div>`;
          } else if (status === "declined") {
            contactHTML = `<div class="sub">📩 Contacto: <span class="meta">Rechazado por el trabajador</span></div>`;
          } else if (status === "shared") {
            contactHTML = `
              <div class="sub">📩 Contacto:</div>
              ${c.whatsapp ? `<div class="sub">🟢 WhatsApp: <b>${c.whatsapp}</b></div>` : ""}
              ${c.phone ? `<div class="sub">📞 Tel: <b>${c.phone}</b></div>` : ""}
              ${c.email ? `<div class="sub">✉️ Email: <b>${c.email}</b></div>` : ""}
            `;
          }

          if (contactBox) contactBox.innerHTML = contactHTML;

          // si ya hay request creado, NO mostramos "Aceptar"
          if (status === "pending" || status === "shared" || status === "declined") {
            const acceptBtn = actionsRow?.querySelector(".acceptBtn");
            if (acceptBtn) acceptBtn.remove();
          }
        });

        reqUnsubs.push(unsubReq);
      }
    });

    return;
  }

  // CERRAR
  if (action === "close") {
    await updateDoc(doc(db, "jobs", id), {
      status: "closed",
      closedAt: serverTimestamp(),
    });
    return;
  }

  // ELIMINAR
  if (action === "delete") {
    if (!confirm("¿Eliminar este turno?")) return;
    await deleteDoc(doc(db, "jobs", id));
    return;
  }
});

/* =========================
    Aceptar postulante 
========================= */
appsModalList.addEventListener("click", async (e) => {
  const btn = e.target.closest(".acceptBtn");
  if (!btn) return;

  const jobId = btn.dataset.jobid;
  const workerUid = btn.dataset.workeruid;
  if (!jobId || !workerUid) return;

  btn.disabled = true;
  btn.textContent = "Aceptando...";

  try {
    // 1) Cerrar job + asignar worker
    await updateDoc(doc(db, "jobs", jobId), {
      status: "filled",
      assignedWorkerUid: workerUid,
      filledAt: serverTimestamp(),
    });

      // 2) Marcar SOLO la postulación elegida como accepted
      const qAll = query(collection(db, "applications"), where("jobId", "==", jobId));
      const allSnap = await getDocs(qAll);

      for (const a of allSnap.docs) {
        const data = a.data();
      
        if (data.workerUid === workerUid) {
          await updateDoc(doc(db, "applications", a.id), {
            status: "accepted",
          });
        }
      }

    // 3) Crear solicitud de contacto
    const requestId = `${jobId}_${workerUid}`;
    await setDoc(doc(db, "contact_requests", requestId), {
      jobId,
      businessUid,
      workerUid,
      status: "pending",
      createdAt: serverTimestamp(),
      type: "job",
    });

    // 4) Guardar en historial de empresa
const jobSnap2 = await getDoc(doc(db, "jobs", jobId));
const jobData2 = jobSnap2.exists() ? jobSnap2.data() : {};

const workerSnap = await getDoc(doc(db, "users", workerUid));
const workerData = workerSnap.exists() ? workerSnap.data() : {};

await setDoc(doc(db, "business_history", requestId), {
  businessUid,
  jobId,
  workerUid,
  workerName: workerData.name || "Trabajador",
  createdAt: serverTimestamp(),
  role: jobData2.role || "",
  date: jobData2.date || "",
  from: jobData2.from || "",
  to: jobData2.to || "",
  pay: jobData2.pay ?? null,
  zone: jobData2.zone || "",
});

    btn.textContent = "Aceptado ✅";
    btn.remove(); // ✅ para que no aparezca más
  } catch (err) {
    console.error(err);
    btn.disabled = false;
    btn.textContent = "Aceptar";
    alert(err.message);
  }
});

/* =========================
    Solicitar contacto directo desde "Trabajadores disponibles"
========================= */
workersList.addEventListener("click", async (e) => {
  const btn = e.target.closest(".reqContactWorkerBtn");
  if (!btn) return;

  const workerUid = btn.dataset.workeruid?.trim();
  const businessUidNow = auth.currentUser?.uid;

  if (!workerUid) {
    alert("No encontré el workerUid del botón.");
    return;
  }

  if (!businessUidNow) {
    alert("Todavía no cargó tu sesión. Esperá 2 segundos y probá de nuevo.");
    return;
  }

  btn.disabled = true;
  const prevText = btn.textContent;
  btn.textContent = "Enviando...";

  try {
    const requestId = `direct_${businessUidNow}_${workerUid}`;

await setDoc(doc(db, "contact_requests", requestId), {
  jobId: null,
  businessUid: businessUidNow,
  workerUid,
  status: "pending",
  createdAt: serverTimestamp(),
  type: "direct",
});

    btn.textContent = "Solicitud enviada ✅";
  } catch (err) {
    console.error(err);
    btn.disabled = false;
    btn.textContent = prevText || "Solicitar contacto";
    alert(err.message || "No se pudo enviar la solicitud.");
  }
});

contactsList?.addEventListener("click", async (e) => {
  const btn = e.target.closest(".deleteContactBtn");
  if (!btn) return;

  const id = btn.dataset.id;
  if (!id) return;

  if (!confirm("¿Eliminar este contacto?")) return;

  btn.disabled = true;
  btn.textContent = "Eliminando...";

  try {
    await deleteDoc(doc(db, "contact_requests", id));
  } catch (err) {
    console.error(err);
    btn.disabled = false;
    btn.textContent = "Eliminar contacto";
    alert(err.message);
  }
});