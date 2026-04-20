import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

//mostrar/ocultar campos según rol
const businessFields = document.getElementById("businessFields");
const regCompanyName = document.getElementById("regCompanyName");
const regCompanyType = document.getElementById("regCompanyType");
const regCompanyLocation = document.getElementById("regCompanyLocation");


// Tabs
const tabLogin = document.getElementById("tabLogin");
const tabRegister = document.getElementById("tabRegister");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

// Forms
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const acceptTerms = document.getElementById("acceptTerms");

const regName = document.getElementById("regName");
const regEmail = document.getElementById("regEmail");
const regPassword = document.getElementById("regPassword");
const regRole = document.getElementById("regRole");

const msg = document.getElementById("msg");

// After login
const afterLogin = document.getElementById("afterLogin");
const userInfo = document.getElementById("userInfo");
const logoutBtn = document.getElementById("logoutBtn");
const resetBtn = document.getElementById("resetBtn");

const langToggle = document.getElementById("langToggle");
const langMenu = document.getElementById("langMenu");
const currentLang = document.getElementById("currentLang");

const translations = {
  ca: {
    hero_subtitle: "Extras i torns per hores a Andorra",
    tab_login: "Iniciar sessió",
    tab_register: "Registrar-me",
    label_name: "Nom",
    label_email: "Email",
    label_password: "Contrasenya",
    label_role: "Perfil",
    role_worker: "Treballador (extres)",
    role_business: "Negoci",
    label_company_name: "Nom de l’empresa",
    label_company_type: "Sector",
    label_company_location: "Ubicació",
    company_type_hotel: "Hotel",
    company_type_restaurant: "Restaurant",
    company_type_shop: "Comerç",
    company_type_other: "Altres",
    btn_login: "Entrar",
    btn_reset: "Has oblidat la contrasenya?",
    btn_create_account: "Crear compte",
    session_started: "Sessió iniciada ✅",
    btn_logout: "Tancar sessió",
    footer_terms: "Termes",
    footer_privacy: "Privacitat",
    footer_contact: "© 2026 AdWork · contacte: adwork.contacto@gmail.com",
    accept_prefix: "Accepto els",
    accept_and: "i la",
    msg_accept_terms: "Has d’acceptar els termes i condicions.",
    msg_creating_account: "Creant compte...",
    msg_account_created: "Compte creat ✅",
    msg_logging_in: "Entrant...",
    msg_welcome: "Benvingut ✅",
    msg_login_error: "Error en iniciar sessió.",
    msg_invalid_credential: "Email o contrasenya incorrectes.",
    msg_user_not_found: "No existeix cap compte amb aquest email.",
    msg_wrong_password: "La contrasenya és incorrecta.",
    msg_too_many_requests: "Massos intents. Torna-ho a provar més tard.",
    msg_write_email_for_reset: "Escriu el teu email a dalt per enviar el reset.",
    msg_sending_reset: "Enviant correu de recuperació...",
    msg_reset_sent: "Fet. Revisa el teu correu ✅",
    msg_reset_failed: "No s'ha pogut enviar el correu de recuperació.",
    msg_invalid_email: "Email invàlid.",
    msg_logged_out: "Sessió tancada."
  },
  es: {
    hero_subtitle: "Extras y turnos por horas en Andorra",
    tab_login: "Iniciar sesión",
    tab_register: "Registrarme",
    label_name: "Nombre",
    label_email: "Email",
    label_password: "Contraseña",
    label_role: "Perfil",
    role_worker: "Trabajador (extras)",
    role_business: "Negocio",
    label_company_name: "Nombre de la empresa",
    label_company_type: "Rubro",
    label_company_location: "Ubicación",
    company_type_hotel: "Hotel",
    company_type_restaurant: "Restaurante",
    company_type_shop: "Comercio",
    company_type_other: "Otros",
    btn_login: "Entrar",
    btn_reset: "¿Olvidaste tu contraseña?",
    btn_create_account: "Crear cuenta",
    session_started: "Sesión iniciada ✅",
    btn_logout: "Cerrar sesión",
    footer_terms: "Términos",
    footer_privacy: "Privacidad",
    footer_contact: "© 2026 AdWork · contacto: adwork.contacto@gmail.com",
    msg_accept_terms: "Debes aceptar los términos y condiciones.",
    msg_creating_account: "Creando cuenta...",
    msg_account_created: "Cuenta creada ✅",
    msg_logging_in: "Ingresando...",
    msg_welcome: "Bienvenido ✅",
    msg_login_error: "Error al iniciar sesión.",
    msg_invalid_credential: "Email o contraseña incorrectos.",
    msg_user_not_found: "No existe una cuenta con ese email.",
    msg_wrong_password: "La contraseña es incorrecta.",
    msg_too_many_requests: "Demasiados intentos. Probá más tarde.",
    msg_write_email_for_reset: "Escribe tu email arriba para enviar el reset.",
    msg_sending_reset: "Enviando correo de recuperación...",
    msg_reset_sent: "Listo. Revisa tu correo ✅",
    msg_reset_failed: "No se pudo enviar el correo de recuperación.",
    msg_invalid_email: "Email inválido.",
    msg_logged_out: "Sesión cerrada.",
    accept_prefix: "Acepto los",
    accept_and: "y la",
  }
};

let currentLanguage = localStorage.getItem("adwork_lang") || "ca";

function t(key) {
  return translations[currentLanguage][key] || key;
}

function applyTranslations() {
  document.documentElement.lang = currentLanguage;
  if (currentLang) currentLang.textContent = currentLanguage.toUpperCase();

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    const text = t(key);

    if (el.tagName === "INPUT" && el.placeholder) {
      el.placeholder = text;
    } else {
      el.textContent = text;
    }
  });

  const regPasswordInput = document.getElementById("regPassword");
  if (regPasswordInput) {
    regPasswordInput.placeholder = currentLanguage === "ca" ? "Mínim 6 caràcters" : "Mínimo 6 caracteres";
  }

  const regCompanyNameInput = document.getElementById("regCompanyName");
  if (regCompanyNameInput) {
    regCompanyNameInput.placeholder = currentLanguage === "ca" ? "Ex: Hotel Nevada" : "Ej: Hotel Nevada";
  }

  const regCompanyLocationInput = document.getElementById("regCompanyLocation");
  if (regCompanyLocationInput) {
    regCompanyLocationInput.placeholder = currentLanguage === "ca" ? "Ex: Escaldes" : "Ej: Escaldes";
  }
}

langToggle?.addEventListener("click", () => {
  langMenu?.classList.toggle("hidden");
});

document.querySelectorAll(".lang-option").forEach((btn) => {
  btn.addEventListener("click", () => {
    currentLanguage = btn.dataset.lang;
    localStorage.setItem("adwork_lang", currentLanguage);
    applyTranslations();
    langMenu?.classList.add("hidden");
  });
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".lang-switcher")) {
    langMenu?.classList.add("hidden");
  }
});

function showMessage(text, type = "info") {
  msg.textContent = text || "";
  msg.style.color =
    type === "error" ? "#ffd6d6" :
    type === "success" ? "#c8ffe5" :
    "#a9b4d0";
}

function setActiveTab(which) {
  if (which === "login") {
    tabLogin.classList.add("active");
    tabRegister.classList.remove("active");
    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");
    showMessage("");
  } else {
    tabRegister.classList.add("active");
    tabLogin.classList.remove("active");
    registerForm.classList.remove("hidden");
    loginForm.classList.add("hidden");
    showMessage("");
  }
}

tabLogin.addEventListener("click", () => setActiveTab("login"));
tabRegister.addEventListener("click", () => setActiveTab("register"));

// REGISTER
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!acceptTerms.checked) {
  showMessage(t("msg_accept_terms"), "error");
  return;
  }
  showMessage(t("msg_creating_account"), "info");

  try {
    const name = regName.value.trim();
    const email = regEmail.value.trim();
    const pass = regPassword.value;
    const role = regRole.value;

    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    const uid = cred.user.uid;
    const isBusiness = role === "business";
    // Guardamos perfil básico en Firestore
    await setDoc(doc(db, "users", uid), {
      uid,
      name,
      email,
      role, 
      createdAt: serverTimestamp(),
      // solo negocio:
      companyName: isBusiness ? regCompanyName.value.trim() : null,
      companyType: isBusiness ? regCompanyType.value : null,
      companyLocation: isBusiness ? regCompanyLocation.value.trim() : null,
      // ratings
      ratingAvg: 0,
      ratingCount: 0,
    });

    showMessage(t("msg_account_created"), "success");
  } catch (err) {
   console.error(err);
    showMessage(err.code ? `${err.code}: ${err.message}` : err.message, "error");
  }
});

// LOGIN
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  showMessage(t("msg_logging_in"), "info");

  try {
    const email = loginEmail.value.trim();
    const pass = loginPassword.value;
    await signInWithEmailAndPassword(auth, email, pass);
    showMessage(t("msg_welcome"), "success");
  } catch (err) {
  let text = t("msg_login_error");

  if (err.code === "auth/invalid-credential") {
    text = t("msg_invalid_credential");
  } else if (err.code === "auth/user-not-found") {
    text = t("msg_user_not_found");
  } else if (err.code === "auth/wrong-password") {
    text = t("msg_wrong_password");
  } else if (err.code === "auth/too-many-requests") {
    text = t("msg_too_many_requests");
  }

  console.error(err);
  showMessage(text, "error");
}



});

// RESET PASSWORD
resetBtn.addEventListener("click", async () => {
  const email = loginEmail.value.trim();
  if (!email) return showMessage(t("msg_write_email_for_reset"), "error");

  showMessage(t("msg_sending_reset"), "info");
  try {
    await sendPasswordResetEmail(auth, email);
    showMessage(t("msg_reset_sent"), "success");
  } catch (err) {
  console.error(err);
  let text = t("msg_reset_failed");

  if (err.code === "auth/user-not-found") text = t("msg_user_not_found");
  else if (err.code === "auth/invalid-email") text = t("msg_invalid_email");
  else if (err.code === "auth/too-many-requests") text = t("msg_too_many_requests");

  showMessage(text, "error");
}
});

// AUTH STATE
  onAuthStateChanged(auth, async (user) => {
  const authCard = document.getElementById("authCard");

  if (!user) {
    afterLogin.classList.add("hidden");
    authCard.classList.remove("hidden");
    return;
  }

  // leer perfil
  const snap = await getDoc(doc(db, "users", user.uid));
  const profile = snap.exists() ? snap.data() : null;

  if (!profile?.role) {
    // Si por alguna razón no existe perfil, no lo dejamos colgado
    userInfo.textContent = `Usuario: ${user.email} — Rol: ?`;
    afterLogin.classList.remove("hidden");
    authCard.classList.add("hidden");
    return;
  }

  // Redirigir según rol
  if (profile.role === "worker") {
    window.location.href = "./worker.html";
  } else if (profile.role === "business") {
    window.location.href = "./business.html";
  } else {
    userInfo.textContent = `Usuario: ${profile.name || user.email} — Rol: ${profile.role}`;
    afterLogin.classList.remove("hidden");
    authCard.classList.add("hidden");
  }
});

// LOGOUT
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  showMessage(t("msg_logged_out"), "info");
  setActiveTab("login");
});

regRole.addEventListener("change", () => {
  const isBusiness = regRole.value === "business";
  businessFields.classList.toggle("hidden", !isBusiness);

  // si no es negocio, limpiamos
  if (!isBusiness) {
    regCompanyName.value = "";
    regCompanyLocation.value = "";
  }
});
applyTranslations();