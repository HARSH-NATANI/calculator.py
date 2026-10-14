import { useEffect, useState } from "react";
import { Download, Loader2, Check, Printer } from "lucide-react";
import { toPng, toJpeg } from "html-to-image";
import { jsPDF } from "jspdf";
import { Modal, ErrorBox } from "./UI";
import { loadProfile, errorMessage } from "../lib/api";
export async function generateFiles(
  nodes: HTMLElement[],
  format: string,
  name: string,
  ratio: number,
  paper: "a4" | "letter",
) {
  if (nodes.some((n) => n.querySelector("[data-export-image-pending]")))
    throw new Error(
      "An included image is unavailable. Wait for it to load, refresh, or upload it again before exporting.",
    );
  await document.fonts.ready;
  await Promise.all(
    nodes.flatMap((n) =>
      Array.from(n.querySelectorAll("img")).map((img) =>
        img.decode().catch(() => {
          throw new Error(
            "A photo could not be loaded. Retry before exporting.",
          );
        }),
      ),
    ),
  );
  const files: { url: string; name: string }[] = [];
  const pdf =
    format === "pdf"
      ? new jsPDF({ orientation: "portrait", unit: "mm", format: paper })
      : null;
  for (let i = 0; i < nodes.length; i++) {
    const data = await (format === "jpeg" ? toJpeg : toPng)(nodes[i], {
      pixelRatio: ratio,
      quality: 0.96,
      cacheBust: false,
      backgroundColor: "#fff",
      skipFonts: true,
    });
    if (pdf) {
      if (i) pdf.addPage();
      pdf.addImage(
        data,
        "PNG",
        0,
        0,
        pdf.internal.pageSize.getWidth(),
        pdf.internal.pageSize.getHeight(),
        undefined,
        "FAST",
      );
    } else {
      const blob = await fetch(data).then((r) => r.blob());
      files.push({
        url: URL.createObjectURL(blob),
        name: `${name}_page-${nodes[i].getAttribute("data-page-number") || i + 1}.${format === "jpeg" ? "jpg" : "png"}`,
      });
    }
  }
  if (pdf)
    files.push({
      url: URL.createObjectURL(pdf.output("blob")),
      name: name + ".pdf",
    });
  return files;
}
export function ExportDialog({
  onClose,
  onSave,
  title,
  paper,
  dirty,
  onPaperChange,
}: {
  onClose: () => void;
  onSave: () => Promise<boolean>;
  title: string;
  paper: "a4" | "letter";
  dirty: boolean;
  onPaperChange: (paper: "a4" | "letter") => void;
}) {
  const [format, setFormat] = useState("pdf");
  const [ratio, setRatio] = useState(2);
  const [name, setName] = useState(
    title.replace(/[^\p{L}\p{N} _-]/gu, "").replaceAll(" ", "_") || "My_Resume",
  );
  const [page, setPage] = useState("all");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [files, setFiles] = useState<{ url: string; name: string }[]>([]);
  const [count, setCount] = useState(
    document.querySelectorAll("[data-export-page]").length,
  );
  useEffect(() => {
    const root = document.querySelector(".editor-preview");
    if (!root) return;
    const updateCount = () =>
      setCount(root.querySelectorAll("[data-export-page]").length);
    updateCount();
    const observer = new MutationObserver(updateCount);
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    loadProfile()
      .then((p) => {
        if (["pdf", "png", "jpeg"].includes(p.preferences.format))
          setFormat(p.preferences.format);
      })
      .catch(() => {});
  }, []);
  function clearFiles() {
    files.forEach((f) => URL.revokeObjectURL(f.url));
    setFiles([]);
  }
  async function generate() {
    setBusy(true);
    setError("");
    clearFiles();
    try {
      if (dirty && !(await onSave()))
        throw new Error("Save your latest changes before downloading.");
      await new Promise((r) =>
        requestAnimationFrame(() => requestAnimationFrame(r)),
      );
      const nodes = Array.from(
        document.querySelectorAll<HTMLElement>("[data-export-page]"),
      );
      const selected =
        page === "all" ? nodes : nodes.filter((_, i) => i + 1 === +page);
      if (!selected.length)
        throw new Error("Your preview is still loading. Please try again.");
      setFiles(await generateFiles(selected, format, name, ratio, paper));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title="Ready for your next move"
      onClose={() => {
        if (!busy) {
          clearFiles();
          onClose();
        }
      }}
    >
      <p className="muted">
        Export the document shown in your live preview. Each image file contains
        one complete page.
      </p>
      {error && <ErrorBox message={error} />}
      <fieldset disabled={busy}>
        <div className="format-options">
          {["pdf", "png", "jpeg"].map((f) => (
            <button
              key={f}
              className={format === f ? "selected" : ""}
              onClick={() => {
                setFormat(f);
                clearFiles();
              }}
            >
              <FileFormat format={f} />
              <strong>{f.toUpperCase()}</strong>
              {format === f && <Check size={14} />}
            </button>
          ))}
        </div>
        <div className="form-grid">
          <label>
            File name
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value.replace(/[^\p{L}\p{N} _-]/gu, ""));
                clearFiles();
              }}
              maxLength={120}
            />
          </label>
          <label>
            Paper size
            <select
              value={paper}
              onChange={(e) => {
                onPaperChange(e.target.value as "a4" | "letter");
                clearFiles();
                setPage("all");
              }}
            >
              <option value="a4">A4</option>
              <option value="letter">US Letter</option>
            </select>
          </label>
          <label>
            Pages
            <select
              value={page}
              onChange={(e) => {
                setPage(e.target.value);
                clearFiles();
              }}
            >
              <option value="all">All pages ({count})</option>
              {Array.from({ length: count }, (_, i) => (
                <option key={i} value={i + 1}>
                  Page {i + 1}
                </option>
              ))}
            </select>
          </label>
          <label>
            Resolution
            <select
              value={ratio}
              onChange={(e) => {
                setRatio(+e.target.value);
                clearFiles();
              }}
            >
              <option value={1}>Standard (1×)</option>
              <option value={2}>High (2×)</option>
              <option value={3}>Print quality (3×)</option>
            </select>
          </label>
        </div>
        <p className="field-hint">
          PDF download preserves the preview as high-resolution images. For
          selectable text, use Print / selectable PDF below.
        </p>
        <button
          className="button primary full"
          disabled={busy || !name.trim()}
          onClick={generate}
        >
          {busy ? (
            <>
              <Loader2 className="spin" size={18} />
              Generating your file…
            </>
          ) : (
            <>
              <Download size={17} />
              {dirty ? "Save & generate files" : "Generate download"}
            </>
          )}
        </button>
        {files.length > 0 && (
          <div className="download-files" role="status">
            <strong>
              <Check size={17} /> Your files are ready
            </strong>
            {files.map((f) => (
              <a key={f.name} href={f.url} download={f.name}>
                <Download size={16} />
                {f.name}
              </a>
            ))}
          </div>
        )}
        <button
          className="button ghost full"
          onClick={async () => {
            if (dirty && !(await onSave())) return;
            window.print();
          }}
        >
          <Printer size={16} /> Print / selectable PDF
        </button>
      </fieldset>
    </Modal>
  );
}
function FileFormat({ format }: { format: string }) {
  return <span className="format-icon">.{format}</span>;
}
