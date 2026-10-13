import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import {
  Save,
  Download,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  History,
  RefreshCw,
  Undo2,
  Redo2,
  CheckCheck,
  Eye,
  PenLine,
  Palette,
  Settings2,
  Minus,
  Plus,
} from "lucide-react";
import { Spinner, ErrorBox, Modal, useToast } from "../components/UI";
import { ProfileForm, useUnsaved } from "../components/ProfileForm";
import { Resume } from "../components/Resume";
import { ExportDialog } from "../components/ExportDialog";
import {
  loadDocument,
  loadProfile,
  saveDocument,
  errorMessage,
} from "../lib/api";
import { db } from "../lib/supabase";
import {
  sections,
  personalFields,
  summaryFields,
  effectiveProfile,
  setOverride,
  syncFields,
  moveItem,
  changedSections,
  type CVDocument,
  type Design,
  type ProfileData,
} from "../lib/model";
import { templates, designFor } from "../lib/templates";
export default function Editor() {
  const { documentId } = useParams();
  const [params] = useSearchParams();
  const [doc, setDoc] = useState<CVDocument>();
  const [saved, setSaved] = useState<CVDocument>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("content");
  const [section, setSection] = useState("personal");
  const [zoom, setZoom] = useState(() =>
    Math.min(0.68, Math.max(0.25, (window.innerWidth - 90) / 816)),
  );
  const [mobile, setMobile] = useState("edit");
  const [download, setDownload] = useState(params.has("download"));
  const [history, setHistory] = useState(false);
  const [versions, setVersions] = useState<
    {
      version_number: number;
      created_at: string;
      change_summary: string;
      saved_document_data: CVDocument;
    }[]
  >([]);
  const [sync, setSync] = useState<ProfileData>();
  const [syncPaths, setSyncPaths] = useState<string[]>([]);
  const [replace, setReplace] = useState(false);
  const [undo, setUndo] = useState<CVDocument[]>([]);
  const [redo, setRedo] = useState<CVDocument[]>([]);
  const [designs, setDesigns] = useState<
    { id: string; name: string; configuration: Design }[]
  >([]);
  const toast = useToast();
  const saving = useRef(false);
  const dirty = !!doc && JSON.stringify(doc) !== JSON.stringify(saved);
  useUnsaved(dirty);
  useEffect(() => {
    if (!documentId) return;
    loadDocument(documentId)
      .then((d) => {
        setDoc(d);
        setSaved(d);
      })
      .catch((e) => setError(errorMessage(e)));
    db()
      .from("saved_designs")
      .select("*")
      .then(({ data }) => {
        if (data) setDesigns(data);
      });
  }, [documentId]);
  useEffect(() => {
    if (params.has("history") && doc) void openHistory();
  }, [!!doc]);
  function update(next: CVDocument, remember = true) {
    if (doc && remember) setUndo((prev) => [...prev.slice(-19), doc]);
    setRedo([]);
    setDoc(next);
  }
  function design(key: keyof Design, value: Design[keyof Design]) {
    if (doc)
      update({
        ...doc,
        design_settings: { ...doc.design_settings, [key]: value },
      });
  }
  async function save() {
    if (!doc || saving.current) return false;
    saving.current = true;
    setBusy(true);
    setError("");
    try {
      const next = await saveDocument(
        doc,
        saved ? changedSections(saved, doc) : "Saved document",
      );
      setDoc(next);
      setSaved(next);
      toast("Your latest changes are saved.");
      return true;
    } catch (e) {
      setError(errorMessage(e));
      return false;
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }
  async function openHistory() {
    if (!documentId) return;
    try {
      const { data, error } = await db()
        .from("document_versions")
        .select("*")
        .eq("document_id", documentId)
        .order("version_number", { ascending: false });
      if (error) throw error;
      setVersions(data || []);
      setHistory(true);
    } catch (e) {
      toast(errorMessage(e), true);
    }
  }
  async function openSync() {
    try {
      const p = await loadProfile();
      setSync(p.data);
      setSyncPaths([]);
    } catch (e) {
      toast(errorMessage(e), true);
    }
  }
  const data = useMemo(() => (doc ? effectiveProfile(doc) : undefined), [doc]);
  if (!doc || !data) return error ? <ErrorBox message={error} /> : <Spinner />;
  const allSections = [
    { id: "personal", label: "Personal information" },
    { id: "summary", label: "Professional summary" },
    ...sections,
  ];
  const syncOptions = sync
    ? [
        ...personalFields,
        ...summaryFields,
        { key: "photo_path", label: "Profile photo" },
      ]
        .map((f) => ({
          path: `personal/${f.key}`,
          label: f.label,
          value: sync.personal[f.key] || "(empty)",
        }))
        .concat(
          sections.flatMap((s) =>
            (sync.sections[s.id] || [])
              .filter((r) =>
                doc.profile_snapshot.sections[s.id]?.some((d) => d.id === r.id),
              )
              .flatMap((r) =>
                s.fields.map((f) => ({
                  path: `${s.id}/${r.id}/${f.key}`,
                  label: `${s.label} · ${r.title || r.name || r.institution || "Entry"} · ${f.label}`,
                  value: r[f.key] || "(empty)",
                })),
              ),
          ),
        )
    : [];
  return (
    <div className="editor-page">
      <div className="editor-heading">
        <div>
          <Link to="/documents" className="back-link">
            <ArrowLeft size={14} />
            My documents
          </Link>
          <input
            className="document-title-input"
            value={doc.title}
            maxLength={200}
            aria-label="Document title"
            onChange={(e) => update({ ...doc, title: e.target.value })}
          />
          <span className="save-status">
            <CheckCheck size={14} />
            {dirty
              ? "Unsaved changes"
              : `Saved · ${new Date(doc.updated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
          </span>
        </div>
        <div className="row">
          <button
            className="icon-button"
            title="Version history"
            aria-label="Version history"
            onClick={openHistory}
          >
            <History size={19} />
          </button>
          <button
            className="button secondary small"
            onClick={save}
            disabled={busy || !dirty || !doc.title.trim()}
          >
            <Save size={15} />
            {busy ? "Saving…" : "Save"}
          </button>
          <button
            className="button primary small"
            onClick={() => setDownload(true)}
          >
            <Download size={16} />
            Download
          </button>
        </div>
      </div>
      {error && <ErrorBox message={error} />}
      <div className="editor-mobile-tabs">
        <button
          className={mobile === "edit" ? "active" : ""}
          onClick={() => setMobile("edit")}
        >
          <PenLine size={15} />
          Edit
        </button>
        <button
          className={mobile === "preview" ? "active" : ""}
          onClick={() => setMobile("preview")}
        >
          <Eye size={15} />
          Preview
        </button>
      </div>
      <div className={`editor-layout mobile-${mobile}`}>
        <section className="editor-controls">
          <div className="editor-tabs">
            {[
              { id: "content", icon: PenLine, label: "Content" },
              { id: "design", icon: Palette, label: "Design" },
              { id: "settings", icon: Settings2, label: "Settings" },
            ].map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                className={tab === id ? "active" : ""}
                onClick={() => setTab(id)}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>
          <div className="editor-control-scroll">
            <fieldset disabled={busy}>
              {tab === "content" && (
                <>
                  <div className="row between editor-section-title">
                    <h3>Your content</h3>
                    <div className="row">
                      <button
                        aria-label="Undo"
                        className="icon-button"
                        disabled={!undo.length}
                        onClick={() => {
                          setRedo([...redo, doc]);
                          setDoc(undo[undo.length - 1]);
                          setUndo(undo.slice(0, -1));
                        }}
                      >
                        <Undo2 size={17} />
                      </button>
                      <button
                        aria-label="Redo"
                        className="icon-button"
                        disabled={!redo.length}
                        onClick={() => {
                          setUndo([...undo, doc]);
                          setDoc(redo[redo.length - 1]);
                          setRedo(redo.slice(0, -1));
                        }}
                      >
                        <Redo2 size={17} />
                      </button>
                    </div>
                  </div>
                  <p className="field-hint">
                    Changes here are specific to this document.
                  </p>
                  <label>
                    Editing section
                    <select
                      value={section}
                      onChange={(e) => setSection(e.target.value)}
                    >
                      {allSections.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <ProfileForm
                    data={data}
                    section={section}
                    onField={(path, value) =>
                      update({
                        ...doc,
                        document_overrides: setOverride(
                          doc.document_overrides,
                          path,
                          value,
                        ),
                      })
                    }
                    onChange={(next) => {
                      const clean = { ...doc.document_overrides };
                      for (const key of Object.keys(clean))
                        if (key.startsWith(section + "/")) delete clean[key];
                      const snapshot = structuredClone(doc.profile_snapshot);
                      snapshot.sections[section] = next.sections[section];
                      update({
                        ...doc,
                        profile_snapshot: snapshot,
                        document_overrides: clean,
                      });
                    }}
                  />
                  <button className="button secondary full" onClick={openSync}>
                    <RefreshCw size={15} />
                    Sync with master profile
                  </button>
                  <div className="editor-checklist">
                    <h4>A little polish goes a long way</h4>
                    {[
                      !data.personal.email && "Add a contact email.",
                      !data.personal.full_name && "Add your name.",
                      !(data.sections.education || []).every(
                        (r) => r.start && r.end,
                      ) && "Review missing education dates.",
                      !(data.sections.projects || []).every(
                        (r) => r.description,
                      ) && "Describe what your projects achieved.",
                      doc.included_sections.length > 10 &&
                        "Consider fewer sections for a focused resume.",
                    ]
                      .filter(Boolean)
                      .map((text, i) => (
                        <p key={i}>• {text}</p>
                      ))}
                    <p>
                      Check spelling, dates and measurable outcomes before
                      sharing.
                    </p>
                  </div>
                </>
              )}
              {tab === "design" && (
                <>
                  <h3>Make it your own</h3>
                  <label>
                    Template
                    <select
                      value={doc.template_id}
                      onChange={(e) =>
                        update({ ...doc, template_id: e.target.value })
                      }
                    >
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} · {t.type}
                        </option>
                      ))}
                    </select>
                  </label>
                  <p className="field-hint">
                    Changing templates preserves your content and custom
                    settings.
                  </p>
                  <div className="form-grid">
                    <label>
                      Font family
                      <select
                        value={doc.design_settings.font}
                        onChange={(e) => design("font", e.target.value)}
                      >
                        {[
                          "Arial",
                          "Georgia",
                          "Verdana",
                          "Times New Roman",
                          "Trebuchet MS",
                          "Courier New",
                        ].map((f) => (
                          <option key={f}>{f}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Text alignment
                      <select
                        value={doc.design_settings.alignment}
                        onChange={(e) => design("alignment", e.target.value)}
                      >
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="justify">Justified</option>
                      </select>
                    </label>
                  </div>
                  {[
                    {
                      key: "fontSize",
                      label: "Font size",
                      min: 9,
                      max: 15,
                      step: 0.5,
                    },
                    {
                      key: "headingSize",
                      label: "Heading size",
                      min: 10,
                      max: 20,
                      step: 1,
                    },
                    {
                      key: "lineHeight",
                      label: "Line height",
                      min: 1.2,
                      max: 2,
                      step: 0.1,
                    },
                    {
                      key: "margin",
                      label: "Page margins",
                      min: 28,
                      max: 70,
                      step: 2,
                    },
                    {
                      key: "spacing",
                      label: "Section spacing",
                      min: 10,
                      max: 30,
                      step: 1,
                    },
                  ].map((f) => (
                    <label className="range-label" key={f.key}>
                      <span>
                        {f.label}
                        <strong>
                          {String(doc.design_settings[f.key as keyof Design])}
                        </strong>
                      </span>
                      <input
                        type="range"
                        min={f.min}
                        max={f.max}
                        step={f.step}
                        value={Number(
                          doc.design_settings[f.key as keyof Design],
                        )}
                        onChange={(e) =>
                          design(f.key as keyof Design, +e.target.value)
                        }
                      />
                    </label>
                  ))}
                  <div className="form-grid">
                    {[
                      {
                        key: "fontWeight",
                        label: "Text weight",
                        fallback: 400,
                      },
                      {
                        key: "headingWeight",
                        label: "Heading weight",
                        fallback: 600,
                      },
                    ].map((f) => (
                      <label key={f.key}>
                        {f.label}
                        <select
                          value={
                            Number(
                              doc.design_settings[f.key as keyof Design],
                            ) || f.fallback
                          }
                          onChange={(e) =>
                            design(f.key as keyof Design, +e.target.value)
                          }
                        >
                          {[400, 500, 600, 700].map((w) => (
                            <option key={w} value={w}>
                              {w === 400
                                ? "Regular"
                                : w === 500
                                  ? "Medium"
                                  : w === 600
                                    ? "Semibold"
                                    : "Bold"}
                            </option>
                          ))}
                        </select>
                      </label>
                    ))}
                  </div>
                  <div
                    className="palette-presets"
                    aria-label="Accessible color palettes"
                  >
                    {[
                      { name: "Slate", color: "#304860", accent: "#e4ebf5" },
                      { name: "Forest", color: "#294c41", accent: "#deebe5" },
                      { name: "Plum", color: "#574360", accent: "#eee6f1" },
                      { name: "Charcoal", color: "#343638", accent: "#e6e7e8" },
                    ].map((p) => (
                      <button
                        key={p.name}
                        aria-label={`Use ${p.name} palette`}
                        onClick={() =>
                          update({
                            ...doc,
                            design_settings: {
                              ...doc.design_settings,
                              color: p.color,
                              accent: p.accent,
                              textColor: "#303936",
                              background: "#ffffff",
                              dividerColor: "#dce1e7",
                            },
                          })
                        }
                      >
                        <span style={{ background: p.color }} />
                        {p.name}
                      </button>
                    ))}
                  </div>
                  <div className="color-fields">
                    {[
                      { key: "color", label: "Headings" },
                      { key: "accent", label: "Accent" },
                      { key: "textColor", label: "Text" },
                      { key: "background", label: "Background" },
                      { key: "dividerColor", label: "Dividers" },
                    ].map((f) => (
                      <label key={f.key}>
                        {f.label}
                        <input
                          type="color"
                          value={String(
                            doc.design_settings[f.key as keyof Design] ||
                              "#dee1da",
                          )}
                          onChange={(e) =>
                            design(f.key as keyof Design, e.target.value)
                          }
                        />
                      </label>
                    ))}
                  </div>
                  <label>
                    Layout
                    <select
                      value={doc.design_settings.layout}
                      onChange={(e) => design("layout", e.target.value)}
                    >
                      <option value="one-column">Single column</option>
                      <option value="two-column">Two columns</option>
                    </select>
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={doc.design_settings.dividers}
                      onChange={(e) => design("dividers", e.target.checked)}
                    />
                    Show section dividers
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={doc.design_settings.photo}
                      onChange={(e) => design("photo", e.target.checked)}
                    />
                    Include profile photograph
                  </label>
                  {doc.design_settings.photo && (
                    <label>
                      Photo shape
                      <select
                        value={doc.design_settings.photoShape}
                        onChange={(e) => design("photoShape", e.target.value)}
                      >
                        <option value="circle">Circle</option>
                        <option value="square">Square</option>
                        <option value="rounded">Rounded</option>
                        <option value="rectangle">Rectangle</option>
                      </select>
                    </label>
                  )}
                  {doc.design_settings.photo && (
                    <label>
                      Photo placement
                      <select
                        value={doc.design_settings.photoPlacement || "right"}
                        onChange={(e) =>
                          design("photoPlacement", e.target.value)
                        }
                      >
                        <option value="right">Right</option>
                        <option value="left">Left</option>
                      </select>
                    </label>
                  )}
                  <button
                    className="button secondary full"
                    onClick={() =>
                      update({
                        ...doc,
                        design_settings: designFor(doc.template_id),
                      })
                    }
                  >
                    Reset to template defaults
                  </button>
                  <button
                    className="button secondary full"
                    onClick={async () => {
                      const name = prompt("Name this reusable design");
                      if (!name?.trim()) return;
                      try {
                        const { data: next, error } = await db()
                          .from("saved_designs")
                          .insert({
                            user_id: doc.user_id,
                            name: name.trim().slice(0, 100),
                            configuration: doc.design_settings,
                          })
                          .select()
                          .single();
                        if (error) throw error;
                        setDesigns([...designs, next]);
                        toast("Design saved to your cloud.");
                      } catch (e) {
                        toast(errorMessage(e), true);
                      }
                    }}
                  >
                    Save as reusable design
                  </button>
                  {designs.length > 0 && (
                    <label>
                      Apply a saved design
                      <select
                        defaultValue=""
                        onChange={(e) => {
                          const d = designs.find(
                            (d) => d.id === e.target.value,
                          );
                          if (d)
                            update({
                              ...doc,
                              design_settings: d.configuration,
                            });
                          e.target.value = "";
                        }}
                      >
                        <option value="">Choose your design…</option>
                        {designs.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                </>
              )}
              {tab === "settings" && (
                <>
                  <h3>Document settings</h3>
                  <label>
                    Purpose
                    <input
                      value={doc.purpose}
                      onChange={(e) =>
                        update({ ...doc, purpose: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Target role
                    <input
                      value={doc.target_role}
                      onChange={(e) =>
                        update({ ...doc, target_role: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Organization
                    <input
                      value={doc.target_organization}
                      onChange={(e) =>
                        update({ ...doc, target_organization: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Job requirements
                    <textarea
                      rows={5}
                      value={doc.job_description}
                      onChange={(e) =>
                        update({ ...doc, job_description: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Paper size
                    <select
                      value={doc.design_settings.paper}
                      onChange={(e) => design("paper", e.target.value)}
                    >
                      <option value="a4">A4</option>
                      <option value="letter">US Letter</option>
                    </select>
                  </label>
                  <h4>Section order & visibility</h4>
                  <p className="field-hint">
                    Your name and contact header are always included.
                  </p>
                  <div className="section-order">
                    {[
                      ...doc.included_sections,
                      ...["summary", ...sections.map((s) => s.id)].filter(
                        (s) => !doc.included_sections.includes(s),
                      ),
                    ].map((s) => (
                      <div key={s}>
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={doc.included_sections.includes(s)}
                            onChange={(e) =>
                              update({
                                ...doc,
                                included_sections: e.target.checked
                                  ? [...doc.included_sections, s]
                                  : doc.included_sections.filter(
                                      (x) => x !== s,
                                    ),
                              })
                            }
                          />
                          {allSections.find((x) => x.id === s)?.label}
                        </label>
                        {doc.included_sections.includes(s) && (
                          <div>
                            <button
                              className="icon-button"
                              aria-label={`Move ${s} up`}
                              disabled={doc.included_sections.indexOf(s) === 0}
                              onClick={() =>
                                update({
                                  ...doc,
                                  included_sections: moveItem(
                                    doc.included_sections,
                                    doc.included_sections.indexOf(s),
                                    -1,
                                  ),
                                })
                              }
                            >
                              <ArrowUp size={14} />
                            </button>
                            <button
                              className="icon-button"
                              aria-label={`Move ${s} down`}
                              disabled={
                                doc.included_sections.indexOf(s) ===
                                doc.included_sections.length - 1
                              }
                              onClick={() =>
                                update({
                                  ...doc,
                                  included_sections: moveItem(
                                    doc.included_sections,
                                    doc.included_sections.indexOf(s),
                                    1,
                                  ),
                                })
                              }
                            >
                              <ArrowDown size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </fieldset>
          </div>
        </section>
        <section className="editor-preview">
          <div className="preview-toolbar">
            <span>
              <span className="status-dot" /> LIVE PREVIEW
            </span>
            <div>
              <button
                aria-label="Zoom out"
                onClick={() => setZoom(Math.max(0.3, zoom - 0.1))}
              >
                <Minus size={15} />
              </button>
              <span>{Math.round(zoom * 100)}%</span>
              <button
                aria-label="Zoom in"
                onClick={() => setZoom(Math.min(1.2, zoom + 0.1))}
              >
                <Plus size={15} />
              </button>
            </div>
          </div>
          <div className="preview-scroll">
            <div className="preview-zoom" style={{ zoom }}>
              <Resume
                data={data}
                templateId={doc.template_id}
                design={doc.design_settings}
                included={doc.included_sections}
              />
            </div>
          </div>
          <p className="preview-foot">
            {doc.design_settings.paper.toUpperCase()} · Content continues
            automatically onto additional pages
          </p>
        </section>
      </div>
      {download && (
        <ExportDialog
          onClose={() => setDownload(false)}
          onSave={save}
          title={doc.title}
          paper={doc.design_settings.paper}
          dirty={dirty}
          onPaperChange={(paper) => design("paper", paper)}
        />
      )}
      {history && (
        <Modal title="Your document’s story" onClose={() => setHistory(false)}>
          <p className="muted">
            The previous 25 saved versions are kept. Restoring keeps the current
            version until you save.
          </p>
          {!versions.length ? (
            <p className="notice">
              No earlier versions yet. Save a change to start your history.
            </p>
          ) : (
            <div className="versions-list">
              {versions.map((v) => (
                <div key={v.version_number}>
                  <div>
                    <strong>Version {v.version_number}</strong>
                    <p>{new Date(v.created_at).toLocaleString()}</p>
                    <small>Before: {v.change_summary}</small>
                  </div>
                  <button
                    className="button secondary small"
                    onClick={() => {
                      if (
                        !confirm(
                          "Restore this version into the editor? Save to confirm the restoration.",
                        )
                      )
                        return;
                      update({
                        ...v.saved_document_data,
                        id: doc.id,
                        user_id: doc.user_id,
                        revision: doc.revision,
                        updated_at: doc.updated_at,
                      });
                      setHistory(false);
                      toast(
                        "Version restored into the preview. Save to keep it.",
                      );
                    }}
                  >
                    Restore
                  </button>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
      {sync && (
        <Modal
          title="Sync only what you choose"
          onClose={() => setSync(undefined)}
          wide
        >
          <p className="muted">
            Select individual fields from your master profile. Design settings
            and unrelated content are preserved. New records can be added in the
            editor or included in a new document.
          </p>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={replace}
              onChange={(e) => setReplace(e.target.checked)}
            />
            <strong>
              Replace document-specific overrides for selected fields
            </strong>
          </label>
          <p className="field-hint">
            Unchecked: your custom wording wins. Checked: explicitly replace it
            with the master value.
          </p>
          <div className="sync-fields">
            {syncOptions.map((f) => (
              <label className="checkbox-label" key={f.path}>
                <input
                  type="checkbox"
                  checked={syncPaths.includes(f.path)}
                  onChange={(e) =>
                    setSyncPaths(
                      e.target.checked
                        ? [...syncPaths, f.path]
                        : syncPaths.filter((x) => x !== f.path),
                    )
                  }
                />
                <span>
                  <strong>{f.label}</strong>
                  <small>
                    {f.path.endsWith("photo_path")
                      ? "Private profile photograph"
                      : f.value.slice(0, 150)}
                  </small>
                  {f.path in doc.document_overrides && (
                    <span className="badge">Customized in this document</span>
                  )}
                </span>
              </label>
            ))}
          </div>
          <button
            className="button primary full"
            disabled={!syncPaths.length}
            onClick={() => {
              update(syncFields(doc, sync, syncPaths, replace));
              setSync(undefined);
              toast("Selected fields applied. Review and save your document.");
            }}
          >
            Apply {syncPaths.length} selected fields
          </button>
        </Modal>
      )}
    </div>
  );
}
