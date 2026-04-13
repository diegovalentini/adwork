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

/* =========================
   Traducciones
========================= */
const businessTranslations = {
  ca: {
    loading: "Carregant...",
    business_panel: "Panell Negoci",
    logout: "Sortir",
    my_company: "La meva empresa",
    edit: "Editar",
    no_type: "🏷️ (sense sector)",
    no_location: "📍 (sense ubicació)",
    publish_shift: "Publicar torn",
    label_position: "Lloc",
    pos_waiter: "Cambrer",
    pos_kitchen: "Cuina",
    pos_cleaning: "Neteja",
    pos_reception: "Recepció",
    pos_pica: "Pica",
    pos_other: "Altres",
    specify_position: "Especificar lloc",
    specify_placeholder: "Ex: Bartender, DJ...",
    label_date: "Data",
    label_from: "Des de",
    label_to: "Fins",
    label_pay: "Pagament (€ / hora)",
    label_zone: "Zona (ex: Escaldes)",
    label_notes: "Notes (opcional)",
    notes_placeholder: "Uniforme, experiència, idioma...",
    btn_publish: "📢 Publicar",
    publishing: "Publicant...",
    shift_published: "Torn publicat ✅",
    specify_position_error: "Especifica el lloc.",
    pay_error: "El pagament ha de ser major a 0.",
    my_published_shifts: "Els meus torns publicats",
    history: "Historial",
    available_workers: "Treballadors disponibles",
    contacts: "Contactes",
    no_shifts: "Encara no has publicat torns.",
    no_workers: "No hi ha treballadors disponibles ara.",
    no_contacts: "Encara no tens contactes compartits.",
    no_history: "Encara no tens historial.",
    status_label: "Estat:",
    applicants_btn: "Postulats",
    close_btn: "Tancar",
    delete_btn: "Eliminar",
    already_contact: "Ja és contacte",
    request_contact: "Sol·licitar contacte",
    sending: "Enviant...",
    request_sent: "Sol·licitud enviada ✅",
    request_error: "No s'ha pogut enviar la sol·licitud.",
    session_error: "Encara no s'ha carregat la sessió. Espera 2 segons i torna-ho a provar.",
    workeruid_error: "No s'ha trobat el workerUid del botó.",
    available_badge: "Disponible",
    unavailable_badge: "No disponible",
    delete_contact: "Eliminar contacte",
    deleting: "Eliminant...",
    delete_contact_confirm: "Vols eliminar aquest contacte?",
    edit_company: "Editar empresa",
    label_company_name: "Nom de l'empresa",
    label_sector: "Sector",
    sector_hotel: "Hotel",
    sector_restaurant: "Restaurant",
    sector_shop: "Comerç",
    sector_other: "Altres",
    label_location: "Ubicació",
    label_description: "Descripció (opcional)",
    description_placeholder: "Ex: Hotel 4* al centre...",
    btn_save: "Desar",
    saving: "Desant...",
    saved: "Actualitzat ✅",
    applicants_title: "Postulats",
    applicants_loading: "Carregant...",
    applicants_total: "Total:",
    no_applicants: "Encara ningú s'ha postulat.",
    worker_default: "Treballador",
    no_location_worker: "(sense ubicació)",
    no_bio: "(sense descripció)",
    no_days: "(sense dies)",
    no_hours: "(sense horari)",
    contact_label: "📩 Contacte:",
    contact_not_requested: "(encara no sol·licitat)",
    contact_pending: "Pendent de compartir…",
    contact_declined: "Rebutjat pel treballador",
    accept_btn: "Acceptar",
    accepting: "Acceptant...",
    accepted: "Acceptat ✅",
    status_accepted: "Acceptat ✅",
    status_rejected: "Rebutjat ❌",
    status_applied: "Postulat ✅",
    delete_shift_confirm: "Vols eliminar aquest torn?",
    job_default: "Torn",
    footer_terms: "Termes",
    footer_privacy: "Privacitat",
    footer_contact: "© 2026 AdWork · contacte: adwork.contacto@gmail.com",
    lang_label: "CA",
  },
  es: {
    loading: "Cargando...",
    business_panel: "Panel Negocio",
    logout: "Salir",
    my_company: "Mi empresa",
    edit: "Editar",
    no_type: "🏷️ (sin rubro)",
    no_location: "📍 (sin locación)",
    publish_shift: "Publicar turno",
    label_position: "Puesto",
    pos_waiter: "Camarero",
    pos_kitchen: "Cocina",
    pos_cleaning: "Limpieza",
    pos_reception: "Recepción",
    pos_pica: "Pica",
    pos_other: "Otros",
    specify_position: "Especificar puesto",
    specify_placeholder: "Ej: Bartender, DJ...",
    label_date: "Fecha",
    label_from: "Desde",
    label_to: "Hasta",
    label_pay: "Pago (€ / hora)",
    label_zone: "Zona (ej: Escaldes)",
    label_notes: "Notas (opcional)",
    notes_placeholder: "Uniforme, experiencia, idioma...",
    btn_publish: "📢 Publicar",
    publishing: "Publicando...",
    shift_published: "Turno publicado ✅",
    specify_position_error: "Especificá el puesto.",
    pay_error: "El pago debe ser mayor a 0.",
    my_published_shifts: "Mis turnos publicados",
    history: "Historial",
    available_workers: "Trabajadores disponibles",
    contacts: "Contactos",
    no_shifts: "Todavía no publicaste turnos.",
    no_workers: "No hay trabajadores disponibles ahora.",
    no_contacts: "Todavía no tenés contactos compartidos.",
    no_history: "Todavía no tenés historial.",
    status_label: "Estado:",
    applicants_btn: "Postulados",
    close_btn: "Cerrar",
    delete_btn: "Eliminar",
    already_contact: "Ya es contacto",
    request_contact: "Solicitar contacto",
    sending: "Enviando...",
    request_sent: "Solicitud enviada ✅",
    request_error: "No se pudo enviar la solicitud.",
    session_error: "Todavía no cargó tu sesión. Esperá 2 segundos y probá de nuevo.",
    workeruid_error: "No encontré el workerUid del botón.",
    available_badge: "Disponible",
    unavailable_badge: "No disponible",
    delete_contact: "Eliminar contacto",
    deleting: "Eliminando...",
    delete_contact_confirm: "¿Eliminar este contacto?",
    edit_company: "Editar empresa",
    label_company_name: "Nombre de empresa",
    label_sector: "Rubro",
    sector_hotel: "Hotel",
    sector_restaurant: "Restaurante",
    sector_shop: "Comercio",
    sector_other: "Otros",
    label_location: "Locación",
    label_description: "Descripción (opcional)",
    description_placeholder: "Ej: Hotel 4* en el centro...",
    btn_save: "Guardar",
    saving: "Guardando...",
    saved: "Actualizado ✅",
    applicants_title: "Postulados",
    applicants_loading: "Cargando...",
    applicants_total: "Total:",
    no_applicants: "Todavía nadie se postuló.",
    worker_default: "Trabajador",
    no_location_worker: "(sin locación)",
    no_bio: "(sin descripción)",
    no_days: "(sin días)",
    no_hours: "(sin horario)",
    contact_label: "📩 Contacto:",
    contact_not_requested: "(todavía no solicitado)",
    contact_pending: "Pendiente de compartir…",
    contact_declined: "Rechazado por el trabajador",
    accept_btn: "Aceptar",
    accepting: "Aceptando...",
    accepted: "Aceptado ✅",
    status_accepted: "Aceptado ✅",
    status_rejected: "Rechazado ❌",
    status_applied: "Postulado ✅",
    delete_shift_confirm: "¿Eliminar este turno?",
    job_default: "Turno",
    footer_terms: "Términos",
    footer_privacy: "Privacidad",
    footer_contact: "© 2026 AdWork · contacto: adwork.contacto@gmail.com",
    lang_label: "ES",
  }
};

function getBusinessLang() {
  return localStorage.getItem("adwork_lang") || "ca";
}

function tb(key) {
  const lang = getBusinessLang();
  return businessTranslations[lang]?.[key] || key;
}

/* =========================
   DOM refs
========================= */
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

// Lang
const langToggle = document.getElementById("langToggle");
const langMenu = document.getElementById("langMenu");
const currentLang = document.getElementById("currentLang");

// Bloquear fechas pasadas
const dateInput = document.getElementById("date");
if (dateInput) {
  dateInput.min = new Date().toISOString().split("T")[0];
}

/* =========================
    Traducciones estáticas
========================= */
async function applyBusinessTranslations() {
  const lang = getBusinessLang();
  document.documentElement.lang = lang;

  if (currentLang) currentLang.textContent = lang.toUpperCase();

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    const text = tb(key);
    if (text && text !== key) el.textContent = text;
  });

  // Placeholders
  const notesEl = document.getElementById("notes");
  if (notesEl) notesEl.placeholder = tb("notes_placeholder");

  const otherRoleEl = document.getElementById("otherRole");
  if (otherRoleEl) otherRoleEl.placeholder = tb("specify_placeholder");

  const editBioEl = document.getElementById("editCompanyBio");
  if (editBioEl) editBioEl.placeholder = tb("description_placeholder");

  // título de página
  document.title = lang === "ca" ? "AdWork - Negoci" : "AdWork - Negocio";

  // textos dinámicos simples
  if (who) who.textContent = tb("business_panel");

  // re-render dinámico con caches
  renderBusinessProfile(latestBusinessProfile);
  renderMyJobs(latestBusinessJobs);
  renderBusinessHistory(latestBusinessHistory);
  renderWorkers(latestWorkers);
  await renderContacts(latestSharedContacts);

  if (appsModalTitle && !currentJobId) {
    appsModalTitle.textContent = tb("applicants_title");
  }
}

// Listener selector idioma
langToggle?.addEventListener("click", (e) => {
  e.stopPropagation();
  langMenu?.classList.toggle("hidden");
});

document.querySelectorAll(".lang-option").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    localStorage.setItem("adwork_lang", btn.dataset.lang);
    langMenu?.classList.add("hidden");
    applyBusinessTranslations();
  });
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".lang-switcher")) {
    langMenu?.classList.add("hidden");
  }
});

/* =========================
   State
========================= */
let businessUid = null;
let myContactWorkerIds = new Set();
let currentJobId = null;
let appsUnsub = null;
let reqUnsubs = [];

// caches para re-render al cambiar idioma
let latestBusinessJobs = [];
let latestWorkers = [];
let latestBusinessHistory = [];
let latestSharedContacts = [];
let latestBusinessProfile = null;

/* =========================
   Modales
========================= */
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

function openAppsModalFn() {
  appsModal.classList.remove("hidden");
}
function closeAppsModalFn() {
  appsModal.classList.add("hidden");
  appsModalTitle.textContent = tb("applicants_title");
  appsModalSub.textContent = "";
  appsModalList.innerHTML = "";
  currentJobId = null;

  if (appsUnsub) { appsUnsub(); appsUnsub = null; }
  reqUnsubs.forEach((fn) => { try { fn(); } catch {} });
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

/* =========================
   Helpers formato
========================= */
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
  function renderBusinessProfile(profile) {
  latestBusinessProfile = profile || null;

  if (!profile) {
    bCompanyName.textContent = "—";
    bCompanyType.textContent = tb("no_type");
    bCompanyLocation.textContent = tb("no_location");
    bRating.textContent = "⭐ 0 (0)";
    return;
  }

  bCompanyName.textContent = profile.companyName || "—";
  bCompanyType.textContent = profile.companyType ? `🏷️ ${profile.companyType}` : tb("no_type");
  bCompanyLocation.textContent = profile.companyLocation ? `📍 ${profile.companyLocation}` : tb("no_location");
  bRating.textContent = `⭐ ${profile.ratingAvg || 0} (${profile.ratingCount || 0})`;
}
function renderBusinessHistory(items) {
  latestBusinessHistory = items || [];
  businessHistoryList.innerHTML = "";

  if (!items || !items.length) {
    businessHistoryList.innerHTML = `<div class="meta">${tb("no_history")}</div>`;
    return;
  }

  items.forEach((h) => {
    const el = document.createElement("div");
    el.className = "item";
    el.innerHTML = `
      <div class="title">${(h.role || tb("job_default")).toUpperCase()} - ${(h.zone || "").toUpperCase()}</div>
      <div class="sub">📅 ${formatDateEU(h.date)}</div>
      <div class="sub">🕒 ${formatHourRange(h.from, h.to)}</div>
      <div class="sub">💶 €${h.pay ?? ""}/h</div>
      ${h.workerName ? `<div class="sub">👤 ${h.workerName}</div>` : ""}
    `;
    businessHistoryList.appendChild(el);
  });
}
/* =========================
   Render: Mis turnos
========================= */
function renderMyJobs(jobs) {
  myJobsList.innerHTML = "";
  if (!jobs.length) {
    myJobsList.innerHTML = `<div class="meta">${tb("no_shifts")}</div>`;
    return;
  }


  jobs.forEach((j) => {
    const el = document.createElement("div");
    el.className = "item";
    el.innerHTML = `
      <div class="title">${(j.role || tb("job_default")).toUpperCase()} - ${(j.zone || "").toUpperCase()}</div>
      <div class="sub">📅 ${formatDateEU(j.date)}</div>
      <div class="sub">🕒 ${formatHourRange(j.from, j.to)}</div>
      <div class="sub">💶 €${j.pay ?? ""}/h</div>
      <div class="sub">${tb("status_label")} ${j.status || "open"}</div>
      ${j.notes ? `<div class="sub">📝 ${j.notes}</div>` : ""}
      <div class="row" style="margin-top:10px; gap:10px;">
        <button class="btn primary" data-action="apps" data-id="${j.id}">${tb("applicants_btn")}</button>
        <button class="btn" data-action="close" data-id="${j.id}">${tb("close_btn")}</button>
        <button class="btn danger" data-action="delete" data-id="${j.id}">${tb("delete_btn")}</button>
      </div>
    `;
    myJobsList.appendChild(el);
  });
}

/* =========================
   Render: Trabajadores
========================= */
function renderWorkers(workers) {
  workersList.innerHTML = "";

  if (!workers.length) {
    workersList.innerHTML = `<div class="meta">${tb("no_workers")}</div>`;
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
          <img class="worker-photo" src="${photo}" alt="${w.name || tb("worker_default")}" />
          <div class="worker-actions">
            ${
              myContactWorkerIds.has(workerId)
                ? `<button class="btn" disabled>${tb("already_contact")}</button>`
                : `<button class="btn primary reqContactWorkerBtn" data-workeruid="${workerId}" disabled>
                    ${tb("request_contact")}
                  </button>`
            }
          </div>
        </div>
        <div class="worker-info">
          <div class="title">${w.name || tb("worker_default")}</div>
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

async function renderContacts(contacts) {
  latestSharedContacts = contacts || [];
  myContactWorkerIds = new Set();
  if (contactsList) contactsList.innerHTML = "";

  if (!contacts || !contacts.length) {
    if (contactsList) {
      contactsList.innerHTML = `<div class="meta">${tb("no_contacts")}</div>`;
    }
    renderWorkers(latestWorkers);
    return;
  }

  for (const item of contacts) {
    const d = item;
    const cReq = d.data;
    const workerId = cReq.workerUid;
    if (!workerId) continue;

    myContactWorkerIds.add(workerId);

    const wSnap = await getDoc(doc(db, "users", workerId));
    const w = wSnap.exists() ? wSnap.data() : {};

    const photo = w.photoUrl && w.photoUrl.trim() ? w.photoUrl : "icons/default-user.png";
    const isAvailable = !!w.availableNow;
    const availabilityHtml = isAvailable
      ? `<span class="badge on">${tb("available_badge")}</span>`
      : `<span class="badge off">${tb("unavailable_badge")}</span>`;

    const contact = cReq.contact || {};

    const el = document.createElement("div");
    el.className = "item";
    el.innerHTML = `
      <div class="row" style="gap:12px; align-items:flex-start;">
        <img src="${photo}"
            style="width:52px;height:52px;border-radius:14px;object-fit:cover;border:1px solid rgba(255,255,255,0.10);background:rgba(255,255,255,0.04);" />
        <div style="flex:1;">
          <div class="row" style="justify-content:space-between; align-items:center; gap:10px;">
            <div class="title">${w.name || tb("worker_default")}</div>
            ${availabilityHtml}
          </div>
          ${w.location ? `<div class="sub">📍 ${w.location}</div>` : ""}
          ${w.bio ? `<div class="sub">📝 ${w.bio}</div>` : ""}
          ${w.availableDays?.length ? `<div class="sub">📅 ${w.availableDays.join(", ")}</div>` : ""}
          ${w.availableHours ? `<div class="sub">⏰ ${w.availableHours}</div>` : ""}
          ${contact.whatsapp ? `<div class="sub">🟢 WhatsApp: <b>${contact.whatsapp}</b></div>` : ""}
          ${contact.phone ? `<div class="sub">📞 Tel: <b>${contact.phone}</b></div>` : ""}
          ${contact.email ? `<div class="sub">✉️ Email: <b>${contact.email}</b></div>` : ""}
          <div class="row" style="margin-top:10px; gap:10px;">
            <button class="btn danger deleteContactBtn" data-id="${d.id}">
              ${tb("delete_contact")}
            </button>
          </div>
        </div>
      </div>
    `;

    if (contactsList) contactsList.appendChild(el);
  }

  renderWorkers(latestWorkers);
}

/* =========================
   Workers disponibles (snapshot global)
========================= */
const qWorkers = query(
  collection(db, "users"),
  where("role", "==", "worker"),
  where("availableNow", "==", true)
);

onSnapshot(qWorkers, (snap) => {
  latestWorkers = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  renderWorkers(latestWorkers);
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
 renderBusinessProfile(profile);

  editCompanyName.value = profile.companyName || "";
  editCompanyType.value = profile.companyType || "hotel";
  editCompanyLocation.value = profile.companyLocation || "";
  editCompanyBio.value = profile.companyBio || "";

  who.textContent = tb("business_panel");

  // Contactos compartidos
  const qContacts = query(
    collection(db, "contact_requests"),
    where("businessUid", "==", businessUid),
    where("status", "==", "shared")
  );

onSnapshot(qContacts, async (snapC) => {
  const contacts = snapC.docs.map((d) => ({
    id: d.id,
    data: d.data(),
  }));
  await renderContacts(contacts);
});

  // Mis jobs
  const qJobs = query(
    collection(db, "jobs"),
    where("businessUid", "==", businessUid),
    orderBy("createdAt", "desc")
  );
  onSnapshot(qJobs, (jobsSnap) => {
  latestBusinessJobs = jobsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  renderMyJobs(latestBusinessJobs);
});

  // Historial
  const qHist = query(
    collection(db, "business_history"),
    where("businessUid", "==", businessUid)
  );
 onSnapshot(qHist, (snapH) => {
  const items = snapH.docs.map(d => ({ id: d.id, ...d.data() }));
  items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  renderBusinessHistory(items);
});
});
/* =========================
   Select puesto "otros"
========================= */
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

  msg.textContent = tb("publishing");

  let roleValue = document.getElementById("role").value;

  if (roleValue === "otros") {
    const other = document.getElementById("otherRole").value.trim();
    if (!other) {
      msg.textContent = tb("specify_position_error");
      return;
    }
    roleValue = other;
  }

  const payValue = Number(document.getElementById("pay").value);
  if (!payValue || payValue <= 0) {
    msg.textContent = tb("pay_error");
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
    msg.textContent = tb("shift_published");
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

  businessProfileMsg.textContent = tb("saving");

  try {
    const payload = {
      companyName: editCompanyName.value.trim(),
      companyType: editCompanyType.value,
      companyLocation: editCompanyLocation.value.trim(),
      companyBio: editCompanyBio.value.trim(),
    };

    await updateDoc(doc(db, "users", businessUid), payload);

latestBusinessProfile = {
  ...(latestBusinessProfile || {}),
  ...payload,
  ratingAvg: latestBusinessProfile?.ratingAvg || 0,
  ratingCount: latestBusinessProfile?.ratingCount || 0,
};

renderBusinessProfile(latestBusinessProfile);

    businessProfileMsg.textContent = tb("saved");
    closeCompanyModal();
  } catch (err) {
    console.error(err);
    businessProfileMsg.textContent = err.message;
  }
});

/* =========================
   Clicks en Mis turnos
========================= */
myJobsList.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;

  const id = btn.dataset.id;
  const action = btn.dataset.action;
  if (!id) return;

  if (action === "apps") {
    currentJobId = id;
    openAppsModalFn();
    appsModalTitle.textContent = tb("applicants_title");
    appsModalSub.textContent = tb("applicants_loading");
    appsModalList.innerHTML = "";

    if (appsUnsub) { appsUnsub(); appsUnsub = null; }
    reqUnsubs.forEach((fn) => { try { fn(); } catch {} });
    reqUnsubs = [];

    const qApps = query(collection(db, "applications"), where("jobId", "==", currentJobId));

    appsUnsub = onSnapshot(qApps, async (snap) => {
      appsModalSub.textContent = `${tb("applicants_total")} ${snap.size}`;
      appsModalList.innerHTML = "";

      if (snap.size === 0) {
        appsModalList.innerHTML = `<div class="meta">${tb("no_applicants")}</div>`;
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
            <img src="${u.photoUrl || "icons/default-user.png"}"
                style="width:56px;height:56px;border-radius:14px;object-fit:cover;border:1px solid rgba(255,255,255,0.10);" />
            <div style="flex:1;">
              <div class="title">${u.name || tb("worker_default")}</div>
              <div class="sub">📍 ${u.location || tb("no_location_worker")}</div>
              <div class="sub">📝 ${u.bio || tb("no_bio")}</div>
              <div class="sub">📅 ${u.availableDays?.length ? u.availableDays.join(", ") : tb("no_days")}</div>
              <div class="sub">⏰ ${u.availableHours || tb("no_hours")}</div>
              <div class="contactBox" style="margin-top:10px;"></div>
              <div class="row actionsRow" style="margin-top:10px; gap:10px;">
                ${
                  appStatus === "applied"
                    ? `<button class="btn primary acceptBtn" data-jobid="${currentJobId}" data-workeruid="${a.workerUid}">${tb("accept_btn")}</button>`
                    : ``
                }
                <span class="badge on">${
                  appStatus === "accepted" ? tb("status_accepted") :
                  appStatus === "rejected" ? tb("status_rejected") :
                  tb("status_applied")
                }</span>
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

          let contactHTML = `<div class="sub">${tb("contact_label")} <span class="meta">${tb("contact_not_requested")}</span></div>`;

          if (status === "pending") {
            contactHTML = `<div class="sub">${tb("contact_label")} <span class="meta">${tb("contact_pending")}</span></div>`;
          } else if (status === "declined") {
            contactHTML = `<div class="sub">${tb("contact_label")} <span class="meta">${tb("contact_declined")}</span></div>`;
          } else if (status === "shared") {
            contactHTML = `
              <div class="sub">${tb("contact_label")}</div>
              ${c.whatsapp ? `<div class="sub">🟢 WhatsApp: <b>${c.whatsapp}</b></div>` : ""}
              ${c.phone ? `<div class="sub">📞 Tel: <b>${c.phone}</b></div>` : ""}
              ${c.email ? `<div class="sub">✉️ Email: <b>${c.email}</b></div>` : ""}
            `;
          }

          if (contactBox) contactBox.innerHTML = contactHTML;

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

  if (action === "close") {
    await updateDoc(doc(db, "jobs", id), {
      status: "closed",
      closedAt: serverTimestamp(),
    });
    return;
  }

  if (action === "delete") {
    if (!confirm(tb("delete_shift_confirm"))) return;
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
  btn.textContent = tb("accepting");

  try {
    await updateDoc(doc(db, "jobs", jobId), {
      status: "filled",
      assignedWorkerUid: workerUid,
      filledAt: serverTimestamp(),
    });

    const qAll = query(collection(db, "applications"), where("jobId", "==", jobId));
    const allSnap = await getDocs(qAll);
    for (const a of allSnap.docs) {
      if (a.data().workerUid === workerUid) {
        await updateDoc(doc(db, "applications", a.id), { status: "accepted" });
      }
    }

    const requestId = `${jobId}_${workerUid}`;
    await setDoc(doc(db, "contact_requests", requestId), {
      jobId, businessUid, workerUid,
      status: "pending",
      createdAt: serverTimestamp(),
      type: "job",
    });

    const jobSnap2 = await getDoc(doc(db, "jobs", jobId));
    const jobData2 = jobSnap2.exists() ? jobSnap2.data() : {};
    const workerSnap = await getDoc(doc(db, "users", workerUid));
    const workerData = workerSnap.exists() ? workerSnap.data() : {};

    await setDoc(doc(db, "business_history", requestId), {
      businessUid, jobId, workerUid,
      workerName: workerData.name || tb("worker_default"),
      createdAt: serverTimestamp(),
      role: jobData2.role || "",
      date: jobData2.date || "",
      from: jobData2.from || "",
      to: jobData2.to || "",
      pay: jobData2.pay ?? null,
      zone: jobData2.zone || "",
    });

    btn.textContent = tb("accepted");
    btn.remove();
  } catch (err) {
    console.error(err);
    btn.disabled = false;
    btn.textContent = tb("accept_btn");
    alert(err.message);
  }
});

/* =========================
   Solicitar contacto directo
========================= */
workersList.addEventListener("click", async (e) => {
  const btn = e.target.closest(".reqContactWorkerBtn");
  if (!btn) return;

  const workerUid = btn.dataset.workeruid?.trim();
  const businessUidNow = auth.currentUser?.uid;

  if (!workerUid) { alert(tb("workeruid_error")); return; }
  if (!businessUidNow) { alert(tb("session_error")); return; }

  btn.disabled = true;
  const prevText = btn.textContent;
  btn.textContent = tb("sending");

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
    btn.textContent = tb("request_sent");
  } catch (err) {
    console.error(err);
    btn.disabled = false;
    btn.textContent = prevText || tb("request_contact");
    alert(err.message || tb("request_error"));
  }
});

/* =========================
   Eliminar contacto
========================= */
contactsList?.addEventListener("click", async (e) => {
  const btn = e.target.closest(".deleteContactBtn");
  if (!btn) return;

  const id = btn.dataset.id;
  if (!id) return;

  if (!confirm(tb("delete_contact_confirm"))) return;

  btn.disabled = true;
  btn.textContent = tb("deleting");

  try {
    await deleteDoc(doc(db, "contact_requests", id));
  } catch (err) {
    console.error(err);
    btn.disabled = false;
    btn.textContent = tb("delete_contact");
    alert(err.message);
  }
});

// Aplicar traducciones al cargar
applyBusinessTranslations();