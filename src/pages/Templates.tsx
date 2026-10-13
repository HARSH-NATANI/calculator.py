import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search,
  ArrowUpRight,
  Image,
  Eye,
  SlidersHorizontal,
} from "lucide-react";
import { Header, Footer, Modal, PageHeading } from "../components/UI";
import { templates, sampleProfile } from "../lib/templates";
import { Resume, TemplateThumb } from "../components/Resume";
import { useAuth } from "../lib/auth";
export default function Templates({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [type, setType] = useState("All templates");
  const [category, setCategory] = useState("All styles");
  const [query, setQuery] = useState("");
  const [photo, setPhoto] = useState("All layouts");
  const preview = templates.find((t) => t.id === params.get("preview"));
  const shown = templates.filter(
    (t) =>
      (type === "All templates" || t.type === type) &&
      (category === "All styles" || t.category === category) &&
      (photo === "All layouts" || t.photo === (photo === "With photo")) &&
      (t.name + " " + t.description + " " + t.category)
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const useLink = (id: string) =>
    user
      ? `/documents/new?template=${id}`
      : `/register?next=${encodeURIComponent("/documents/new?template=" + id)}`;
  return (
    <>
      {!embedded && <Header />}
      <main className={embedded ? "" : "container gallery-page"}>
        <PageHeading
          eyebrow="A STRONG FIRST IMPRESSION STARTS HERE"
          title="Find your perfect fit."
          description="Thoughtfully designed. Easily personalized. Ready for your next chapter."
        />
        <div className="gallery-tabs">
          {["All templates", "Resume", "CV", "Portfolio"].map((t) => (
            <button
              className={t === type ? "active" : ""}
              key={t}
              onClick={() => setType(t)}
            >
              {t}
              {t === "All templates" && <span>{templates.length}</span>}
            </button>
          ))}
        </div>
        <div className="gallery-filters">
          <label className="search-field">
            <Search size={18} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find a template…"
              aria-label="Search templates"
            />
          </label>
          <div>
            <SlidersHorizontal size={17} />
            <select
              aria-label="Filter by style"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {["All styles", ...new Set(templates.map((t) => t.category))].map(
                (c) => (
                  <option key={c}>{c}</option>
                ),
              )}
            </select>
            <select
              aria-label="Filter by photo"
              value={photo}
              onChange={(e) => setPhoto(e.target.value)}
            >
              {["All layouts", "With photo", "No photo"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="gallery-grid">
          {shown.map((t) => (
            <article className="gallery-card" key={t.id}>
              <button
                className={`gallery-preview home-template-${t.id}`}
                onClick={() => setParams({ preview: t.id })}
                aria-label={`Preview ${t.name}`}
              >
                <TemplateThumb id={t.id} />
                {t.tag && <span className="template-tag">{t.tag}</span>}
                <span className="template-hover">
                  <Eye size={16} /> Preview template
                </span>
              </button>
              <div className="gallery-card-info">
                <div>
                  <h3>{t.name}</h3>
                  <span className="badge">{t.type}</span>
                </div>
                <p>{t.description}</p>
                <div className="gallery-card-bottom">
                  <span>
                    {t.photo ? (
                      <>
                        <Image size={13} /> Photo friendly
                      </>
                    ) : (
                      t.category
                    )}
                  </span>
                  <Link to={useLink(t.id)}>
                    Use template <ArrowUpRight size={15} />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
        {!shown.length && (
          <div className="empty-state">
            <h3>No matching templates</h3>
            <p>Try another style or clear your search.</p>
          </div>
        )}
        <p className="sample-note">
          All previews use illustrative sample information. Your documents use
          only the information you provide.
        </p>
      </main>
      {!embedded && <Footer />}
      {preview && (
        <Modal
          title={preview.name + " · Sample preview"}
          onClose={() => setParams({})}
          wide
        >
          <div className="template-modal-preview">
            <Resume data={sampleProfile} templateId={preview.id} compact />
          </div>
          <div className="modal-actions">
            <p>{preview.description}</p>
            <Link className="button primary" to={useLink(preview.id)}>
              Use this template <ArrowUpRight size={17} />
            </Link>
          </div>
        </Modal>
      )}
    </>
  );
}
