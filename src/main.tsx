import React, { Suspense, lazy, useEffect } from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./lib/auth";
import { ToastProvider, Spinner } from "./components/UI";
import AppShell from "./components/AppShell";
import Home from "./pages/Home";
import "./styles.css";
const Auth = lazy(() => import("./pages/Auth"));
const Templates = lazy(() => import("./pages/Templates"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Profile = lazy(() => import("./pages/Profile"));
const Documents = lazy(() => import("./pages/Documents"));
const Wizard = lazy(() => import("./pages/Wizard"));
const Editor = lazy(() => import("./pages/Editor"));
const Settings = lazy(() => import("./pages/Settings"));
const Info = lazy(() => import("./pages/Info"));
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title =
      pathname === "/"
        ? "CloudCV — Make your next move."
        : `${pathname.split("/")[1].replace(/^./, (s) => s.toUpperCase())} · CloudCV`;
  }, [pathname]);
  return null;
}
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <div className="empty-state">
        <h1>Let’s get you back on track.</h1>
        <p>
          The application encountered an unexpected error. Unsaved edits may
          need to be re-entered.
        </p>
        <button className="button primary" onClick={() => location.reload()}>
          Reload CloudCV
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <ScrollToTop />
            <Suspense fallback={<Spinner />}>
              <Routes>
                <Route path="/" element={<Home />} />
                {["login", "register", "forgot-password", "reset-password"].map(
                  (p) => (
                    <Route key={p} path={"/" + p} element={<Auth />} />
                  ),
                )}
                <Route path="/templates" element={<Templates />} />
                {["about", "privacy", "terms", "contact", "help"].map((p) => (
                  <Route key={p} path={"/" + p} element={<Info />} />
                ))}
                <Route element={<AppShell />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/profile/:section" element={<Profile />} />
                  <Route path="/documents" element={<Documents />} />
                  <Route path="/documents/new" element={<Wizard />} />
                  <Route path="/documents/:documentId" element={<Editor />} />
                  <Route path="/editor/:documentId" element={<Editor />} />
                  <Route path="/portfolio" element={<Wizard />} />
                  <Route
                    path="/templates/:templateId"
                    element={<TemplateRedirect />}
                  />
                  <Route path="/settings" element={<Settings />} />
                </Route>
                <Route path="*" element={<Info />} />
              </Routes>
            </Suspense>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);
function TemplateRedirect() {
  const { pathname } = useLocation();
  return (
    <Navigate
      to={"/documents/new?template=" + pathname.split("/").pop()}
      replace
    />
  );
}
