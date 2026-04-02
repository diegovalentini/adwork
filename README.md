# AdWork

AdWork es una app web pensada para conectar empresas con trabajadores de forma rápida y directa, especialmente para cubrir turnos puntuales.

La idea es simple:  
las empresas publican turnos, los trabajadores se postulan, y cuando hay un match, recién ahí se habilita el contacto.

---

## 🚀 Qué se puede hacer

### 👨‍💼 Empresas
- Crear y gestionar turnos
- Ver postulaciones en tiempo real
- Aceptar trabajadores
- Solicitar contacto (solo después de aceptar)
- Ver trabajadores disponibles
- Historial de turnos completados

### 👷 Trabajadores
- Ver turnos disponibles
- Postularse a trabajos
- Gestionar sus postulaciones
- Recibir solicitudes de contacto
- Compartir contacto (opcional)
- Perfil editable (días, horarios, bio, etc.)

---

## 🧠 Cómo funciona la lógica

- Un trabajador se postula → se crea en `applications`
- La empresa acepta → el job pasa a `filled`
- Se genera una `contact_request`
- El trabajador decide si comparte su contacto
- Si lo comparte → la empresa puede verlo
- Se guarda en historial para futuras valoraciones

👉 Nadie puede ver datos de contacto sin consentimiento

---

## 🛠️ Tecnologías

- HTML / CSS / JS (vanilla)
- Firebase Auth
- Firestore (base de datos en tiempo real)
- Firebase Storage (fotos de perfil)

---

## 📁 Estructura básica
/app
├── index.html
├── worker.html
├── business.html
├── dashboard-worker.js
├── dashboard-business.js
├── firebase-config.js
└── styles.css

