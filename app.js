// ============================================================
// DEINE APPWRITE-DATEN
// ============================================================

const APPWRITE_ENDPOINT = "https://cloud.appwrite.io/v1";
const PROJECT_ID = "6a902517000542f46530";
const DATABASE_ID = "6a902c4f0026523fc9c5";
const TABLE_ID = "angebote_informatik";

// ============================================================
// 2. ELEMENTE
// ============================================================

const offersEl = document.getElementById("offers");
const statusEl = document.getElementById("status");
const resultCountEl = document.getElementById("resultCount");

const searchEl = document.getElementById("search");

const facultyFilterEl = document.getElementById("facultyFilter");
const mintFilterEl = document.getElementById("mintFilter");
const formatFilterEl = document.getElementById("formatFilter");
const gradeFilterEl = document.getElementById("gradeFilter");
const durationFilterEl = document.getElementById("durationFilter");
const capacityFilterEl = document.getElementById("capacityFilter");
const locationFilterEl = document.getElementById("locationFilter");

const resetFiltersEl = document.getElementById("resetFilters");

const filterToggleEl = document.getElementById("filterToggle");
const filterPanelEl = document.getElementById("filterPanel");

const detailModalEl = document.getElementById("detailModal");
const detailContentEl = document.getElementById("detailContent");
const closeDetailEl = document.getElementById("closeDetail");

const requestListButtonEl = document.getElementById("requestListButton");
const requestCountEl = document.getElementById("requestCount");

const requestModalEl = document.getElementById("requestModal");
const closeRequestEl = document.getElementById("closeRequest");
const requestItemsEl = document.getElementById("requestItems");
const requestFormAreaEl = document.getElementById("requestFormArea");
const requestFormEl = document.getElementById("requestForm");
const requestSuccessEl = document.getElementById("requestSuccess");

let allOffers = [];

let selectedOfferIds = [];


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
// 4. DATENFELDER
// ============================================================

function getId(row) {
  return row.$id;
}

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
// 5. FAKULTÄTEN
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
// 6. FILTEROPTIONEN
// ============================================================

function getUniqueValues(getter) {

  return [
    ...new Set(
      allOffers
        .map(getter)
        .filter(Boolean)
    )
  ];
}


function fillSelect(
  selectElement,
  values,
  firstLabel,
  labelFormatter = null
) {

  const sortedValues =
    [...values].sort((a, b) => {

      const labelA =
        labelFormatter
          ? labelFormatter(a)
          : a;

      const labelB =
        labelFormatter
          ? labelFormatter(b)
          : b;

      return String(labelA).localeCompare(
        String(labelB),
        "de"
      );
    });


  selectElement.innerHTML =
    `<option value="">${firstLabel}</option>` +

    sortedValues
      .map(value => {

        const label =
          labelFormatter
            ? labelFormatter(value)
            : value;

        return `
          <option value="${escapeHtml(value)}">
            ${escapeHtml(label)}
          </option>
        `;
      })
      .join("");
}


function renderFilterOptions() {

  fillSelect(
    facultyFilterEl,
    getUniqueValues(getFaculty),
    "Alle Fakultäten",
    getFacultyLabel
  );

  fillSelect(
    mintFilterEl,
    getUniqueValues(getMintArea),
    "Alle MINT-Bereiche"
  );

  fillSelect(
    formatFilterEl,
    getUniqueValues(getFormat),
    "Alle Formate"
  );

  fillSelect(
    gradeFilterEl,
    getUniqueValues(getGrade),
    "Alle Klassenstufen"
  );

  fillSelect(
    durationFilterEl,
    getUniqueValues(getDuration),
    "Alle Dauern"
  );

  fillSelect(
    capacityFilterEl,
    getUniqueValues(getCapacity),
    "Alle Gruppengrößen"
  );

  fillSelect(
    locationFilterEl,
    getUniqueValues(getLocation),
    "Alle Orte"
  );
}


// ============================================================
// 7. ANGEBOTE ANZEIGEN
// ============================================================

function renderOffers() {

  const searchTerm =
    searchEl.value
      .trim()
      .toLowerCase();


  const selectedFaculty =
    facultyFilterEl.value;

  const selectedMint =
    mintFilterEl.value;

  const selectedFormat =
    formatFilterEl.value;

  const selectedGrade =
    gradeFilterEl.value;

  const selectedDuration =
    durationFilterEl.value;

  const selectedCapacity =
    capacityFilterEl.value;

  const selectedLocation =
    locationFilterEl.value;


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


      return (

        (
          !searchTerm ||
          searchableText.includes(searchTerm)
        )

        &&

        (
          !selectedFaculty ||
          getFaculty(row) === selectedFaculty
        )

        &&

        (
          !selectedMint ||
          getMintArea(row) === selectedMint
        )

        &&

        (
          !selectedFormat ||
          getFormat(row) === selectedFormat
        )

        &&

        (
          !selectedGrade ||
          getGrade(row) === selectedGrade
        )

        &&

        (
          !selectedDuration ||
          getDuration(row) === selectedDuration
        )

        &&

        (
          !selectedCapacity ||
          getCapacity(row) === selectedCapacity
        )

        &&

        (
          !selectedLocation ||
          getLocation(row) === selectedLocation
        )

      );
    });


  resultCountEl.textContent =
    filtered.length === 1
      ? "1 Angebot gefunden"
      : `${filtered.length} Angebote gefunden`;


  if (filtered.length === 0) {

    offersEl.innerHTML = `
      <div class="empty">
        Keine passenden Angebote gefunden.
      </div>
    `;

    return;
  }


  offersEl.innerHTML =
    filtered
      .map(row => {

        const id =
          escapeHtml(getId(row));

        const title =
          escapeHtml(getTitle(row));

        const faculty =
          getFaculty(row);

        const facultyLabel =
          escapeHtml(
            getFacultyLabel(faculty)
          );

        const facultyClass =
          getFacultyClass(faculty);

        const format =
          escapeHtml(getFormat(row));

        const mint =
          escapeHtml(getMintArea(row));

        const description =
          escapeHtml(
            getDescription(row) ||
            "Weitere Informationen folgen."
          );

        const grade =
          escapeHtml(getGrade(row));

        const capacity =
          escapeHtml(getCapacity(row));

        const location =
          escapeHtml(getLocation(row));

        const duration =
          escapeHtml(getDuration(row));


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
          .map(
            item =>
              `<span>${item}</span>`
          )
          .join("");


        const isSelected =
          selectedOfferIds.includes(
            getId(row)
          );


        return `
          <article
            class="card ${facultyClass}"
            data-offer-id="${id}"
            tabindex="0"
            role="button"
          >

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


            <div class="card-footer">

              <span class="details-link">
                Details ansehen →
              </span>

              ${
                isSelected
                  ? `
                    <span class="selected-label">
                      ✓ Vorgemerkt
                    </span>
                  `
                  : ""
              }

            </div>

          </article>
        `;
      })
      .join("");


  document
    .querySelectorAll(".card")
    .forEach(card => {

      card.addEventListener(
        "click",
        () => {
          openOfferDetails(
            card.dataset.offerId
          );
        }
      );


      card.addEventListener(
        "keydown",
        event => {

          if (
            event.key === "Enter" ||
            event.key === " "
          ) {

            event.preventDefault();

            openOfferDetails(
              card.dataset.offerId
            );

          }

        }
      );

    });
}


// ============================================================
// 8. DETAILFENSTER
// ============================================================

function openOfferDetails(id) {

  const row =
    allOffers.find(
      offer =>
        getId(offer) === id
    );


  if (!row) {
    return;
  }


  const faculty =
    getFaculty(row);

  const facultyClass =
    getFacultyClass(faculty);

  const contactPerson =
    getContactPerson(row);

  const isSelected =
    selectedOfferIds.includes(id);


  detailContentEl.innerHTML = `

    <div class="detail-card ${facultyClass}">

      <div class="card-top">

        <span class="badge">
          ${escapeHtml(getFormat(row))}
        </span>

        <span class="faculty">
          ${escapeHtml(
            getFacultyLabel(faculty)
          )}
        </span>

      </div>


      <h2 id="detailTitle">
        ${escapeHtml(getTitle(row))}
      </h2>


      <p class="detail-description">
        ${escapeHtml(
          getDescription(row) ||
          "Weitere Informationen folgen."
        )}
      </p>


      <div class="detail-meta">

        ${
          getMintArea(row)
            ? `
              <div>
                <strong>MINT-Bereich</strong>
                <span>
                  ${escapeHtml(getMintArea(row))}
                </span>
              </div>
            `
            : ""
        }


        ${
          getGrade(row)
            ? `
              <div>
                <strong>Klassenstufe</strong>
                <span>
                  ${escapeHtml(getGrade(row))}
                </span>
              </div>
            `
            : ""
        }


        ${
          getCapacity(row)
            ? `
              <div>
                <strong>Personenanzahl</strong>
                <span>
                  ${escapeHtml(getCapacity(row))}
                </span>
              </div>
            `
            : ""
        }


        ${
          getDuration(row)
            ? `
              <div>
                <strong>Dauer</strong>
                <span>
                  ${escapeHtml(getDuration(row))}
                </span>
              </div>
            `
            : ""
        }


        ${
          getLocation(row)
            ? `
              <div>
                <strong>Ort</strong>
                <span>
                  ${escapeHtml(getLocation(row))}
                </span>
              </div>
            `
            : ""
        }

      </div>


      <div class="contact-box">

        <p>
          Für dieses Angebot ist
          <strong>
            ${
              escapeHtml(
                contactPerson ||
                "die zuständige Ansprechperson"
              )
            }
          </strong>
          zuständig.
        </p>

      </div>


      <button
        id="detailAddButton"
        class="${
          isSelected
            ? "secondary-button"
            : "primary-button"
        }"
        type="button"
      >
        ${
          isSelected
            ? "Aus meiner Anfrage entfernen"
            : "Zur Anfrage hinzufügen"
        }
      </button>

    </div>
  `;


  const addButton =
    document.getElementById(
      "detailAddButton"
    );


  addButton.addEventListener(
    "click",
    () => {

      toggleOfferSelection(id);

      openOfferDetails(id);

    }
  );


  detailModalEl.classList.remove(
    "modal-hidden"
  );

  detailModalEl.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.classList.add(
    "modal-open"
  );
}


function closeOfferDetails() {

  detailModalEl.classList.add(
    "modal-hidden"
  );

  detailModalEl.setAttribute(
    "aria-hidden",
    "true"
  );

  document.body.classList.remove(
    "modal-open"
  );
}


// ============================================================
// 9. ANFRAGELISTE / MERKLISTE
// ============================================================

function loadSavedSelection() {

  try {

    const saved =
      localStorage.getItem(
        "mintRequestList"
      );


    if (saved) {

      selectedOfferIds =
        JSON.parse(saved);

    }

  }

  catch (error) {

    console.error(
      "Merkliste konnte nicht geladen werden:",
      error
    );

    selectedOfferIds = [];

  }

}


function saveSelection() {

  localStorage.setItem(
    "mintRequestList",
    JSON.stringify(
      selectedOfferIds
    )
  );

}


function toggleOfferSelection(id) {

  if (
    selectedOfferIds.includes(id)
  ) {

    selectedOfferIds =
      selectedOfferIds.filter(
        selectedId =>
          selectedId !== id
      );

  }

  else {

    selectedOfferIds.push(id);

  }


  saveSelection();

  updateRequestCount();

  renderOffers();

  renderRequestList();

}


function removeOfferFromRequest(id) {

  selectedOfferIds =
    selectedOfferIds.filter(
      selectedId =>
        selectedId !== id
    );


  saveSelection();

  updateRequestCount();

  renderOffers();

  renderRequestList();

}


function updateRequestCount() {

  requestCountEl.textContent =
    selectedOfferIds.length;

}


function getSelectedOffers() {

  return allOffers.filter(
    row =>
      selectedOfferIds.includes(
        getId(row)
      )
  );

}


// ============================================================
// 10. ANFRAGEFENSTER
// ============================================================

function openRequestModal() {

  renderRequestList();


  requestModalEl.classList.remove(
    "modal-hidden"
  );

  requestModalEl.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.classList.add(
    "modal-open"
  );
}


function closeRequestModal() {

  requestModalEl.classList.add(
    "modal-hidden"
  );

  requestModalEl.setAttribute(
    "aria-hidden",
    "true"
  );

  document.body.classList.remove(
    "modal-open"
  );
}


function renderRequestList() {

  const selected =
    getSelectedOffers();


  if (selected.length === 0) {

    requestItemsEl.innerHTML = `

      <div class="empty request-empty">

        <strong>
          Deine Anfrage ist noch leer.
        </strong>

        <p>
          Öffne ein Angebot und wähle
          „Zur Anfrage hinzufügen“.
        </p>

      </div>
    `;


    requestFormAreaEl.classList.add(
      "hidden"
    );

    return;
  }


  requestFormAreaEl.classList.remove(
    "hidden"
  );


  requestItemsEl.innerHTML =
    selected
      .map(row => {

        return `

          <div class="request-item">

            <div>

              <span class="request-item-format">
                ${escapeHtml(getFormat(row))}
              </span>

              <h3>
                ${escapeHtml(getTitle(row))}
              </h3>

              <p>
                ${
                  escapeHtml(
                    getFacultyLabel(
                      getFaculty(row)
                    )
                  )
                }
              </p>

            </div>


            <button
              class="remove-request-item"
              type="button"
              data-remove-id="${escapeHtml(
                getId(row)
              )}"
            >
              Entfernen
            </button>

          </div>

        `;
      })
      .join("");


  document
    .querySelectorAll(
      "[data-remove-id]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          removeOfferFromRequest(
            button.dataset.removeId
          );

        }
      );

    });
}


// ============================================================
// 11. FORMULAR – VORERST TESTVERSION
// ============================================================

function handleRequestSubmit(event) {

  event.preventDefault();


  const selected =
    getSelectedOffers();


  if (selected.length === 0) {
    return;
  }


  const formData =
    new FormData(
      requestFormEl
    );


  const name =
    formData.get("name");


  requestSuccessEl.classList.remove(
    "hidden"
  );


  requestSuccessEl.innerHTML = `

    <strong>
      Anfrage ist vorbereitet ✓
    </strong>

    <p>
      Danke ${escapeHtml(name)}.
      Deine Auswahl und deine Angaben wurden korrekt erfasst.
    </p>

    <p>
      Im nächsten Schritt verbinden wir diesen Button
      mit Appwrite, damit die Anfrage automatisch
      an die hinterlegten Ansprechpartner verschickt wird.
    </p>

  `;

}


// ============================================================
// 12. FILTER
// ============================================================

function toggleFilterPanel() {

  const isHidden =
    filterPanelEl.classList.contains(
      "filter-panel-hidden"
    );


  if (isHidden) {

    filterPanelEl.classList.remove(
      "filter-panel-hidden"
    );

    filterToggleEl.setAttribute(
      "aria-expanded",
      "true"
    );

    filterToggleEl.textContent =
      "Filter schließen";

  }

  else {

    filterPanelEl.classList.add(
      "filter-panel-hidden"
    );

    filterToggleEl.setAttribute(
      "aria-expanded",
      "false"
    );

    filterToggleEl.textContent =
      "Filter";

  }

}


function resetFilters() {

  searchEl.value = "";

  facultyFilterEl.value = "";
  mintFilterEl.value = "";
  formatFilterEl.value = "";
  gradeFilterEl.value = "";
  durationFilterEl.value = "";
  capacityFilterEl.value = "";
  locationFilterEl.value = "";

  renderOffers();

}


// ============================================================
// 13. APPWRITE LADEN
// ============================================================

async function loadOffers() {

  try {

    statusEl.classList.remove(
      "error"
    );

    statusEl.style.display =
      "block";

    statusEl.textContent =
      "Angebote werden geladen …";


    const url =
      `${APPWRITE_ENDPOINT}/tablesdb/` +
      `${encodeURIComponent(DATABASE_ID)}/tables/` +
      `${encodeURIComponent(TABLE_ID)}/rows`;


    const response =
      await fetch(
        url,
        {

          method: "GET",

          headers: {

            "X-Appwrite-Project":
              PROJECT_ID,

            "X-Appwrite-Response-Format":
              "1.9.5"

          }

        }
      );


    if (!response.ok) {

      const errorText =
        await response.text();

      throw new Error(
        `Appwrite antwortet mit ${response.status}: ${errorText}`
      );

    }


    const data =
      await response.json();


    allOffers =
      data.rows || [];


    selectedOfferIds =
      selectedOfferIds.filter(
        id =>
          allOffers.some(
            row =>
              getId(row) === id
          )
      );


    saveSelection();

    renderFilterOptions();

    updateRequestCount();

    renderOffers();

    renderRequestList();


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
// 14. EVENTS
// ============================================================

searchEl.addEventListener(
  "input",
  renderOffers
);


facultyFilterEl.addEventListener(
  "change",
  renderOffers
);

mintFilterEl.addEventListener(
  "change",
  renderOffers
);

formatFilterEl.addEventListener(
  "change",
  renderOffers
);

gradeFilterEl.addEventListener(
  "change",
  renderOffers
);

durationFilterEl.addEventListener(
  "change",
  renderOffers
);

capacityFilterEl.addEventListener(
  "change",
  renderOffers
);

locationFilterEl.addEventListener(
  "change",
  renderOffers
);


resetFiltersEl.addEventListener(
  "click",
  resetFilters
);


filterToggleEl.addEventListener(
  "click",
  toggleFilterPanel
);


requestListButtonEl.addEventListener(
  "click",
  openRequestModal
);


closeDetailEl.addEventListener(
  "click",
  closeOfferDetails
);


closeRequestEl.addEventListener(
  "click",
  closeRequestModal
);


document
  .querySelector(
    "[data-close-detail]"
  )
  .addEventListener(
    "click",
    closeOfferDetails
  );


document
  .querySelector(
    "[data-close-request]"
  )
  .addEventListener(
    "click",
    closeRequestModal
  );


requestFormEl.addEventListener(
  "submit",
  handleRequestSubmit
);


document.addEventListener(
  "keydown",
  event => {

    if (event.key === "Escape") {

      closeOfferDetails();

      closeRequestModal();

    }

  }
);


// ============================================================
// 15. START
// ============================================================

loadSavedSelection();

updateRequestCount();

loadOffers();
