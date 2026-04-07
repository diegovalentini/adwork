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
  showMessage("Debes aceptar los términos y condiciones.", "error");
  return;
  }
  showMessage("Creando cuenta...", "info");

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

    showMessage("Cuenta creada ✅", "success");
  } catch (err) {
   console.error(err);
    showMessage(err.code ? `${err.code}: ${err.message}` : err.message, "error");
  }
});

// LOGIN
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  showMessage("Ingresando...", "info");

  try {
    const email = loginEmail.value.trim();
    const pass = loginPassword.value;
    await signInWithEmailAndPassword(auth, email, pass);
    showMessage("Bienvenido ✅", "success");
  } catch (err) {
  let text = "Error al iniciar sesión.";

  if (err.code === "auth/invalid-credential") {
    text = "Email o contraseña incorrectos.";
  } else if (err.code === "auth/user-not-found") {
    text = "No existe una cuenta con ese email.";
  } else if (err.code === "auth/wrong-password") {
    text = "La contraseña es incorrecta.";
  } else if (err.code === "auth/too-many-requests") {
    text = "Demasiados intentos. Probá más tarde.";
  }

  console.error(err);
  showMessage(text, "error");
}



});

// RESET PASSWORD
resetBtn.addEventListener("click", async () => {
  const email = loginEmail.value.trim();
  if (!email) return showMessage("Escribe tu email arriba para enviar el reset.", "error");

  showMessage("Enviando correo de recuperación...", "info");
  try {
    await sendPasswordResetEmail(auth, email);
    showMessage("Listo. Revisa tu correo ✅", "success");
  } catch (err) {
  console.error(err);
  let text = "No se pudo enviar el correo de recuperación.";

  if (err.code === "auth/user-not-found") text = "No existe una cuenta con ese email.";
  else if (err.code === "auth/invalid-email") text = "Email inválido.";
  else if (err.code === "auth/too-many-requests") text = "Demasiados intentos. Probá más tarde.";

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
  showMessage("Sesión cerrada.", "info");
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
