import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  Check,
  X,
  Loader2,
  Cloud,
  ArrowUpRight,
  Menu,
  ArrowRight,
} from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../lib/auth";
export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link
      to="/"
      className={`logo ${light ? "light" : ""}`}
      aria-label="CloudCV home"
    >
      <span className="logo-mark">
        <Cloud size={25} strokeWidth={1.7} />
        <Check size={11} className="logo-check" />
      </span>
      <span>
        cloud<span className="logo-cv">cv</span>
        <span className="logo-dot">.</span>
      </span>
    </Link>
  );
}
export function Header() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Logo />
        <nav
          className={open ? "public-nav open" : "public-nav"}
          aria-label="Main navigation"
          onClick={() => setOpen(false)}
        >
          <NavLink to="/" end>
            Home
          </NavLink>
          <a href="/#features">Features</a>
          <NavLink to="/templates">Templates</NavLink>
          <a href="/#how-it-works">How it works</a>
          <a href="/#plans">
            Plans <span className="free-pill">FREE</span>
          </a>
        </nav>
        <div className="header-actions">
          <Link className="login-link" to={user ? "/dashboard" : "/login"}>
            {user ? "Dashboard" : "Log in"}
          </Link>
          <Link
            className="button small primary"
            to={user ? "/documents/new" : "/register"}
          >
            {user ? "Create a resume" : "Get started"}
            <ArrowUpRight size={16} />
          </Link>
          <button
            className="icon-button mobile-menu"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label="Toggle navigation"
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
    </header>
  );
}
export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-main">
          <div>
            <Logo />
            <p>
              Your career. Your story.
              <br />
              One smart profile.
            </p>
          </div>
          <div>
            <h4>Product</h4>
            <Link to="/templates">Templates</Link>
            <a href="/#features">Features</a>
            <a href="/#how-it-works">How it works</a>
          </div>
          <div>
            <h4>CloudCV</h4>
            <Link to="/about">About us</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/help">Help center</Link>
          </div>
          <div className="footer-note">
            <span className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</span>
            <Link to="/register">
              Let’s make it a good one. <ArrowUpRight size={22} />
            </Link>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} CloudCV. Built for your next chapter.
          </span>
          <div>
            <Link to="/privacy">Privacy policy</Link>
            <Link to="/terms">Terms of service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
const ToastContext = createContext<(message: string, error?: boolean) => void>(
  () => {},
);
export const useToast = () => useContext(ToastContext);
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{
    message: string;
    error: boolean;
  } | null>(null);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(timer);
  }, [toast]);
  return (
    <ToastContext.Provider
      value={(message, error = false) => setToast({ message, error })}
    >
      {children}
      {toast && (
        <div
          className={`toast ${toast.error ? "error" : ""}`}
          role={toast.error ? "alert" : "status"}
        >
          {toast.error ? <X size={19} /> : <Check size={19} />}
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </ToastContext.Provider>
  );
}
export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const last = document.activeElement as HTMLElement;
    ref.current?.showModal();
    return () => last?.focus();
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? "wide" : ""}`}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-head">
        <h2>{title}</h2>
        <button
          className="icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Spinner({
  label = "Loading your workspace…",
}: {
  label?: string;
}) {
  return (
    <div className="loading" role="status">
      <Loader2 className="spin" />
      <span>{label}</span>
    </div>
  );
}
export function EmptyState({
  icon: Icon = Cloud,
  title,
  text,
  action,
  to,
}: {
  icon?: typeof Cloud;
  title: string;
  text: string;
  action?: string;
  to?: string;
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Icon size={30} />
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
      {to && (
        <Link className="button primary" to={to}>
          {action}
          <ArrowRight size={17} />
        </Link>
      )}
    </div>
  );
}
export function ErrorBox({ message }: { message: string }) {
  return (
    <div className="error-box" role="alert">
      {message}
    </div>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {children}
    </div>
  );
}
