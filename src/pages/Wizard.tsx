import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  GraduationCap,
  Globe,
  Sparkles,
} from "lucide-react";
import { PageHeading, Spinner, ErrorBox, useToast } from "../components/UI";
import { ProfileForm, useUnsaved } from "../components/ProfileForm";
import { Resume, TemplateThumb } from "../components/Resume";
import { sections, purposes, type ProfileData } from "../lib/model";
import { templates, designFor, templateOrder } from "../lib/templates";
import { loadProfile, createDocument, errorMessage } from "../lib/api";
const steps = [
  "Document type",
  "Your purpose",
  "Template",
  "Your information",
  "Make it yours",
  "Review",
  "Save & export",
];
export default function Wizard() {
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const chosen = templates.find((t) => t.id === params.get("template"));
  const [step, setStep] = useState(0);
  const [type, setType] = useState(
    chosen?.type ||
      params.get("type") ||
      (location.pathname === "/portfolio" ? "Portfolio" : "Resume"),
  );
  const [purpose, setPurpose] = useState(
    type === "CV"
      ? "Academic or research application"
      : type === "Portfolio"
        ? "Personal branding"
        : purposes[0],
  );
  const [target, setTarget] = useState("");
  const [organization, setOrganization] = useState("");
  const [job, setJob] = useState("");
  const [template, setTemplate] = useState(
    chosen?.id || templates.find((t) => t.type === type)?.id || "modern",
  );
  const [data, setData] = useState<ProfileData>();
  const [included, setIncluded] = useState(
    templateOrder(
      chosen?.id ||
        (location.pathname === "/portfolio" ? "creative" : "modern"),
    ),
  );
  const [excluded, setExcluded] = useState<string[]>([]);
  const [section, setSection] = useState("personal");
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(false);
  const [length, setLength] = useState("Flexible");
  const [paper, setPaper] = useState<"a4" | "letter">("a4");
  useUnsaved(step > 0 && !created);
  useEffect(() => {
    loadProfile()
      .then((p) => {
        setData(p.data);
        if (p.preferences.paper === "letter") setPaper("letter");
        if (
          !chosen &&
          !params.get("type") &&
          location.pathname !== "/portfolio"
        ) {
          if (p.preferences.type) setType(p.preferences.type);
          if (p.preferences.template) setTemplate(p.preferences.template);
        }
      })
      .catch((e) => setError(errorMessage(e)));
  }, []);
  const filtered = data
    ? {
        ...data,
        sections: Object.fromEntries(
          Object.entries(data.sections).map(([k, records]) => [
            k,
            records.filter((r) => !excluded.includes(r.id)),
          ]),
        ),
      }
    : undefined;
  async function create() {
    if (!filtered) return;
    setBusy(true);
    setError("");
    try {
      const doc = await createDocument({
        title: (
          title.trim() || `${data?.personal.full_name || "My"} — ${type}`
        ).slice(0, 200),
        document_type: type,
        purpose,
        target_role: target,
        target_organization: organization,
        job_description: job,
        template_id: template,
        profile_snapshot: filtered,
        document_overrides: {},
        included_sections: included,
        design_settings: { ...designFor(template), paper },
        archived: false,
      });
      setCreated(true);
      toast("Your document is saved. You can keep editing or download it.");
      navigate("/editor/" + doc.id + "?download=1");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  if (!data) return error ? <ErrorBox message={error} /> : <Spinner />;
  return (
    <>
      <PageHeading
        eyebrow={
          type === "Portfolio"
            ? "LET YOUR WORK TELL YOUR STORY"
            : "A NEW DOCUMENT. A NEW POSSIBILITY."
        }
        title={
          type === "Portfolio"
            ? "Build a portfolio that feels like you."
            : "Let’s make your experience stand out."
        }
        description="Start with your profile. Make it personal to this opportunity."
      />
      <ol className="wizard-progress">
        {steps.map((s, i) => (
          <li
            className={i === step ? "active" : i < step ? "complete" : ""}
            key={s}
          >
            <span>{i < step ? <Check size={14} /> : i + 1}</span>
            <small>{s}</small>
          </li>
        ))}
      </ol>
      {error && <ErrorBox message={error} />}
      <section className="panel wizard-panel">
        <div className="panel-heading">
          <span className="eyebrow">STEP {step + 1} OF 7</span>
          <h2>{steps[step]}</h2>
        </div>
        {step === 0 && (
          <>
            <p className="muted">
              Different formats for different next steps. What are you creating?
            </p>
            <div className="type-grid">
              {[
                {
                  id: "Resume",
                  icon: FileText,
                  description:
                    "A concise, role-specific introduction to your skills and experience.",
                },
                {
                  id: "CV",
                  icon: GraduationCap,
                  description:
                    "A detailed view of your academic, research and professional history.",
                },
                {
                  id: "Portfolio",
                  icon: Globe,
                  description:
                    "A project-led showcase of your work, ideas and achievements.",
                },
              ].map(({ id, icon: Icon, description }) => (
                <button
                  key={id}
                  className={`type-card ${type === id ? "selected" : ""}`}
                  onClick={() => {
                    setType(id);
                    const first = templates.find((t) => t.type === id);
                    if (first) setTemplate(first.id);
                  }}
                >
                  <Icon size={30} />
                  <h3>{id}</h3>
                  <p>{description}</p>
                  {type === id && (
                    <span className="selection-check">
                      <Check size={14} />
                    </span>
                  )}
                </button>
              ))}
            </div>
            {type === "Portfolio" && (
              <p className="notice">
                Your portfolio is a private, exportable document. You choose who
                receives a copy.
              </p>
            )}
          </>
        )}
        {step === 1 && (
          <>
            <div className="form-grid">
              <label>
                Primary purpose
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                >
                  {purposes.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </label>
              <label>
                Target role
                <input
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="e.g. Frontend Developer"
                />
              </label>
              <label>
                Company or organization
                <input
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="Who is this document for?"
                />
              </label>
              <label>
                Preferred length
                <select
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                >
                  <option>Flexible</option>
                  <option>Concise (aim for one page)</option>
                  <option>Detailed (multiple pages)</option>
                </select>
              </label>
              <label className="span-two">
                Job description or requirements (optional)
                <textarea
                  rows={5}
                  value={job}
                  onChange={(e) => setJob(e.target.value)}
                  placeholder="Paste the requirements to reference while tailoring your document."
                />
              </label>
            </div>
            <div className="notice">
              <Sparkles size={17} />
              {purpose.includes("Internship") || purpose.includes("Fresher")
                ? "Let your education, projects, skills and certifications lead the way."
                : purpose.includes("Academic")
                  ? "Highlight your education, publications, research and conferences."
                  : "Select the experience and achievements most relevant to this opportunity."}{" "}
              Length is a writing preference; all content is preserved.
              Interface language: English.
            </div>
          </>
        )}
        {step === 2 && (
          <div className="wizard-templates">
            {templates
              .filter((t) => t.type === type)
              .map((t) => (
                <button
                  key={t.id}
                  className={`wizard-template ${template === t.id ? "selected" : ""}`}
                  onClick={() => {
                    setTemplate(t.id);
                    setIncluded(
                      templateOrder(t.id).filter((id) => included.includes(id)),
                    );
                  }}
                >
                  <TemplateThumb id={t.id} />
                  <div>
                    <strong>{t.name}</strong>
                    {template === t.id && <Check size={16} />}
                  </div>
                  <p>{t.description}</p>
                </button>
              ))}
          </div>
        )}
        {step === 3 && (
          <>
            <p className="muted">
              Your master profile is already here. Choose the sections and
              records for this document.
            </p>
            {!data.personal.full_name && (
              <p className="notice">
                Your name is missing. You can add it in the next step.
              </p>
            )}
            <div className="information-select">
              {[
                { id: "summary", label: "Professional summary" },
                ...sections,
              ].map((s) => (
                <div key={s.id}>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={included.includes(s.id)}
                      onChange={(e) =>
                        setIncluded(
                          e.target.checked
                            ? [...included, s.id]
                            : included.filter((i) => i !== s.id),
                        )
                      }
                    />
                    <strong>{s.label}</strong>
                    <span className="muted">
                      {s.id === "summary"
                        ? data.personal.summary
                          ? "Ready to use"
                          : "Not yet added"
                        : `${data.sections[s.id]?.length || 0} entries`}
                    </span>
                  </label>
                  {included.includes(s.id) &&
                    data.sections[s.id]?.map((r) => (
                      <label
                        className="checkbox-label record-select"
                        key={r.id}
                      >
                        <input
                          type="checkbox"
                          checked={!excluded.includes(r.id)}
                          onChange={(e) =>
                            setExcluded(
                              e.target.checked
                                ? excluded.filter((i) => i !== r.id)
                                : [...excluded, r.id],
                            )
                          }
                        />
                        {r.title || r.name || r.institution || "Untitled entry"}
                      </label>
                    ))}
                </div>
              ))}
            </div>
          </>
        )}
        {step === 4 && (
          <>
            <div className="notice">
              These edits belong to this document. Your saved master profile
              stays as it is.
            </div>
            <label className="section-picker">
              Section
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
              >
                <option value="personal">Personal information</option>
                <option value="summary">Professional summary</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <ProfileForm data={data} section={section} onChange={setData} />
          </>
        )}
        {step === 5 && filtered && (
          <div className="wizard-review">
            <div>
              <h3>Your document at a glance</h3>
              <dl>
                <dt>Document</dt>
                <dd>{type}</dd>
                <dt>Purpose</dt>
                <dd>{purpose}</dd>
                <dt>Template</dt>
                <dd>{templates.find((t) => t.id === template)?.name}</dd>
                <dt>Target role</dt>
                <dd>{target || "Not specified"}</dd>
                <dt>Writing preference</dt>
                <dd>{length}</dd>
                <dt>Included sections</dt>
                <dd>
                  {
                    included.filter((i) =>
                      i === "summary"
                        ? filtered.personal.summary
                        : filtered.sections[i]?.length,
                    ).length
                  }
                </dd>
              </dl>
              {!filtered.personal.email && (
                <p className="notice">
                  Add a contact email so employers can reach you.
                </p>
              )}
              <p className="muted">
                Review your dates, details and spelling. CloudCV uses only the
                information you provide.
              </p>
            </div>
            <div className="review-document">
              <Resume
                data={filtered}
                templateId={template}
                included={included}
                compact
              />
            </div>
          </div>
        )}
        {step === 6 && (
          <>
            <div className="save-illustration">
              <Check size={28} />
            </div>
            <h3>A strong first impression, ready to go.</h3>
            <p className="muted">
              Save to your private cloud workspace. The editor will open with
              PDF, PNG and JPEG download options.
            </p>
            <label>
              Document title
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`${data.personal.full_name || "My"} — ${type}`}
                maxLength={200}
              />
            </label>
            <label>
              Paper size
              <select
                value={paper}
                onChange={(e) => setPaper(e.target.value as "a4" | "letter")}
              >
                <option value="a4">A4</option>
                <option value="letter">US Letter</option>
              </select>
            </label>
          </>
        )}
        <div className="wizard-actions">
          <button
            className="button secondary"
            onClick={() => setStep(step - 1)}
            disabled={step === 0 || busy}
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <span>{step + 1} / 7</span>
          {step < 6 ? (
            <button
              className="button primary"
              onClick={() => setStep(step + 1)}
            >
              Continue
              <ArrowRight size={16} />
            </button>
          ) : (
            <button className="button primary" onClick={create} disabled={busy}>
              {busy ? "Saving to your cloud…" : "Save & open download"}
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </section>
    </>
  );
}
