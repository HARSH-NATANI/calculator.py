export type RecordData = { id: string; [field: string]: string };
export type ProfileData = {
  personal: Record<string, string>;
  sections: Record<string, RecordData[]>;
};
export type Design = {
  color: string;
  accent: string;
  font: string;
  fontSize: number;
  fontWeight?: number;
  headingWeight?: number;
  dividerColor?: string;
  photoPlacement?: string;
  headingSize: number;
  lineHeight: number;
  margin: number;
  spacing: number;
  layout: string;
  paper: "a4" | "letter";
  photo: boolean;
  photoShape: string;
  photoPosition: string;
  textColor: string;
  dividers: boolean;
  alignment: string;
  background: string;
};
export type CVDocument = {
  id: string;
  user_id: string;
  title: string;
  document_type: string;
  purpose: string;
  target_role: string;
  target_organization: string;
  job_description: string;
  template_id: string;
  profile_snapshot: ProfileData;
  document_overrides: Record<string, string>;
  included_sections: string[];
  design_settings: Design;
  revision: number;
  archived: boolean;
  created_at: string;
  updated_at: string;
};
export type Field = {
  key: string;
  label: string;
  type?: string;
  placeholder?: string;
};
export type Section = { id: string; label: string; fields: Field[] };
const f = (key: string, label: string, type?: string): Field => ({
  key,
  label,
  type,
});
export const sections: Section[] = [
  {
    id: "education",
    label: "Education",
    fields: [
      f("institution", "Institution"),
      f("degree", "Degree / qualification"),
      f("field", "Field of study"),
      f("start", "Start date", "month"),
      f("end", "End date / expected graduation", "month"),
      f("current", "Currently studying", "checkbox"),
      f("grade", "Grade / CGPA / percentage"),
      f("coursework", "Relevant coursework"),
      f("achievements", "Academic achievements", "textarea"),
      f("description", "Description", "textarea"),
    ],
  },
  {
    id: "experience",
    label: "Work Experience",
    fields: [
      f("title", "Job title"),
      f("organization", "Company"),
      f("type", "Employment type"),
      f("location", "Location"),
      f("start", "Start date", "month"),
      f("end", "End date", "month"),
      f("current", "Currently working here", "checkbox"),
      f("description", "Responsibilities (one bullet per line)", "textarea"),
      f("achievements", "Achievements and measurable outcomes", "textarea"),
      f("technologies", "Technologies used"),
    ],
  },
  {
    id: "skills",
    label: "Skills",
    fields: [
      f("name", "Skill"),
      f("category", "Category"),
      f("proficiency", "Proficiency (optional)"),
      f("description", "Evidence / context", "textarea"),
    ],
  },
  {
    id: "internships",
    label: "Internships",
    fields: [
      f("title", "Internship title"),
      f("organization", "Organization"),
      f("start", "Start date", "month"),
      f("end", "End date", "month"),
      f("duration", "Duration"),
      f("description", "Responsibilities", "textarea"),
      f("skills", "Skills gained"),
      f("projects", "Projects completed", "textarea"),
      f("achievements", "Achievements", "textarea"),
      f("url", "Certificate URL", "url"),
    ],
  },
  {
    id: "projects",
    label: "Projects",
    fields: [
      f("title", "Project title"),
      f("description", "Short description", "textarea"),
      f("problem", "Problem solved", "textarea"),
      f("technologies", "Technologies used"),
      f("responsibilities", "Your responsibilities", "textarea"),
      f("features", "Key features", "textarea"),
      f("results", "Results", "textarea"),
      f("github", "GitHub URL", "url"),
      f("url", "Live project URL", "url"),
      f("start", "Start date", "month"),
      f("end", "Completion date", "month"),
    ],
  },
  {
    id: "certifications",
    label: "Certifications",
    fields: [
      f("name", "Certification / course name"),
      f("organization", "Issuing organization"),
      f("date", "Completion date", "date"),
      f("credential", "Credential ID"),
      f("url", "Credential URL", "url"),
      f("duration", "Duration"),
      f("skills", "Skills covered"),
    ],
  },
  {
    id: "achievements",
    label: "Achievements",
    fields: [
      f("title", "Award / achievement"),
      f("organization", "Issuing organization"),
      f("date", "Date", "date"),
      f("description", "Description", "textarea"),
      f("url", "Supporting URL", "url"),
    ],
  },
  ...[
    "Languages",
    "Publications",
    "Research",
    "Conferences",
    "Workshops",
    "Volunteer Experience",
    "Leadership",
    "Extracurricular Activities",
    "Interests",
    "Memberships",
    "References",
    "Custom Sections",
  ].map((label) => ({
    id: label.toLowerCase().replaceAll(" ", "-"),
    label,
    fields: [
      f("title", label === "Languages" ? "Language" : "Title / name"),
      f("subtitle", "Organization / proficiency / subtitle"),
      f("date", "Date (optional)", "date"),
      f("description", "Details", "textarea"),
      f("url", "Link (optional)", "url"),
    ],
  })),
];
export const personalFields: Field[] = [
  f("full_name", "Full name"),
  f("display_name", "Preferred display name"),
  f("headline", "Professional headline"),
  f("email", "Contact email", "email"),
  f("phone", "Phone number", "tel"),
  f("location", "City and country"),
  f("linkedin", "LinkedIn URL", "url"),
  f("github", "GitHub URL", "url"),
  f("website", "Personal website", "url"),
  f("social", "Other professional link", "url"),
  f("address", "Address (optional)"),
  f("birthdate", "Date of birth (optional)", "date"),
];
export const summaryFields: Field[] = [
  f("summary", "Professional summary", "textarea"),
  f("objective", "Career objective", "textarea"),
  f("about", "About me", "textarea"),
  f("interests", "Career interests"),
  f("strengths", "Professional strengths"),
  f("target", "Target role"),
  f("industry", "Preferred industry"),
];
export const emptyProfile = (): ProfileData => ({
  personal: {},
  sections: Object.fromEntries(sections.map((s) => [s.id, []])),
});
export const defaultDesign = (): Design => ({
  color: "#294c41",
  accent: "#d7e5dc",
  font: "Arial",
  fontSize: 11,
  fontWeight: 400,
  headingWeight: 600,
  dividerColor: "#dee1da",
  photoPlacement: "right",
  headingSize: 12,
  lineHeight: 1.5,
  margin: 44,
  spacing: 18,
  layout: "one-column",
  paper: "a4",
  photo: false,
  photoShape: "circle",
  photoPosition: "50% 50%",
  textColor: "#303936",
  dividers: true,
  alignment: "left",
  background: "#ffffff",
});
export function setOverride(
  overrides: Record<string, string>,
  path: string,
  value: string,
) {
  return { ...overrides, [path]: value };
}
export function effectiveProfile(
  doc: Pick<CVDocument, "profile_snapshot" | "document_overrides">,
): ProfileData {
  const result = structuredClone(doc.profile_snapshot);
  for (const [path, value] of Object.entries(doc.document_overrides)) {
    const [group, id, key] = path.split("/");
    if (group === "personal") result.personal[id] = value;
    else {
      const record = result.sections[group]?.find((r) => r.id === id);
      if (record && key) record[key] = value;
    }
  }
  return result;
}
export function syncFields(
  doc: CVDocument,
  master: ProfileData,
  paths: string[],
  replace: boolean,
): CVDocument {
  const next = structuredClone(doc);
  for (const path of paths) {
    const [group, id, key] = path.split("/");
    if (group === "personal")
      next.profile_snapshot.personal[id] = master.personal[id] || "";
    else {
      const source = master.sections[group]?.find((r) => r.id === id);
      if (!source || !key) continue;
      const dest = next.profile_snapshot.sections[group]?.find(
        (r) => r.id === id,
      );
      if (dest) dest[key] = source[key] || "";
    }
    if (replace) delete next.document_overrides[path];
  }
  return next;
}
export function profileCompletion(p: ProfileData) {
  return Math.round(
    ([
      p.personal.full_name,
      p.personal.email,
      p.personal.headline,
      p.personal.summary,
      p.sections.education?.length,
      p.sections.skills?.length,
      p.sections.experience?.length || p.sections.projects?.length,
    ].filter(Boolean).length /
      7) *
      100,
  );
}
export const purposes = [
  "Internship application",
  "Fresher job application",
  "Experienced job application",
  "Campus placement",
  "Technical interview",
  "Non-technical job",
  "Scholarship application",
  "Higher education",
  "Academic or research application",
  "Freelancing",
  "Personal branding",
  "Professional networking",
  "General-purpose resume",
  "Custom purpose",
];
export function safeUrl(value: string) {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
}
export function moveItem<T>(items: T[], index: number, direction: number) {
  const result = [...items];
  const target = index + direction;
  if (target < 0 || target >= items.length) return result;
  [result[index], result[target]] = [result[target], result[index]];
  return result;
}
export function changedSections(previous: CVDocument, next: CVDocument) {
  const changed: string[] = [];
  if (
    JSON.stringify(previous.profile_snapshot.personal) !==
    JSON.stringify(next.profile_snapshot.personal)
  )
    changed.push("Personal information");
  for (const s of sections)
    if (
      JSON.stringify(previous.profile_snapshot.sections[s.id]) !==
      JSON.stringify(next.profile_snapshot.sections[s.id])
    )
      changed.push(s.label);
  if (
    JSON.stringify(previous.document_overrides) !==
    JSON.stringify(next.document_overrides)
  )
    changed.push("Document fields");
  if (
    previous.template_id !== next.template_id ||
    JSON.stringify(previous.design_settings) !==
      JSON.stringify(next.design_settings)
  )
    changed.push("Design");
  if (
    JSON.stringify(previous.included_sections) !==
    JSON.stringify(next.included_sections)
  )
    changed.push("Section order");
  return changed.join(", ") || "Document settings";
}
