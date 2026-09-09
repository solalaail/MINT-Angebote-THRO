const DATABASE_ID = "6a902c4f0026523fc9c5";
const OFFERS_TABLE_ID = "angebote_informatik";
const REQUESTS_TABLE_ID = "anfragen";

const MAX_OFFERS_PER_REQUEST = 20;

export default async ({ req, res, log, error }) => {
  try {
    // Nur POST erlauben
    if (req.method !== "POST") {
      return res.json(
        {
          success: false,
          message: "Diese Function akzeptiert nur POST-Anfragen."
        },
        405
      );
    }

    // JSON-Body lesen
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

    // Grundprüfung
    if (!Array.isArray(offerIds)) {
      return res.json(
        {
          success: false,
          message: "offerIds muss eine Liste sein."
        },
        400
      );
    }

    // Nur gültige Strings übernehmen,
    // Leerzeichen und Duplikate entfernen
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
          message:
            `Maximal ${MAX_OFFERS_PER_REQUEST} Angebote pro Anfrage sind erlaubt.`
        },
        400
      );
    }

    // Appwrite-Verbindung
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

    const headers = {
      "Content-Type": "application/json",
      "X-Appwrite-Project": projectId,
      "X-Appwrite-Key": apiKey,
      "X-Appwrite-Response-Format": "1.9.5"
    };

    // --------------------------------------------------
    // SCHRITT 1:
    // Prüfen, ob ALLE Angebots-IDs wirklich existieren.
    // --------------------------------------------------

    const validOfferIds = [];

    for (const offerId of uniqueOfferIds) {
      const checkResponse = await fetch(
        `${apiEndpoint}/tablesdb/${DATABASE_ID}/tables/${OFFERS_TABLE_ID}/rows/${encodeURIComponent(offerId)}`,
        {
          method: "GET",
          headers
        }
      );

      if (checkResponse.status === 404) {
        return res.json(
          {
            success: false,
            message:
              "Mindestens eines der ausgewählten Angebote existiert nicht mehr."
          },
          400
        );
      }

      if (!checkResponse.ok) {
        const checkResult = await checkResponse.text();

        throw new Error(
          `Angebot konnte nicht geprüft werden: ${checkResult}`
        );
      }

      const offer = await checkResponse.json();

      // Falls ein Angebot ausdrücklich deaktiviert wurde,
      // darf es nicht neu angefragt werden.
      if (offer.Aktiv === false) {
        return res.json(
          {
            success: false,
            message:
              `Das Angebot "${offer.Titel_des_Angebots || offerId}" ist derzeit pausiert.`
          },
          400
        );
      }

      // Auch Pausiert_bis berücksichtigen
      if (offer.Pausiert_bis) {
        const pausedUntil = new Date(offer.Pausiert_bis);

        if (
          !Number.isNaN(pausedUntil.getTime()) &&
          pausedUntil.getTime() > Date.now()
        ) {
          return res.json(
            {
              success: false,
              message:
                `Das Angebot "${offer.Titel_des_Angebots || offerId}" ist derzeit pausiert.`
            },
            400
          );
        }
      }

      validOfferIds.push(offerId);
    }

    // --------------------------------------------------
    // SCHRITT 2:
    // Erst NACH erfolgreicher Prüfung speichern.
    // --------------------------------------------------

    const requestedAt = new Date().toISOString();
    const createdRows = [];

    for (const offerId of validOfferIds) {
      const createResponse = await fetch(
        `${apiEndpoint}/tablesdb/${DATABASE_ID}/tables/${REQUESTS_TABLE_ID}/rows`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            rowId: "unique()",
            data: {
              Angebot_ID: offerId,
              Angefragt_am: requestedAt
            }
          })
        }
      );

      const result = await createResponse.json();

      if (!createResponse.ok) {
        throw new Error(
          `Anfrage konnte nicht gespeichert werden: ${JSON.stringify(result)}`
        );
      }

      createdRows.push(result.$id);
    }

    log(
      `${createdRows.length} gültige Anfrage-Einträge gespeichert.`
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
