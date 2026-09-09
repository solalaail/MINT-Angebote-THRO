export default async ({ req, res, log, error }) => {
  log("Function 'Anfrage speichern' wurde gestartet.");

  return res.json({
    success: true,
    message: "Die Function funktioniert."
  });
};
