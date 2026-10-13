import { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Upload,
  ImagePlus,
  Loader2,
} from "lucide-react";
import {
  personalFields,
  summaryFields,
  sections,
  moveItem,
  type ProfileData,
  type Field,
} from "../lib/model";
import { useToast, Modal } from "./UI";
import { useAuth } from "../lib/auth";
import { db } from "../lib/supabase";
import { errorMessage } from "../lib/api";
import { usePhoto } from "./Resume";
export function useUnsaved(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const unload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    const click = (e: MouseEvent) => {
      const link = (e.target as HTMLElement).closest("a");
      if (
        link &&
        link.href !== window.location.href &&
        !link.download &&
        link.target !== "_blank" &&
        !confirm("You have unsaved changes. Leave this page without saving?")
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", click, true);
    return () => {
      window.removeEventListener("beforeunload", unload);
      document.removeEventListener("click", click, true);
    };
  }, [dirty]);
}
export function Fields({
  fields,
  values,
  onChange,
}: {
  fields: Field[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div className="form-grid">
      {fields.map((f) => (
        <label
          key={f.key}
          className={`${f.type === "textarea" ? "span-two" : ""} ${f.type === "checkbox" ? "checkbox-label" : ""}`}
        >
          {f.type !== "checkbox" && f.label}
          {f.type === "textarea" ? (
            <textarea
              rows={4}
              value={values[f.key] || ""}
              maxLength={10000}
              onChange={(e) => onChange(f.key, e.target.value)}
              placeholder={f.placeholder || f.label}
            />
          ) : f.type === "checkbox" ? (
            <>
              <input
                type="checkbox"
                checked={values[f.key] === "true"}
                onChange={(e) => onChange(f.key, String(e.target.checked))}
              />
              {f.label}
            </>
          ) : (
            <input
              type={f.type || "text"}
              value={values[f.key] || ""}
              maxLength={500}
              onChange={(e) => onChange(f.key, e.target.value)}
              placeholder={f.placeholder || f.label}
            />
          )}
        </label>
      ))}
    </div>
  );
}
export function PhotoUpload({
  label = "Your profile photo",
  path,
  onChange,
}: {
  label?: string;
  path?: string;
  onChange: (path: string) => void;
}) {
  const url = usePhoto(path);
  const { user } = useAuth();
  const toast = useToast();
  const [source, setSource] = useState("");
  const [zoom, setZoom] = useState(1);
  const [x, setX] = useState(50);
  const [y, setY] = useState(50);
  const [busy, setBusy] = useState(false);
  async function upload() {
    if (!source || !user) return;
    setBusy(true);
    try {
      const image = new Image();
      image.src = source;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = 800;
      canvas.height = 800;
      const side = Math.min(image.naturalWidth, image.naturalHeight) / zoom;
      const sx = ((image.naturalWidth - side) * x) / 100,
        sy = ((image.naturalHeight - side) * y) / 100;
      canvas
        .getContext("2d")!
        .drawImage(image, sx, sy, side, side, 0, 0, 800, 800);
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (b) =>
            b ? resolve(b) : reject(new Error("Could not prepare your image.")),
          "image/jpeg",
          0.9,
        ),
      );
      const next = `${user.id}/${crypto.randomUUID()}.jpg`;
      const { error } = await db()
        .storage.from("profile-assets")
        .upload(next, blob, { contentType: "image/jpeg" });
      if (error) throw error;
      onChange(next);
      setSource("");
      toast("Image uploaded. Save your changes to keep it.");
    } catch (e) {
      toast(errorMessage(e), true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="photo-upload">
        <div className="photo-placeholder">
          {url ? <img src={url} alt="Your profile" /> : <ImagePlus size={27} />}
        </div>
        <div>
          <strong>{label}</strong>
          <p>JPG, PNG or WebP · up to 5 MB</p>
          <div className="row">
            <label className="button secondary small">
              <Upload size={14} /> {path ? "Change photo" : "Upload photo"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  if (
                    !["image/jpeg", "image/png", "image/webp"].includes(
                      file.type,
                    ) ||
                    file.size > 5 * 1024 * 1024
                  ) {
                    toast(
                      "Choose a JPG, PNG or WebP image smaller than 5 MB.",
                      true,
                    );
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = () => {
                    setSource(String(reader.result));
                    setZoom(1);
                    setX(50);
                    setY(50);
                  };
                  reader.readAsDataURL(file);
                }}
              />
            </label>
            {path && (
              <button
                className="button ghost small"
                onClick={() => onChange("")}
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>
      {source && (
        <Modal
          title="Crop your photograph"
          onClose={() => {
            if (!busy) setSource("");
          }}
        >
          <div className="crop-window">
            <img
              src={source}
              alt="Crop preview"
              style={{
                objectPosition: `${x}% ${y}%`,
                transform: `scale(${zoom})`,
                transformOrigin: `${x}% ${y}%`,
              }}
            />
          </div>
          <label>
            Zoom
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(+e.target.value)}
            />
          </label>
          <label>
            Horizontal position
            <input
              type="range"
              min="0"
              max="100"
              value={x}
              onChange={(e) => setX(+e.target.value)}
            />
          </label>
          <label>
            Vertical position
            <input
              type="range"
              min="0"
              max="100"
              value={y}
              onChange={(e) => setY(+e.target.value)}
            />
          </label>
          <button
            className="button primary full"
            disabled={busy}
            onClick={upload}
          >
            {busy ? <Loader2 size={17} className="spin" /> : "Crop & upload"}
          </button>
        </Modal>
      )}
    </>
  );
}
export function ProfileForm({
  data,
  section,
  onChange,
  onField,
}: {
  data: ProfileData;
  section: string;
  onChange: (data: ProfileData) => void;
  onField?: (path: string, value: string) => void;
}) {
  const config = sections.find((s) => s.id === section);
  const records = data.sections[section] || [];
  function changePersonal(k: string, v: string) {
    if (onField) onField(`personal/${k}`, v);
    else onChange({ ...data, personal: { ...data.personal, [k]: v } });
  }
  function setRecords(records: ProfileData["sections"][string]) {
    onChange({ ...data, sections: { ...data.sections, [section]: records } });
  }
  if (section === "personal" || section === "summary")
    return (
      <>
        {section === "personal" && (
          <PhotoUpload
            path={data.personal.photo_path}
            onChange={(p) => changePersonal("photo_path", p)}
          />
        )}
        <Fields
          fields={section === "personal" ? personalFields : summaryFields}
          values={data.personal}
          onChange={changePersonal}
        />
      </>
    );
  if (!config) return null;
  return (
    <div className="records-form">
      {records.map((r, index) => (
        <div className="record-card" key={r.id}>
          <div className="record-top">
            <strong>
              {r.title ||
                r.name ||
                r.institution ||
                `${config.label} ${index + 1}`}
            </strong>
            <div>
              <button
                className="icon-button"
                disabled={index === 0}
                onClick={() => setRecords(moveItem(records, index, -1))}
                aria-label="Move entry up"
              >
                <ArrowUp size={15} />
              </button>
              <button
                className="icon-button"
                disabled={index === records.length - 1}
                onClick={() => setRecords(moveItem(records, index, 1))}
                aria-label="Move entry down"
              >
                <ArrowDown size={15} />
              </button>
              <button
                className="icon-button danger"
                onClick={() => {
                  if (
                    confirm("Remove this entry? Save your changes to confirm.")
                  )
                    setRecords(records.filter((x) => x.id !== r.id));
                }}
                aria-label="Remove entry"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
          {section === "projects" && (
            <PhotoUpload
              label="Project thumbnail"
              path={r.image_path}
              onChange={(value) => {
                if (onField) onField(`${section}/${r.id}/image_path`, value);
                else
                  setRecords(
                    records.map((item) =>
                      item.id === r.id ? { ...item, image_path: value } : item,
                    ),
                  );
              }}
            />
          )}
          <Fields
            fields={config.fields}
            values={r}
            onChange={(k, v) => {
              if (onField) onField(`${section}/${r.id}/${k}`, v);
              else
                setRecords(
                  records.map((item) =>
                    item.id === r.id ? { ...item, [k]: v } : item,
                  ),
                );
            }}
          />
        </div>
      ))}
      <button
        className="add-record"
        onClick={() => setRecords([...records, { id: crypto.randomUUID() }])}
      >
        <Plus size={18} /> Add {config.label.toLowerCase()} entry
      </button>
      {!records.length && (
        <p className="field-hint">
          Start with one entry. You can add, reorder or remove entries at any
          time.
        </p>
      )}
    </div>
  );
}
