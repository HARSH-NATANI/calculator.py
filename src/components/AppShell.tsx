import { useEffect, useState } from "react";
import { Navigate, NavLink, Outlet, useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard,
  UserRound,
  FileText,
  LayoutTemplate,
  Globe,
  Settings,
  HelpCircle,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Plus,
  GraduationCap,
  BriefcaseBusiness,
  Wrench,
  Folder,
  Cloud,
} from "lucide-react";
import { sections } from "../lib/model";
import { useAuth } from "../lib/auth";
import { db } from "../lib/supabase";
import { Logo, Spinner, useToast } from "./UI";
import { errorMessage } from "../lib/api";
const links = [
  { to: "/dashboard", name: "Overview", icon: LayoutDashboard },
  { to: "/profile", name: "My profile", icon: UserRound },
  { to: "/documents", name: "My documents", icon: FileText },
  { to: "/templates", name: "Template gallery", icon: LayoutTemplate },
  { to: "/portfolio", name: "Portfolio builder", icon: Globe },
];
export default function AppShell() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const panel = document.querySelector<HTMLElement>(".app-sidebar");
    const previous = document.activeElement as HTMLElement;
    const focusable = () =>
      Array.from(
        panel?.querySelectorAll<HTMLElement>("a,button,summary") || [],
      ).filter((el) => el.getClientRects().length > 0);
    focusable()[0]?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
      }
      if (event.key === "Tab") {
        const items = focusable();
        const first = items[0],
          last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    const resize = () => {
      if (window.innerWidth > 700) setOpen(false);
    };
    document.addEventListener("keydown", keydown);
    window.addEventListener("resize", resize);
    return () => {
      document.removeEventListener("keydown", keydown);
      window.removeEventListener("resize", resize);
      previous?.focus();
    };
  }, [open]);
  if (loading) return <Spinner />;
  if (!user)
    return (
      <Navigate
        to={
          "/login?next=" +
          encodeURIComponent(location.pathname + location.search)
        }
        replace
      />
    );
  const name =
    user.user_metadata.full_name ||
    user.email?.split("@")[0] ||
    "Your workspace";
  const current =
    links.find((l) => location.pathname.startsWith(l.to))?.name || "Workspace";
  return (
    <div className="app-shell">
      <aside
        id="workspace-navigation"
        className={`app-sidebar ${open ? "open" : ""}`}
      >
        <div className="sidebar-logo">
          <Logo />
          <button
            className="icon-button mobile-menu"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
          >
            <X />
          </button>
        </div>
        <span className="sidebar-caption">YOUR WORKSPACE</span>
        <nav
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("a")) setOpen(false);
          }}
        >
          {links.map(({ to, name, icon: Icon }) => (
            <NavLink to={to} end={to === "/profile"} key={to}>
              <Icon size={19} />
              {name}
            </NavLink>
          ))}
          <div className="sidebar-profile-links">
            {[
              { to: "education", name: "Education", icon: GraduationCap },
              { to: "experience", name: "Experience", icon: BriefcaseBusiness },
              { to: "skills", name: "Skills", icon: Wrench },
              { to: "projects", name: "Projects", icon: Folder },
            ].map(({ to, name, icon: Icon }) => (
              <NavLink key={to} to={"/profile/" + to}>
                <Icon size={15} />
                {name}
              </NavLink>
            ))}
          </div>
          <details className="sidebar-more-sections">
            <summary>
              All profile sections <ChevronRight size={13} />
            </summary>
            <div className="sidebar-profile-links">
              {[
                { id: "personal", label: "Personal information" },
                { id: "summary", label: "Professional summary" },
                ...sections.filter(
                  (s) =>
                    !["education", "experience", "skills", "projects"].includes(
                      s.id,
                    ),
                ),
              ].map((s) => (
                <NavLink key={s.id} to={"/profile/" + s.id}>
                  <FileText size={14} />
                  {s.label}
                </NavLink>
              ))}
            </div>
          </details>
        </nav>
        <div className="sidebar-tip">
          <span className="sidebar-tip-icon">
            <Cloud size={22} />
          </span>
          <h4>
            One profile.
            <br />
            Every opportunity.
          </h4>
          <p>
            Keep your story up to date.
            <br />
            Your next move starts here.
          </p>
          <Link to="/profile">
            Complete your profile <ChevronRight size={15} />
          </Link>
        </div>
        <nav className="sidebar-bottom">
          <NavLink to="/settings">
            <Settings size={18} />
            Settings
          </NavLink>
          <NavLink to="/help">
            <HelpCircle size={18} />
            Help & support
          </NavLink>
          <button
            onClick={async () => {
              try {
                const { error } = await db().auth.signOut();
                if (error) throw error;
              } catch (e) {
                toast(errorMessage(e), true);
              }
            }}
          >
            <LogOut size={18} />
            Log out
          </button>
        </nav>
        <div className="sidebar-user">
          <span>{name.slice(0, 2).toUpperCase()}</span>
          <div>
            <strong>{name}</strong>
            <small>{user.email}</small>
          </div>
        </div>
      </aside>
      {open && (
        <button
          className="sidebar-overlay"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      )}
      <div className="app-body">
        <header className="app-topbar">
          <div>
            <button
              className="icon-button mobile-menu"
              onClick={() => setOpen(true)}
              aria-label="Open navigation"
              aria-expanded={open}
              aria-controls="workspace-navigation"
            >
              <Menu />
            </button>
            <span>Workspace</span>
            <ChevronRight size={13} />
            <strong>{current}</strong>
          </div>
          <Link className="button primary small" to="/documents/new">
            <Plus size={16} /> New document
          </Link>
        </header>
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
