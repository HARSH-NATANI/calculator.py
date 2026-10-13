import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  ArrowRight,
  Plus,
  FileText,
  UserRound,
  LayoutTemplate,
  Globe,
  Clock,
  CheckCheck,
  Search,
} from "lucide-react";
import { useAuth } from "../lib/auth";
import { PageHeading, Spinner, ErrorBox } from "../components/UI";
import { loadProfile, listDocuments, errorMessage } from "../lib/api";
import {
  profileCompletion,
  effectiveProfile,
  type CVDocument,
  type ProfileData,
} from "../lib/model";
import { templates } from "../lib/templates";
import { Resume } from "../components/Resume";
export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData>();
  const [docs, setDocs] = useState<CVDocument[]>([]);
  const [error, setError] = useState("");
  const [last, setLast] = useState("");
  const [query, setQuery] = useState("");
  const [type, setType] = useState("All types");
  const filteredDocs = docs.filter(
    (d) =>
      (type === "All types" || d.document_type === type) &&
      (d.title + " " + d.purpose).toLowerCase().includes(query.toLowerCase()),
  );
  useEffect(() => {
    Promise.all([loadProfile(), listDocuments()])
      .then(([p, d]) => {
        setProfile(p.data);
        setLast(p.updated_at);
        setDocs(d.filter((d) => !d.archived));
      })
      .catch((e) => setError(errorMessage(e)));
  }, []);
  if (error) return <ErrorBox message={error} />;
  if (!profile) return <Spinner />;
  const name = (
    profile.personal.display_name ||
    profile.personal.full_name ||
    user?.user_metadata.full_name ||
    "there"
  ).split(" ")[0];
  return (
    <>
      <PageHeading
        eyebrow="A FRESH PAGE. A NEW POSSIBILITY."
        title={`Good to see you, ${name}.`}
        description="Your next chapter is yours to create."
      >
        <Link to="/documents/new" className="button primary">
          <Plus size={17} />
          Create a document
        </Link>
      </PageHeading>
      <div className="dashboard-banner">
        <div>
          <span className="eyebrow">ONE PROFILE. EVERY OPPORTUNITY.</span>
          <h2>
            You’ve got the experience.
            <br />
            Let’s make it stand out.
          </h2>
          <p>Keep your story up to date, and be ready for what’s next.</p>
          <Link className="button lime small" to="/profile">
            Continue your profile <ArrowRight size={16} />
          </Link>
        </div>
        <div
          className="progress-ring"
          style={{
            background: `conic-gradient(#d8eda7 ${profileCompletion(profile)}%,#49614e 0)`,
          }}
        >
          <div>
            <strong>
              {profileCompletion(profile)}
              <span>%</span>
            </strong>
            <small>PROFILE COMPLETE</small>
          </div>
        </div>
      </div>
      <div className="stat-grid">
        <div className="stat-card">
          <span>
            <FileText size={20} />
          </span>
          <div>
            <small>Saved documents</small>
            <strong>{docs.length}</strong>
          </div>
        </div>
        <div className="stat-card">
          <span>
            <LayoutTemplate size={20} />
          </span>
          <div>
            <small>Templates to explore</small>
            <strong>{templates.length}</strong>
          </div>
        </div>
        <div className="stat-card">
          <span>
            <Clock size={20} />
          </span>
          <div>
            <small>Profile last saved</small>
            <strong className="stat-date">
              {last
                ? new Date(last).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })
                : "Ready when you are"}
            </strong>
          </div>
        </div>
      </div>
      <div className="section-heading">
        <div>
          <h2>Make your next move</h2>
          <p>Different opportunities. The same remarkable you.</p>
        </div>
      </div>
      <div className="quick-grid">
        {[
          {
            type: "Resume",
            icon: FileText,
            text: "A focused introduction for your next role.",
          },
          {
            type: "CV",
            icon: UserRound,
            text: "Your academic and professional journey.",
          },
          {
            type: "Portfolio",
            icon: Globe,
            text: "Let your projects tell the story.",
          },
        ].map(({ type, icon: Icon, text }) => (
          <Link
            key={type}
            to={"/documents/new?type=" + type}
            className="quick-card"
          >
            <Icon size={23} />
            <div>
              <h3>Create a {type.toLowerCase()}</h3>
              <p>{text}</p>
            </div>
            <ArrowUpRight size={20} />
          </Link>
        ))}
      </div>
      <div className="section-heading">
        <div>
          <h2>Pick up where you left off</h2>
          <p>Your most recently edited documents.</p>
        </div>
        <Link to="/documents" className="text-link">
          View all documents <ArrowRight size={16} />
        </Link>
      </div>
      {docs.length > 0 && (
        <div className="gallery-filters">
          <label className="search-field">
            <Search size={17} />
            <input
              placeholder="Find a recent document…"
              aria-label="Search recent documents"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <select
            aria-label="Filter recent documents"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            {["All types", "Resume", "CV", "Portfolio"].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
      )}
      {docs.length ? (
        <div className="document-grid">
          {filteredDocs.slice(0, 3).map((d) => (
            <Link className="document-card" to={"/editor/" + d.id} key={d.id}>
              <div className="document-thumb">
                <Resume
                  data={effectiveProfile(d)}
                  design={d.design_settings}
                  templateId={d.template_id}
                  included={d.included_sections}
                  compact
                />
              </div>
              <div className="document-card-info">
                <h3>{d.title}</h3>
                <p>
                  {d.document_type} ·{" "}
                  {new Date(d.updated_at).toLocaleDateString()}
                </p>
                <span>
                  <CheckCheck size={13} />
                  Saved in your cloud
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="first-document">
          <div className="empty-icon">
            <FileText />
          </div>
          <div>
            <h3>Your story deserves a great introduction.</h3>
            <p>
              Create your first document using the details in your master
              profile.
            </p>
          </div>
          <Link className="button secondary" to="/documents/new">
            Let’s get started <ArrowUpRight size={17} />
          </Link>
        </div>
      )}
      {docs.length > 0 && filteredDocs.length === 0 && (
        <p className="notice">
          No matching recent documents. Try another search or filter.
        </p>
      )}
      {docs.length > 0 && (
        <div className="recent-template-list">
          <span className="eyebrow">YOUR RECENT TEMPLATES</span>
          <div className="row">
            {[...new Set(docs.map((d) => d.template_id))]
              .slice(0, 4)
              .map((id) => (
                <Link
                  className="button secondary small"
                  to={"/documents/new?template=" + id}
                  key={id}
                >
                  {templates.find((t) => t.id === id)?.name || id}
                  <ArrowUpRight size={14} />
                </Link>
              ))}
          </div>
        </div>
      )}
    </>
  );
}
