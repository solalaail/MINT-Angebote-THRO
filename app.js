// ============================================================
// 1) HIER DEINE APPWRITE-DATEN EINTRAGEN
// ============================================================

const APPWRITE_ENDPOINT = "https://cloud.appwrite.io/v1";
const PROJECT_ID = "6a902517000542f46530";
const DATABASE_ID = "6a902c4f0026523fc9c5";
const TABLE_ID = "angebote_informatik";

// ============================================================
// Appwrite-Verbindung
// ============================================================

const client = new Appwrite.Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(PROJECT_ID);

const tablesDB = new Appwrite.TablesDB(client);

const offersEl = document.getElementById("offers");
const statusEl = document.getElementById("status");
const resultCountEl = document.getElementById("resultCount");
const searchEl = document.getElementById("search");
const facultyFilterEl = document.getElementById("facultyFilter");

let allOffers = [];

// Falls deine Spalten anders heißen, kannst du die Alternativen hier ergänzen.
function valueOf(row, ...keys) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== "") {
      return row[key];
    }
  }
  return "";
}

function asText(value) {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "Ja" : "Nein";
  return value ? String(value) : "";
}

function escapeHtml(value) {
  return asText(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getFaculty(row) {
  return asText(valueOf(row, "fakultaet", "Fakultät", "fakultät", "faculty"));
}

function getTitle(row) {
  return asText(valueOf(row, "titel", "Titel", "title")) || "Unbenanntes Angebot";
}

function getDescription(row) {
  return asText(
    valueOf(
      row,
      "kurzbeschreibung",
      "Kurzbeschreibung",
      "beschreibung",
      "Beschreibung",
      "description"
    )
  );
}

function getFormat(row) {
  return asText(valueOf(row, "format", "Format")) || "MINT-Angebot";
}

function renderFacultyOptions() {
  const faculties = [...new Set(allOffers.map(getFaculty).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "de"));

  facultyFilterEl.innerHTML =
    '<option value="">Alle Fakultäten</option>' +
    faculties
      .map(faculty => `<option value="${escapeHtml(faculty)}">${escapeHtml(faculty)}</option>`)
      .join("");
}

function renderOffers() {
  const searchTerm = searchEl.value.trim().toLowerCase();
  const selectedFaculty = facultyFilterEl.value;

  const filtered = allOffers.filter(row => {
    const searchableText = [
      getTitle(row),
      getDescription(row),
      getFaculty(row),
      asText(valueOf(row, "mint_bereich", "MINT-Bereich", "mint_bereiche")),
      asText(valueOf(row, "zielgruppe", "Zielgruppe", "zielgruppen")),
      getFormat(row),
      asText(valueOf(row, "anbieter", "Anbieter"))
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch = !searchTerm || searchableText.includes(searchTerm);
    const matchesFaculty = !selectedFaculty || getFaculty(row) === selectedFaculty;

    return matchesSearch && matchesFaculty;
  });

  resultCountEl.textContent =
    filtered.length === 1 ? "1 Angebot gefunden" : `${filtered.length} Angebote gefunden`;

  if (filtered.length === 0) {
    offersEl.innerHTML = '<div class="empty">Keine passenden Angebote gefunden.</div>';
    return;
  }

  offersEl.innerHTML = filtered.map(row => {
    const title = escapeHtml(getTitle(row));
    const description = escapeHtml(getDescription(row) || "Weitere Informationen folgen.");
    const faculty = escapeHtml(getFaculty(row));
    const format = escapeHtml(getFormat(row));

    const mint = escapeHtml(
      valueOf(row, "mint_bereich", "MINT-Bereich", "mint_bereiche")
    );
    const target = escapeHtml(
      valueOf(row, "zielgruppe", "Zielgruppe", "zielgruppen")
    );
    const location = escapeHtml(valueOf(row, "ort", "Ort"));
    const mode = escapeHtml(
      valueOf(row, "durchfuehrung", "Durchführung", "durchführung")
    );

    const metadata = [mint, target, mode, location]
      .filter(Boolean)
      .map(item => `<span>${item}</span>`)
      .join("");

    return `
      <article class="card">
        <div class="card-top">
          <span class="badge">${format}</span>
          ${faculty ? `<span class="faculty">${faculty}</span>` : ""}
        </div>
        <h3>${title}</h3>
        <p class="description">${description}</p>
        ${metadata ? `<div class="meta">${metadata}</div>` : ""}
      </article>
    `;
  }).join("");
}

async function loadOffers() {
  try {
    statusEl.classList.remove("error");
    statusEl.textContent = "Angebote werden geladen …";

    const response = await tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: TABLE_ID,
      queries: [
        Appwrite.Query.limit(100),
        Appwrite.Query.orderDesc("$createdAt")
      ]
    });

    allOffers = response.rows || [];

    renderFacultyOptions();
    renderOffers();

    statusEl.style.display = "none";
  } catch (error) {
    console.error(error);
    resultCountEl.textContent = "Fehler beim Laden";
    statusEl.style.display = "block";
    statusEl.classList.add("error");
    statusEl.innerHTML =
      "<strong>Die Angebote konnten noch nicht geladen werden.</strong><br>" +
      "Prüfe Project-ID, Database-ID, Table-ID und die Leseberechtigungen der Tabelle.";
  }
}

searchEl.addEventListener("input", renderOffers);
facultyFilterEl.addEventListener("change", renderOffers);

loadOffers();
