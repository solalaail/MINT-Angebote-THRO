const DATABASE_ID = "6a902c4f0026523fc9c5";
const REQUESTS_TABLE_ID = "anfragen";

export default async ({ req, res, log, error }) => {
  try {
    const apiEndpoint =
      process.env.APPWRITE_FUNCTION_API_ENDPOINT ||
      "https://fra.cloud.appwrite.io/v1";

    const projectId = process.env.APPWRITE_FUNCTION_PROJECT_ID;

    // Der dynamische Function-Key wird bei der Ausführung
    // von Appwrite im Request-Header bereitgestellt.
    const apiKey =
      req.headers["x-appwrite-key"] ||
      req.headers["X-Appwrite-Key"];

    if (!projectId) {
      throw new Error("APPWRITE_FUNCTION_PROJECT_ID fehlt.");
    }

    if (!apiKey) {
      throw new Error("Dynamischer Appwrite API-Key fehlt.");
    }

    const angebotId = "TEST";

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
            Angebot_ID: angebotId,
            Angefragt_am: new Date().toISOString()
          }
        })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        `Appwrite-Fehler ${response.status}: ${JSON.stringify(result)}`
      );
    }

    log(`Testanfrage gespeichert: ${result.$id}`);

    return res.json({
      success: true,
      message: "Testanfrage wurde gespeichert.",
      rowId: result.$id
    });
  } catch (err) {
    error(err.message);

    return res.json(
      {
        success: false,
        message: err.message
      },
      500
    );
  }
};
