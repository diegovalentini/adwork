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
   Helpers
========================= */
function $(id) { return document.getElementById(id); }
function safeText(el, value) { if (el) el.textContent = value; }
function safeHTML(el, value) { if (el) el.innerHTML = value; }
function safeSrc(el, value) { if (el) el.src = value; }
function safeAddClass(el, cls) { if (el) el.classList.add(cls); }
function safeRemoveClass(el, cls) { if (el) el.classList.remove(cls); }
function safeOn(el, evt, fn) { if (el) el.addEventListener(evt, fn); }

/* =========================
   Traducciones
========================= */
const workerTranslations = {
  ca: {
    worker_toggle_status: "Canviar estat",
    common_history: "Historial",
    worker_my_applications: "Les meves postulacions",
    worker_profile_title: "El meu perfil",
    worker_contact_requests: "Sol·licituds de contacte",
    worker_shared_contacts: "Contactes compartits",
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
    no_shared_contacts: "Encara no has compartit el teu contacte amb cap empresa.",
    shared_on: "Compartit el",
    for_shift: "Per al torn:",
    direct_contact: "Contacte directe",
    delete_contact: "Eliminar",
    deleting: "Eliminant...",
    delete_contact_confirm: "Vols eliminar aquest contacte compartit?",
    no_history: "Encara no tens historial.",
    no_contact_requests: "No tens sol·licituds pendents.",
    company: "Empresa",
    wants_contact_no_job: "Vol el teu contacte (sense torn)",
    contact_for_shift_intro: "Vol el teu contacte per a aquest torn:",
    share_contact: "Compartir contacte",
    decline: "Rebutjar",
    reject_request_confirm: "Vols rebutjar la sol·licitud?",
    worker_available_jobs: "Torns disponibles",
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
    job_default: "Torn",
    uploading_photo: "Pujant foto...",
    photo_uploaded: "Foto pujada ✅",
    worker_save_changes: "Desar canvis",
    lang_label: "CA",
    page_title: "AdWork - Treballador",
    onboarding_title: "👋 Benvingut a AdWork!",
    onboarding_text: "Per que les empreses et trobin, completa el teu perfil i activa la teva disponibilitat.",
    onboarding_btn: "Completar perfil",
    error_loading: "Error en carregar les dades. Comprova la connexió.",
    footer_terms: "Termes",
    footer_privacy: "Privacitat",
    footer_contact: "© 2026 AdWork · contacte@adwork.ad",
    common_edit: "Editar",
    worker_edit_profile: "Editar perfil",
    worker_name: "Nom",
    worker_location: "Ubicació",
    worker_days: "Dies disponibles",
    worker_hours: "Horari disponible",
    worker_photo: "Foto de perfil",
    worker_bio: "Descripció",
    worker_share_contact: "Compartir contacte",
    worker_whatsapp_optional: "WhatsApp (opcional)",
    worker_phone_optional: "Telèfon (opcional)",
    worker_email_optional: "Email (opcional)",
    worker_share: "Compartir",
  },
  es: {
    worker_toggle_status: "Cambiar estado",
    common_history: "Historial",
    worker_my_applications: "Mis postulaciones",
    worker_profile_title: "Mi perfil",
    worker_contact_requests: "Solicitudes de contacto",
    worker_shared_contacts: "Contactos compartidos",
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
    no_shared_contacts: "Todavía no compartiste tu contacto con ninguna empresa.",
    shared_on: "Compartido el",
    for_shift: "Para el turno:",
    direct_contact: "Contacto directo",
    delete_contact: "Eliminar",
    deleting: "Eliminando...",
    delete_contact_confirm: "¿Eliminar este contacto compartido?",
    no_history: "Todavía no tenés historial.",
    no_contact_requests: "No tenés solicitudes pendientes.",
    company: "Empresa",
    wants_contact_no_job: "Quiere tu contacto (sin turno)",
    contact_for_shift_intro: "Quiere tu contacto para este turno:",
    share_contact: "Compartir contacto",
    decline: "Rechazar",
    reject_request_confirm: "¿Rechazar solicitud?",
    worker_available_jobs: "Turnos disponibles",
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
    job_default: "Turno",
    uploading_photo: "Subiendo foto...",
    photo_uploaded: "Foto subida ✅",
    worker_save_changes: "Guardar cambios",
    lang_label: "ES",
    page_title: "AdWork - Trabajador",
    onboarding_title: "👋 ¡Bienvenido a AdWork!",
    onboarding_text: "Para que las empresas te encuentren, completá tu perfil y activá tu disponibilidad.",
    onboarding_btn: "Completar perfil",
    error_loading: "Error al cargar los datos. Revisá tu conexión.",
    footer_terms: "Términos",
    footer_privacy: "Privacidad",
    footer_contact: "© 2026 AdWork · contacte@adwork.ad",
    common_edit: "Editar",
    worker_edit_profile: "Editar perfil",
    worker_name: "Nombre",
    worker_location: "Ubicación",
    worker_days: "Días disponibles",
    worker_hours: "Horario disponible",
    worker_photo: "Foto de perfil",
    worker_bio: "Descripción",
    worker_share_contact: "Compartir contacto",
    worker_whatsapp_optional: "WhatsApp (opcional)",
    worker_phone_optional: "Teléfono (opcional)",
    worker_email_optional: "Email (opcional)",
    worker_share: "Compartir",
  }
};

function getWorkerLang() { return localStorage.getItem("adwork_lang") || "ca"; }
function tw(key) {
  const lang = getWorkerLang();
  return workerTranslations[lang]?.[key] || key;
}

/* =========================
   State
========================= */
let myAppliedJobIds = new Set();
let currentUid = null;
let currentAvailable = false;
let latestJobs = [];
let currentWorkerName = "";

/* =========================
   DOM
========================= */
const who = $("who");
const availabilityBadge = $("availabilityBadge");
const toggleAvail = $("toggleAvail");
const logoutBtn = $("logoutBtn");
const myAppsList = $("myAppsList");
const workerHistoryList = $("workerHistoryList");
const sharedContactsList = $("sharedContactsList");
const langToggle = $("langToggle");
const langMenu = $("langMenu");
const currentLang = $("currentLang");
const jobsList = $("jobsList");
const contactReqList = $("contactReqList");
const shareContactModal = $("shareContactModal");
const closeShareContact = $("closeShareContact");
const shareContactForm = $("shareContactForm");
const shareReqId = $("shareReqId");
const shareWhatsapp = $("shareWhatsapp");
const sharePhone = $("sharePhone");
const shareEmail = $("shareEmail");
const shareContactMsg = $("shareContactMsg");
const profilePhoto = $("profilePhoto");
const pName = $("pName");
const pRole = $("pRole");
const pLocation = $("pLocation");
const pBio = $("pBio");
const pDays = $("pDays");
const pHours = $("pHours");
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
const appSpinner = $("appSpinner");
const appContent = $("appContent");
const onboardingBanner = $("onboardingBanner");
const onboardingTitle = $("onboardingTitle");
const onboardingText = $("onboardingText");
const onboardingBtn = $("onboardingBtn");
const dayChks = Array.from(document.querySelectorAll(".dayChk"));

/* =========================
   Spinner helpers
========================= */
function showSpinner() {
  if (appSpinner) appSpinner.classList.remove("hidden");
  if (appContent) appContent.classList.add("hidden");
}
function hideSpinner() {
  if (appSpinner) appSpinner.classList.add("hidden");
  if (appContent) appContent.classList.remove("hidden");
}

/* =========================
   Formato
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

/* =========================
   Traducciones estáticas
========================= */
function applyWorkerTranslations() {
  const lang = getWorkerLang();
  document.documentElement.lang = lang;
  document.title = tw("page_title");
  if (currentLang) currentLang.textContent = lang.toUpperCase();

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    const text = tw(key);
    if (text && text !== key) el.textContent = text;
  });

  if (onboardingTitle) onboardingTitle.textContent = tw("onboarding_title");
  if (onboardingText) onboardingText.textContent = tw("onboarding_text");
  if (onboardingBtn) onboardingBtn.textContent = tw("onboarding_btn");

  setAvailUI(currentAvailable);
  rerenderLists();
}

/* =========================
   Selector idioma
========================= */
safeOn(langToggle, "click", (e) => {
  e.stopPropagation();
  langMenu?.classList.toggle("hidden");
});

document.querySelectorAll(".lang-option").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    localStorage.setItem("adwork_lang", btn.dataset.lang);
    langMenu?.classList.add("hidden");
    applyWorkerTranslations();
  });
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".lang-switcher")) langMenu?.classList.add("hidden");
});

applyWorkerTranslations();

/* =========================
   Onboarding
========================= */
function checkOnboarding(profile) {
  if (!onboardingBanner) return;
  const isIncomplete = !profile.name || !profile.location || !profile.bio || !profile.availableDays?.length;
  if (isIncomplete) {
    onboardingBanner.classList.remove("hidden");
  } else {
    onboardingBanner.classList.add("hidden");
  }
}

safeOn(onboardingBtn, "click", () => {
  openProfileModal();
  if (onboardingBanner) onboardingBanner.classList.add("hidden");
});

/* =========================
   Contacto modal
========================= */
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
  if (e.key === "Escape") { closeShareModal(); closeProfileModal(); }
});

/* =========================
   Días checkboxes
========================= */
function getSelectedDays() { return dayChks.filter((c) => c.checked).map((c) => c.value); }
function setSelectedDays(days = []) {
  const set = new Set(days);
  dayChks.forEach((c) => (c.checked = set.has(c.value)));
}

/* =========================
   UI disponibilidad
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
   Modal perfil
========================= */
function openProfileModal() { safeRemoveClass(editProfileModal, "hidden"); }
function closeProfileModal() { safeAddClass(editProfileModal, "hidden"); }
safeOn(openEditProfile, "click", openProfileModal);
safeOn(closeEditProfile, "click", closeProfileModal);
safeOn(editProfileModal, "click", (e) => { if (e.target === editProfileModal) closeProfileModal(); });

/* =========================
   Render: Turnos disponibles
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

/* =========================
   Render: Mis postulaciones
========================= */
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
   Postularme
========================= */
safeOn(jobsList, "click", async (e) => {
  const btn = e.target.closest(".applyBtn");
  if (!btn) return;
  if (!currentUid) return alert(tw("no_session"));
  const jobId = btn.dataset.jobid;
  if (!jobId) return;
  if (myAppliedJobIds.has(jobId)) { btn.disabled = true; btn.textContent = tw("applied"); return; }
  btn.disabled = true;
  btn.textContent = tw("applying");
  try {
    await addDoc(collection(db, "applications"), {
      jobId, workerUid: currentUid, createdAt: serverTimestamp(),
      status: "applied", workerName: currentWorkerName || tw("worker_default_name"),
    });
    myAppliedJobIds.add(jobId);
    btn.textContent = tw("applied");
  } catch (err) {
    console.error(err);
    btn.disabled = false;
    btn.textContent = tw("apply");
    alert(err.message);
  }
});

/* =========================
   Despostularme
========================= */
myAppsList.addEventListener("click", async (e) => {
  const btn = e.target.closest(".withdrawBtn");
  if (!btn) return;
  const jobId = btn.dataset.jobid;
  if (!jobId || !currentUid) return;
  btn.disabled = true;
  btn.textContent = tw("withdrawing");
  try {
    const q = query(collection(db, "applications"), where("workerUid", "==", currentUid), where("jobId", "==", jobId));
    const snap = await getDocs(q);
    for (const d of snap.docs) await deleteDoc(doc(db, "applications", d.id));
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
   Preview foto
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
  showSpinner();

  try {
    const snap = await getDoc(doc(db, "users", user.uid));
    const profile = snap.exists() ? snap.data() : {};
    currentWorkerName = profile.name || tw("worker_default_name");

    if (profile.role !== "worker") return (window.location.href = "./index.html");

    document.title = tw("page_title");
    safeText(who, tw("worker_panel"));
    currentAvailable = !!profile.availableNow;
    setAvailUI(currentAvailable);

    safeText(pName, profile.name || "—");
    safeText(pRole, `${tw("role_label")} ${profile.role || "worker"}`);
    safeSrc(profilePhoto, profile.photoUrl || "icons/default-user.png");
    safeText(pLocation, profile.location ? `📍 ${profile.location}` : tw("location_empty"));
    safeText(pBio, profile.bio ? `📝 ${profile.bio}` : tw("bio_empty"));
    safeText(pDays, profile.availableDays?.length ? `📅 ${profile.availableDays.join(", ")}` : tw("days_empty"));
    safeText(pHours, profile.availableHours ? `⏰ ${profile.availableHours}` : tw("hours_empty"));

    if (editName) editName.value = profile.name || "";
    if (editLocation) editLocation.value = profile.location || "";
    if (editBio) editBio.value = profile.bio || "";
    if (editHours) editHours.value = profile.availableHours || "";
    setSelectedDays(profile.availableDays || []);
    safeSrc(photoPreview, profile.photoUrl || "icons/default-user.png");
    safeText(uploadHint, profile.photoUrl ? tw("current_photo_loaded") : tw("upload_photo_hint"));

    checkOnboarding(profile);
    hideSpinner();

    /* --- Snapshots --- */

    // Historial worker (worker_history)
    const qWHist = query(collection(db, "worker_history"), where("workerUid", "==", currentUid));
    onSnapshot(qWHist, (histSnap) => {
      if (!workerHistoryList) return;
      const items = histSnap.docs.map(d => ({ id: d.id, ...d.data() }));
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
    }, (err) => {
      console.error(err);
      if (workerHistoryList) workerHistoryList.innerHTML = `<div class="meta error">${tw("error_loading")}</div>`;
    });

    // Contactos compartidos por el worker
    const qShared = query(
      collection(db, "contact_requests"),
      where("workerUid", "==", currentUid),
      where("status", "==", "shared")
    );
    onSnapshot(qShared, async (sharedSnap) => {
      if (!sharedContactsList) return;
      sharedContactsList.innerHTML = "";
      if (sharedSnap.empty) {
        sharedContactsList.innerHTML = `<div class="meta">${tw("no_shared_contacts")}</div>`;
        return;
      }
      for (const d of sharedSnap.docs) {
        const r = d.data();
        const bSnap = await getDoc(doc(db, "users", r.businessUid));
        const b = bSnap.exists() ? bSnap.data() : {};
        const sharedDate = r.sharedAt?.toDate?.() ? r.sharedAt.toDate().toLocaleDateString("ca-ES") : "—";

        let shiftInfo = `<div class="sub">${tw("direct_contact")}</div>`;
        if (r.jobId) {
          const jobSnap = await getDoc(doc(db, "jobs", r.jobId));
          if (jobSnap.exists()) {
            const job = jobSnap.data();
            shiftInfo = `
              <div class="sub">${tw("for_shift")} ${(job.role || tw("job_default")).toUpperCase()} - ${(job.zone || "").toUpperCase()}</div>
              <div class="sub">📅 ${formatDateEU(job.date)} · 🕒 ${formatHourRange(job.from, job.to)}</div>
            `;
          }
        }

        const el = document.createElement("div");
        el.className = "item";
        el.innerHTML = `
          <div class="title">${b.companyName || tw("company")}</div>
          ${shiftInfo}
          <div class="sub" style="margin-top:4px;">🕐 ${tw("shared_on")} ${sharedDate}</div>
          <div class="row" style="margin-top:10px;">
            <button class="btn danger deleteSharedContactBtn" data-id="${d.id}">${tw("delete_contact")}</button>
          </div>
        `;
        sharedContactsList.appendChild(el);
      }
    }, (err) => {
      console.error(err);
      if (sharedContactsList) sharedContactsList.innerHTML = `<div class="meta error">${tw("error_loading")}</div>`;
    });

    // Mis postulaciones
    const qMyApps = query(collection(db, "applications"), where("workerUid", "==", currentUid));
    onSnapshot(qMyApps, (appsSnap) => {
      myAppliedJobIds = new Set(appsSnap.docs.map((d) => d.data().jobId));
      rerenderLists();
    }, (err) => {
      console.error(err);
      if (myAppsList) myAppsList.innerHTML = `<div class="meta error">${tw("error_loading")}</div>`;
    });

    // Jobs abiertos
    const qJobs = query(collection(db, "jobs"), where("status", "==", "open"));
    onSnapshot(qJobs, (jobsSnap) => {
      latestJobs = jobsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      latestJobs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      rerenderLists();
    }, (err) => {
      console.error(err);
      if (jobsList) jobsList.innerHTML = `<div class="meta error">${tw("error_loading")}</div>`;
    });

    // Solicitudes de contacto pendientes
    const qReq = query(
      collection(db, "contact_requests"),
      where("workerUid", "==", currentUid),
      where("status", "==", "pending")
    );
    onSnapshot(qReq, async (reqSnap) => {
      if (!contactReqList) return;
      contactReqList.innerHTML = "";
      if (reqSnap.size === 0) {
        contactReqList.innerHTML = `<div class="meta">${tw("no_contact_requests")}</div>`;
        return;
      }
      for (const d of reqSnap.docs) {
        const r = d.data();
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
    }, (err) => {
      console.error(err);
      if (contactReqList) contactReqList.innerHTML = `<div class="meta error">${tw("error_loading")}</div>`;
    });

  } catch (err) {
    console.error(err);
    hideSpinner();
  }
});

/* =========================
   Guardar perfil
========================= */
safeOn(profileForm, "submit", async (e) => {
  e.preventDefault();
  if (!currentUid) return;
  safeText(profileMsg, tw("save_profile"));
  try {
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
    checkOnboarding(updatePayload);
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
   Logout
========================= */
safeOn(logoutBtn, "click", async () => {
  await signOut(auth);
  window.location.href = "./index.html";
});

/* =========================
   Click contactReqList
========================= */
contactReqList.addEventListener("click", async (e) => {
  const shareBtn = e.target.closest(".shareContactBtn");
  const declineBtn = e.target.closest(".declineContactBtn");
  if (shareBtn) { openShareModal(shareBtn.dataset.id); return; }
  if (declineBtn) {
    const id = declineBtn.dataset.id;
    if (!confirm(tw("reject_request_confirm"))) return;
    await updateDoc(doc(db, "contact_requests", id), { status: "declined" });
  }
});

/* =========================
   Eliminar contacto compartido (worker)
========================= */
if (sharedContactsList) {
  sharedContactsList.addEventListener("click", async (e) => {
    const btn = e.target.closest(".deleteSharedContactBtn");
    if (!btn) return;
    const id = btn.dataset.id;
    if (!id) return;
    if (!confirm(tw("delete_contact_confirm"))) return;
    btn.disabled = true;
    btn.textContent = tw("deleting");
    try {
      await deleteDoc(doc(db, "contact_requests", id));
    } catch (err) {
      console.error(err);
      btn.disabled = false;
      btn.textContent = tw("delete_contact");
    }
  });
}

/* =========================
   Formulario compartir contacto
========================= */
if (shareContactForm) {
  shareContactForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = shareReqId?.value;
    if (!id) return;
    const whatsapp = (shareWhatsapp?.value || "").trim();
    const phone = (sharePhone?.value || "").trim();
    const email = (shareEmail?.value || "").trim();
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