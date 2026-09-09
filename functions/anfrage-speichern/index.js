const DATABASE_ID = "6a902c4f0026523fc9c5";
const REQUESTS_TABLE_ID = "anfragen";

const MAX_OFFERS_PER_REQUEST = 20;

export default async ({ req, res, log, error }) => {
  try {
    // Nur POST-Anfragen akzeptieren
    if (req.method !== "POST") {
      return res.json(
        {
          success: false,
          message: "Diese Function akzeptiert nur POST-Anfragen."
        },
        405
      );
    }

    // JSON-Body einlesen
    let body;

    try {
      body = req.bodyJson;
    } catch {
      return res.json(
        {
          success: false,
          message: "Die übermittelten Daten sind kein gültiges JSON."
        },
        400
      );
    }

    const offerIds = body?.offerIds;

    // Prüfen, ob überhaupt Angebots-IDs geschickt wurden
    if (!Array.isArray(offerIds)) {
      return res.json(
        {
          success: false,
          message: "offerIds muss eine Liste sein."
        },
        400
      );
    }

    // Nur Strings übernehmen, Leerzeichen entfernen,
    // leere Werte entfernen und doppelte IDs löschen
    const uniqueOfferIds = [
      ...new Set(
        offerIds
          .filter((id) => typeof id === "string")
          .map((id) => id.trim())
          .filter(Boolean)
      )
    ];

    if (uniqueOfferIds.length === 0) {
      return res.json(
        {
          success: false,
          message: "Es wurde kein Angebot ausgewählt."
        },
        400
      );
    }

    if (uniqueOfferIds.length > MAX_OFFERS_PER_REQUEST) {
      return res.json(
        {
          success: false,
          message: `Maximal ${MAX_OFFERS_PER_REQUEST} Angebote pro Anfrage sind erlaubt.`
        },
        400
      );
    }

    const apiEndpoint =
      process.env.APPWRITE_FUNCTION_API_ENDPOINT ||
      "https://fra.cloud.appwrite.io/v1";

    const projectId = process.env.APPWRITE_FUNCTION_PROJECT_ID;

    const apiKey =
      req.headers["x-appwrite-key"] ||
      req.headers["X-Appwrite-Key"];

    if (!projectId) {
      throw new Error("APPWRITE_FUNCTION_PROJECT_ID fehlt.");
    }

    if (!apiKey) {
      throw new Error("Dynamischer Appwrite API-Key fehlt.");
    }

    const requestedAt = new Date().toISOString();
    const createdRows = [];

    // Für jedes ausgewählte Angebot genau eine Statistik-Zeile erzeugen
    for (const offerId of uniqueOfferIds) {
      const response = await fetch(
        `${apiEndpoint}/tablesdb/${DATABASE_ID}/tables/${REQUESTS_TABLE_ID}/rows`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Appwrite-Project": projectId,
            "X-Appwrite-Key": apiKey,
            "X-Appwrite-Response-Format": "1.9.5"
          },
          body: JSON.stringify({
            rowId: "unique()",
            data: {
              Angebot_ID: offerId,
              Angefragt_am: requestedAt
            }
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          `Anfrage konnte nicht gespeichert werden: ${JSON.stringify(result)}`
        );
      }

      createdRows.push(result.$id);
    }

    log(
      `${createdRows.length} Anfrage-Einträge erfolgreich gespeichert.`
    );

    return res.json({
      success: true,
      message: "Anfrage erfolgreich erfasst.",
      savedOffers: createdRows.length
    });
  } catch (err) {
    error(err?.message || String(err));

    return res.json(
      {
        success: false,
        message: "Die Anfrage konnte nicht gespeichert werden."
      },
      500
    );
  }
};
