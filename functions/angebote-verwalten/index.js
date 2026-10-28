
import crypto from "node:crypto";

const ALLOWED_ORIGIN =
  "https://mint-angebote-thro.appwrite.network";

const APPWRITE_ENDPOINT = "https://cloud.appwrite.io/v1";
const PROJECT_ID = "6a902517000542f46530";
const DATABASE_ID = "6a902c4f0026523fc9c5";

const TABLE_ID = "angebote_informatik";
const MATERIAL_TABLE_ID = "materialien";
const BUCKET_ID = "6a9fde2300387d9f36fb";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

const ALLOWED_FILE_TYPES = {
  pdf: [
    "application/pdf"
  ],
  docx: [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ],
  pptx: [
    "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  ]
};

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

function validId(value) {
  return (
    typeof value === "string" &&
    /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,35}$/.test(value)
  );
}

function apiHeaders(apiKey) {
  return {
    "X-Appwrite-Project": PROJECT_ID,
    "X-Appwrite-Key": apiKey
  };
}

function tableRowsUrl(tableId) {
  return (
    APPWRITE_ENDPOINT +
    "/tablesdb/" +
    encodeURIComponent(DATABASE_ID) +
    "/tables/" +
    encodeURIComponent(tableId) +
    "/rows"
  );
}

function storageFileUrl(fileId = "") {
  const base =
    APPWRITE_ENDPOINT +
    "/storage/buckets/" +
    encodeURIComponent(BUCKET_ID) +
    "/files";

  return fileId
    ? base + "/" + encodeURIComponent(fileId)
    : base;
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
    throw new Error("Keine Angebotsdaten übermittelt.");
  }

  for (const key of keys) {
    if (!ALLOWED_FIELDS.has(key)) {
      throw new Error(
        "Dieses Feld ist nicht erlaubt: " + key
      );
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
        (
          typeof value !== "string" ||
          value.length > OPTIONAL_STRINGS[key]
        )
      ) {
        throw new Error("Ungültiger Wert für " + key);
      }

    } else if (key === "Beschreibung") {
      if (
        typeof value !== "string" ||
        !value.trim()
      ) {
        throw new Error(
          "Die Beschreibung darf nicht leer sein."
        );
      }

    } else if (key === "Kontakt_Mail") {
      if (
        typeof value !== "string" ||
        value.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      ) {
        throw new Error(
          "Bitte eine gültige Kontakt-E-Mail eingeben."
        );
      }

    } else if (Object.hasOwn(ENUMS, key)) {
      if (
        value !== null &&
        !ENUMS[key].includes(value)
      ) {
        throw new Error(
          "Ungültige Auswahl für " + key
        );
      }

      if (
        (key === "Bereich" || key === "Format") &&
        value === null
      ) {
        throw new Error(key + " ist ein Pflichtfeld.");
      }

    } else if (key === "Aktiv") {
      if (typeof value !== "boolean") {
        throw new Error(
          "Aktiv muss wahr oder falsch sein."
        );
      }

    } else if (key === "pausiert_bis") {
      if (
        value !== null &&
        (
          typeof value !== "string" ||
          !Number.isFinite(Date.parse(value))
        )
      ) {
        throw new Error(
          "Ungültiges Datum für pausiert_bis."
        );
      }
    }
  }
}

function validateCreate(changes) {
  validateChanges(changes);

  const requiredFields = [
    "Titel_des_Angebots",
    "Platz_fuer_wie_viele",
    "Beschreibung",
    "Bereich",
    "Format",
    "Klassenstufe",
    "Kontakt_Mail",
    "Aktiv"
  ];

  for (const field of requiredFields) {
    if (!Object.hasOwn(changes, field)) {
      throw new Error(
        "Pflichtfeld fehlt: " + field
      );
    }
  }
}

async function saveOffer(action, body, apiKey) {
  const rowId = body.rowId;

  if (action === "update" && !validId(rowId)) {
    return {
      status: 400,
      data: {
        success: false,
        message: "Ungültige Angebots-ID."
      }
    };
  }

  if (
    action === "create" &&
    rowId !== undefined
  ) {
    return {
      status: 400,
      data: {
        success: false,
        message:
          "Beim Anlegen darf keine Angebots-ID angegeben werden."
      }
    };
  }

  try {
    if (action === "create") {
      validateCreate(body.changes);
    } else {
      validateChanges(body.changes);
    }
  } catch (err) {
    return {
      status: 400,
      data: {
        success: false,
        message: err.message
      }
    };
  }

  const baseUrl = tableRowsUrl(TABLE_ID);

  const url = action === "create"
    ? baseUrl
    : baseUrl + "/" + encodeURIComponent(rowId);

  const payload = action === "create"
    ? {
        rowId: "unique()",
        data: body.changes
      }
    : {
        data: body.changes
      };

  const response = await fetch(url, {
    method: action === "create" ? "POST" : "PATCH",
    headers: {
      ...apiHeaders(apiKey),
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10000)
  });

  const result = await response.json();

  if (!response.ok) {
    return {
      status: response.status === 404 ? 404 : 500,
      data: {
        success: false,
        message: response.status === 404
          ? "Angebot nicht gefunden."
          : "Das Angebot konnte nicht gespeichert werden."
      }
    };
  }

  return {
    status: 200,
    data: {
      success: true,
      message: action === "create"
        ? "Neues Angebot erfolgreich angelegt."
        : "Angebot erfolgreich gespeichert.",
      rowId: result.$id
    }
  };
}

function decodeUpload(body) {
  const offerId = body.angebotId;
  const fileName = body.fileName;
  const mimeType = body.mimeType;
  const base64 = body.fileBase64;

  if (!validId(offerId)) {
    throw new Error("Ungültige Angebots-ID.");
  }

  if (
    typeof fileName !== "string" ||
    !fileName.trim() ||
    fileName.length > 200 ||
    /[\/\\\x00-\x1f]/.test(fileName)
  ) {
    throw new Error("Ungültiger Dateiname.");
  }

  const extension =
    fileName.split(".").pop().toLowerCase();

  if (!Object.hasOwn(ALLOWED_FILE_TYPES, extension)) {
    throw new Error(
      "Erlaubt sind nur PDF, DOCX und PPTX."
    );
  }

  if (
    typeof mimeType !== "string" ||
    !ALLOWED_FILE_TYPES[extension].includes(mimeType)
  ) {
    throw new Error(
      "Der Dateityp passt nicht zur Dateiendung."
    );
  }

  if (
    typeof base64 !== "string" ||
    !base64 ||
    base64.length > Math.ceil(MAX_FILE_BYTES / 3) * 4 + 4 ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(base64) ||
    base64.length % 4 !== 0
  ) {
    throw new Error("Ungültige oder zu große Datei.");
  }

  const bytes = Buffer.from(base64, "base64");

  if (
    bytes.length === 0 ||
    bytes.length > MAX_FILE_BYTES ||
    bytes.toString("base64") !== base64
  ) {
    throw new Error(
      "Die Datei darf höchstens 5 MB groß sein."
    );
  }

  if (extension === "pdf") {
    if (
      bytes.subarray(0, 5).toString("ascii") !== "%PDF-"
    ) {
      throw new Error(
        "Die Datei ist kein gültiger PDF-Dateianfang."
      );
    }
  } else {
    const zipSignature = bytes.subarray(0, 4);

    if (
      !zipSignature.equals(
        Buffer.from([0x50, 0x4b, 0x03, 0x04])
      )
    ) {
      throw new Error(
        "Die Office-Datei hat kein gültiges ZIP-Format."
      );
    }
  }

  return {
    offerId,
    fileName,
    mimeType,
    bytes
  };
}

async function offerExists(offerId, apiKey) {
  const response = await fetch(
    tableRowsUrl(TABLE_ID) +
      "/" +
      encodeURIComponent(offerId),
    {
      headers: apiHeaders(apiKey),
      signal: AbortSignal.timeout(10000)
    }
  );

  if (response.status === 404) {
    return false;
  }

  if (!response.ok) {
    throw new Error(
      "Das zugehörige Angebot konnte nicht geprüft werden."
    );
  }

  return true;
}

async function uploadMaterial(body, apiKey, log, error) {
  let upload;

  try {
    upload = decodeUpload(body);
  } catch (err) {
    return {
      status: 400,
      data: {
        success: false,
        message: err.message
      }
    };
  }

  if (!await offerExists(upload.offerId, apiKey)) {
    return {
      status: 404,
      data: {
        success: false,
        message: "Das zugehörige Angebot existiert nicht."
      }
    };
  }

  const fileId = crypto.randomUUID().replace(/-/g, "");

  const formData = new FormData();

  formData.append("fileId", fileId);

  formData.append(
    "file",
    new Blob(
      [upload.bytes],
      { type: upload.mimeType }
    ),
    upload.fileName
  );

  const fileResponse = await fetch(
    storageFileUrl(),
    {
      method: "POST",
      headers: apiHeaders(apiKey),
      body: formData,
      signal: AbortSignal.timeout(12000)
    }
  );

  if (!fileResponse.ok) {
    error(
      "Storage-Upload fehlgeschlagen: HTTP " +
      fileResponse.status
    );

    return {
      status: 502,
      data: {
        success: false,
        message:
          "Die Datei konnte nicht hochgeladen werden."
      }
    };
  }

  const uploadedFile = await fileResponse.json();

  const materialResponse = await fetch(
    tableRowsUrl(MATERIAL_TABLE_ID),
    {
      method: "POST",
      headers: {
        ...apiHeaders(apiKey),
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        rowId: "unique()",
        data: {
          Angebot_ID: upload.offerId,
          Datei_ID: uploadedFile.$id,
          Titel: upload.fileName
        }
      }),
      signal: AbortSignal.timeout(10000)
    }
  );

  if (!materialResponse.ok) {
    error(
      "Material-Zuordnung fehlgeschlagen: HTTP " +
      materialResponse.status
    );

    // Wenn die Zuordnung scheitert, versuchen wir,
    // die gerade hochgeladene Datei wieder zu entfernen.
    try {
      await fetch(
        storageFileUrl(uploadedFile.$id),
        {
          method: "DELETE",
          headers: apiHeaders(apiKey),
          signal: AbortSignal.timeout(5000)
        }
      );
    } catch (cleanupError) {
      error(
        "Upload-Bereinigung fehlgeschlagen: " +
        cleanupError.message
      );
    }

    return {
      status: 502,
      data: {
        success: false,
        message:
          "Die Datei konnte dem Angebot nicht zugeordnet werden."
      }
    };
  }

  const material = await materialResponse.json();

  log("Material erfolgreich hochgeladen und zugeordnet.");

  return {
    status: 200,
    data: {
      success: true,
      message: "Dokument erfolgreich hochgeladen.",
      materialId: material.$id,
      fileId: uploadedFile.$id,
      angebotId: upload.offerId,
      title: upload.fileName
    }
  };
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

  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body)
  ) {
    try {
      body = JSON.parse(req.bodyText || "{}");
    } catch {
      body = {};
    }
  }

  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body)
  ) {
    body = {};
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

  if (
    action !== "update" &&
    action !== "create" &&
    action !== "uploadMaterial"
  ) {
    return respond(res, 400, {
      success: false,
      message: "Unbekannte Aktion."
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

  try {
    let outcome;

    if (action === "uploadMaterial") {
      outcome = await uploadMaterial(
        body,
        apiKey,
        log,
        error
      );
    } else {
      outcome = await saveOffer(
        action,
        body,
        apiKey
      );
    }

    return respond(
      res,
      outcome.status,
      outcome.data,
      allowedOrigin
    );

  } catch (err) {
    error(
      "Verwaltungsaktion fehlgeschlagen: " +
      err.message
    );

    return respond(res, 500, {
      success: false,
      message:
        "Die Aktion konnte nicht abgeschlossen werden."
    }, allowedOrigin);
  }
};
