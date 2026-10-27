
import crypto from "node:crypto";

// Erste Version: Passwortprüfung ohne Schreibzugriff.
// Neue Angebote und Bearbeitungen ergänzen wir später.

const ALLOWED_ORIGIN =
  "https://mint-angebote-thro.appwrite.network";

function json(res, status, data, origin) {
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

export default async ({ req, res, log, error }) => {
  const origin = req.headers.origin || "";
  const allowedOrigin =
    origin === ALLOWED_ORIGIN ? origin : "";

  if (origin && !allowedOrigin) {
    return res.json(
      { success: false, message: "Zugriff nicht erlaubt." },
      403
    );
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
    return json(res, 405, {
      success: false,
      message: "Nur POST-Anfragen sind erlaubt."
    }, allowedOrigin);
  }

  const expectedPassword = process.env.ADMIN_PASSWORD;

  if (!expectedPassword) {
    error("ADMIN_PASSWORD ist nicht konfiguriert.");

    return json(res, 500, {
      success: false,
      message: "Serverkonfiguration unvollständig."
    }, allowedOrigin);
  }

  let body = req.bodyJson;

  if (!body || typeof body !== "object") {
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
    return json(res, 400, {
      success: false,
      message: "Bitte ein gültiges Passwort eingeben."
    }, allowedOrigin);
  }

  if (!passwordsMatch(password, expectedPassword)) {
    return json(res, 401, {
      success: false,
      message: "Passwort nicht korrekt."
    }, allowedOrigin);
  }

  log("Verwaltungspasswort erfolgreich geprüft.");

  return json(res, 200, {
    success: true,
    message: "Passwort korrekt. Anmeldung erfolgreich.",
    mode: "read-only"
  }, allowedOrigin);
};
