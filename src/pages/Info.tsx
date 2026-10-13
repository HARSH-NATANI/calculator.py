import { Link, useLocation } from "react-router-dom";
import { Header, Footer } from "../components/UI";
const content: Record<
  string,
  { title: string; intro: string; sections: [string, string][] }
> = {
  about: {
    title: "Built for your next chapter.",
    intro:
      "CloudCV is the career workspace at the heart of HireCraftCV: one reusable profile for resumes, CVs and portfolios.",
    sections: [
      [
        "Your story, connected",
        "Keep your education, experience, projects and skills in one private profile. Create independent documents for each opportunity and update them as your career grows.",
      ],
      [
        "Design with purpose",
        "Our templates focus on clear information, readable typography and thoughtful spacing. Customize your document without starting from scratch.",
      ],
    ],
  },
  privacy: {
    title: "Your story stays yours.",
    intro:
      "CloudCV stores information you choose to provide so you can create career documents. Last updated: October 13, 2026.",
    sections: [
      [
        "What we store",
        "Your account email, profile information, uploaded images, document snapshots, design preferences and up to 25 saved document versions. Avoid adding sensitive information you do not need in a resume.",
      ],
      [
        "Access and storage",
        "Supabase handles authentication, database storage and private image storage. Ownership rules restrict access to your account. Photographs are displayed with temporary signed URLs. Authentication session tokens are stored by the authentication provider in your browser; profile and document data are persisted in the database.",
      ],
      [
        "Your control",
        "You can edit or delete documents, export your data, remove photographs and permanently delete your account in Settings. Exported files remain on devices or with recipients you share them with. Portfolio documents are private; this release does not publish a public portfolio website.",
      ],
      [
        "Retention and backups",
        "Deleting your account removes active database records and uploaded assets. Infrastructure backup retention is controlled by your Supabase hosting configuration; operators must disclose that retention period before production launch. CloudCV cannot erase copies you previously downloaded or shared.",
      ],
      [
        "Questions",
        "Use the Help center for account management instructions. Production operators must configure a support contact and review this policy for their deployment.",
      ],
    ],
  },
  terms: {
    title: "A clear understanding.",
    intro:
      "CloudCV helps you prepare and manage your career documents. Last updated: October 13, 2026.",
    sections: [
      [
        "Your information",
        "You are responsible for the accuracy of your documents and for having permission to upload any assets. Do not misrepresent qualifications or use the service to harm others.",
      ],
      [
        "Service and usage",
        "The application does not impose download quotas. Hosting, email and storage providers have separate limits, availability and pricing. Back up important documents through the export feature.",
      ],
      [
        "Your account",
        "Keep your password secure. You may delete your account from Settings. The application does not guarantee employment, applicant tracking scores, or recruitment outcomes.",
      ],
      [
        "Deployment terms",
        "These are project-level terms. Before operating a public production service, the operator must supply their legal identity, support contact, applicable jurisdiction and service terms.",
      ],
    ],
  },
  contact: {
    title: "Let’s find your next step.",
    intro: "Need a hand with CloudCV? Start with our practical guides below.",
    sections: [
      [
        "Account and password help",
        "Use the password-reset page to recover access. Check your spam folder and make sure you are using the email you registered with.",
      ],
      [
        "Profile and document help",
        "Save your reusable information in My Profile, then create a new document. Changes to one document do not overwrite your master profile or other documents.",
      ],
      [
        "Deployment support",
        "This project does not yet have a configured support mailbox. The deployment owner should add their support address before a public launch. No message is collected or sent from this page.",
      ],
    ],
  },
  help: {
    title: "A little guidance goes a long way.",
    intro: "Everything you need to make the most of your CloudCV workspace.",
    sections: [
      [
        "1. Build your master profile",
        "Open My Profile. Add your contact information and career history. Use Add entry for multiple education, work and project records. Save each round of changes to the cloud.",
      ],
      [
        "2. Make a document your own",
        "Create a resume, CV or portfolio. Pick a purpose, template and records. In the editor, changing a field creates a document-specific override. Your master profile stays intact.",
      ],
      [
        "3. Sync thoughtfully",
        "Use Sync with master in the editor, select individual fields, and choose whether to keep or replace document overrides. Preview your changes and save.",
      ],
      [
        "4. Export your next chapter",
        "Open Download. Select PDF, PNG or JPEG, choose pages and resolution, then generate. Image exports provide one file per page. Use Print / selectable PDF for the browser’s native text-preserving PDF.",
      ],
      [
        "5. History, privacy and account deletion",
        "Version history retains the previous 25 saved versions. Restore a version and save it as a new revision. Settings offers data export and account deletion.",
      ],
    ],
  },
};
export default function Info() {
  const key = useLocation().pathname.slice(1);
  const data = content[key];
  return (
    <>
      <Header />
      <main className="container info-page">
        <span className="eyebrow">
          CLOUDCV · {key.replaceAll("-", " ").toUpperCase()}
        </span>
        <h1>{data?.title || "This page took a different path."}</h1>
        <p className="info-intro">
          {data?.intro ||
            "The page you’re looking for doesn’t exist. Let’s get you back to your next chapter."}
        </p>
        {data?.sections.map(([title, text]) => (
          <section key={title}>
            <h2>{title}</h2>
            <p>{text}</p>
          </section>
        ))}
        <div className="info-actions">
          <Link className="button primary" to="/dashboard">
            Go to workspace
          </Link>
          <Link
            className="button secondary"
            to={key === "contact" ? "/help" : "/"}
          >
            {key === "contact" ? "Help center" : "Back to home"}
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
