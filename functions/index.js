const { onRequest } = require("firebase-functions/v2/https");
const {
  onDocumentCreated,
  onDocumentWritten,
} = require("firebase-functions/v2/firestore");
const { defineSecret } = require("firebase-functions/params");

const admin = require("firebase-admin");
const { Resend } = require("resend");

admin.initializeApp();

const RESEND_API_KEY = defineSecret("RESEND_API_KEY");

const TEST_MODE = true;
const TEST_EMAIL = "diegu.v1@gmail.com";

exports.helloWorld = onRequest((req, res) => {
  res.send("Hola desde Firebase Functions");
});

exports.onNewApplication = onDocumentCreated(
  {
    document: "applications/{appId}",
    region: "us-central1",
    secrets: [RESEND_API_KEY],
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const application = snap.data();
    if (!application) return;

    const db = admin.firestore();

    try {
      console.log("Trigger ejecutado");

      const jobId = application.jobId;
      const workerName = application.workerName || "Un trabajador";

      if (!jobId) {
        console.log("La postulación no tiene jobId");
        return;
      }

      const jobSnap = await db.collection("jobs").doc(jobId).get();
      if (!jobSnap.exists) {
        console.log("No existe el job:", jobId);
        return;
      }

      const job = jobSnap.data();
      const businessUid = job.businessUid;

      if (!businessUid) {
        console.log("El job no tiene businessUid");
        return;
      }

      const businessSnap = await db.collection("users").doc(businessUid).get();
      if (!businessSnap.exists) {
        console.log("No existe la empresa:", businessUid);
        return;
      }

      const business = businessSnap.data();
      const businessEmail = business.email;
      const companyName = business.companyName || business.name || "Tu empresa";

      if (!businessEmail) {
        console.log("La empresa no tiene email");
        return;
      }

      const jobRole = job.role || "Puesto no especificado";
      const jobDate = job.date || "Fecha no especificada";
      const jobZone = job.zone || "Zona no especificada";

      const recipient = TEST_MODE ? TEST_EMAIL : businessEmail;

      const resend = new Resend(RESEND_API_KEY.value());
      console.log("Resend inicializado");

      const result = await resend.emails.send({
        from: "AdWork <noreply@adwork.ad>",
        to: recipient,
        subject: "Nuevo postulante en AdWork",
        html: `
          <h2>Nuevo postulante</h2>
          <p>Hola ${companyName},</p>
          <p><strong>${workerName}</strong> se postuló a uno de tus turnos en AdWork.</p>

          <p><strong>Detalles del turno:</strong></p>
          <ul>
            <li><strong>Puesto:</strong> ${jobRole}</li>
            <li><strong>Fecha:</strong> ${jobDate}</li>
            <li><strong>Zona:</strong> ${jobZone}</li>
          </ul>

          <p>Entrá a AdWork para revisar la postulación.</p>
          ${
            TEST_MODE
              ? `<p style="margin-top:16px;color:#666;">Modo prueba: el destinatario real era ${businessEmail}</p>`
              : ""
          }
        `,
      });

      if (result.error) {
        console.error("Error enviando email con Resend:", result.error);
        return;
      }

      console.log("Email enviado correctamente:", result.data);
    } catch (error) {
      console.error("Error en onNewApplication:", error);
    }
  }
);

exports.onContactRequestWritten = onDocumentWritten(
  {
    document: "contact_requests/{requestId}",
    region: "us-central1",
    secrets: [RESEND_API_KEY],
  },
  async (event) => {
const beforeSnap = event.data?.before;
const afterSnap = event.data?.after;

// Si se borró el doc, no hacemos nada
if (!afterSnap || !afterSnap.exists) return;

const requestData = afterSnap.data();

if (requestData.status !== "pending") {
  console.log("La solicitud no está en pending, no se envía mail");
  return;
}

    const db = admin.firestore();

    try {
      console.log("Trigger onContactRequestWritten ejecutado");

      const { workerUid, businessUid, jobId } = requestData;

      if (!workerUid || !businessUid) {
        console.log("Faltan workerUid o businessUid");
        return;
      }

      const workerSnap = await db.collection("users").doc(workerUid).get();
      if (!workerSnap.exists) {
        console.log("No existe el worker:", workerUid);
        return;
      }

      const worker = workerSnap.data();
      const workerEmail = worker.email;
      const workerName = worker.name || "Trabajador";

      if (!workerEmail) {
        console.log("El worker no tiene email");
        return;
      }

      const businessSnap = await db.collection("users").doc(businessUid).get();
      if (!businessSnap.exists) {
        console.log("No existe la empresa:", businessUid);
        return;
      }

      const business = businessSnap.data();
      const companyName = business.companyName || business.name || "Una empresa";

      let html = "";

      if (jobId) {
        const jobSnap = await db.collection("jobs").doc(jobId).get();
        const job = jobSnap.exists ? jobSnap.data() : {};

        const jobRole = job.role || "Puesto no especificado";
        const jobDate = job.date || "Fecha no especificada";
        const jobZone = job.zone || "Zona no especificada";
        const jobFrom = job.from || "";
        const jobTo = job.to || "";

        html = `
          <h2>Solicitud de contacto</h2>
          <p>Hola ${workerName},</p>
          <p><strong>${companyName}</strong> solicitó tu contacto para un turno en AdWork.</p>

          <p><strong>Detalles del turno:</strong></p>
          <ul>
            <li><strong>Puesto:</strong> ${jobRole}</li>
            <li><strong>Fecha:</strong> ${jobDate}</li>
            <li><strong>Zona:</strong> ${jobZone}</li>
            <li><strong>Horario:</strong> ${jobFrom} ${jobTo ? `- ${jobTo}` : ""}</li>
          </ul>

          <p>Entrá a AdWork para decidir si querés compartir tu contacto.</p>
          ${
            TEST_MODE
              ? `<p style="margin-top:16px;color:#666;">Modo prueba: el destinatario real era ${workerEmail}</p>`
              : ""
          }
        `;
      } else {
        html = `
          <h2>Solicitud de contacto</h2>
          <p>Hola ${workerName},</p>
          <p><strong>${companyName}</strong> quiere contactarte directamente a través de AdWork.</p>
          <p>Entrá a AdWork para decidir si querés compartir tu contacto.</p>
          ${
            TEST_MODE
              ? `<p style="margin-top:16px;color:#666;">Modo prueba: el destinatario real era ${workerEmail}</p>`
              : ""
          }
        `;
      }

      const recipient = TEST_MODE ? TEST_EMAIL : workerEmail;
      const resend = new Resend(RESEND_API_KEY.value());

      const result = await resend.emails.send({
        from: "AdWork <noreply@adwork.ad>",
        to: recipient,
        subject: "Una empresa solicitó tu contacto en AdWork",
        html,
      });

      if (result.error) {
        console.error("Error enviando email al worker con Resend:", result.error);
        return;
      }

      console.log("Email al worker enviado correctamente:", result.data);
    } catch (error) {
      console.error("Error en onContactRequestWritten:", error);
    }
  }
);