import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { sections, safeUrl, type ProfileData, type Design } from "../lib/model";
import {
  templates,
  sampleProfile,
  designFor,
  templateOrder,
} from "../lib/templates";
import { signedPhoto } from "../lib/api";
export function usePhoto(path?: string) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    let active = true;
    setUrl(undefined);
    const refresh = () => {
      if (path)
        signedPhoto(path)
          .then((url) => {
            if (active) setUrl(url);
          })
          .catch(() => {
            if (active) setUrl(undefined);
          });
    };
    refresh();
    const timer = setInterval(refresh, 50 * 60 * 1000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [path]);
  return url;
}
function ProjectImage({ path }: { path: string }) {
  const url = usePhoto(path);
  return (
    <div className="resume-project-image">
      {url ? (
        <img src={url} alt="Project showcase" />
      ) : (
        <span data-export-image-pending>
          Project image unavailable. Try refreshing or upload it again.
        </span>
      )}
    </div>
  );
}
function date(value: string) {
  if (!value) return "";
  return new Date(
    value.length === 7 ? value + "-02" : value + "T12:00:00",
  ).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}
function recordBlocks(
  section: string,
  record: Record<string, string>,
  compact = false,
): ReactNode[] {
  const heading =
    record.title || record.name || record.degree || record.institution;
  const sub = [
    record.organization ||
      (record.institution && record.degree && record.institution),
    record.field,
    record.location,
    record.grade,
    record.proficiency,
  ]
    .filter(Boolean)
    .join(" · ");
  const dates = [
    date(record.start || record.date),
    record.current === "true"
      ? section === "education" && record.end
        ? `Expected ${date(record.end)}`
        : "Present"
      : date(record.end),
  ]
    .filter(Boolean)
    .join(" – ");
  const ignore = [
    "id",
    "title",
    "name",
    "degree",
    "institution",
    "organization",
    "field",
    "location",
    "grade",
    "proficiency",
    "start",
    "end",
    "date",
    "current",
    "url",
    "github",
    "image",
    "image_path",
    "category",
  ];
  const details = Object.entries(record)
    .filter(([key, value]) => !ignore.includes(key) && value)
    .flatMap(([key, value]) =>
      value
        .split("\n")
        .flatMap((line) => line.match(/.{1,350}(?:\s|$)|.{1,350}/g) || [])
        .map((line, i) => (
          <p className="resume-detail" key={key + i}>
            {section === "experience" || section === "internships" ? "• " : ""}
            {line}
          </p>
        )),
    );
  return [
    <div className="resume-record-head" key="head">
      <div>
        <strong>{heading}</strong>
        {sub && <div className="resume-sub">{sub}</div>}
      </div>
      <span>{dates}</span>
    </div>,
    ...(record.image_path
      ? [<ProjectImage path={record.image_path} key="project-image" />]
      : []),
    ...details,
    ...["url", "github"]
      .filter((k) => safeUrl(record[k]))
      .map((k) => (
        <p key={k} className="resume-link">
          {compact ? (
            <span>{record[k].replace(/^https?:\/\//, "")}</span>
          ) : (
            <a href={safeUrl(record[k])}>
              {record[k].replace(/^https?:\/\//, "")}
            </a>
          )}
        </p>
      )),
  ];
}
export function Resume({
  data,
  templateId = "modern",
  design = designFor(templateId),
  included = [
    "summary",
    "experience",
    "education",
    "skills",
    "projects",
    "certifications",
  ],
  compact = false,
  sample = false,
}: {
  data: ProfileData;
  templateId?: string;
  design?: Design;
  included?: string[];
  compact?: boolean;
  sample?: boolean;
}) {
  const template = templates.find((t) => t.id === templateId) || templates[0];
  const photo = usePhoto(data.personal.photo_path);
  const measure = useRef<HTMLDivElement>(null);
  const [pageBlocks, setPageBlocks] = useState<number[][][]>([]);
  const p = data.personal;
  const blocks = useMemo(() => {
    const content: { node: ReactNode; keep?: boolean }[] = [];
    content.push({
      node: (
        <header className="resume-header">
          {design.photo && photo && (
            <img
              className={`resume-photo ${design.photoShape}`}
              src={photo}
              style={{
                objectPosition: design.photoPosition,
                float: design.photoPlacement === "left" ? "left" : "right",
                marginLeft: design.photoPlacement === "left" ? 0 : 15,
                marginRight: design.photoPlacement === "left" ? 15 : 0,
              }}
              alt="Profile portrait"
            />
          )}
          {design.photo && p.photo_path && !photo && (
            <span data-export-image-pending>
              Photo unavailable. Try refreshing or upload it again.
            </span>
          )}
          <h1 style={{ fontWeight: design.headingWeight }}>
            {p.display_name || p.full_name || "Your name"}
          </h1>
          <div className="resume-headline">
            {p.headline || "Your professional headline"}
          </div>
          <div className="resume-contact">
            {[p.email, p.phone, p.location].filter(Boolean).join("  ·  ")}
          </div>
          <div className="resume-contact">
            {["website", "linkedin", "github", "social"]
              .filter((k) => safeUrl(p[k]))
              .map((k) =>
                compact ? (
                  <span key={k}>{p[k].replace(/^https?:\/\//, "")} </span>
                ) : (
                  <a key={k} href={safeUrl(p[k])}>
                    {p[k].replace(/^https?:\/\//, "")}{" "}
                  </a>
                ),
              )}
          </div>
        </header>
      ),
    });
    for (const id of included) {
      if (id === "summary") {
        const text = p.summary || p.objective || p.about;
        if (text) {
          content.push({ node: <h2>Profile</h2>, keep: true });
          for (const line of text.match(/.{1,350}(?:\s|$)|.{1,350}/g) || [])
            content.push({ node: <p>{line}</p> });
        }
        continue;
      }
      const records = data.sections[id] || [];
      if (!records.length) continue;
      content.push({
        node: <h2>{sections.find((s) => s.id === id)?.label || id}</h2>,
        keep: true,
      });
      if (id === "skills") {
        for (let i = 0; i < records.length; i += 4)
          content.push({
            node: (
              <div className="resume-skills">
                {records.slice(i, i + 4).map((r) => (
                  <span key={r.id}>
                    {r.name}
                    {r.proficiency ? ` · ${r.proficiency}` : ""}
                  </span>
                ))}
              </div>
            ),
          });
        continue;
      }
      for (const r of records) {
        const parts = recordBlocks(id, r, compact);
        parts.forEach((node, i) =>
          content.push({ node, keep: i === 0 && parts.length > 1 }),
        );
      }
    }
    return content;
  }, [
    data,
    included,
    design.photo,
    design.photoShape,
    design.photoPosition,
    design.photoPlacement,
    photo,
    compact,
  ]);
  const pageHeight = design.paper === "letter" ? 1056 : 1123;
  const pageWidth = design.paper === "letter" ? 816 : 794;
  const usable = pageHeight - design.margin * 2 - 24;
  const columns = design.layout === "two-column" ? 2 : 1;
  const columnWidth =
    (pageWidth - design.margin * 2 - (columns - 1) * 24) / columns;
  useLayoutEffect(() => {
    if (compact || !measure.current) return;
    const elements = Array.from(measure.current.children) as HTMLElement[];
    const columnGroups: number[][] = [[]];
    let used = 0;
    elements.forEach((el, i) => {
      const h = el.offsetHeight;
      const following = blocks[i].keep ? elements[i + 1]?.offsetHeight || 0 : 0;
      if (
        used + h + following > usable &&
        columnGroups[columnGroups.length - 1].length
      ) {
        columnGroups.push([]);
        used = 0;
      }
      columnGroups[columnGroups.length - 1].push(i);
      used += h;
    });
    const pages: number[][][] = [];
    for (let i = 0; i < columnGroups.length; i += columns)
      pages.push(columnGroups.slice(i, i + columns));
    setPageBlocks(pages);
  }, [blocks, design, usable, compact, columns]);
  const style = {
    "--resume-color": design.color,
    "--resume-heading-weight": design.headingWeight || 600,
    "--resume-divider-color": design.dividerColor || "#dee1da",
    fontWeight: design.fontWeight || 400,
    "--resume-accent": design.accent,
    "--resume-font-size": `${design.fontSize}px`,
    "--resume-heading-size": `${design.headingSize}px`,
    "--resume-spacing": `${design.spacing}px`,
    fontFamily: design.font,
    color: design.textColor,
    lineHeight: design.lineHeight,
    textAlign: design.alignment as CSSProperties["textAlign"],
    backgroundColor: design.background,
  } as CSSProperties;
  const classes = `resume layout-${template.layout} ${design.dividers ? "with-dividers" : ""} ${design.layout === "two-column" ? "with-sidebar" : ""}`;
  if (compact)
    return (
      <div className={`${classes} compact-resume`} style={style}>
        <div
          className="resume-compact-columns"
          style={{ columnCount: columns, columnGap: 22 }}
        >
          {blocks.map((b, i) => (
            <div className="resume-block" key={i}>
              {b.node}
            </div>
          ))}
        </div>
        {sample && <span className="sample-watermark">SAMPLE PROFILE</span>}
      </div>
    );
  return (
    <div className="resume-pages" style={{ width: pageWidth }}>
      <style media="print">{`@page { size: ${design.paper === "letter" ? "letter" : "A4"}; margin: 0; }`}</style>
      <div
        aria-hidden="true"
        className={`${classes} measure-resume`}
        style={{ ...style, width: columnWidth, padding: 0 }}
        ref={measure}
      >
        {blocks.map((b, i) => (
          <div className="resume-block" key={i}>
            {b.node}
          </div>
        ))}
      </div>
      {(pageBlocks.length ? pageBlocks : [[blocks.map((_, i) => i)]]).map(
        (pageColumns, page) => (
          <article
            key={page}
            data-export-page
            data-page-number={page + 1}
            className={`${classes} resume-page`}
            style={{
              ...style,
              width: pageWidth,
              minHeight: pageHeight,
              height: pageHeight,
              padding: design.margin,
            }}
          >
            <div
              className="resume-page-columns"
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${columns},minmax(0,1fr))`,
                gap: 24,
              }}
            >
              {pageColumns.map((indices, col) => (
                <div className="resume-column" key={col}>
                  {indices.map((i) => (
                    <div className="resume-block" key={i}>
                      {blocks[i].node}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <footer className="resume-page-number">
              {page + 1} / {pageBlocks.length || 1}
            </footer>
          </article>
        ),
      )}
    </div>
  );
}
export function TemplateThumb({
  id,
  large = false,
}: {
  id: string;
  large?: boolean;
}) {
  return (
    <div className={`template-thumb ${large ? "large" : ""}`}>
      <div className="template-scale">
        <Resume
          data={sampleProfile}
          templateId={id}
          included={templateOrder(id)}
          compact
          sample
        />
      </div>
    </div>
  );
}
