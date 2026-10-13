import { useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Check,
  ShieldCheck,
  Cloud,
  Loader2,
} from "lucide-react";
import { Logo, ErrorBox } from "../components/UI";
import { db, configured } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { errorMessage } from "../lib/api";
export default function Auth() {
  const { pathname } = useLocation();
  const mode = pathname.slice(1);
  const register = mode === "register",
    forgot = mode === "forgot-password",
    reset = mode === "reset-password";
  const { recovery } = useAuth();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const rawNext = params.get("next") || "/dashboard";
  const next =
    rawNext.startsWith("/") && !rawNext.startsWith("//")
      ? rawNext
      : "/dashboard";
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setBusy(true);
    const values = new FormData(e.currentTarget);
    const email = String(values.get("email") || "").trim();
    const password = String(values.get("password") || "");
    try {
      if ((register || reset) && password !== values.get("confirm"))
        throw new Error("Your passwords do not match.");
      if (
        (register || reset) &&
        (!/[A-Za-z]/.test(password) ||
          !/[0-9]/.test(password) ||
          password.length < 8)
      )
        throw new Error(
          "Use at least 8 characters, including a letter and a number.",
        );
      if (register) {
        const { data, error } = await db().auth.signUp({
          email,
          password,
          options: {
            data: { full_name: String(values.get("name")).trim() },
            emailRedirectTo: window.location.origin + "/dashboard",
          },
        });
        if (error) throw error;
        if (data.session) navigate(next);
        else
          setSuccess(
            "Check your inbox for a verification link. If this address already has an account, sign in or reset your password.",
          );
      } else if (forgot) {
        const { error } = await db().auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/reset-password",
        });
        if (error) throw error;
        setSuccess(
          "If an account exists for this email, you’ll receive a password reset link shortly.",
        );
      } else if (reset) {
        if (!recovery)
          throw new Error(
            "This reset link is missing or expired. Request a new one.",
          );
        const { error } = await db().auth.updateUser({ password });
        if (error) throw error;
        await db().auth.signOut();
        setSuccess("Your password has been updated. You can now sign in.");
      } else {
        const { error } = await db().auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate(next);
      }
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  const title = register
    ? "Your next chapter starts here."
    : forgot
      ? "Let’s get you back in."
      : reset
        ? "A fresh start."
        : "Welcome back.";
  return (
    <div className="auth-page">
      <aside className="auth-aside">
        <Logo light />
        <div>
          <span className="eyebrow">YOUR CAREER. YOUR STORY.</span>
          <h2>
            A little clarity.
            <br />A world of
            <br />
            <em>possibility.</em>
          </h2>
          <p>
            One smart profile for every opportunity
            <br />
            that comes your way.
          </p>
          <div className="auth-points">
            <span>
              <Check /> Your experience, all in one place
            </span>
            <span>
              <Check /> Beautiful documents, made by you
            </span>
            <span>
              <Check /> Private by default. Always yours.
            </span>
          </div>
        </div>
        <span className="auth-aside-bottom">
          <ShieldCheck size={17} /> Your story stays yours.
        </span>
        <Cloud className="auth-cloud" />
      </aside>
      <main className="auth-main">
        <div className="auth-mobile-logo">
          <Logo />
        </div>
        <Link className="auth-back" to="/">
          ← Back to CloudCV
        </Link>
        <div className="auth-form-wrap">
          <span className="eyebrow">
            {register
              ? "MAKE YOUR NEXT MOVE"
              : forgot || reset
                ? "ACCOUNT RECOVERY"
                : "GOOD TO SEE YOU AGAIN"}
          </span>
          <h1>{title}</h1>
          <p>
            {register
              ? "Create your free account. Make your experience count."
              : forgot
                ? "Enter your email and we’ll send you a secure reset link."
                : reset
                  ? "Choose a strong password for your account."
                  : "Your profile, your documents, your next opportunity."}
          </p>
          {import.meta.env.VITE_LOCAL_DEVELOPMENT === "true" && (
            <div className="notice">
              Development environment: confirmation and reset emails arrive in
              the{" "}
              <a href="http://localhost:54324" target="_blank" rel="noreferrer">
                local test inbox ↗
              </a>
              .
            </div>
          )}
          {!configured && (
            <ErrorBox message="Cloud storage is awaiting configuration. Authentication will be available once the Supabase project is connected." />
          )}
          {error && <ErrorBox message={error} />}{" "}
          {success ? (
            <div className="success-box">
              <Check />
              <p>{success}</p>
              <Link to="/login" className="button secondary">
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={submit}>
              {register && (
                <label>
                  Full name
                  <input
                    name="name"
                    required
                    autoComplete="name"
                    placeholder="Your full name"
                    maxLength={120}
                  />
                </label>
              )}
              {!reset && (
                <label>
                  Email address
                  <input
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                  />
                </label>
              )}
              {!forgot && (
                <label>
                  Password
                  <div className="password-input">
                    <input
                      name="password"
                      type={show ? "text" : "password"}
                      required
                      minLength={register || reset ? 8 : 1}
                      autoComplete={
                        register || reset ? "new-password" : "current-password"
                      }
                      placeholder={
                        register
                          ? "At least 8 characters"
                          : "Enter your password"
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setShow(!show)}
                      aria-label={show ? "Hide password" : "Show password"}
                    >
                      {show ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </label>
              )}
              {(register || reset) && (
                <>
                  <label>
                    Confirm password
                    <input
                      name="confirm"
                      type={show ? "text" : "password"}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      placeholder="Re-enter your password"
                    />
                  </label>
                  <span className="field-hint">
                    Use at least 8 characters with a letter and a number.
                  </span>
                </>
              )}
              {register && (
                <label className="checkbox-label">
                  <input name="terms" type="checkbox" required />
                  <span>
                    I agree to the <Link to="/terms">Terms of Service</Link> and{" "}
                    <Link to="/privacy">Privacy Policy</Link>.
                  </span>
                </label>
              )}
              {!register && !forgot && !reset && (
                <div className="auth-options">
                  <span>Secure, persistent session</span>
                  <Link to="/forgot-password">Forgot password?</Link>
                </div>
              )}
              {reset && !recovery && (
                <ErrorBox message="Open the secure link from your password-reset email. An invalid or expired link cannot reset your password." />
              )}
              <button
                disabled={busy || !configured || (reset && !recovery)}
                className="button primary full"
              >
                {busy ? (
                  <Loader2 className="spin" size={18} />
                ) : (
                  <>
                    {register
                      ? "Create my account"
                      : forgot
                        ? "Send reset link"
                        : reset
                          ? "Update password"
                          : "Log in"}
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          )}
          <div className="auth-switch">
            {register ? (
              <>
                Already have an account?{" "}
                <Link to={"/login?next=" + encodeURIComponent(next)}>
                  Log in
                </Link>
              </>
            ) : forgot || reset ? (
              <Link to="/forgot-password">Request a new reset link</Link>
            ) : (
              <>
                New to CloudCV?{" "}
                <Link to={"/register?next=" + encodeURIComponent(next)}>
                  Create an account
                </Link>
              </>
            )}
          </div>
          <div className="auth-secure">
            <ShieldCheck size={15} /> Securely stored. Entirely yours.
          </div>
        </div>
      </main>
    </div>
  );
}
