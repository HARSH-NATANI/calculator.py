import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  FileText,
  Copy,
  Trash2,
  Archive,
  ArrowUpRight,
  PenLine,
  History,
  Download,
} from "lucide-react";
import {
  PageHeading,
  Spinner,
  ErrorBox,
  EmptyState,
  Modal,
  useToast,
} from "../components/UI";
import { Resume } from "../components/Resume";
import {
  listDocuments,
  createDocument,
  saveDocument,
  errorMessage,
} from "../lib/api";
import { db } from "../lib/supabase";
import { effectiveProfile, type CVDocument } from "../lib/model";
import { templates } from "../lib/templates";
export default function Documents() {
  const [docs, setDocs] = useState<CVDocument[]>();
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All documents");
  const [sort, setSort] = useState("Recently edited");
  const [rename, setRename] = useState<CVDocument | null>(null);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();
  const refresh = () =>
    listDocuments()
      .then(setDocs)
      .catch((e) => setError(errorMessage(e)));
  useEffect(() => {
    void refresh();
  }, []);
  async function action(doc: CVDocument, kind: string) {
    setBusy(true);
    try {
      if (kind === "delete") {
        if (
          !confirm(
            `Permanently delete “${doc.title}” and its version history? Your master profile will be kept.`,
          )
        )
          return;
        const { error } = await db()
          .from("documents")
          .delete()
          .eq("id", doc.id);
        if (error) throw error;
        toast("Document deleted.");
      }
      if (kind === "duplicate") {
        const copy = await createDocument({
          ...doc,
          title: doc.title.slice(0, 193) + " — Copy",
          archived: false,
        });
        navigate("/editor/" + copy.id);
        return;
      }
      if (kind === "archive")
        await saveDocument(
          { ...doc, archived: !doc.archived },
          doc.archived ? "Unarchived" : "Archived",
        );
      if (kind === "rename") {
        await saveDocument({ ...doc, title: title.trim() }, "Renamed document");
        setRename(null);
      }
      await refresh();
    } catch (e) {
      toast(errorMessage(e), true);
    } finally {
      setBusy(false);
    }
  }
  if (!docs) return error ? <ErrorBox message={error} /> : <Spinner />;
  const shown = docs
    .filter(
      (d) =>
        (filter === "Archived" ? d.archived : !d.archived) &&
        (filter === "All documents" ||
          filter === "Archived" ||
          d.document_type === filter) &&
        (d.title + " " + d.purpose + " " + d.target_role)
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "Name A–Z"
        ? a.title.localeCompare(b.title)
        : sort === "Oldest first"
          ? a.created_at.localeCompare(b.created_at)
          : b.updated_at.localeCompare(a.updated_at),
    );
  return (
    <>
      <PageHeading
        eyebrow="YOUR CAREER TOOLKIT"
        title="Made by you. Ready for what’s next."
        description="All your resumes, CVs and portfolios, in one place."
      >
        <Link className="button primary" to="/documents/new">
          <Plus size={17} />
          New document
        </Link>
      </PageHeading>
      <div className="gallery-tabs">
        {["All documents", "Resume", "CV", "Portfolio", "Archived"].map((f) => (
          <button
            key={f}
            className={filter === f ? "active" : ""}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="gallery-filters">
        <label className="search-field">
          <Search size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Find a document…"
            aria-label="Search documents"
          />
        </label>
        <select
          aria-label="Sort documents"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          {["Recently edited", "Name A–Z", "Oldest first"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      {shown.length ? (
        <div className="document-grid">
          {shown.map((d) => (
            <article className="document-card" key={d.id}>
              <Link className="document-thumb" to={"/editor/" + d.id}>
                <Resume
                  data={effectiveProfile(d)}
                  templateId={d.template_id}
                  design={d.design_settings}
                  included={d.included_sections}
                  compact
                />
              </Link>
              <div className="document-card-info">
                <div className="row between">
                  <h3>{d.title}</h3>
                  <span className="badge">{d.document_type}</span>
                </div>
                <p>
                  {d.purpose || "General purpose"} ·{" "}
                  {templates.find((t) => t.id === d.template_id)?.name}
                </p>
                <span>Saved {new Date(d.updated_at).toLocaleDateString()}</span>
                <div className="document-actions">
                  <Link className="button primary small" to={"/editor/" + d.id}>
                    Edit <ArrowUpRight size={14} />
                  </Link>
                  <button
                    title="Rename"
                    aria-label={`Rename ${d.title}`}
                    className="icon-button"
                    disabled={busy}
                    onClick={() => {
                      setRename(d);
                      setTitle(d.title);
                    }}
                  >
                    <PenLine size={16} />
                  </button>
                  <button
                    title="Duplicate"
                    aria-label={`Duplicate ${d.title}`}
                    className="icon-button"
                    disabled={busy}
                    onClick={() => action(d, "duplicate")}
                  >
                    <Copy size={16} />
                  </button>
                  <Link
                    title="Download"
                    aria-label={`Download ${d.title}`}
                    className="icon-button"
                    to={"/editor/" + d.id + "?download=1"}
                  >
                    <Download size={16} />
                  </Link>
                  <Link
                    title="Version history"
                    aria-label={`History of ${d.title}`}
                    className="icon-button"
                    to={"/editor/" + d.id + "?history=1"}
                  >
                    <History size={16} />
                  </Link>
                  <button
                    title={d.archived ? "Unarchive" : "Archive"}
                    aria-label={`${d.archived ? "Unarchive" : "Archive"} ${d.title}`}
                    className="icon-button"
                    disabled={busy}
                    onClick={() => action(d, "archive")}
                  >
                    <Archive size={16} />
                  </button>
                  <button
                    title="Delete"
                    aria-label={`Delete ${d.title}`}
                    className="icon-button danger"
                    disabled={busy}
                    onClick={() => action(d, "delete")}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          title={
            search
              ? "No matching documents"
              : "Your next chapter starts with a blank page."
          }
          text={
            search
              ? "Try another search or filter."
              : "Create a document from your profile and make it your own."
          }
          to="/documents/new"
          action="Create your first document"
        />
      )}
      {rename && (
        <Modal title="Give it a new name" onClose={() => setRename(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void action(rename, "rename");
            }}
          >
            <label>
              Document title
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                required
                autoFocus
              />
            </label>
            <button
              disabled={busy || !title.trim()}
              className="button primary full"
            >
              {busy ? "Saving…" : "Save name"}
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
