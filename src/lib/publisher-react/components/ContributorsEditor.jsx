import React, { useEffect } from "react";
import { IMPRINT_OPTIONS, unitFromCode } from "../utils/imprint.js";

const ROLE_OPTIONS = ["author", "editor", "reviewer", "contributor"];

function emptyContributor() {
  return {
    given: "",
    family: "",
    role: "author",
    affiliation: {
      unitCode: "COMMS",
      unit: unitFromCode("COMMS"),
    },
    showAsAuthor: true,
  };
}

function normalizeContributor(contributor = {}) {
  const unitCode =
    typeof contributor.affiliation === "object" &&
    contributor.affiliation?.unitCode
      ? contributor.affiliation.unitCode
      : "COMMS";

  return {
    given: contributor.given || "",
    family: contributor.family || "",
    role: contributor.role || "author",
    affiliation: {
      unitCode,
      unit: unitFromCode(unitCode),
    },
    showAsAuthor:
      typeof contributor.showAsAuthor === "boolean"
        ? contributor.showAsAuthor
        : true,
  };
}

const UNIT_OPTIONS = IMPRINT_OPTIONS.filter((option) =>
  ["COMMS", "LIB", "PBO", "COMSEC"].includes(option.code),
).sort((a, b) => a.title.localeCompare(b.title));

export default function ContributorsEditor({ value = [], onChange }) {
  const list = value;

  useEffect(() => {
    if (list.length === 0) {
      onChange([emptyContributor()]);
      return;
    }

    const normalized = list.map((contributor) => normalizeContributor(contributor));
    const hasChanged =
      JSON.stringify(normalized) !== JSON.stringify(list);

    if (hasChanged) {
      onChange(normalized);
    }
  }, [list, onChange]);

  const add = () => {
    onChange([...list, emptyContributor()]);
  };

  const setAt = (index, patch) => {
    const next = [...list];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  const removeAt = (index) => {
    onChange(list.filter((_, currentIndex) => currentIndex !== index));
  };

  return (
    <fieldset className="contributors-editor">
      <legend>Author Information</legend>

      <div className="contributors-editor__header">
        <p className="contributors-editor__copy">
          Add the people responsible for the article. Choose whether each person
          appears in the visible byline.
        </p>
        <button type="button" className="secondary-button" onClick={add}>
          Add contributor
        </button>
      </div>

      {list.map((rawContributor, index) => {
        const contributor = normalizeContributor(rawContributor);

        return (
        <div key={index} className="contributors-editor__card">
          <div className="contributors-editor__card-header">
            <strong>Contributor {index + 1}</strong>
            {list.length > 1 && (
              <button
                type="button"
                className="contributors-editor__remove"
                onClick={() => removeAt(index)}
              >
                Remove
              </button>
            )}
          </div>

          <div className="contributors-editor__row contributors-editor__row--primary">
            <label className="contributors-editor__field">
              <span>Given name</span>
              <input
                placeholder="First"
                value={contributor.given || ""}
                onChange={(event) =>
                  setAt(index, { given: event.target.value })
                }
              />
            </label>

            <label className="contributors-editor__field">
              <span>Surname</span>
              <input
                placeholder="Surname"
                value={contributor.family || ""}
                onChange={(event) =>
                  setAt(index, { family: event.target.value })
                }
              />
            </label>
          </div>

          <div className="contributors-editor__row contributors-editor__row--secondary">
            <label className="contributors-editor__field">
              <span>Unit</span>
              <select
                value={contributor.affiliation.unitCode}
                onChange={(event) => {
                  const unitCode = event.target.value;
                  setAt(index, {
                    affiliation: {
                      unitCode,
                      unit: unitFromCode(unitCode),
                    },
                  });
                }}
              >
                {UNIT_OPTIONS.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="contributors-editor__field contributors-editor__field--compact">
              <span>Role</span>
              <select
                value={contributor.role || "author"}
                onChange={(event) => setAt(index, { role: event.target.value })}
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>

            <label className="contributors-editor__toggle">
              <input
                checked={contributor.showAsAuthor}
                type="checkbox"
                onChange={(event) =>
                  setAt(index, { showAsAuthor: event.target.checked })
                }
              />
              <span>Show as author on page</span>
            </label>
          </div>
        </div>
      )})}
    </fieldset>
  );
}
