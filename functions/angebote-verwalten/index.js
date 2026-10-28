
import crypto from "node:crypto";

const ALLOWED_ORIGIN =
  "https://mint-angebote-thro.appwrite.network";

const APPWRITE_ENDPOINT = "https://cloud.appwrite.io/v1";
const PROJECT_ID = "6a902517000542f46530";
const DATABASE_ID = "6a902c4f0026523fc9c5";
const TABLE_ID = "angebote_informatik";

const ENUMS = {
  Bereich: [
    "Informatik",
    "Mathematik",
    "Naturwissenschaft",
    "Physik",
    "Programmieren",
    "Chemie",
    "Technik",
    "Andere",
    "Kunststoff",
    "Holz",
    "Elektrotechnik",
    "Angewandte Natur- und Geisteswissenschaften",
    "Gesundheitswissenschaft",
    "Pflegewissenschaft",
    "Ingenieurswissenschaften"
  ],
  Format: [
    "Workshop",
    "Vortrag",
    "Vorlesung",
    "Führung",
    "Andere",
    "Kinderuni"
  ],
  Fakultaet: [
    "Informatik",
    "Holztechnik_Bau_HTB",
    "Angewandte_Natur_und_Geisteswissenschaften_ANG",
    "Betriebswirtschaft",
    "Campus_Chiemgau",
    "Gesundheitswissenschaften_GSW",
    "Ingenieurswissenschaften",
    "Wirtschaftsingenieurwesen_WI",
    "Andere",
    "Campus Mühldorf"
  ],
  Kapazitaetsstatus: [
    "automatisch",
    "gruen",
    "gelb",
    "rot"
  ]
};

const REQUIRED_STRINGS = {
  Titel_des_Angebots: 100,
  Platz_fuer_wie_viele: 200,
  Klassenstufe: 100
};

const OPTIONAL_STRINGS = {
  Ort_Raum: 100,
  Dauer: 100,
  Ansprechperson: 100
};

const ALLOWED_FIELDS = new Set([
  ...Object.keys(REQUIRED_STRINGS),
  ...Object.keys(OPTIONAL_STRINGS),
  "Beschreibung",
  "Bereich",
  "Format",
  "Kontakt_Mail",
  "Fakultaet",
  "Aktiv",
  "Kapazitaetsstatus",
  "pausiert_bis"
]);

function respond(res, status, data, origin) {
  return res.json(data, status, {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store",
    "Vary": "Origin"
  });
}

function passwordsMatch(input, expected) {
  const a = crypto.createHash("sha256")
    .update(input)
    .digest();

  const b = crypto.createHash("sha256")
    .update(expected)
    .digest();

  return crypto.timingSafeEqual(a, b);
}

function validateChanges(changes) {
  if (
    !changes ||
    typeof changes !== "object" ||
    Array.isArray(changes)
  ) {
    throw new Error("Ungültige Angebotsdaten.");
  }

  const keys = Object.keys(changes);

  if (keys.length === 0) {
    throw new Error("Keine Änderungen übermittelt.");
  }

  for (const key of keys) {
    if (!ALLOWED_FIELDS.has(key)) {
      throw new Error("Dieses Feld darf nicht geändert werden: " + key);
    }

    const value = changes[key];

    if (Object.hasOwn(REQUIRED_STRINGS, key)) {
      if (
        typeof value !== "string" ||
        !value.trim() ||
        value.length > REQUIRED_STRINGS[key]
      ) {
        throw new Error("Ungültiger Wert für " + key);
      }
    } else if (Object.hasOwn(OPTIONAL_STRINGS, key)) {
      if (
        value !== null &&
        (typeof value !== "string" ||
          value.length > OPTIONAL_STRINGS[key])
      ) {
        throw new Error("Ungültiger Wert für " + key);
      }
    } else if (key === "Beschreibung") {
      if (typeof value !== "string" || !value.trim()) {
        throw new Error("Die Beschreibung darf nicht leer sein.");
      }
    } else if (key === "Kontakt_Mail") {
      if (
        typeof value !== "string" ||
        value.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      ) {
        throw new Error("Bitte eine gültige Kontakt-E-Mail eingeben.");
      }
    } else if (Object.hasOwn(ENUMS, key)) {
      if (
        value !== null &&
        !ENUMS[key].includes(value)
      ) {
        throw new Error("Ungültige Auswahl für " + key);
      }

      if (
        (key === "Bereich" || key === "Format") &&
        value === null
      ) {
        throw new Error(key + " ist ein Pflichtfeld.");
      }
    } else if (key === "Aktiv") {
      if (typeof value !== "boolean") {
        throw new Error("Aktiv muss wahr oder falsch sein.");
      }
    } else if (key === "pausiert_bis") {
      if (
        value !== null &&
        (typeof value !== "string" ||
          !Number.isFinite(Date.parse(value)))
      ) {
        throw new Error("Ungültiges Datum für pausiert_bis.");
      }
    }
  }
}

export default async ({ req, res, log, error }) => {
  const origin = req.headers.origin || "";
  const allowedOrigin =
    origin === ALLOWED_ORIGIN ? origin : "";

  if (origin && !allowedOrigin) {
    return respond(res, 403, {
      success: false,
      message: "Zugriff nicht erlaubt."
    }, "");
  }

  if (req.method === "OPTIONS") {
    return res.text("", 204, {
      "Access-Control-Allow-Origin": allowedOrigin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "600",
      "Vary": "Origin"
    });
  }

  if (req.method !== "POST") {
    return respond(res, 405, {
      success: false,
      message: "Nur POST-Anfragen sind erlaubt."
    }, allowedOrigin);
  }

  const expectedPassword = process.env.ADMIN_PASSWORD;

  if (!expectedPassword) {
    error("ADMIN_PASSWORD fehlt.");

    return respond(res, 500, {
      success: false,
      message: "Serverkonfiguration unvollständig."
    }, allowedOrigin);
  }

  let body = req.bodyJson;

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    try {
      body = JSON.parse(req.bodyText || "{}");
    } catch {
      body = {};
    }
  }

  const password = body.password;

  if (
    typeof password !== "string" ||
    password.length === 0 ||
    password.length > 1024
  ) {
    return respond(res, 400, {
      success: false,
      message: "Bitte ein gültiges Passwort eingeben."
    }, allowedOrigin);
  }

  if (!passwordsMatch(password, expectedPassword)) {
    return respond(res, 401, {
      success: false,
      message: "Passwort nicht korrekt."
    }, allowedOrigin);
  }

  const action = body.action || "login";

  if (action === "login") {
    return respond(res, 200, {
      success: true,
      message: "Passwort korrekt. Anmeldung erfolgreich.",
      mode: "edit"
    }, allowedOrigin);
  }

  if (action !== "update") {
    return respond(res, 400, {
      success: false,
      message: "Unbekannte Aktion."
    }, allowedOrigin);
  }

  const rowId = body.rowId;

  if (
    typeof rowId !== "string" ||
    !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,35}$/.test(rowId)
  ) {
    return respond(res, 400, {
      success: false,
      message: "Ungültige Angebots-ID."
    }, allowedOrigin);
  }

  try {
    validateChanges(body.changes);
  } catch (err) {
    return respond(res, 400, {
      success: false,
      message: err.message
    }, allowedOrigin);
  }

  const apiKey =
    process.env.MINT_ADMIN_API_KEY ||
    process.env.APPWRITE_API_KEY;

  if (!apiKey) {
    error("API-Schlüssel fehlt.");

    return respond(res, 500, {
      success: false,
      message: "Serverkonfiguration unvollständig."
    }, allowedOrigin);
  }

  const url =
    APPWRITE_ENDPOINT +
    "/tablesdb/" +
    encodeURIComponent(DATABASE_ID) +
    "/tables/" +
    encodeURIComponent(TABLE_ID) +
    "/rows/" +
    encodeURIComponent(rowId);

  try {
    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-Appwrite-Project": PROJECT_ID,
        "X-Appwrite-Key": apiKey
      },
      body: JSON.stringify({
        data: body.changes
      }),
      signal: AbortSignal.timeout(10000)
    });

    const result = await response.json();

    if (!response.ok) {
      error(
        "Appwrite-Update fehlgeschlagen. Status: " +
        response.status
      );

      return respond(res, response.status === 404 ? 404 : 500, {
        success: false,
        message: response.status === 404
          ? "Angebot nicht gefunden."
          : "Das Angebot konnte nicht gespeichert werden."
      }, allowedOrigin);
    }

    log("Angebot erfolgreich aktualisiert.");

    return respond(res, 200, {
      success: true,
      message: "Angebot erfolgreich gespeichert.",
      rowId: result.$id
    }, allowedOrigin);

  } catch (err) {
    error("Fehler beim Speichern: " + err.message);

    return respond(res, 500, {
      success: false,
      message: "Verbindungsfehler beim Speichern."
    }, allowedOrigin);
  }
};
