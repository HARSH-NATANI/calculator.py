import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Save,
  CheckCheck,
  UserRound,
  FileText,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { PageHeading, Spinner, ErrorBox, useToast } from "../components/UI";
import { ProfileForm, useUnsaved } from "../components/ProfileForm";
import { sections, profileCompletion, type ProfileData } from "../lib/model";
import { loadProfile, saveProfile, errorMessage } from "../lib/api";
export default function Profile() {
  const { section: routeSection } = useParams();
  const [section, setSection] = useState(routeSection || "personal");
  const [data, setData] = useState<ProfileData>();
  const [saved, setSaved] = useState("");
  const [revision, setRevision] = useState(1);
  const [savedTime, setSavedTime] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showSync, setShowSync] = useState(false);
  const toast = useToast();
  useEffect(() => {
    setSection(routeSection || "personal");
  }, [routeSection]);
  useEffect(() => {
    loadProfile()
      .then((p) => {
        setData(p.data);
        setSaved(JSON.stringify(p.data));
        setRevision(p.revision);
        setSavedTime(p.updated_at);
      })
      .catch((e) => setError(errorMessage(e)));
  }, []);
  const dirty = !!data && JSON.stringify(data) !== saved;
  useUnsaved(dirty);
  async function save() {
    if (!data) return;
    setBusy(true);
    setError("");
    try {
      const result = await saveProfile(data, revision);
      setRevision(result.revision);
      setSaved(JSON.stringify(data));
      setSavedTime(result.updated_at);
      setShowSync(true);
      toast("Your master profile is saved.");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  if (!data) return error ? <ErrorBox message={error} /> : <Spinner />;
  const all = [
    { id: "personal", label: "Personal information" },
    { id: "summary", label: "Professional summary" },
    ...sections,
  ];
  return (
    <>
      <PageHeading
        eyebrow="THE FOUNDATION OF YOUR NEXT CHAPTER"
        title="Your story, all in one place."
        description="Add it once. Make it work for every opportunity."
      >
        <button
          className="button primary"
          disabled={busy || !dirty}
          onClick={save}
        >
          <Save size={17} />
          {busy ? "Saving…" : "Save profile"}
        </button>
      </PageHeading>
      <div className="profile-status">
        <div>
          <span className="completion-circle">{profileCompletion(data)}%</span>
          <div>
            <strong>Your profile is taking shape</strong>
            <span>
              {dirty
                ? "You have unsaved changes"
                : savedTime
                  ? "Last saved " + new Date(savedTime).toLocaleString()
                  : "Add your details to get started"}
            </span>
          </div>
        </div>
        <span className="save-status">
          <CheckCheck size={16} />
          {dirty ? "Unsaved changes" : "Cloud profile"}
        </span>
      </div>
      {error && <ErrorBox message={error} />}{" "}
      {showSync && (
        <div className="sync-notice">
          <div>
            <strong>Bring your documents up to date?</strong>
            <p>
              Open a saved document and choose “Sync with master” to apply
              selected fields. Your customizations stay in your control.
            </p>
          </div>
          <Link className="button secondary small" to="/documents">
            My documents <ArrowRight size={14} />
          </Link>
          <button
            className="icon-button"
            onClick={() => setShowSync(false)}
            aria-label="Dismiss sync notice"
          >
            ×
          </button>
        </div>
      )}
      <div className="profile-layout">
        <nav className="profile-sections" aria-label="Profile sections">
          {all.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={s.id === section ? "active" : ""}
            >
              {i < 2 ? <UserRound size={16} /> : <FileText size={16} />}
              <span>{s.label}</span>
              {i > 1 && data.sections[s.id]?.length > 0 && (
                <small>{data.sections[s.id].length}</small>
              )}
              <ChevronRight size={13} />
            </button>
          ))}
        </nav>
        <section className="panel profile-panel">
          <div className="panel-heading">
            <h2>{all.find((s) => s.id === section)?.label}</h2>
            <p>
              Your details are private. Include only what you want to share in
              your documents.
            </p>
          </div>
          <fieldset disabled={busy}>
            <ProfileForm data={data} section={section} onChange={setData} />
          </fieldset>
          <div className="form-footer">
            <span>
              {dirty ? "Remember to save your changes." : "You’re up to date."}
            </span>
            <button
              className="button primary small"
              disabled={busy || !dirty}
              onClick={save}
            >
              <Save size={15} />
              {busy ? "Saving…" : "Save changes"}
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
