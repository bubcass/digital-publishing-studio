import React, { useEffect, useState } from "react";

const LICENSES = [
  "Oireachtas (Open Data) PSI Licence",
  "CC BY 4.0",
  "CC BY-SA 4.0",
  "CC0 1.0",
  "All rights reserved",
  "Custom…",
];

const DESTINATION_OPTIONS = [
  { value: "inside-parliament", label: "Inside Parliament" },
  { value: "stor", label: "Stór" },
  { value: "committee-reports", label: "Committee reports" },
];

const ARTICLE_TYPE_OPTIONS = {
  stor: [
    { value: "research-article", label: "Research article" },
    { value: "research-note", label: "Research note" },
    { value: "committee-report", label: "Committee report" },
  ],
  "inside-parliament": [
    { value: "parliament-now", label: "Parliament Now" },
    { value: "parliament-explained", label: "Parliament Explained" },
    { value: "parliament-at-work", label: "Parliament at Work" },
  ],
  "committee-reports": [],
};

const SECTION_OPTIONS = {
  stor: [
    "Learning Hub",
    "Open Data Insight",
    "Visual Data",
    "Research Matters",
    "Committee Report",
  ],
  "inside-parliament": [
    "Learning Hub",
    "Parliament Essentials",
    "Report Launch",
    "Open Data Insight",
    "The Seanad at Work",
    "The Dáil at Work",
    "Committees at Work",
    "The Week Ahead",
  ],
  "committee-reports": [],
};

const COMMITTEE_OPTIONS = [
  "Business Committee",
  "Committee of Public Accounts",
  "Committee of Selection (Seanad Éireann)",
  "Committee on Agriculture and Food",
  "Committee on Artificial Intelligence",
  "Committee on Arts, Media, Communications, Culture and Sport",
  "Committee on Budgetary Oversight",
  "Committee on Children and Equality",
  "Committee on Climate, Environment and Energy",
  "Committee on Defence and National Security",
  "Committee on Disability Matters",
  "Committee on Drugs Use",
  "Committee on Education and Youth",
  "Committee on Enterprise, Tourism and Employment",
  "Committee on European Union Affairs",
  "Committee on Finance, Public Expenditure, Public Service Reform and Digitalisation, and Taoiseach",
  "Committee on Fisheries and Maritime Affairs",
  "Committee on Foreign Affairs and Trade",
  "Committee on Further and Higher Education, Research, Innovation and Science",
  "Committee on Health",
  "Committee on Housing, Local Government and Heritage",
  "Committee on Infrastructure and National Development Plan Delivery",
  "Committee on Justice, Home Affairs and Migration",
  "Committee on Key Issues affecting the Traveller Community",
  "Committee on Members' Interests of Dáil Éireann",
  "Committee on Members’ Interests of Seanad Éireann",
  "Committee on Parliamentary Privileges and Oversight (Dáil Éireann)",
  "Committee on Parliamentary Privileges and Oversight (Seanad Éireann)",
  "Committee on Public Petitions and the Ombudsmen",
  "Committee on Social Protection, Rural and Community Development",
  "Committee on Standing Orders and Dáil Reform",
  "Committee on the Implementation of the Good Friday Agreement",
  "Committee on the Irish Language, Gaeltacht and the Irish-speaking Community",
  "Committee on Transport",
  "Seanad Public Consultation Committee",
  "Seanad Select Committee on EU Scrutiny and Transparency",
  "Working Group of Committee Cathaoirligh",
];

const LAYOUT_OPTIONS = [
  { value: "standard", label: "Standard" },
  { value: "immersive", label: "Immersive" },
  { value: "feature", label: "Feature" },
];

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "in_review", label: "In review" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

const DEFAULT_VERSION = "0.1";
const DEFAULT_LICENSE = "Oireachtas (Open Data) PSI Licence";
const CUSTOM_SECTION_VALUE = "__custom__";

function getArticleTypeOptions(destination) {
  if (!destination) return [];
  return (
    ARTICLE_TYPE_OPTIONS[destination] ||
    ARTICLE_TYPE_OPTIONS["inside-parliament"]
  );
}

function getSectionOptions(destination) {
  if (!destination) return [];
  return SECTION_OPTIONS[destination] || SECTION_OPTIONS["inside-parliament"];
}

export default function MetadataForm({
  value,
  onChange,
  slugLocked,
  onSlugLockChange,
  children,
}) {
  const meta = value || {};
  const destination = meta.destination || "";
  const isCommitteeReport = destination === "committee-reports";
  const articleTypeOptions = getArticleTypeOptions(destination);
  const sectionOptions = getSectionOptions(destination);
  const effectiveSection = meta.section || meta.theme || "";
  const sectionChoice =
    effectiveSection && sectionOptions.includes(effectiveSection)
      ? effectiveSection
      : CUSTOM_SECTION_VALUE;

  const set = (patch) => onChange({ ...meta, ...patch });
  useEffect(() => {
    const patch = {};
    if (!meta.version || String(meta.version).trim() === "") {
      patch.version = DEFAULT_VERSION;
    }
    if (!meta.license || String(meta.license).trim() === "") {
      patch.license = DEFAULT_LICENSE;
    }
    if (!meta.layout) {
      patch.layout = "standard";
    }
    if (!meta.language || String(meta.language).trim() === "") {
      patch.language = "en";
    }
    if (!meta.datePublished) {
      const now = new Date();
      const timezoneOffset = now.getTimezoneOffset() * 60000;
      patch.datePublished = new Date(now.getTime() - timezoneOffset)
        .toISOString()
        .slice(0, 10);
    }

    const nextDestination = patch.destination || meta.destination || "";
    const availableTypes = getArticleTypeOptions(nextDestination).map(
      (option) => option.value,
    );
    if (nextDestination === "committee-reports") {
      patch.contentType = "committee-report";
      patch.section = "";
      patch.theme = "";
    } else if (meta.contentType && !availableTypes.includes(meta.contentType)) {
      patch.contentType = "";
    }

    if (Object.keys(patch).length) {
      onChange({ ...meta, ...patch });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    meta.version,
    meta.license,
    meta.destination,
    meta.contentType,
    meta.layout,
    meta.language,
    meta.datePublished,
  ]);

  const licenseIsCustom =
    meta.license &&
    !LICENSES.includes(meta.license) &&
    meta.license !== "Custom…";

  const [topicsInput, setTopicsInput] = useState(
    (meta.topics || []).join(", "),
  );

  useEffect(() => {
    const joined = (meta.topics || []).join(", ");
    if (joined !== topicsInput) setTopicsInput(joined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta.topics]);

  const commitTopics = () => {
    const list = (topicsInput || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    set({ topics: list });
  };

  const datePublishedValue = (meta.datePublished || "").slice(0, 10);

  return (
    <fieldset className="metadata-form">
      <legend>Primary details</legend>

      <div
        className="metadata-form__status-picker"
        aria-label="Document status"
      >
        <div>
          <span className="metadata-form__status-label">Document status</span>
          <div
            className="metadata-form__status-options"
            role="radiogroup"
            aria-label="Document status options"
          >
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={(meta.status || "draft") === option.value}
                className={
                  (meta.status || "draft") === option.value
                    ? "status-option is-active"
                    : "status-option"
                }
                onClick={() => set({ status: option.value })}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <label className="metadata-form__field metadata-form__field--version">
          <span>Document version</span>
          <input
            placeholder="e.g. 0.1"
            value={meta.version || DEFAULT_VERSION}
            onChange={(e) => set({ version: e.target.value.trim() })}
          />
        </label>
      </div>

      <div className="metadata-form__grid metadata-form__grid--top">
        <label className="metadata-form__field">
          <span>Destination</span>
          <select
            value={destination}
            onChange={(e) => set({ destination: e.target.value })}
          >
            <option value="">Choose destination…</option>
            {DESTINATION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {!isCommitteeReport && (
          <label className="metadata-form__field">
            <span>Article type</span>
            <select
              value={meta.contentType || ""}
              onChange={(e) => set({ contentType: e.target.value })}
              disabled={!destination}
            >
              <option value="">Choose article type…</option>
              {articleTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        )}

        {isCommitteeReport ? (
          <label className="metadata-form__field">
            <span>Authoring committee</span>
            <select
              value={meta.committeeName || ""}
              onChange={(e) => set({ committeeName: e.target.value })}
              disabled={!destination}
            >
              <option value="">Choose committee…</option>
              {COMMITTEE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label className="metadata-form__field">
            <span>Series</span>
            <select
              value={destination ? sectionChoice : ""}
              onChange={(e) => {
                const nextValue = e.target.value;
                if (nextValue === CUSTOM_SECTION_VALUE) {
                  set({
                    section: sectionOptions.includes(effectiveSection)
                      ? ""
                      : effectiveSection,
                  });
                  return;
                }
                set({ section: nextValue });
              }}
              disabled={!destination}
            >
              {!destination && (
                <option value="">Choose destination first…</option>
              )}
              {sectionOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
              <option value={CUSTOM_SECTION_VALUE}>Other / custom</option>
            </select>
          </label>
        )}
      </div>

      {!isCommitteeReport && sectionChoice === CUSTOM_SECTION_VALUE && (
        <label className="metadata-form__field">
          <span>Custom series</span>
          <input
            placeholder="Optional custom series label if required"
            value={effectiveSection}
            onChange={(e) => set({ section: e.target.value })}
          />
        </label>
      )}

      <label className="metadata-form__field">
        <span>Title</span>
        <input
          placeholder="Mandatory title"
          value={meta.title || ""}
          onChange={(e) => set({ title: e.target.value })}
        />
      </label>

      <label className="metadata-form__field">
        <span>Strapline</span>
        <textarea
          rows={3}
          placeholder="Optional short summary shown below the title used as a short overview or introduction"
          value={meta.dek || ""}
          onChange={(e) => set({ dek: e.target.value })}
        />
      </label>

      <label className="metadata-form__field">
        <span>Topics</span>
        <input
          type="text"
          placeholder="Seanad, voting, divisions"
          value={topicsInput}
          onChange={(e) => setTopicsInput(e.target.value)}
          onBlur={commitTopics}
        />
        <small className="field-hint">Optional. Separate with commas.</small>
      </label>

      {children}

      <details className="metadata-accordion">
        <summary className="details-summary">
          <span className="details-summary__label">Hero media</span>
          <span className="details-summary__meta">
            {meta.hero?.src
              ? "Controls the header image or video"
              : "Optional header image or video"}
          </span>
        </summary>
        <div className="metadata-form__hero">
          <div className="metadata-form__hero-copy">
            <span>
              Optional. Use an existing asset path from the SvelteKit site, for
              example
              <code> /media/full_chamber.jpg</code> or
              <code> /media/coin.mp4</code>.
            </span>
          </div>
          <div className="metadata-form__grid metadata-form__grid--hero">
            <label className="metadata-form__field">
              <span>Layout</span>
              <select
                value={meta.layout || "standard"}
                onChange={(e) => set({ layout: e.target.value })}
              >
                {LAYOUT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="metadata-form__field">
              <span>Hero media path</span>
              <input
                placeholder="/static/media/full_chamber.jpg or static/media/coin.mp4"
                value={meta.hero?.src || ""}
                onChange={(e) =>
                  set({ hero: { ...(meta.hero || {}), src: e.target.value } })
                }
              />
            </label>

            <label className="metadata-form__field">
              <span>Hero alt text</span>
              <input
                placeholder="Describe the image for readers using assistive technology"
                value={meta.hero?.alt || ""}
                onChange={(e) =>
                  set({ hero: { ...(meta.hero || {}), alt: e.target.value } })
                }
              />
            </label>

            <label className="metadata-form__field">
              <span>Hero poster image</span>
              <input
                placeholder="/static/media/full_chamber.jpg"
                value={meta.hero?.poster || ""}
                onChange={(e) =>
                  set({
                    hero: { ...(meta.hero || {}), poster: e.target.value },
                  })
                }
              />
            </label>

            <label className="metadata-form__field">
              <span>Hero caption</span>
              <input
                placeholder="Optional caption"
                value={meta.hero?.caption || ""}
                onChange={(e) =>
                  set({
                    hero: { ...(meta.hero || {}), caption: e.target.value },
                  })
                }
              />
            </label>

            <label className="metadata-form__field">
              <span>Hero credit</span>
              <input
                placeholder="Optional credit"
                value={meta.hero?.credit || ""}
                onChange={(e) =>
                  set({
                    hero: { ...(meta.hero || {}), credit: e.target.value },
                  })
                }
              />
            </label>
          </div>
        </div>
      </details>

      <details className="metadata-accordion">
        <summary className="details-summary">
          <span className="details-summary__label">More settings</span>
          <span className="details-summary__meta">
            Reference, publication date, language, licensing
          </span>
        </summary>
        <div className="metadata-form__details">
          <label className="reference-field">
            <span>Reference</span>
            <input
              placeholder="example-story"
              value={meta.slug || ""}
              readOnly={slugLocked}
              onChange={(e) => set({ slug: e.target.value })}
            />
            <div className="reference-field__actions">
              <button
                type="button"
                onClick={() => onSlugLockChange?.(!slugLocked)}
              >
                {slugLocked
                  ? "Edit reference manually"
                  : "Use generated reference"}
              </button>
              <small>
                {slugLocked
                  ? "Updates live from the title and publication date."
                  : "Manual reference stays fixed until you switch back."}
              </small>
            </div>
          </label>

          <div className="publication-meta-grid">
            <label className="metadata-form__field">
              <span>Publication date</span>
              <input
                type="date"
                value={datePublishedValue}
                onChange={(e) =>
                  set({ datePublished: e.target.value || undefined })
                }
              />
            </label>

            <label className="metadata-form__field">
              <span>Language</span>
              <input
                placeholder="en"
                value={meta.language || ""}
                onChange={(e) => set({ language: e.target.value })}
              />
            </label>
          </div>

          <label className="metadata-form__field">
            <span>Subtitle</span>
            <input
              placeholder="Optional subtitle"
              value={meta.subtitle || ""}
              onChange={(e) => set({ subtitle: e.target.value })}
            />
          </label>

          <label className="metadata-form__field">
            <span>DOI</span>
            <input
              placeholder="e.g. 10.1234/pbo.2025.12"
              value={meta.doi || ""}
              onChange={(e) => set({ doi: e.target.value.trim() })}
            />
          </label>

          <div className="metadata-form__grid metadata-form__grid--details">
            <label className="metadata-form__field">
              <span>Licence</span>
              <select
                value={
                  licenseIsCustom ? "Custom…" : meta.license || DEFAULT_LICENSE
                }
                onChange={(e) => {
                  const next = e.target.value;
                  if (next === "Custom…") set({ license: "" });
                  else set({ license: next });
                }}
              >
                {LICENSES.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
                <option value="Custom…">Custom…</option>
              </select>

              {(meta.license === "" || licenseIsCustom) && (
                <input
                  className="metadata-form__nested-input"
                  placeholder="Enter custom license text or URL"
                  value={meta.license || ""}
                  onChange={(e) => set({ license: e.target.value })}
                />
              )}
            </label>
          </div>
        </div>
      </details>
    </fieldset>
  );
}
