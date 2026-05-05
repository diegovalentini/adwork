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

const TEST_MODE = false;
const TEST_EMAIL = "diegu.v1@gmail.com";

const I18N = {
  ca: {
    worker_default: "Un treballador",
    business_default: "La teva empresa",
    job_unspecified: "Lloc no especificat",
    date_unspecified: "Data no especificada",
    zone_unspecified: "Zona no especificada",
    shift: "torn",

    new_application_subject: "Nou postulant a AdWork",
    new_application_title: "Nou postulant",
    new_application_intro: "{workerName} s'ha postulat a un dels teus torns a AdWork.",
    shift_details: "Detalls del torn:",
    position: "Lloc",
    date: "Data",
    zone: "Zona",
    schedule: "Horari",
    enter_review_application: "Entra a AdWork per revisar la postulació.",

    contact_request_subject: "Una empresa ha sol·licitat el teu contacte a AdWork",
    contact_request_title: "Sol·licitud de contacte",
    contact_request_intro: "{companyName} ha sol·licitat el teu contacte a AdWork.",
    enter_share_contact: "Entra a AdWork per decidir si vols compartir el teu contacte.",

    contact_shared_subject: "Un treballador ha compartit el seu contacte a AdWork",
    contact_shared_title: "Contacte compartit",
    contact_shared_intro: "{workerName} ha acceptat la teva sol·licitud i ha compartit el seu contacte.",
    contact_data: "Dades de contacte:",
    related_shift: "Torn relacionat:",
    see_in_panel: "També pots veure-ho des del teu panell d'AdWork.",

    contact_declined_subject: "Un treballador ha rebutjat compartir el seu contacte a AdWork",
    contact_declined_title: "Sol·licitud rebutjada",
    contact_declined_intro: "{workerName} ha rebutjat compartir el seu contacte.",
    keep_searching: "Pots continuar buscant treballadors disponibles a AdWork.",

    notif_new_application_title: "Nou postulant",
    notif_new_application_message: "{workerName} s'ha postulat al teu torn de {jobRole}.",
    notif_contact_request_title: "Sol·licitud de contacte",
    notif_contact_request_message: "{companyName} vol contactar amb tu a AdWork.",
    notif_contact_shared_title: "Contacte compartit",
    notif_contact_shared_message: "{workerName} ha compartit el seu contacte amb tu.",
    notif_contact_declined_title: "Sol·licitud rebutjada",
    notif_contact_declined_message: "{workerName} ha rebutjat compartir el seu contacte.",
  },

  es: {
    worker_default: "Un trabajador",
    business_default: "Tu empresa",
    job_unspecified: "Puesto no especificado",
    date_unspecified: "Fecha no especificada",
    zone_unspecified: "Zona no especificada",
    shift: "turno",

    new_application_subject: "Nuevo postulante en AdWork",
    new_application_title: "Nuevo postulante",
    new_application_intro: "{workerName} se postuló a uno de tus turnos en AdWork.",
    shift_details: "Detalles del turno:",
    position: "Puesto",
    date: "Fecha",
    zone: "Zona",
    schedule: "Horario",
    enter_review_application: "Entrá a AdWork para revisar la postulación.",

    contact_request_subject: "Una empresa solicitó tu contacto en AdWork",
    contact_request_title: "Solicitud de contacto",
    contact_request_intro: "{companyName} solicitó tu contacto en AdWork.",
    enter_share_contact: "Entrá a AdWork para decidir si querés compartir tu contacto.",

    contact_shared_subject: "Un trabajador compartió su contacto en AdWork",
    contact_shared_title: "Contacto compartido",
    contact_shared_intro: "{workerName} aceptó tu solicitud y compartió su contacto.",
    contact_data: "Datos de contacto:",
    related_shift: "Turno relacionado:",
    see_in_panel: "También podés verlo desde tu panel de AdWork.",

    contact_declined_subject: "Un trabajador rechazó compartir su contacto en AdWork",
    contact_declined_title: "Solicitud rechazada",
    contact_declined_intro: "{workerName} rechazó compartir su contacto.",
    keep_searching: "Podés seguir buscando trabajadores disponibles en AdWork.",

    notif_new_application_title: "Nuevo postulante",
    notif_new_application_message: "{workerName} se postuló a tu turno de {jobRole}.",
    notif_contact_request_title: "Solicitud de contacto",
    notif_contact_request_message: "{companyName} quiere contactarte en AdWork.",
    notif_contact_shared_title: "Contacto compartido",
    notif_contact_shared_message: "{workerName} compartió su contacto contigo.",
    notif_contact_declined_title: "Solicitud rechazada",
    notif_contact_declined_message: "{workerName} rechazó compartir su contacto.",
  },
};

function getLang(profile) {
  return profile?.lang || profile?.language || profile?.preferredLang || "ca";
}

function tr(lang, key, vars = {}) {
  let text = I18N[lang]?.[key] || I18N.ca[key] || key;

  Object.entries(vars).forEach(([name, value]) => {
    text = text.replaceAll(`{${name}}`, value ?? "");
  });

  return text;
}

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
      console.log("Trigger onNewApplication ejecutado");

      const jobId = application.jobId;
      const workerName = application.workerName || I18N.ca.worker_default;

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
      const companyName =
        business.companyName ||
        business.name ||
        tr(getLang(business), "business_default");

      if (!businessEmail) {
        console.log("La empresa no tiene email");
        return;
      }

      const lang = getLang(business);

      const jobRole = job.role || tr(lang, "job_unspecified");
      const jobDate = job.date || tr(lang, "date_unspecified");
      const jobZone = job.zone || tr(lang, "zone_unspecified");

      const recipient = TEST_MODE ? TEST_EMAIL : businessEmail;
      const resend = new Resend(RESEND_API_KEY.value());

      const result = await resend.emails.send({
        from: "AdWork <noreply@adwork.ad>",
        to: recipient,
        subject: tr(lang, "new_application_subject"),
        html: `
          <h2>${tr(lang, "new_application_title")}</h2>

          <p>Hola ${companyName},</p>

        <p>${tr(lang, "new_application_intro", { workerName: `<strong>${workerName}</strong>` })}</p>

          <p><strong>${tr(lang, "shift_details")}</strong></p>

          <ul>
            <li><strong>${tr(lang, "position")}:</strong> ${jobRole}</li>
            <li><strong>${tr(lang, "date")}:</strong> ${jobDate}</li>
            <li><strong>${tr(lang, "zone")}:</strong> ${jobZone}</li>
          </ul>

          <p>${tr(lang, "enter_review_application")}</p>

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

      await db.collection("notifications").add({
        userUid: businessUid,
        role: "business",
        type: "new_application",

        titleKey: "notif_new_application_title",
        messageKey: "notif_new_application_message",
        vars: {
          workerName,
          jobRole,
        },

        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log("Notificación traducible creada para la empresa");
    } catch (error) {
      console.error("Error en onNewApplication:", error);
    }
  }
);

exports.onApplicationWritten = onDocumentWritten(
  {
    document: "applications/{appId}",
    region: "us-central1",
    secrets: [RESEND_API_KEY],
  },
  async (event) => {
    const beforeSnap = event.data?.before;
    const afterSnap = event.data?.after;

    if (!afterSnap || !afterSnap.exists) return;

    const before = beforeSnap?.exists ? beforeSnap.data() : null;
    const after = afterSnap.data();

    const beforeStatus = before?.status || null;
    const afterStatus = after.status || "applied";

    if (beforeStatus === afterStatus) return;

    if (afterStatus !== "rejected") return;

    const db = admin.firestore();

    try {
      const { workerUid, jobId } = after;

      if (!workerUid || !jobId) {
        console.log("Faltan workerUid o jobId en application rejected");
        return;
      }

      const jobSnap = await db.collection("jobs").doc(jobId).get();
      if (!jobSnap.exists) {
        console.log("No existe job para rechazo:", jobId);
        return;
      }

      const job = jobSnap.data();
      const businessUid = job.businessUid;

      let companyName = "Una empresa";

      if (businessUid) {
        const businessSnap = await db.collection("users").doc(businessUid).get();
        if (businessSnap.exists) {
          const business = businessSnap.data();
          companyName = business.companyName || business.name || companyName;
        }
      }

      const jobRole = job.role || "turno";

      await db.collection("notifications").add({
        userUid: workerUid,
        role: "worker",
        type: "application_rejected",
        titleKey: "notif_application_rejected_title",
        messageKey: "notif_application_rejected_message",
        vars: {
          companyName,
          jobRole,
        },
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log("Notificación de rechazo creada para worker");
    } catch (error) {
      console.error("Error en onApplicationWritten:", error);
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

    if (!afterSnap || !afterSnap.exists) return;

    const before = beforeSnap?.exists ? beforeSnap.data() : null;
    const requestData = afterSnap.data();

    const beforeStatus = before?.status || null;
    const afterStatus = requestData.status;

    if (beforeStatus === afterStatus) {
      console.log("El status no cambió, no se envía email");
      return;
    }

    const db = admin.firestore();

    try {
      const { workerUid, businessUid, jobId } = requestData;

      if (!workerUid || !businessUid) {
        console.log("Faltan workerUid o businessUid");
        return;
      }

      const workerSnap = await db.collection("users").doc(workerUid).get();
      const businessSnap = await db.collection("users").doc(businessUid).get();

      if (!workerSnap.exists || !businessSnap.exists) {
        console.log("No existe worker o business");
        return;
      }

      const worker = workerSnap.data();
      const business = businessSnap.data();

      const workerEmail = worker.email;
      const businessEmail = business.email;

      const workerName =
        worker.name || tr(getLang(business), "worker_default");

      const companyName =
        business.companyName ||
        business.name ||
        tr(getLang(worker), "business_default");

      const resend = new Resend(RESEND_API_KEY.value());

      let jobRole = "";
      let jobDate = "";
      let jobZone = "";
      let jobFrom = "";
      let jobTo = "";

      if (jobId) {
        const jobSnap = await db.collection("jobs").doc(jobId).get();

        if (jobSnap.exists) {
          const job = jobSnap.data();
          jobRole = job.role || "";
          jobDate = job.date || "";
          jobZone = job.zone || "";
          jobFrom = job.from || "";
          jobTo = job.to || "";
        }
      }

      // 1) Business solicita contacto -> mail/notificación al worker
      if (afterStatus === "pending") {
        if (!workerEmail) return;

        const lang = getLang(worker);
        const recipient = TEST_MODE ? TEST_EMAIL : workerEmail;

        const result = await resend.emails.send({
          from: "AdWork <noreply@adwork.ad>",
          to: recipient,
          subject: tr(lang, "contact_request_subject"),
          html: `
            <h2>${tr(lang, "contact_request_title")}</h2>

            <p>Hola ${workerName},</p>

            <p>${tr(lang, "contact_request_intro", {
              companyName: `<strong>${companyName}</strong>`,
            })}</p>

            ${
              jobId
                ? `
                  <p><strong>${tr(lang, "shift_details")}</strong></p>
                  <ul>
                    <li><strong>${tr(lang, "position")}:</strong> ${jobRole || tr(lang, "job_unspecified")}</li>
                    <li><strong>${tr(lang, "date")}:</strong> ${jobDate || tr(lang, "date_unspecified")}</li>
                    <li><strong>${tr(lang, "zone")}:</strong> ${jobZone || tr(lang, "zone_unspecified")}</li>
                    <li><strong>${tr(lang, "schedule")}:</strong> ${jobFrom} ${jobTo ? `- ${jobTo}` : ""}</li>
                  </ul>
                `
                : ""
            }

            <p>${tr(lang, "enter_share_contact")}</p>

            ${
              TEST_MODE
                ? `<p style="margin-top:16px;color:#666;">Modo prueba: el destinatario real era ${workerEmail}</p>`
                : ""
            }
          `,
        });

        if (result.error) {
          console.error("Error enviando email al worker:", result.error);
          return;
        }

        await db.collection("notifications").add({
          userUid: workerUid,
          role: "worker",
          type: "contact_request",

          titleKey: "notif_contact_request_title",
          messageKey: "notif_contact_request_message",
          vars: {
            companyName,
          },

          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log("Email/notificación traducible al worker enviados");
        return;
      }

      // 2) Worker comparte contacto -> mail/notificación al business
      if (afterStatus === "shared") {
        if (!businessEmail) return;

        const lang = getLang(business);
        const contact = requestData.contact || {};
        const recipient = TEST_MODE ? TEST_EMAIL : businessEmail;

        const result = await resend.emails.send({
          from: "AdWork <noreply@adwork.ad>",
          to: recipient,
          subject: tr(lang, "contact_shared_subject"),
          html: `
            <h2>${tr(lang, "contact_shared_title")}</h2>

            <p>Hola ${companyName},</p>

            <p>${tr(lang, "contact_shared_intro", {
              workerName: `<strong>${workerName}</strong>`,
            })}</p>

            <p><strong>${tr(lang, "contact_data")}</strong></p>
            <ul>
              ${contact.whatsapp ? `<li><strong>WhatsApp:</strong> ${contact.whatsapp}</li>` : ""}
              ${contact.phone ? `<li><strong>Teléfono:</strong> ${contact.phone}</li>` : ""}
              ${contact.email ? `<li><strong>Email:</strong> ${contact.email}</li>` : ""}
            </ul>

            ${
              jobId
                ? `
                  <p><strong>${tr(lang, "related_shift")}</strong></p>
                  <ul>
                    <li><strong>${tr(lang, "position")}:</strong> ${jobRole || tr(lang, "job_unspecified")}</li>
                    <li><strong>${tr(lang, "date")}:</strong> ${jobDate || tr(lang, "date_unspecified")}</li>
                    <li><strong>${tr(lang, "zone")}:</strong> ${jobZone || tr(lang, "zone_unspecified")}</li>
                  </ul>
                `
                : ""
            }

            <p>${tr(lang, "see_in_panel")}</p>

            ${
              TEST_MODE
                ? `<p style="margin-top:16px;color:#666;">Modo prueba: el destinatario real era ${businessEmail}</p>`
                : ""
            }
          `,
        });

        if (result.error) {
          console.error("Error enviando email al business:", result.error);
          return;
        }

        await db.collection("notifications").add({
          userUid: businessUid,
          role: "business",
          type: "contact_shared",

          titleKey: "notif_contact_shared_title",
          messageKey: "notif_contact_shared_message",
          vars: {
            workerName,
          },

          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log("Email/notificación traducible al business por contacto compartido enviados");
        return;
      }

      // 3) Worker rechaza -> mail/notificación al business
      if (afterStatus === "declined") {
        if (!businessEmail) return;

        const lang = getLang(business);
        const recipient = TEST_MODE ? TEST_EMAIL : businessEmail;

        const result = await resend.emails.send({
          from: "AdWork <noreply@adwork.ad>",
          to: recipient,
          subject: tr(lang, "contact_declined_subject"),
          html: `
            <h2>${tr(lang, "contact_declined_title")}</h2>

            <p>Hola ${companyName},</p>

            <p>${tr(lang, "contact_declined_intro", {
              workerName: `<strong>${workerName}</strong>`,
            })}</p>

            ${
              jobId
                ? `
                  <p><strong>${tr(lang, "related_shift")}</strong></p>
                  <ul>
                    <li><strong>${tr(lang, "position")}:</strong> ${jobRole || tr(lang, "job_unspecified")}</li>
                    <li><strong>${tr(lang, "date")}:</strong> ${jobDate || tr(lang, "date_unspecified")}</li>
                    <li><strong>${tr(lang, "zone")}:</strong> ${jobZone || tr(lang, "zone_unspecified")}</li>
                  </ul>
                `
                : ""
            }

            <p>${tr(lang, "keep_searching")}</p>

            ${
              TEST_MODE
                ? `<p style="margin-top:16px;color:#666;">Modo prueba: el destinatario real era ${businessEmail}</p>`
                : ""
            }
          `,
        });

        if (result.error) {
          console.error("Error enviando email de rechazo al business:", result.error);
          return;
        }

        await db.collection("notifications").add({
          userUid: businessUid,
          role: "business",
          type: "contact_declined",

          titleKey: "notif_contact_declined_title",
          messageKey: "notif_contact_declined_message",
          vars: {
            workerName,
          },

          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log("Email/notificación traducible al business por rechazo enviados");
      }
    } catch (error) {
      console.error("Error en onContactRequestWritten:", error);
    }
  }
);