import React, { useEffect, useMemo, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import History from "@tiptap/extension-history";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Superscript from "@tiptap/extension-superscript";
import Subscript from "@tiptap/extension-subscript";
import TextAlign from "@tiptap/extension-text-align";
import * as mammoth from "mammoth/mammoth.browser";

import MenuBar from "./components/MenuBar.jsx";
import Accordion from "./components/Accordion.jsx";
import MetadataStatus from "./components/MetadataStatus.jsx";
import MetadataForm from "./components/MetadataForm.jsx";
import ContributorsEditor from "./components/ContributorsEditor.jsx";
import StructuredBlockInspector from "./components/StructuredBlockInspector.jsx";
import { CalloutBlock } from "./extensions/CalloutBlock.js";
import { ChartBlock } from "./extensions/ChartBlock.js";
import { ImageBlock } from "./extensions/ImageBlock.js";

import { MetadataSchema } from "./metadata/schema.js";
import { validateMetadata } from "./metadata/validate.js";
import { unitFromCode } from "./utils/imprint.js";
import { extractDocxMetadata } from "./utils/extractDocxMetadata.js";
import { wrapHtml } from "./serializers/htmlTemplate.js";
import { pmJsonToXml } from "./serializers/toXml.js";
import { pmToDocbookArticle } from "./serializers/toDocbook.js";
import { pmToStorDocument } from "./serializers/toStorJson.js";
import { downloadFile } from "./utils/download.js";
import { mdToHtml, looksLikeMarkdown } from "./utils/markdown.js";
import { savePreviewArticle } from "../preview-storage.ts";

const PUBLISHER_DRAFT_KEY = "oireachtas-publishing-studio/publisher-draft";
const INITIAL_EDITOR_CONTENT =
  "<p>This is the <strong>Oireachtas Digital Publishing Studio</strong> prototype.</p><p>Set publication details, structure the article in the editor, live preview and publishing of Oireachtas research, information and committee reports.</p>";

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

function getArticleTypeOptions(destination = "inside-parliament") {
  return (
    ARTICLE_TYPE_OPTIONS[destination] ||
    ARTICLE_TYPE_OPTIONS["inside-parliament"]
  );
}

function getDefaultArticleType(destination = "inside-parliament") {
  if (destination === "committee-reports") return "committee-report";
  return getArticleTypeOptions(destination)[0].value;
}

function safeFileSlug(input = "") {
  const base = String(input).trim() || "Untitled research document";
  const slug =
    base
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^[-]+|[-]+$/g, "")
      .toLowerCase()
      .slice(0, 100) || "untitled-research-document";
  return slug;
}

function todayIsoDate() {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 10);
}

function buildDocumentSlug(title = "", datePublished = "") {
  const base = safeFileSlug(title);
  const dateTail = String(datePublished || "")
    .slice(0, 10)
    .replace(/-/g, "");

  return dateTail ? `${base}-${dateTail}` : base;
}

function deriveUnitFromContributors(contributors = [], fallbackUnit) {
  const firstContributorWithUnit = contributors.find(
    (contributor) =>
      contributor &&
      typeof contributor.affiliation === "object" &&
      contributor.affiliation?.unitCode &&
      contributor.affiliation?.unit,
  );

  if (
    firstContributorWithUnit &&
    typeof firstContributorWithUnit.affiliation === "object"
  ) {
    return {
      unitCode: firstContributorWithUnit.affiliation.unitCode,
      unit: firstContributorWithUnit.affiliation.unit,
      ...(firstContributorWithUnit.affiliation.committeeCode
        ? { committeeCode: firstContributorWithUnit.affiliation.committeeCode }
        : {}),
    };
  }

  return fallbackUnit;
}

function buildXml(docJson, meta) {
  try {
    return pmJsonToXml(docJson, meta);
  } catch (e) {
    try {
      return pmJsonToXml(docJson);
    } catch {
      throw e;
    }
  }
}

function extractFirstHeadingFromHtml(html = "") {
  const match = String(html).match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  if (!match) return "";

  return String(match[1] || "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function parseContributors(raw, fallbackUnitCode, fallbackCommitteeCode) {
  if (!raw) return [];
  return raw
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((tok) => {
      const [name, role = "author", unitTok = "", email = "", orcid = ""] = tok
        .split("|")
        .map((t) => t.trim());

      let given = "";
      let family = name;
      if (name.includes(",")) {
        const [fam, giv] = name.split(",").map((t) => t.trim());
        family = fam;
        given = giv;
      } else if (name.includes(" ")) {
        const parts = name.split(" ");
        given = parts[0];
        family = parts.slice(1).join(" ");
      }

      const isCommitteeToken = unitTok?.toUpperCase?.().startsWith("COM-");
      const unitCode = isCommitteeToken
        ? "COM"
        : (unitTok || fallbackUnitCode || "OTHER").toUpperCase();
      const committeeCode = isCommitteeToken
        ? unitTok
        : unitCode === "COM"
          ? fallbackCommitteeCode || undefined
          : undefined;

      const affiliationParts = [unitFromCode(unitCode), committeeCode].filter(
        Boolean,
      );

      return {
        name: [given, family].filter(Boolean).join(" ").trim() || family,
        role: role.toLowerCase(),
        showAsAuthor: role.toLowerCase() === "author",
        email: email || undefined,
        orcid: orcid || undefined,
        affiliation: affiliationParts.join(" / ") || "Houses of the Oireachtas",
      };
    });
}

function parseAuthorsFromDocx(core = {}, custom = {}) {
  const raw =
    custom.Authors || custom.Author || core.creator || core.author || "";

  const tokens = String(raw)
    .split(/;|\n|,/)
    .map((s) => s.trim())
    .filter(Boolean);

  return tokens.map((name) => {
    let given = "";
    let family = name;
    if (name.includes(",")) {
      const [fam, giv] = name.split(",").map((t) => t.trim());
      family = fam;
      given = giv;
    } else if (name.includes(" ")) {
      const parts = name.split(" ");
      given = parts[0];
      family = parts.slice(1).join(" ");
    }
    return {
      name: [given, family].filter(Boolean).join(" ").trim() || family,
      role: "author",
      affiliation: "Houses of the Oireachtas",
      showAsAuthor: true,
    };
  });
}

function dedupeContributors(list = []) {
  const seen = new Set();
  const out = [];
  for (const c of list) {
    const key = `${(c.name || "").trim().toLowerCase()}|${(c.role || "").toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(c);
    }
  }
  return out;
}

function getSelectedStructuredBlock(editor) {
  if (!editor) return null;

  const { selection } = editor.state;
  const selectedNode = selection.node;

  if (
    selectedNode &&
    (selectedNode.type.name === "calloutBlock" ||
      selectedNode.type.name === "chartBlock" ||
      selectedNode.type.name === "imageBlock")
  ) {
    return {
      type: selectedNode.type.name,
      attrs: selectedNode.attrs || {},
      from: selection.from,
      to: selection.to,
    };
  }

  const nodeAfter = selection.$from.nodeAfter;
  if (
    nodeAfter &&
    (nodeAfter.type.name === "calloutBlock" ||
      nodeAfter.type.name === "chartBlock" ||
      nodeAfter.type.name === "imageBlock")
  ) {
    return {
      type: nodeAfter.type.name,
      attrs: nodeAfter.attrs || {},
      from: selection.from,
      to: selection.from + nodeAfter.nodeSize,
    };
  }

  return null;
}

function createInitialMetadata(initialSlug, initialDatePublished) {
  return MetadataSchema.parse({
    storId: initialSlug,
    slug: initialSlug,
    destination: "",
    contentType: "",
    title: "",
    dek: "",
    section: "",
    theme: "",
    topics: [],
    layout: "standard",
    language: "en",
    status: "draft",
    version: "0.1",
    keywords: ["prototype"],
    datePublished: initialDatePublished,
    hero: {
      src: "",
      alt: "",
      caption: "",
      credit: "",
    },
    unit: {
      unitCode: "COMMS",
      unit: unitFromCode("COMMS"),
    },
    contributors: [
      {
        given: "",
        family: "",
        role: "author",
        affiliation: {
          unitCode: "COMMS",
          unit: unitFromCode("COMMS"),
        },
        showAsAuthor: true,
      },
    ],
  });
}

function readPublisherDraft() {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(PUBLISHER_DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writePublisherDraft(payload) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PUBLISHER_DRAFT_KEY, JSON.stringify(payload));
}

function clearPublisherDraft() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PUBLISHER_DRAFT_KEY);
}

export default function App({ appBase = "" }) {
  const initialDatePublished = todayIsoDate();
  const initialSlug = buildDocumentSlug(
    "Untitled research document",
    initialDatePublished,
  );

  const extensions = useMemo(
    () => [
      History.configure({ depth: 100, newGroupDelay: 500 }),
      StarterKit.configure({
        history: false,
        heading: { levels: [1, 2, 3, 4] },
      }),
      Placeholder.configure({
        placeholder: "Write something… or import a .docx file",
      }),
      Underline,
      Highlight,
      Link.configure({
        autolink: true,
        openOnClick: true,
        linkOnPaste: true,
        protocols: ["http", "https", "mailto"],
      }),
      Superscript,
      Subscript,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      CalloutBlock,
      ChartBlock,
      ImageBlock,
    ],
    [],
  );

  const editor = useEditor({
    extensions,
    content: INITIAL_EDITOR_CONTENT,
  });

  const [metadata, setMetadata] = useState(
    createInitialMetadata(initialSlug, initialDatePublished),
  );

  const validation = useMemo(() => validateMetadata(metadata), [metadata]);
  const canExport = validation.ok && validation.errors.length === 0;
  const [inputMode, setInputMode] = useState("editor");
  const [selectedStructuredBlock, setSelectedStructuredBlock] = useState(null);
  const [openStage, setOpenStage] = useState("start");
  const [slugLocked, setSlugLocked] = useState(true);
  const [workflowMessage, setWorkflowMessage] = useState(null);
  const [publishMessage, setPublishMessage] = useState(null);
  const fileInputRef = useRef(null);
  const hasHydratedDraft = useRef(false);
  const initialMetadataRef = useRef(
    createInitialMetadata(initialSlug, initialDatePublished),
  );

  const applyMetadataUpdate = (nextValue) => {
    setMetadata((current) => {
      const patch =
        typeof nextValue === "function" ? nextValue(current) : nextValue;
      const next = { ...current, ...patch };
      const destination = next.destination || "";
      const contentTypeOptions = destination
        ? getArticleTypeOptions(destination)
        : [];

      if (
        patch.destination !== undefined &&
        patch.destination !== current.destination &&
        patch.contentType === undefined
      ) {
        next.contentType =
          destination === "committee-reports" ? "committee-report" : "";
      } else if (
        next.contentType &&
        destination !== "committee-reports" &&
        !contentTypeOptions.some((option) => option.value === next.contentType)
      ) {
        next.contentType = "";
      }

      if (destination === "committee-reports") {
        next.contentType = "committee-report";
        next.section = "";
        next.theme = "";
      }

      if (!next.layout) {
        next.layout = "standard";
      }

      if (!next.language || String(next.language).trim() === "") {
        next.language = "en";
      }

      next.unit = deriveUnitFromContributors(
        next.contributors || [],
        next.unit,
      );

      if (!next.datePublished) {
        next.datePublished = todayIsoDate();
      }

      const rawTitle = typeof next.title === "string" ? next.title : "";
      const normalizedTitle = rawTitle.trim() || "Untitled research document";
      next.title = rawTitle;

      if (patch.slug !== undefined) {
        next.slug = safeFileSlug(patch.slug);
      } else if (slugLocked || !next.slug) {
        next.slug = buildDocumentSlug(normalizedTitle, next.datePublished);
      }

      if (!next.slug) {
        next.slug = buildDocumentSlug(normalizedTitle, next.datePublished);
      }

      next.storId = next.slug;
      return next;
    });
    setPublishMessage(null);
  };

  const handleSlugLockChange = (nextLocked) => {
    setSlugLocked(nextLocked);
    if (nextLocked) {
      applyMetadataUpdate({
        slug: buildDocumentSlug(metadata.title, metadata.datePublished),
      });
    }
  };

  const buildStorDocument = () =>
    editor ? pmToStorDocument(editor.getJSON(), metadata) : null;

  const handleClearDraft = () => {
    clearPublisherDraft();
    setMetadata(initialMetadataRef.current);
    setInputMode("editor");
    setOpenStage("start");
    setSlugLocked(true);
    setSelectedStructuredBlock(null);
    setWorkflowMessage({
      type: "success",
      text: "Saved browser draft cleared. The publisher has been reset.",
    });
    setPublishMessage(null);
    editor?.commands.setContent(INITIAL_EDITOR_CONTENT, true);
  };

  useEffect(() => {
    if (!editor || hasHydratedDraft.current) return;

    const draft = readPublisherDraft();
    const defaultMetadata = createInitialMetadata(initialSlug, initialDatePublished);

    if (draft) {
      const nextMetadata = MetadataSchema.parse({
        ...defaultMetadata,
        ...(draft.metadata || {}),
      });

      setMetadata(nextMetadata);
      setInputMode(
        draft.inputMode === "upload" || draft.inputMode === "editor"
          ? draft.inputMode
          : "editor",
      );
      setOpenStage(
        ["start", "details", "edit", "preview"].includes(draft.openStage)
          ? draft.openStage
          : "start",
      );
      setSlugLocked(
        typeof draft.slugLocked === "boolean" ? draft.slugLocked : true,
      );

      if (draft.editorJson) {
        editor.commands.setContent(draft.editorJson, true);
      }
    }

    hasHydratedDraft.current = true;
  }, [editor, initialDatePublished, initialSlug]);

  useEffect(() => {
    if (!editor || !hasHydratedDraft.current) return undefined;

    const persistDraft = () => {
      writePublisherDraft({
        metadata,
        inputMode,
        openStage,
        slugLocked,
        editorJson: editor.getJSON(),
        updatedAt: new Date().toISOString(),
      });
    };

    persistDraft();

    let timeoutId;
    const handleUpdate = () => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(persistDraft, 200);
    };

    editor.on("update", handleUpdate);

    return () => {
      window.clearTimeout(timeoutId);
      editor.off("update", handleUpdate);
    };
  }, [editor, inputMode, metadata, openStage, slugLocked]);

  const handleExportHTML = () => {
    if (!editor) return;
    const body = editor.getHTML();
    const page = wrapHtml(body, metadata);
    const base = safeFileSlug(metadata.title);
    const name = metadata.version
      ? `${base}-v${String(metadata.version).replace(/\s+/g, "")}`
      : base;
    downloadFile(page, `${name}.html`, "text/html;charset=utf-8");
  };

  const handleExportDocBook = () => {
    if (!editor) return;
    const json = editor.getJSON();
    const docbook = pmToDocbookArticle(json, metadata);
    const base = safeFileSlug(metadata.title);
    const name = metadata.version
      ? `${base}-v${String(metadata.version).replace(/\s+/g, "")}`
      : base;
    downloadFile(
      docbook,
      `${name}.docbook.xml`,
      "application/xml;charset=utf-8",
    );
  };

  const handleExportStorJson = () => {
    const storDocument = buildStorDocument();
    if (!storDocument) return;

    downloadFile(
      JSON.stringify(storDocument, null, 2),
      `${storDocument.slug || safeFileSlug(metadata.title)}.json`,
      "application/json;charset=utf-8",
    );
  };

  const handlePreviewArticle = async () => {
    if (validation.errors.length > 0) {
      setPublishMessage({
        type: "error",
        text: `Complete the required publication details first: ${validation.errors.join(", ")}.`,
      });
      setOpenStage("details");
      return;
    }

    const storDocument = buildStorDocument();
    if (!storDocument) return;

    setPublishMessage(null);

    try {
      savePreviewArticle(storDocument);
      const previewPath = new URL(
        `${String(appBase).replace(/\/$/, "")}/preview/`,
        window.location.origin,
      ).toString();
      window.open(previewPath, "_blank", "noopener");

      setPublishMessage({
        type: "success",
        text: "Preview article opened from browser storage.",
        previewUrl: previewPath,
      });
      setOpenStage("preview");
    } catch (error) {
      setPublishMessage({
        type: "error",
        text:
          error?.message || "Preview could not be prepared in browser storage.",
      });
    }
  };

  const handleDocxSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setInputMode("upload");
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml(
        { arrayBuffer },
        {
          styleMap: [
            "p[style-name='Title'] => h1",
            "p[style-name='Heading 1'] => h1",
            "p[style-name='Heading 2'] => h2",
            "p[style-name='Heading 3'] => h3",
            "p[style-name='Heading 4'] => h4",
          ],
          includeDefaultStyleMap: true,
        },
      );
      editor?.chain().focus().setContent(result.value, true).run();
      const firstImportedHeading = extractFirstHeadingFromHtml(result.value);

      const { core, custom } = await extractDocxMetadata(arrayBuffer);
      const rawUnitCode = (
        custom.UnitCode ||
        custom.ImprintCode ||
        "OTHER"
      ).toUpperCase();
      const unit =
        custom.UnitCode || custom.ImprintCode
          ? { unitCode: rawUnitCode, unit: unitFromCode(rawUnitCode) }
          : undefined;

      const contributorsFromCustom = parseContributors(
        custom.Contributors,
        unit?.unitCode,
        undefined,
      );
      const authorsFromProps = parseAuthorsFromDocx(core, custom);
      const mergedContribs = contributorsFromCustom.length
        ? dedupeContributors([...contributorsFromCustom, ...authorsFromProps])
        : authorsFromProps;

      applyMetadataUpdate({
        destination:
          custom.Destination || metadata.destination || "inside-parliament",
        contentType:
          custom.Type ||
          custom.ResourceType ||
          metadata.contentType ||
          getDefaultArticleType(metadata.destination),
        title:
          custom.Title ||
          core.title ||
          firstImportedHeading ||
          metadata.title ||
          "Untitled research document",
        dek:
          custom.Dek ||
          custom.Subtitle ||
          metadata.dek ||
          metadata.subtitle ||
          "",
        theme: custom.Theme || metadata.theme || "",
        layout: custom.Layout || metadata.layout || "standard",
        subtitle: custom.Subtitle || metadata.subtitle,
        abstract: custom.Abstract || metadata.abstract,
        language: (
          custom.Language ||
          core.language ||
          metadata.language ||
          "en"
        ).trim(),
        status: (
          custom.Status ||
          core.contentStatus ||
          metadata.status ||
          "draft"
        ).toLowerCase(),
        version: custom.Version ?? metadata.version ?? "0.1",
        datePublished:
          custom.DatePublished || core.dateCreated || metadata.datePublished,
        dateModified: core.dateModified || metadata.dateModified,
        doi: custom.DOI || metadata.doi,
        license: custom.License || metadata.license,
        keywords: (custom.Keywords || core.keywords || metadata.keywords || [])
          .toString()
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        publisher: "Houses of the Oireachtas",
        unit,
        contributors: mergedContribs,
      });
      setWorkflowMessage({
        type: "success",
        text: `Imported ${file.name}. Review the publication details before previewing.`,
      });
    } catch (err) {
      console.error(err);
      window.alert(`Failed to import .docx: ${err?.message || String(err)}`);
    } finally {
      e.target.value = "";
    }
  };

  const handlePaste = (event) => {
    if (!editor) return;
    const plain = event.clipboardData?.getData("text/plain") || "";
    const html = event.clipboardData?.getData("text/html") || "";

    if (html) return;

    if (looksLikeMarkdown(plain)) {
      event.preventDefault();
      const converted = mdToHtml(plain);
      editor.chain().focus().insertContent(converted).run();
    }
  };

  const xmlPreview = useMemo(() => {
    if (!editor) return "";
    try {
      return buildXml(editor.getJSON(), metadata);
    } catch (e) {
      return `<!-- XML preview error: ${e?.message || e} -->`;
    }
  }, [editor, metadata]);

  const storPreview = useMemo(() => {
    if (!editor) return "";
    return JSON.stringify(
      pmToStorDocument(editor.getJSON(), metadata),
      null,
      2,
    );
  }, [editor, metadata]);

  useEffect(() => {
    if (!editor) return undefined;

    const updateSelection = () => {
      setSelectedStructuredBlock(getSelectedStructuredBlock(editor));
    };

    updateSelection();
    editor.on("selectionUpdate", updateSelection);
    editor.on("transaction", updateSelection);

    return () => {
      editor.off("selectionUpdate", updateSelection);
      editor.off("transaction", updateSelection);
    };
  }, [editor]);

  const handleStructuredBlockUpdate = (patch) => {
    if (!editor || !selectedStructuredBlock) return;
    editor
      .chain()
      .focus()
      .updateAttributes(selectedStructuredBlock.type, patch)
      .run();
    setSelectedStructuredBlock((current) =>
      current ? { ...current, attrs: { ...current.attrs, ...patch } } : current,
    );
    setPublishMessage(null);
  };

  const stageItems = [
    { id: "start", label: "1. Start" },
    { id: "details", label: "2. Publication details" },
    { id: "edit", label: "3. Edit content" },
    { id: "preview", label: "4. Preview and export" },
  ];

  const activeStage =
    stageItems.find((stage) => stage.id === openStage) || stageItems[0];

  const renderStepNavigation = ({
    backLabel = "Back",
    onBack,
    nextLabel,
    onNext,
  }) => (
    <div className="wizard-nav">
      <button type="button" onClick={onBack}>
        {backLabel}
      </button>
      <button type="button" className="primary-button" onClick={onNext}>
        {nextLabel}
      </button>
    </div>
  );

  const handleDuplicateStructuredBlock = () => {
    if (!editor || !selectedStructuredBlock) return;

    editor
      .chain()
      .focus()
      .insertContentAt(selectedStructuredBlock.to, {
        type: selectedStructuredBlock.type,
        attrs: selectedStructuredBlock.attrs,
      })
      .run();

    setPublishMessage(null);
  };

  const handleRemoveStructuredBlock = () => {
    if (!editor || !selectedStructuredBlock) return;

    editor
      .chain()
      .focus()
      .deleteRange({
        from: selectedStructuredBlock.from,
        to: selectedStructuredBlock.to,
      })
      .run();

    setSelectedStructuredBlock(null);
    setPublishMessage(null);
  };

  if (!editor) {
    return (
      <p style={{ padding: 12, fontFamily: "system-ui" }}>Loading editor…</p>
    );
  }

  return (
    <div className="container">
      <header className="page-intro">
        <p className="subtitle">
          Create and preview articles and committee reports.
        </p>
      </header>

      <nav className="stage-nav" aria-label="Publisher workflow stages">
        {stageItems.map((stage) => (
          <button
            key={stage.id}
            type="button"
            className={
              openStage === stage.id ? "stage-pill active" : "stage-pill"
            }
            onClick={() => setOpenStage(stage.id)}
          >
            {stage.label}
          </button>
        ))}
      </nav>

      {openStage !== "start" && (
        <MetadataStatus report={validation} metadata={metadata} />
      )}
      {workflowMessage && (
        <div
          className={
            workflowMessage.type === "error"
              ? "publish-message error"
              : "publish-message success"
          }
        >
          <strong>{workflowMessage.text}</strong>
        </div>
      )}

      <section className="stage-section wizard-panel">
        <header className="stage-heading">
          <span>{activeStage.label}</span>
        </header>

        {openStage === "start" && (
          <div className="stage-body stage-body--start">
            <p className="stage-copy">
              Upload remains a placeholder-first Word import; the editor path is
              the main route for this prototype.
            </p>

            <div className="workflow-grid">
              <button
                type="button"
                className={
                  inputMode === "upload"
                    ? "workflow-card active"
                    : "workflow-card"
                }
                onClick={() => setInputMode("upload")}
              >
                <strong>Upload document</strong>
                <span>
                  Use the current Word import path and refine in the editor.
                </span>
              </button>

              <button
                type="button"
                className={
                  inputMode === "editor"
                    ? "workflow-card active"
                    : "workflow-card"
                }
                onClick={() => setInputMode("editor")}
              >
                <strong>Use the editor</strong>
                <span>
                  Paste, type and structure the article directly in the editor.
                </span>
              </button>
            </div>

            <div
              className={
                inputMode === "editor"
                  ? "stage-actions stage-actions--start stage-actions--editor"
                  : "stage-actions stage-actions--start"
              }
            >
              {inputMode === "upload" && (
                <label className="file-label">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".docx"
                    onChange={handleDocxSelected}
                    style={{ display: "none" }}
                  />
                  Select a Word document (.docx)
                </label>
              )}
              <button
                type="button"
                className="primary-button"
                onClick={() => setOpenStage("details")}
              >
                Continue to publication details
              </button>
            </div>
          </div>
        )}

        {openStage === "details" && (
          <div className="stage-body">
            <p className="stage-copy">
              Set the publication metadata and core article details.
            </p>
            <Accordion
              title="Metadata"
              defaultOpen={true}
              badge={
                validation.errors.length > 0
                  ? `Needs attention (${validation.errors.length})`
                  : undefined
              }
            >
              <MetadataForm
                value={metadata}
                onChange={applyMetadataUpdate}
                slugLocked={slugLocked}
                onSlugLockChange={handleSlugLockChange}
              >
                <ContributorsEditor
                  value={metadata.contributors}
                  unit={metadata.unit}
                  onChange={(nextList) =>
                    applyMetadataUpdate({ contributors: nextList })
                  }
                />
              </MetadataForm>
            </Accordion>
            {renderStepNavigation({
              onBack: () => setOpenStage("start"),
              nextLabel: "Continue to edit content",
              onNext: () => setOpenStage("edit"),
            })}
          </div>
        )}

        {openStage === "edit" && (
          <div className="stage-body">
            <section className="editor-context">
              <p>
                Use the toolbar to adjust headings, lists, links and basic
                formatting. Use <strong>Add → Full-width image</strong> for
                media, charts and interactives [**NOT WORKING TOO WELL ATM**].
              </p>
            </section>
            <div
              className={
                selectedStructuredBlock
                  ? "editor-layout has-selection"
                  : "editor-layout"
              }
            >
              <div className="editor-shell">
                <MenuBar editor={editor} />
                {selectedStructuredBlock && (
                  <div className="structured-block-bar">
                    <div className="structured-block-bar__copy">
                      <strong>
                        {selectedStructuredBlock.type === "calloutBlock"
                          ? "Callout block selected"
                          : selectedStructuredBlock.type === "imageBlock"
                            ? "Image block selected"
                            : "Chart block selected"}
                      </strong>
                      <span>
                        Edit fields in the inspector, or duplicate/remove this
                        block here.
                      </span>
                    </div>
                    <div className="structured-block-bar__actions">
                      <button
                        type="button"
                        onClick={handleDuplicateStructuredBlock}
                      >
                        Duplicate
                      </button>
                      <button
                        type="button"
                        className="danger"
                        onClick={handleRemoveStructuredBlock}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
                <div className="editor-scroll">
                  <EditorContent editor={editor} onPaste={handlePaste} />
                </div>
              </div>
              {selectedStructuredBlock && (
                <StructuredBlockInspector
                  selectedBlock={selectedStructuredBlock}
                  onUpdate={handleStructuredBlockUpdate}
                />
              )}
            </div>
            {renderStepNavigation({
              onBack: () => setOpenStage("details"),
              nextLabel: "Continue to preview / publish",
              onNext: () => setOpenStage("preview"),
            })}
          </div>
        )}

        {openStage === "preview" && (
          <div className="stage-body">
            <div className="publish-panel">
              <div className="publish-panel__copy">
                <strong>Preview or publish</strong>
                <span>
                  Save the current Sveltekit JSON to browser storage, open the
                  rendered preview or export the publishable JSON artefact.
                </span>
              </div>
              <div className="publish-panel__actions publish-panel__actions--split">
                <button type="button" onClick={() => setOpenStage("edit")}>
                  Back
                </button>
                <div className="publish-panel__actions-right">
                  <button
                    type="button"
                    className="primary-button"
                    onClick={handlePreviewArticle}
                  >
                    Preview article
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={handleExportStorJson}
                  >
                    Export JSON
                  </button>
                </div>
              </div>
            </div>

            {publishMessage && (
              <div
                className={
                  publishMessage.type === "error"
                    ? "publish-message error"
                    : "publish-message success"
                }
              >
                <strong>{publishMessage.text}</strong>
                {publishMessage.previewUrl && (
                  <span>
                    Preview route:{" "}
                    <code>{new URL(publishMessage.previewUrl).pathname}</code>
                  </span>
                )}
              </div>
            )}

            <Accordion title="Technical outputs" defaultOpen={false}>
              <div style={{ display: "grid", gap: "12px" }}>
                <p className="export-note">
                  Preview works entirely in the browser. The current article is
                  saved to local storage and opened at <code>/preview/</code>.
                </p>

                <div className="actions actions--secondary">
                  <div className="actions-right">
                    <button type="button" onClick={handleClearDraft}>
                      Clear draft
                    </button>
                    <button type="button" onClick={handleExportHTML}>
                      Export HTML
                    </button>
                    <button
                      type="button"
                      onClick={handleExportDocBook}
                      disabled={!canExport}
                      title={
                        !canExport
                          ? "Fix required metadata first"
                          : "Export DocBook XML"
                      }
                    >
                      Export DocBook XML
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await navigator.clipboard.writeText(
                          JSON.stringify(editor.getJSON(), null, 2),
                        );
                      }}
                    >
                      Copy ProseMirror JSON
                    </button>
                  </div>
                </div>

                <Accordion title="Live preview" defaultOpen={true}>
                  <pre>{storPreview}</pre>
                </Accordion>
                <Accordion title="ProseMirror JSON" defaultOpen={false}>
                  <pre>{JSON.stringify(editor.getJSON(), null, 2)}</pre>
                </Accordion>
                <Accordion title="HTML" defaultOpen={false}>
                  <pre>{editor.getHTML()}</pre>
                </Accordion>
                <Accordion title="XML (House Schema)" defaultOpen={false}>
                  <pre>{xmlPreview}</pre>
                </Accordion>
              </div>
            </Accordion>
          </div>
        )}
      </section>
    </div>
  );
}
