import { defaultDesign, emptyProfile, sections, type Design } from "./model";
export type Template = {
  id: string;
  name: string;
  type: string;
  category: string;
  description: string;
  layout: string;
  color: string;
  photo: boolean;
  tag?: string;
};
export const templates: Template[] = [
  {
    id: "modern",
    name: "The Modern",
    type: "Resume",
    category: "Modern",
    description:
      "A confident first impression with a clean, considered layout.",
    layout: "modern",
    color: "#344e48",
    photo: false,
    tag: "POPULAR",
  },
  {
    id: "minimal",
    name: "The Minimalist",
    type: "Resume",
    category: "Minimal",
    description: "Thoughtful typography. Room for your experience to speak.",
    layout: "minimal",
    color: "#323434",
    photo: false,
  },
  {
    id: "executive",
    name: "The Executive",
    type: "Resume",
    category: "Experienced professional",
    description: "A polished, structured layout for your next big move.",
    layout: "executive",
    color: "#334457",
    photo: false,
  },
  {
    id: "creative",
    name: "The Creative",
    type: "Portfolio",
    category: "Creative",
    description: "A little personality, a lot of possibility.",
    layout: "creative",
    color: "#8b6050",
    photo: true,
    tag: "NEW",
  },
  {
    id: "classic",
    name: "Classic Corporate",
    type: "Resume",
    category: "Traditional",
    description: "Timeless serif headings with a traditional centered header.",
    layout: "classic",
    color: "#343434",
    photo: false,
  },
  {
    id: "student",
    name: "The Graduate",
    type: "Resume",
    category: "Student",
    description: "Education, coursework and potential take center stage.",
    layout: "modern",
    color: "#5b6083",
    photo: false,
  },
  {
    id: "internship",
    name: "The First Step",
    type: "Resume",
    category: "Internship",
    description: "Make your projects and hands-on learning count.",
    layout: "minimal",
    color: "#476747",
    photo: false,
  },
  {
    id: "developer",
    name: "The Developer",
    type: "Resume",
    category: "Technical",
    description: "A precise layout for projects, tools and technical impact.",
    layout: "developer",
    color: "#36465a",
    photo: false,
  },
  {
    id: "analyst",
    name: "The Analyst",
    type: "Resume",
    category: "Technical",
    description:
      "Clear sections for measurable achievements and data expertise.",
    layout: "executive",
    color: "#376c71",
    photo: false,
  },
  {
    id: "cloud",
    name: "Cloud Professional",
    type: "Resume",
    category: "Technical",
    description: "Highlight infrastructure expertise and certifications.",
    layout: "developer",
    color: "#545c82",
    photo: false,
  },
  {
    id: "academic",
    name: "The Academic",
    type: "CV",
    category: "Academic or research",
    description:
      "An expansive, print-friendly canvas for research and publications.",
    layout: "classic",
    color: "#4b4050",
    photo: false,
  },
  {
    id: "photo",
    name: "The Personal",
    type: "Resume",
    category: "Fresher",
    description: "A distinctive introduction with a portrait and warm accents.",
    layout: "creative",
    color: "#7c6550",
    photo: true,
  },
  {
    id: "folio-minimal",
    name: "Quiet Portfolio",
    type: "Portfolio",
    category: "Minimal",
    description: "A simple project-led introduction to your work.",
    layout: "minimal",
    color: "#313b37",
    photo: false,
  },
  {
    id: "folio-dev",
    name: "Developer Portfolio",
    type: "Portfolio",
    category: "Technical",
    description: "Put your code, projects and thinking in focus.",
    layout: "developer",
    color: "#35435b",
    photo: false,
  },
  {
    id: "folio-student",
    name: "Student Portfolio",
    type: "Portfolio",
    category: "Student",
    description: "A home for your ideas, experiments and achievements.",
    layout: "modern",
    color: "#4f6654",
    photo: true,
  },
  {
    id: "folio-project",
    name: "Project Journal",
    type: "Portfolio",
    category: "Modern",
    description: "A project-first canvas for the work you are proud of.",
    layout: "creative",
    color: "#785d4c",
    photo: false,
  },
];
const variants: Record<string, Partial<Design>> = {
  minimal: { headingWeight: 400 },
  creative: { headingWeight: 400 },
  student: { font: "Trebuchet MS", spacing: 15, headingSize: 13 },
  internship: { font: "Verdana", fontSize: 10.5, margin: 38, spacing: 14 },
  analyst: {
    layout: "one-column",
    font: "Arial",
    headingSize: 13,
    spacing: 16,
  },
  cloud: {
    layout: "two-column",
    font: "Trebuchet MS",
    margin: 36,
    spacing: 16,
  },
  academic: {
    font: "Georgia",
    fontSize: 12,
    headingSize: 14,
    margin: 52,
    spacing: 22,
    lineHeight: 1.6,
  },
  photo: { layout: "one-column", font: "Georgia", margin: 46, headingSize: 14 },
  "folio-minimal": { font: "Georgia", fontSize: 12, spacing: 25, margin: 55 },
  "folio-dev": {
    font: "Verdana",
    layout: "two-column",
    spacing: 20,
    margin: 38,
  },
  "folio-student": { font: "Trebuchet MS", headingSize: 14, spacing: 20 },
  "folio-project": {
    font: "Georgia",
    layout: "one-column",
    fontSize: 12,
    headingSize: 16,
    spacing: 25,
  },
};
export function templateOrder(id: string) {
  const t = templates.find((t) => t.id === id);
  const first =
    t?.type === "Portfolio"
      ? ["summary", "projects", "skills", "experience", "education"]
      : id === "academic"
        ? [
            "summary",
            "education",
            "publications",
            "research",
            "conferences",
            "experience",
          ]
        : ["student", "internship"].includes(id)
          ? [
              "summary",
              "education",
              "skills",
              "projects",
              "internships",
              "certifications",
            ]
          : ["developer", "analyst", "cloud"].includes(id)
            ? [
                "summary",
                "skills",
                "experience",
                "projects",
                "certifications",
                "education",
              ]
            : ["summary", "experience", "education", "skills", "projects"];
  return [
    ...first,
    ...sections.map((s) => s.id).filter((s) => !first.includes(s)),
  ];
}
export const designFor = (id: string) => {
  const t = templates.find((t) => t.id === id) || templates[0];
  return {
    ...defaultDesign(),
    color: t.color,
    font:
      t.layout === "classic"
        ? "Georgia"
        : t.layout === "developer"
          ? "Verdana"
          : "Arial",
    photo: t.photo,
    layout:
      t.layout === "executive" || t.layout === "creative"
        ? "two-column"
        : "one-column",
    ...variants[id],
  };
};
export const sampleProfile = emptyProfile();
sampleProfile.personal = {
  full_name: "Alex Morgan",
  headline: "Product Designer",
  email: "alex.morgan@example.com",
  phone: "+1 (415) 555-0128",
  location: "San Francisco, CA",
  website: "https://example.com",
  summary:
    "Thoughtful product designer turning complex problems into intuitive digital experiences. Passionate about creating meaningful products that put people first.",
};
sampleProfile.sections.experience = [
  {
    id: "exp-1",
    title: "Senior Product Designer",
    organization: "Studio North",
    start: "2022-01",
    end: "",
    current: "true",
    description:
      "Led end-to-end design for a collaborative workspace used by 20,000+ teams.\nPartnered with engineering to bring thoughtful, accessible experiences to life.",
  },
  {
    id: "exp-2",
    title: "Product Designer",
    organization: "Forma Digital",
    start: "2019-06",
    end: "2021-12",
    description:
      "Designed intuitive experiences across web and mobile.\nBuilt a cohesive design system for a growing product team.",
  },
];
sampleProfile.sections.education = [
  {
    id: "edu-1",
    institution: "California College of the Arts",
    degree: "BFA, Interaction Design",
    start: "2015-09",
    end: "2019-05",
    grade: "Magna cum laude",
  },
];
sampleProfile.sections.skills = [
  "Product strategy",
  "User research",
  "Interaction design",
  "Design systems",
  "Figma",
  "Prototyping",
].map((name, i) => ({ id: `skill-${i}`, name, category: "Design" }));
sampleProfile.sections.projects = [
  {
    id: "project-1",
    title: "A better way to collaborate",
    description:
      "An intuitive workspace that brings people, ideas and projects together.",
    technologies: "Research · Strategy · Product design",
  },
];
sampleProfile.sections.certifications = [
  {
    id: "cert-1",
    name: "Google UX Design",
    organization: "Google",
    date: "2023-04-01",
  },
];
