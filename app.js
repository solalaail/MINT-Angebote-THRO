// ============================================================
// DEINE APPWRITE-DATEN
// ============================================================

const APPWRITE_ENDPOINT = "https://cloud.appwrite.io/v1";
const PROJECT_ID = "6a902517000542f46530";
const DATABASE_ID = "6a902c4f0026523fc9c5";
const TABLE_ID = "angebote_informatik";

// ============================================================
// 2. ELEMENTE DER WEBSEITE
// ============================================================

const offersEl = document.getElementById("offers");
const statusEl = document.getElementById("status");
const resultCountEl = document.getElementById("resultCount");
const searchEl = document.getElementById("search");
const facultyFilterEl = document.getElementById("facultyFilter");

let allOffers = [];


// ============================================================
// 3. HILFSFUNKTIONEN
// ============================================================

function asText(value) {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (typeof value === "boolean") {
    return value ? "Ja" : "Nein";
  }

  return value ?? "";
}


function escapeHtml(value) {
  return String(asText(value))
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


// ============================================================
// 4. DEINE APPWRITE-SPALTEN
// ============================================================

function getTitle(row) {
  return asText(row.Titel_des_Angebots) || "Unbenanntes Angebot";
}


function getFaculty(row) {
  return asText(row.Fakultaet);
}


function getMintArea(row) {
  return asText(row.MINT_Bereich);
}


function getFormat(row) {
  return asText(row.Format) || "MINT-Angebot";
}


function getDescription(row) {
  return asText(row.Beschreibung);
}


function getGrade(row) {
  return asText(row.Klassenstufe);
}


function getCapacity(row) {
  return asText(row.Platz_fuer_wie_viele);
}


function getLocation(row) {
  return asText(row.Ort_Raum);
}


function getDuration(row) {
  return asText(row.Dauer);
}


function getContactPerson(row) {
  return asText(row.Ansprechperson);
}


function getContactMail(row) {
  return asText(row.Kontakt_Mail);
}


// ============================================================
// 5. SCHÖNE FAKULTÄTSNAMEN
// ============================================================

function getFacultyLabel(faculty) {

  const labels = {

    "Informatik":
      "Informatik",

    "Holztechnik_Bau_HTB":
      "HTB · Holztechnik & Bau",

    "Angewandte_Natur_und_Geisteswissenschaften_ANG":
      "ANG · Angewandte Natur- & Geisteswissenschaften",

    "Betriebswirtschaft":
      "Betriebswirtschaft",

    "Campus_Chiemgau":
      "Campus Chiemgau",

    "Gesundheitswissenschaften_GSW":
      "GSW · Gesundheitswissenschaften",

    "Ingenieurswissenschaften":
      "Ingenieurwissenschaften",

    "Wirtschaftsingenieurwesen_WI":
      "WI · Wirtschaftsingenieurwesen",

    "Andere":
      "Andere"

  };

  return labels[faculty] || faculty || "Andere";
}


// ============================================================
// 6. FAKULTÄTSFARBEN ZUORDNEN
// ============================================================

function getFacultyClass(faculty) {

  const classes = {

    "Informatik":
      "faculty-inf",

    "Holztechnik_Bau_HTB":
      "faculty-htb",

    "Angewandte_Natur_und_Geisteswissenschaften_ANG":
      "faculty-ang",

    "Betriebswirtschaft":
      "faculty-bwl",

    "Campus_Chiemgau":
      "faculty-chiemgau",

    "Gesundheitswissenschaften_GSW":
      "faculty-gsw",

    "Ingenieurswissenschaften":
      "faculty-ing",

    "Wirtschaftsingenieurwesen_WI":
      "faculty-wi",

    "Andere":
      "faculty-other"

  };

  return classes[faculty] || "faculty-other";
}


// ============================================================
// 7. FAKULTÄTSFILTER ERSTELLEN
// ============================================================

function renderFacultyOptions() {

  const faculties = [
    ...new Set(
      allOffers
        .map(getFaculty)
        .filter(Boolean)
    )
  ];


  faculties.sort((a, b) =>
    getFacultyLabel(a).localeCompare(
      getFacultyLabel(b),
      "de"
    )
  );


  facultyFilterEl.innerHTML =
    '<option value="">Alle Fakultäten</option>' +

    faculties
      .map(faculty => {

        const label =
          getFacultyLabel(faculty);

        return `
          <option value="${escapeHtml(faculty)}">
            ${escapeHtml(label)}
          </option>
        `;

      })
      .join("");
}


// ============================================================
// 8. ANGEBOTE FILTERN UND ANZEIGEN
// ============================================================

function renderOffers() {

  const searchTerm =
    searchEl.value
      .trim()
      .toLowerCase();


  const selectedFaculty =
    facultyFilterEl.value;


  const filtered =
    allOffers.filter(row => {

      const searchableText = [

        getTitle(row),
        getDescription(row),
        getFaculty(row),
        getFacultyLabel(getFaculty(row)),
        getMintArea(row),
        getFormat(row),
        getGrade(row),
        getCapacity(row),
        getLocation(row),
        getDuration(row)

      ]
        .join(" ")
        .toLowerCase();


      const matchesSearch =
        !searchTerm ||
        searchableText.includes(searchTerm);


      const matchesFaculty =
        !selectedFaculty ||
        getFaculty(row) === selectedFaculty;


      return (
        matchesSearch &&
        matchesFaculty
      );

    });


  // Anzahl anzeigen

  resultCountEl.textContent =
    filtered.length === 1
      ? "1 Angebot gefunden"
      : `${filtered.length} Angebote gefunden`;


  // Keine Ergebnisse

  if (filtered.length === 0) {

    offersEl.innerHTML = `
      <div class="empty">
        Keine passenden Angebote gefunden.
      </div>
    `;

    return;
  }


  // Karten erstellen

  offersEl.innerHTML =
    filtered
      .map(row => {

        const title =
          escapeHtml(
            getTitle(row)
          );


        const faculty =
          getFaculty(row);


        const facultyLabel =
          escapeHtml(
            getFacultyLabel(faculty)
          );


        const facultyClass =
          getFacultyClass(faculty);


        const format =
          escapeHtml(
            getFormat(row)
          );


        const mint =
          escapeHtml(
            getMintArea(row)
          );


        const description =
          escapeHtml(
            getDescription(row) ||
            "Weitere Informationen folgen."
          );


        const grade =
          escapeHtml(
            getGrade(row)
          );


        const capacity =
          escapeHtml(
            getCapacity(row)
          );


        const location =
          escapeHtml(
            getLocation(row)
          );


        const duration =
          escapeHtml(
            getDuration(row)
          );


        // Zusatzinformationen unten auf der Karte

        const metadata = [

          mint
            ? `🧪 ${mint}`
            : "",

          grade
            ? `🎓 ${grade}`
            : "",

          capacity
            ? `👥 ${capacity}`
            : "",

          location
            ? `📍 ${location}`
            : "",

          duration
            ? `🕐 ${duration}`
            : ""

        ]
          .filter(Boolean)

          .map(item =>
            `<span>${item}</span>`
          )

          .join("");


        // Karte

        return `

          <article class="card ${facultyClass}">

            <div class="card-top">

              <span class="badge">
                ${format}
              </span>

              <span class="faculty">
                ${facultyLabel}
              </span>

            </div>


            <h3>
              ${title}
            </h3>


            <p class="description">
              ${description}
            </p>


            ${
              metadata
                ? `
                  <div class="meta">
                    ${metadata}
                  </div>
                `
                : ""
            }

          </article>

        `;

      })

      .join("");
}


// ============================================================
// 9. ANGEBOTE AUS APPWRITE LADEN
// ============================================================

async function loadOffers() {

  try {

    statusEl.classList.remove("error");

    statusEl.style.display =
      "block";

    statusEl.textContent =
      "Angebote werden geladen …";


    // Appwrite-Adresse zusammensetzen

    const url =
      `${APPWRITE_ENDPOINT}/tablesdb/` +
      `${encodeURIComponent(DATABASE_ID)}/tables/` +
      `${encodeURIComponent(TABLE_ID)}/rows`;


    // Anfrage an Appwrite

    const response =
      await fetch(url, {

        method: "GET",

        headers: {

          "X-Appwrite-Project":
            PROJECT_ID,

          "X-Appwrite-Response-Format":
            "1.9.5"

        }

      });


    // Fehler von Appwrite abfangen

    if (!response.ok) {

      const errorText =
        await response.text();


      throw new Error(
        `Appwrite antwortet mit ${response.status}: ${errorText}`
      );

    }


    // Antwort auslesen

    const data =
      await response.json();


    console.log(
      "Appwrite Antwort:",
      data
    );


    allOffers =
      data.rows || [];


    // Filter erstellen

    renderFacultyOptions();


    // Angebote anzeigen

    renderOffers();


    // Ladeanzeige ausblenden

    statusEl.style.display =
      "none";

  }


  catch (error) {

    console.error(
      "Fehler beim Laden:",
      error
    );


    resultCountEl.textContent =
      "Fehler beim Laden";


    statusEl.style.display =
      "block";


    statusEl.classList.add(
      "error"
    );


    statusEl.innerHTML =

      "<strong>Die Angebote konnten nicht geladen werden.</strong><br>" +

      escapeHtml(
        error.message
      );

  }

}


// ============================================================
// 10. SUCHE UND FILTER
// ============================================================

searchEl.addEventListener(
  "input",
  renderOffers
);


facultyFilterEl.addEventListener(
  "change",
  renderOffers
);


// ============================================================
// 11. START
// ============================================================

loadOffers();

loadOffers();
