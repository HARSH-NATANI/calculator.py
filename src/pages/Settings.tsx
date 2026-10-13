import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Download,
  ShieldCheck,
  Trash2,
  Save,
  Check,
  LogOut,
} from "lucide-react";
import {
  PageHeading,
  Spinner,
  ErrorBox,
  Modal,
  useToast,
} from "../components/UI";
import { useAuth } from "../lib/auth";
import { loadProfile, errorMessage, exportRows } from "../lib/api";
import { db } from "../lib/supabase";
import { templates } from "../lib/templates";
export default function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [preferences, setPreferences] = useState<Record<string, string>>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  useEffect(() => {
    loadProfile()
      .then((p) =>
        setPreferences({
          type: "Resume",
          template: "modern",
          paper: "a4",
          format: "pdf",
          ...p.preferences,
        }),
      )
      .catch((e) => setError(errorMessage(e)));
  }, []);
  async function save() {
    if (!user) return;
    setBusy(true);
    try {
      const p = await loadProfile();
      if (!p.updated_at) {
        const { error } = await db().rpc("save_profile", {
          p_data: p.data,
          p_revision: p.revision,
        });
        if (error) throw error;
      }
      const { error } = await db()
        .from("profiles")
        .update({ preferences })
        .eq("user_id", user.id);
      if (error) throw error;
      toast("Your preferences are saved.");
    } catch (e) {
      toast(errorMessage(e), true);
    } finally {
      setBusy(false);
    }
  }
  async function exportAccount() {
    setBusy(true);
    try {
      const results = await Promise.all(
        ["profiles", "documents", "document_versions", "saved_designs"].map(
          (t) => exportRows(t),
        ),
      );
      const blob = new Blob(
        [
          JSON.stringify(
            Object.fromEntries(
              [
                "profiles",
                "documents",
                "document_versions",
                "saved_designs",
              ].map((t, i) => [t, results[i]]),
            ),
            null,
            2,
          ),
        ],
        { type: "application/json" },
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "CloudCV_Account_Data.json";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast(
        "Account data export generated. Uploaded image binaries are stored separately.",
      );
    } catch (e) {
      toast(errorMessage(e), true);
    } finally {
      setBusy(false);
    }
  }
  async function removeAccount() {
    if (!user || confirmText !== "DELETE") return;
    setBusy(true);
    setError("");
    try {
      while (true) {
        const { data, error } = await db()
          .storage.from("profile-assets")
          .list(user.id, { limit: 100 });
        if (error) throw error;
        if (!data?.length) break;
        const removal = await db()
          .storage.from("profile-assets")
          .remove(data.map((f) => `${user.id}/${f.name}`));
        if (removal.error) throw removal.error;
      }
      const { error } = await db().rpc("delete_my_account");
      if (error) throw error;
      await db().auth.signOut();
      navigate("/");
      toast("Your account and active records have been deleted.");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  if (!preferences) return error ? <ErrorBox message={error} /> : <Spinner />;
  return (
    <>
      <PageHeading
        eyebrow="YOUR WORKSPACE, YOUR WAY"
        title="The little details matter."
        description="Manage your account, defaults and privacy."
      />
      {error && <ErrorBox message={error} />}
      <div className="settings-grid">
        <section className="panel">
          <div className="panel-heading">
            <h2>Account information</h2>
            <p>A secure home for your career story.</p>
          </div>
          <dl>
            <dt>Email address</dt>
            <dd>{user?.email}</dd>
            <dt>Email status</dt>
            <dd className="row">
              <ShieldCheck size={16} />
              {user?.email_confirmed_at ? "Verified" : "Awaiting verification"}
            </dd>
            <dt>Account ID</dt>
            <dd className="account-id">{user?.id}</dd>
          </dl>
          <Link to="/forgot-password" className="button secondary small">
            Change password securely
          </Link>
          <p className="field-hint">We’ll email you a secure reset link.</p>
        </section>
        <section className="panel">
          <div className="panel-heading">
            <h2>A head start, every time</h2>
            <p>Your preferred starting point for new documents.</p>
          </div>
          <div className="form-grid">
            {[
              {
                key: "type",
                label: "Default document",
                options: ["Resume", "CV", "Portfolio"],
              },
              { key: "paper", label: "Paper size", options: ["a4", "letter"] },
              {
                key: "format",
                label: "Export format",
                options: ["pdf", "png", "jpeg"],
              },
            ].map((f) => (
              <label key={f.key}>
                {f.label}
                <select
                  value={preferences[f.key]}
                  onChange={(e) =>
                    setPreferences({ ...preferences, [f.key]: e.target.value })
                  }
                >
                  {f.options.map((o) => (
                    <option key={o} value={o}>
                      {o.toUpperCase()}
                    </option>
                  ))}
                </select>
              </label>
            ))}
            <label>
              Default template
              <select
                value={preferences.template}
                onChange={(e) =>
                  setPreferences({ ...preferences, template: e.target.value })
                }
              >
                {templates.map((t) => (
                  <option value={t.id} key={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button
            className="button primary small"
            disabled={busy}
            onClick={save}
          >
            <Save size={15} />
            Save preferences
          </button>
        </section>
        <section className="panel">
          <div className="panel-heading">
            <h2>Your information, in your hands</h2>
            <p>
              Download a JSON copy of your profile, documents, saved versions
              and designs.
            </p>
          </div>
          <button
            className="button secondary"
            disabled={busy}
            onClick={exportAccount}
          >
            <Download size={17} />
            Export account data
          </button>
          <p className="field-hint">
            To export a finished resume or portfolio, use Download in its
            editor. Images are not embedded in this JSON export.
          </p>
        </section>
        <section className="panel danger-panel">
          <div className="panel-heading">
            <h2>Account & privacy</h2>
            <p>
              Deleting your account removes active records and uploaded photos.
              Download anything you want to keep first.
            </p>
          </div>
          <div className="row">
            <button
              className="button secondary small"
              disabled={busy}
              onClick={async () => {
                const { error } = await db().auth.signOut();
                if (error) toast(error.message, true);
              }}
            >
              <LogOut size={15} />
              Log out
            </button>
            <button
              className="button danger-button small"
              onClick={() => setDeleting(true)}
            >
              <Trash2 size={15} />
              Delete account
            </button>
          </div>
          <p className="field-hint">
            Infrastructure backups follow your hosting provider’s retention
            schedule. <Link to="/privacy">Read our privacy policy.</Link>
          </p>
        </section>
      </div>
      {deleting && (
        <Modal
          title="Permanently delete your account?"
          onClose={() => {
            if (!busy) setDeleting(false);
          }}
        >
          <p className="muted">
            This removes your profile, documents, version history, designs and
            photos. This action cannot be undone. If interrupted, some photos
            may already have been removed; retry to finish.
          </p>
          {error && <ErrorBox message={error} />}
          <label>
            Type DELETE to confirm
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoComplete="off"
            />
          </label>
          <button
            disabled={confirmText !== "DELETE" || busy}
            className="button danger-button full"
            onClick={removeAccount}
          >
            {busy ? (
              "Deleting your data…"
            ) : (
              <>
                <Trash2 size={17} />
                Delete my account permanently
              </>
            )}
          </button>
        </Modal>
      )}
    </>
  );
}
