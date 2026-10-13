import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCheck,
  Cloud,
  Download,
  FileText,
  FolderOpen,
  LayoutTemplate,
  LockKeyhole,
  MousePointer2,
  Paintbrush,
  Plus,
  ShieldCheck,
  Sparkles,
  UserRound,
  BriefcaseBusiness,
  GraduationCap,
  Globe,
  ChevronRight,
} from "lucide-react";
import { Header, Footer } from "../components/UI";
import { Resume, TemplateThumb } from "../components/Resume";
import { sampleProfile, templates } from "../lib/templates";
export default function Home() {
  return (
    <>
      <Header />
      <main>
        <section className="hero">
          <div className="container hero-grid">
            <div className="hero-copy">
              <div className="hero-eyebrow">
                <span className="status-dot" /> A LITTLE CLARITY. A BIG NEXT
                STEP.
              </div>
              <h1>
                Build your future
                <br />
                with a resume that
                <br />
                <span>stands out.</span>
                <svg className="hero-underline" viewBox="0 0 400 17">
                  <path
                    d="M3 12Q180-4 396 7M25 16Q200 2 365 12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </h1>
              <p>
                Your career. Your story. One smart profile.
                <br />
                Create beautiful resumes, CVs, and portfolios that
                <br className="desktop-br" /> open doors — all from one place.
              </p>
              <div className="hero-buttons">
                <Link className="button primary" to="/register">
                  Create my resume <ArrowUpRight size={18} />
                </Link>
                <Link className="button secondary" to="/templates">
                  Explore templates <ArrowRight size={17} />
                </Link>
              </div>
              <div className="hero-perks">
                <span>
                  <Check size={14} /> Free to get started
                </span>
                <span>
                  <Check size={14} /> No credit card needed
                </span>
              </div>
              <div className="hero-bottom">
                <div className="tiny-docs">
                  <FileText />
                  <BriefcaseBusiness />
                  <GraduationCap />
                </div>
                <span>
                  From your first internship
                  <br />
                  to your next big opportunity.
                </span>
              </div>
            </div>
            <div className="hero-visual">
              <div className="orbit orbit-one" />
              <div className="orbit orbit-two" />
              <div className="visual-dots" />
              <div className="hero-back-sheet">
                <div className="back-sheet-bar" />
                <TemplateThumb id="minimal" />
              </div>
              <div className="editor-mock">
                <div className="mock-top">
                  <span className="mock-dots">
                    <i />
                    <i />
                    <i />
                  </span>
                  <span>My professional resume</span>
                  <span className="mock-saved">
                    <CheckCheck size={11} /> All changes saved
                  </span>
                </div>
                <div className="mock-body">
                  <div className="mock-sidebar">
                    <span className="mock-side-active">
                      <UserRound />
                    </span>
                    <FileText />
                    <GraduationCap />
                    <BriefcaseBusiness />
                    <Paintbrush />
                    <span className="mock-plus">
                      <Plus />
                    </span>
                  </div>
                  <div className="mock-document">
                    <Resume data={sampleProfile} templateId="modern" compact />
                  </div>
                </div>
                <div className="mock-bottom">
                  <span>
                    <span className="status-dot" /> Your story, beautifully
                    told.
                  </span>
                  <span>
                    100% <span className="mock-zoom">− &nbsp; +</span>
                  </span>
                </div>
              </div>
              <div className="floating-chip cloud-chip">
                <span className="chip-icon">
                  <Cloud size={20} />
                </span>
                <div>
                  <strong>One profile. Endless possibilities.</strong>
                  <span>Always with you, in the cloud.</span>
                </div>
                <span className="chip-check">
                  <Check size={12} />
                </span>
              </div>
              <div className="floating-chip export-chip">
                <span className="chip-icon">
                  <Download size={19} />
                </span>
                <div>
                  <strong>Ready for your next move</strong>
                  <span>Export in PDF, PNG & JPEG</span>
                </div>
              </div>
              <div className="cursor-label">
                <MousePointer2 size={24} />
                <span>Your next chapter</span>
              </div>
              <span className="visual-caption">
                A polished first impression, made by you.
              </span>
            </div>
          </div>
        </section>
        <section className="trust-strip">
          <div className="container">
            <span>
              BUILT FOR EVERY
              <br />
              <strong>STEP OF YOUR JOURNEY</strong>
            </span>
            <div>
              <GraduationCap /> Students & graduates
            </div>
            <div>
              <BriefcaseBusiness /> Working professionals
            </div>
            <div>
              <Sparkles /> Career changers
            </div>
            <div>
              <Globe /> Independent thinkers
            </div>
          </div>
        </section>
        <section id="features" className="features-section section">
          <div className="container">
            <div className="section-intro">
              <div>
                <span className="eyebrow">
                  <span className="small-line" /> LESS BUSYWORK. MORE
                  POSSIBILITIES.
                </span>
                <h2>
                  Your experience, connected.
                  <br />
                  Your possibilities, unlimited.
                </h2>
              </div>
              <p>
                Everything you need to tell your professional story.
                <br />
                Nothing standing between you and what’s next.
              </p>
            </div>
            <div className="feature-grid">
              <article className="feature-card feature-profile">
                <span className="feature-icon">
                  <UserRound size={22} />
                </span>
                <h3>One profile. Every opportunity.</h3>
                <p>
                  Add your experience once. Turn it into tailored
                  <br className="desktop-br" /> resumes, detailed CVs, and
                  personal portfolios.
                </p>
                <div className="profile-diagram">
                  <div className="profile-node">
                    <div className="initial-avatar">You</div>
                    <span>Your master profile</span>
                    <CheckCheck size={14} />
                  </div>
                  <div className="diagram-lines">
                    <i />
                    <i />
                    <i />
                  </div>
                  <div className="document-nodes">
                    <span>
                      <FileText /> Resume
                    </span>
                    <span>
                      <GraduationCap /> CV
                    </span>
                    <span>
                      <Globe /> Portfolio
                    </span>
                  </div>
                </div>
                <Link to="/register">
                  Build your profile <ArrowUpRight size={16} />
                </Link>
              </article>
              <article className="feature-card">
                <span className="feature-icon">
                  <LayoutTemplate size={22} />
                </span>
                <h3>A great look, built in.</h3>
                <p>
                  Thoughtfully designed templates that let your
                  <br className="desktop-br" /> skills and experience take the
                  spotlight.
                </p>
                <div className="mini-template-stack">
                  <TemplateThumb id="classic" />
                  <TemplateThumb id="executive" />
                  <TemplateThumb id="creative" />
                </div>
                <Link to="/templates">
                  Find your template <ArrowUpRight size={16} />
                </Link>
              </article>
              <article className="feature-card">
                <span className="feature-icon">
                  <Paintbrush size={22} />
                </span>
                <h3>Make it unmistakably you.</h3>
                <p>
                  Your font. Your colors. Your story.
                  <br />
                  Fine-tune every detail with a live preview.
                </p>
                <div className="design-demo">
                  <div>
                    <span>COLOR PALETTE</span>
                    <div className="swatches">
                      <i style={{ background: "#304a3d" }}>
                        <Check size={13} />
                      </i>
                      <i style={{ background: "#7d88a6" }} />
                      <i style={{ background: "#c08c75" }} />
                      <i style={{ background: "#b1ae9a" }} />
                      <i style={{ background: "#d8bd82" }} />
                    </div>
                  </div>
                  <div className="font-demo">
                    <span>Aa</span>
                    <div>
                      <strong>Beautiful by default.</strong>
                      <span>Personal by design.</span>
                    </div>
                  </div>
                </div>
                <Link to="/templates">
                  Explore the possibilities <ArrowUpRight size={16} />
                </Link>
              </article>
            </div>
            <div className="feature-inline">
              <span>
                <Cloud /> Secure cloud saving
              </span>
              <span>
                <Download /> PDF, PNG & JPEG export
              </span>
              <span>
                <UserRound /> Photo-friendly layouts
              </span>
              <span>
                <FolderOpen /> A resume for every role
              </span>
            </div>
          </div>
        </section>
        <section id="how-it-works" className="how-section section">
          <div className="container">
            <div className="center-heading">
              <span className="eyebrow">FROM EXPERIENCE TO OPPORTUNITY</span>
              <h2>Big next steps. Three simple ones.</h2>
              <p>Spend less time formatting. More time moving forward.</p>
            </div>
            <div className="steps-grid">
              {[
                {
                  n: "01",
                  icon: UserRound,
                  title: "Tell your story once.",
                  text: "Add your education, experience, skills, and projects to your private cloud profile.",
                },
                {
                  n: "02",
                  icon: LayoutTemplate,
                  title: "Find your perfect fit.",
                  text: "Choose a template, tailor your content, and make the design your own.",
                },
                {
                  n: "03",
                  icon: ArrowUpRight,
                  title: "Make your next move.",
                  text: "Download a polished document and put your best self out there.",
                },
              ].map(({ n, icon: Icon, title, text }) => (
                <article key={n}>
                  <div className="step-top">
                    <span>{n}</span>
                    <Icon size={25} />
                  </div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section className="templates-section section">
          <div className="container">
            <div className="section-intro">
              <div>
                <span className="eyebrow">
                  <span className="small-line" /> GOOD DESIGN OPENS DOORS
                </span>
                <h2>A template for your kind of ambition.</h2>
              </div>
              <Link to="/templates" className="text-link">
                Explore all templates <ArrowRight size={17} />
              </Link>
            </div>
            <div className="home-templates">
              {templates.slice(0, 4).map((t) => (
                <Link
                  to={`/templates?preview=${t.id}`}
                  className={`home-template home-template-${t.id}`}
                  key={t.id}
                >
                  <div className="home-template-preview">
                    <TemplateThumb id={t.id} />
                    {t.tag && <span className="template-tag">{t.tag}</span>}
                    <span className="template-hover">
                      Preview template <ArrowUpRight size={16} />
                    </span>
                  </div>
                  <div className="template-caption">
                    <div>
                      <h3>{t.name}</h3>
                      <span>
                        {t.category} · {t.type}
                      </span>
                    </div>
                    <ArrowUpRight size={18} />
                  </div>
                </Link>
              ))}
            </div>
            <p className="sample-note">
              Real layouts. Illustrative sample profiles. Your story goes here.
            </p>
          </div>
        </section>
        <section className="security-section">
          <div className="container security-inner">
            <div className="security-symbol">
              <ShieldCheck size={40} />
              <span className="security-orbit" />
            </div>
            <div>
              <span className="eyebrow">YOUR STORY STAYS YOURS</span>
              <h2>Big on possibilities. Serious about privacy.</h2>
              <p>
                Your information is private by default. Secure authentication,
                personal cloud storage,
                <br className="desktop-br" /> and full control over your
                documents. Because your career is your business.
              </p>
            </div>
            <Link to="/privacy" className="text-link">
              Our privacy promise <ArrowUpRight size={17} />
            </Link>
          </div>
        </section>
        <section className="faq-section section">
          <div className="container faq-grid">
            <div>
              <span className="eyebrow">A LITTLE MORE CLARITY</span>
              <h2>
                Good questions.
                <br />
                Straight answers.
              </h2>
              <p>Something else on your mind?</p>
              <Link to="/help" className="text-link">
                Visit our help center <ArrowUpRight size={17} />
              </Link>
            </div>
            <div className="faq-list">
              {[
                [
                  "Is CloudCV free to use?",
                  "The application has no document or download quota. Cloud hosting, storage, and email providers have their own service limits. See Plans for deployment details.",
                ],
                [
                  "Can I create more than one resume?",
                  "Absolutely. Create separate documents for different opportunities using the same master profile. Each document keeps its own content, template and design.",
                ],
                [
                  "Can I update a resume without starting over?",
                  "Yes. Reopen a saved document and edit just the fields you need. You can also selectively sync updates from your master profile without overwriting your customizations.",
                ],
                [
                  "What formats can I download?",
                  "Download your actual document as a multi-page PDF or high-resolution PNG and JPEG images. Use browser print when you need a PDF with selectable text.",
                ],
                [
                  "Is my personal information private?",
                  "Your profile, documents and photographs are private to your authenticated account. Database and storage access rules enforce ownership. Portfolio documents are private unless you share an exported copy.",
                ],
              ].map(([q, a]) => (
                <details key={q}>
                  <summary>
                    {q}
                    <Plus size={18} />
                  </summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
        <section id="plans" className="container cta-section">
          <div className="cta-copy">
            <span className="eyebrow">YOUR NEXT CHAPTER IS WAITING</span>
            <h2>
              Build your future with a<br />
              resume that stands out.
            </h2>
            <p>Start with your story. We’ll help you make it shine.</p>
            <Link to="/register" className="button lime">
              Create my resume <ArrowUpRight size={18} />
            </Link>
            <span className="cta-note">
              No application download limits. Provider usage limits apply.
            </span>
          </div>
          <div className="cta-art">
            <div className="cta-art-circle" />
            <div className="cta-file">
              <FileText size={45} strokeWidth={1.2} />
              <span>
                YOUR NEXT
                <br />
                <strong>big thing.</strong>
              </span>
              <ArrowUpRight size={32} />
            </div>
            <span className="cta-star">✳</span>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
