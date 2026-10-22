"use client";
import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  GraduationCap, ArrowRight, X, Eye, EyeOff, Loader2,
  ClipboardList, BarChart2, FileText, Shield, Star,
  CheckCircle2, Users, Layers, ChevronDown, ChevronRight,
  Github, Link2, FileCheck, TrendingUp, Bell, Award
} from "lucide-react";
import { toast } from "sonner";

/* ── Auth Modal ───────────────────────────────────────────────── */
type ModalMode = "signin" | "signup" | null;

function AuthModal({ mode, onClose, onSuccess }: { mode: ModalMode; onClose: () => void; onSuccess: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState<"choose" | "email">("choose");
  const [loading, setLoading] = useState(false);

  // Sign-in form
  const [siEmail, setSiEmail] = useState("");
  const [siPw, setSiPw] = useState("");
  const [showPw, setShowPw] = useState(false);

  // Sign-up form
  const [suForm, setSuForm] = useState({ companyName: "", industry: "Technology", name: "", email: "", password: "", confirm: "" });
  const setSu = (k: string, v: string) => setSuForm(p => ({ ...p, [k]: v }));

  const isSignIn = mode === "signin";
  const title = isSignIn ? "Sign in to InternHub" : "Create your account";
  const sub = isSignIn ? "Access your internship dashboard" : "Set up InternHub for your organization";

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await signIn("credentials", { email: siEmail, password: siPw, redirect: false });
      if (res?.error) toast.error("Invalid email or password");
      else { toast.success("Welcome back!"); onSuccess(); }
    } finally { setLoading(false); }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (suForm.password !== suForm.confirm) { toast.error("Passwords don't match"); return; }
    if (suForm.password.length < 8) { toast.error("Min 8 characters"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName: suForm.companyName, industry: suForm.industry, name: suForm.name, email: suForm.email, password: suForm.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Account created! Please sign in.");
      onClose();
      setTimeout(() => router.push("/login"), 300);
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { setStep("choose"); }, [mode]);
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const inputStyle = {
    width: "100%", height: 44, padding: "0 14px", borderRadius: "var(--radius-md)",
    border: "1px solid var(--border-default)", background: "var(--bg-quaternary)",
    color: "var(--text-primary)", fontFamily: "var(--font-sans)", fontSize: 14, outline: "none",
    transition: "border-color 150ms",
  };

  return (
    <div className="auth-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
        {/* Close button */}
        <button onClick={onClose} style={{
          position: "absolute", top: 16, right: 16, width: 32, height: 32, borderRadius: "var(--radius-md)",
          border: "1px solid var(--border-default)", background: "var(--bg-tertiary)", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)",
          zIndex: 1,
        }} aria-label="Close">
          <X size={14} />
        </button>

        <div className="auth-modal-header">
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <div style={{ width: 28, height: 28, borderRadius: "var(--radius-sm)", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <GraduationCap size={14} color="#fff" />
            </div>
            <span style={{ fontFamily: "var(--font-serif)", fontSize: 16, color: "var(--text-primary)" }}>InternHub</span>
          </div>
          <h2 id="auth-modal-title" style={{ fontFamily: "var(--font-serif)", fontSize: 24, color: "var(--text-primary)", fontWeight: 400, marginBottom: 4 }}>
            {title}
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 0 }}>{sub}</p>
        </div>

        <div className="auth-modal-body">
          {step === "choose" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Primary CTA */}
              <button className="auth-provider-btn primary" onClick={() => setStep("email")} style={{ justifyContent: "center" }}>
                {isSignIn ? "Continue with Email" : "Sign up with Email"}
                <ArrowRight size={14} style={{ marginLeft: "auto" }} />
              </button>

              <div className="or-divider">or</div>

              {/* Role info */}
              <div style={{ background: "var(--bg-tertiary)", borderRadius: "var(--radius-md)", padding: "12px 14px", fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                {isSignIn ? (
                  <>
                    <strong style={{ color: "var(--text-primary)" }}>Mentors & Interns:</strong> Use the credentials sent to your email by your admin. You cannot self-register.
                  </>
                ) : (
                  <>
                    <strong style={{ color: "var(--text-primary)" }}>Company Admins only.</strong> Registering creates a new company account. Your work email is required (no gmail/yahoo).
                  </>
                )}
              </div>

              <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
                {isSignIn ? "Don't have an account?" : "Already have an account?"}{" "}
                <button onClick={() => { onClose(); setTimeout(() => {}, 10); }} style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: 13, fontFamily: "var(--font-sans)" }}>
                  {isSignIn ? "Register your company" : "Sign in instead"}
                </button>
              </p>
            </div>
          ) : isSignIn ? (
            /* Sign-in email form */
            <form onSubmit={handleSignIn} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <button type="button" onClick={() => setStep("choose")} style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: 13, fontFamily: "var(--font-sans)", textAlign: "left", padding: 0, marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
                ← Back
              </button>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>Email</label>
                <input type="email" style={inputStyle} value={siEmail} onChange={e => setSiEmail(e.target.value)}
                  placeholder="you@company.com" required
                  onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                  onBlur={e => (e.target.style.borderColor = "var(--border-default)")} />
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>Password</label>
                  <Link href="/forgot-password" style={{ fontSize: 12, color: "var(--accent)", textDecoration: "none" }} onClick={onClose}>Forgot?</Link>
                </div>
                <div style={{ position: "relative" }}>
                  <input type={showPw ? "text" : "password"} style={{ ...inputStyle, paddingRight: 44 }} value={siPw}
                    onChange={e => setSiPw(e.target.value)} placeholder="••••••••" required
                    onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                    onBlur={e => (e.target.style.borderColor = "var(--border-default)")} />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)" }}>
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="auth-provider-btn primary" style={{ justifyContent: "center", marginTop: 4 }}>
                {loading ? <Loader2 size={14} style={{ animation: "spin 0.8s linear infinite" }} /> : "Sign in"}
              </button>
            </form>
          ) : (
            /* Sign-up email form */
            <form onSubmit={handleSignUp} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <button type="button" onClick={() => setStep("choose")} style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: 13, fontFamily: "var(--font-sans)", textAlign: "left", padding: 0, marginBottom: 2, display: "flex", alignItems: "center", gap: 4 }}>
                ← Back
              </button>
              {[
                { label: "Company Name *", key: "companyName", placeholder: "Acme Technologies", type: "text" },
                { label: "Your Name *", key: "name", placeholder: "Full name", type: "text" },
                { label: "Work Email *", key: "email", placeholder: "you@company.com", type: "email" },
                { label: "Password *", key: "password", placeholder: "Min 8 characters", type: "password" },
                { label: "Confirm Password *", key: "confirm", placeholder: "Repeat password", type: "password" },
              ].map(({ label, key, placeholder, type }) => (
                <div key={key}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 5 }}>{label}</label>
                  <input type={type} style={inputStyle} placeholder={placeholder}
                    value={suForm[key as keyof typeof suForm]}
                    onChange={e => setSu(key, e.target.value)} required
                    onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                    onBlur={e => (e.target.style.borderColor = "var(--border-default)")} />
                </div>
              ))}
              <button type="submit" disabled={loading} className="auth-provider-btn primary" style={{ justifyContent: "center", marginTop: 4 }}>
                {loading ? <Loader2 size={14} style={{ animation: "spin 0.8s linear infinite" }} /> : "Create Account"}
              </button>
              <p style={{ fontSize: 11, color: "var(--text-tertiary)", textAlign: "center", lineHeight: 1.6 }}>
                Work emails only. No gmail/yahoo/hotmail.
              </p>
            </form>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ── Navbar ───────────────────────────────────────────────────── */
function Navbar({ onSignIn, onSignUp }: { onSignIn: () => void; onSignUp: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [dark, setDark] = useState(true);
  const [themeReady, setThemeReady] = useState(false);

  useEffect(() => {
    // Apply persisted theme only after mount to avoid hydration drift.
    try {
      const stored = localStorage.getItem("internhub-theme");
      const isLight = stored === "light";
      setDark(!isLight);
      document.documentElement.setAttribute("data-theme", isLight ? "light" : "dark");
    } catch {}
    setThemeReady(true);

    const h = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    const theme = next ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("internhub-theme", theme); } catch {}
  }

  return (
    <nav className={`landing-nav ${scrolled ? "scrolled" : ""}`}>
      <div className="landing-nav-inner">
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: "auto" }}>
          <div style={{ width: 32, height: 32, borderRadius: "var(--radius-md)", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <GraduationCap size={16} color="#fff" />
          </div>
          <span style={{ fontFamily: "var(--font-serif)", fontSize: 20, color: "var(--text-primary)" }}>InternHub</span>
        </div>

        {/* Nav links - desktop */}
        <div style={{ display: "flex", alignItems: "center", gap: 28, flex: 1, justifyContent: "center" }}>
          {["Features", "How it works", "Pricing", "FAQ"].map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`} style={{ fontSize: 14, color: "var(--text-secondary)", textDecoration: "none", transition: "color 150ms" }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--text-secondary)")}>
              {l}
            </a>
          ))}
        </div>

        {/* CTAs */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={toggleTheme} aria-label="Toggle theme" style={{ width: 34, height: 34, borderRadius: "var(--radius-md)", border: "1px solid var(--border-default)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)", flexShrink: 0, transition: "all 150ms" }}>
            {dark ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            )}
          </button>
          <button onClick={onSignIn} style={{ height: 36, padding: "0 18px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-default)", background: "transparent", color: "var(--text-primary)", fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 500, cursor: "pointer", transition: "all 150ms" }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-tertiary)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
            Sign in
          </button>
          <button onClick={onSignUp} style={{ height: 36, padding: "0 18px", borderRadius: "var(--radius-md)", background: "var(--accent)", color: "#fff", fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 500, cursor: "pointer", border: "none", transition: "background 150ms" }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--accent-hover)")}
            onMouseLeave={e => (e.currentTarget.style.background = "var(--accent)")}>
            Get started →
          </button>
        </div>
      </div>
    </nav>
  );
}

/* ── Product Illustration SVG ─────────────────────────────────── */
function ProductIllustration() {
  return (
    <div className="product-card" style={{ width: "100%", maxWidth: 560 }}>
      {/* Top bar */}
      <div style={{ background: "var(--bg-tertiary)", padding: "12px 16px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ display: "flex", gap: 5 }}>
          {["#ff5f57","#febc2e","#28c840"].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />)}
        </div>
        <div style={{ flex: 1, height: 24, background: "var(--bg-quaternary)", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", paddingLeft: 10, fontSize: 11, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>
          app.internhub.io/mentor/tasks
        </div>
      </div>

      {/* App shell */}
      <div style={{ display: "flex", height: 380, overflow: "hidden" }}>
        {/* Mini sidebar */}
        <div style={{ width: 52, background: "var(--bg-primary)", borderRight: "1px solid var(--border-subtle)", padding: "12px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div style={{ width: 28, height: 28, borderRadius: "var(--radius-sm)", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
            <GraduationCap size={13} color="#fff" />
          </div>
          {[BarChart2, ClipboardList, FileText, Star, Shield].map((Icon, i) => (
            <div key={i} style={{ width: 32, height: 32, borderRadius: "var(--radius-sm)", background: i === 1 ? "var(--accent-20)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <Icon size={14} color={i === 1 ? "var(--accent)" : "var(--text-tertiary)"} />
            </div>
          ))}
        </div>

        {/* Content area */}
        <div style={{ flex: 1, padding: 16, overflow: "hidden", background: "var(--bg-primary)" }}>
          {/* Page title row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 10, color: "var(--text-tertiary)", letterSpacing: "0.08em", marginBottom: 3 }}>MENTOR DASHBOARD</div>
              <div style={{ fontFamily: "var(--font-serif)", fontSize: 16, color: "var(--text-primary)" }}>Tasks & Reviews</div>
            </div>
            <div style={{ height: 26, padding: "0 10px", background: "var(--accent)", borderRadius: "var(--radius-sm)", fontSize: 11, color: "#fff", display: "flex", alignItems: "center", gap: 4 }}>
              <span>+</span> New Task
            </div>
          </div>

          {/* Stat row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 14 }}>
            {[
              { label: "TASKS", value: "24", color: "var(--accent)" },
              { label: "REVIEWS", value: "7", color: "var(--warning)" },
              { label: "APPROVED", value: "18", color: "var(--success)" },
            ].map(s => (
              <div key={s.label} style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", padding: "8px 10px" }}>
                <div style={{ fontSize: 9, color: "var(--text-tertiary)", letterSpacing: "0.06em", marginBottom: 3 }}>{s.label}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 18, color: s.color, fontWeight: 500 }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Task cards */}
          {[
            { title: "Build Auth API", intern: "Priya S.", status: "SUBMITTED", badge: "PENDING", badgeColor: "var(--warning)", dot: "var(--warning)" },
            { title: "Design DB Schema", intern: "Rahul M.", status: "IN PROGRESS", badge: "REVIEW", badgeColor: "var(--accent)", dot: "var(--accent)" },
            { title: "Setup CI/CD Pipeline", intern: "Aditya K.", status: "APPROVED", badge: "DONE", badgeColor: "var(--success)", dot: "var(--success)" },
          ].map((task, i) => (
            <div key={i} style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", padding: "9px 11px", marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: task.dot, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.title}</div>
                <div style={{ fontSize: 10, color: "var(--text-tertiary)", marginTop: 1 }}>{task.intern}</div>
              </div>
              <div style={{ fontSize: 9, padding: "2px 6px", borderRadius: "var(--radius-sm)", background: task.badgeColor + "20", color: task.badgeColor, fontWeight: 500, flexShrink: 0 }}>{task.badge}</div>
            </div>
          ))}

          {/* Review panel */}
          <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--accent-20)", borderRadius: "var(--radius-sm)", padding: "10px 11px", marginTop: 8 }}>
            <div style={{ fontSize: 10, color: "var(--accent)", letterSpacing: "0.06em", marginBottom: 6 }}>PENDING REVIEW · Priya Sharma</div>
            <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 8 }}>JWT auth implemented. GitHub: /intern/auth-api</div>
            <div style={{ display: "flex", gap: 6 }}>
              <div style={{ flex: 1, height: 22, background: "var(--success)", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", fontWeight: 500 }}>
                ✓ Approve
              </div>
              <div style={{ flex: 1, height: 22, background: "var(--bg-tertiary)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "var(--text-secondary)" }}>
                ↩ Rework
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating notification badge */}
      <div style={{
        position: "absolute", top: 56, right: -12,
        background: "var(--bg-secondary)", border: "1px solid var(--border-emphasis)",
        borderRadius: "var(--radius-md)", padding: "8px 12px",
        boxShadow: "var(--shadow-medium)", fontSize: 12, color: "var(--text-primary)",
        display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap",
      }}>
        <Bell size={12} color="var(--accent)" />
        <span>Priya submitted a task</span>
        <span style={{ fontSize: 10, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>2m ago</span>
      </div>

      {/* Floating eval badge */}
      <div style={{
        position: "absolute", bottom: 56, left: -16,
        background: "var(--bg-secondary)", border: "1px solid var(--border-emphasis)",
        borderRadius: "var(--radius-md)", padding: "8px 12px",
        boxShadow: "var(--shadow-medium)", fontSize: 12, color: "var(--text-primary)",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <Award size={12} color="var(--success)" />
        <span>Rahul scored <strong style={{ fontFamily: "var(--font-mono)", color: "var(--success)" }}>87/100</strong></span>
      </div>
    </div>
  );
}

/* ── FAQ Item ──────────────────────────────────────────────────── */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="faq-item">
      <button className="faq-question" onClick={() => setOpen(!open)} aria-expanded={open}>
        {q}
        <ChevronDown size={16} style={{ flexShrink: 0, transition: "transform 200ms", transform: open ? "rotate(180deg)" : "rotate(0deg)", color: "var(--text-tertiary)" }} />
      </button>
      <div className={`faq-answer ${open ? "open" : ""}`}>
        <p className="faq-answer-inner">{a}</p>
      </div>
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────────────── */
function HomePageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [modal, setModal] = useState<ModalMode>(null);
  const [mounted, setMounted] = useState(false);

  const searchParams = useSearchParams();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Open modal if redirected from /login or /register
  useEffect(() => {
    if (searchParams?.get("signin") === "true") setModal("signin");
    if (searchParams?.get("signup") === "true") setModal("signup");
  }, [searchParams]);

  // Redirect if already logged in
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const role = (session.user as any).role;
      if (role === "ADMIN") router.push("/admin");
      else if (role === "MENTOR") router.push("/mentor");
      else if (role === "INTERN") router.push("/intern");
    }
  }, [status, session, router]);

  function handleAuthSuccess() {
    setModal(null);
    router.push("/");
    router.refresh();
  }

  if (!mounted || status === "loading") return null;

  const features = [
    { icon: ClipboardList, color: "var(--accent)", title: "Proof-Based Task Management", desc: "Interns submit tasks with mandatory GitHub links, deployed URLs, or documents. No more 'I did the work' without evidence.", bg: "var(--accent-10)" },
    { icon: Shield, color: "var(--success)", title: "Multi-Layer Verification", desc: "Interns submit → Mentor reviews → Approve or request rework. Tasks can't be self-completed. Every submission is traceable.", bg: "var(--success-10)" },
    { icon: FileText, color: "var(--info)", title: "Weekly Progress Reports", desc: "Structured weekly check-ins tied to actual tasks. Mentors cross-check reports against real submissions automatically.", bg: "var(--info-10)" },
    { icon: BarChart2, color: "var(--warning)", title: "Data-Driven Evaluations", desc: "6-criteria weighted scoring: Code Quality, Consistency, Timeliness, Problem Solving, Communication, Learning Attitude.", bg: "var(--warning-10)" },
    { icon: Bell, color: "#e879f9", title: "Real-Time Notifications", desc: "In-app bell + email alerts for every event: task assigned, submission reviewed, evaluation complete, report submitted.", bg: "rgba(232,121,249,0.10)" },
    { icon: Award, color: "#fb7185", title: "Completion Certificates", desc: "Auto-generated, branded PDF certificates with score, grade, mentor signature — emailed to interns upon completion.", bg: "rgba(251,113,133,0.10)" },
  ];

  const steps = [
    { n: "01", title: "Admin Creates Batch", desc: "Set duration, add mentors & interns via email invite" },
    { n: "02", title: "Mentor Assigns Tasks", desc: "Weekly tasks with deadlines, priority & required proof type" },
    { n: "03", title: "Intern Submits Proof", desc: "GitHub links, URLs, docs — not just text descriptions" },
    { n: "04", title: "Mentor Reviews", desc: "Approve or request rework with structured feedback" },
    { n: "05", title: "Final Evaluation", desc: "Weighted scoring, completion certificate, program ends" },
  ];

  const stats = [
    { value: "3", label: "User Roles" }, { value: "100%", label: "Proof-Based" },
    { value: "6", label: "Eval Criteria" }, { value: "48h", label: "Invite Expiry" },
    { value: "Real-Time", label: "Notifications" }, { value: "PDF", label: "Certificates" },
    { value: "Audit", label: "Log Every Action" }, { value: "JWT", label: "Secure Sessions" },
  ];

  const faqs = [
    { q: "How do interns and mentors get access?", a: "The Admin creates their accounts and invites them via email. They receive a link to set their password — no self-registration for these roles. This ensures only verified team members can access the platform." },
    { q: "What happens if an intern submits fake work?", a: "Submission requires a valid proof link (GitHub repo, deployed URL, Google Doc, etc.). The mentor must open and verify the link before approving. Tasks cannot be marked complete by the intern themselves." },
    { q: "Can one company have multiple batches?", a: "Yes. You can run multiple simultaneous batches — Summer 2026, Winter 2026, etc. Each has its own mentors, interns, tasks, and evaluations completely isolated from others." },
    { q: "Is the platform free to use?", a: "InternHub is open-source. You self-host it on any Node.js platform. You only pay for your MongoDB Atlas cluster (free tier works), email SMTP, and optionally Cloudinary for file uploads." },
    { q: "Can I customize the evaluation criteria?", a: "Each batch gets the default 6 criteria (Code Quality, Consistency, Timeliness, Problem Solving, Communication, Learning). The weights are configurable per batch by the admin." },
    { q: "What kind of email notifications are sent?", a: "Invite emails, task assigned, task reviewed (approved/rework), weekly report submitted, evaluation complete with final score, and certificate delivery — all with branded HTML templates." },
  ];

  return (
    <div style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
      <Navbar onSignIn={() => setModal("signin")} onSignUp={() => setModal("signup")} />

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", paddingTop: 64, position: "relative", overflow: "hidden" }}>
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />

        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "80px 40px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center", width: "100%" }}>
          {/* Left copy */}
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 12px", border: "1px solid var(--accent-20)", borderRadius: "var(--radius-pill)", background: "var(--accent-10)", marginBottom: 24 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", animation: "pulse 2s ease-in-out infinite" }} />
              <span style={{ fontSize: 12, color: "var(--accent)", fontWeight: 500, letterSpacing: "0.04em" }}>INTERN MANAGEMENT · BUILT FOR COMPANIES</span>
            </div>

            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 56, color: "var(--text-primary)", lineHeight: 1.1, letterSpacing: "-0.02em", marginBottom: 20, fontWeight: 400 }}>
              Manage interns<br />
              <span style={{ color: "var(--accent)" }}>like a pro.</span>
            </h1>

            <p style={{ fontSize: 18, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 32, maxWidth: 440 }}>
              Replace WhatsApp chaos and Excel sheets with a structured platform for task tracking, proof-based submissions, weekly reports, and data-driven evaluations.
            </p>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 40 }}>
              <button onClick={() => setModal("signup")} style={{ height: 48, padding: "0 28px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", fontFamily: "var(--font-sans)", fontSize: 15, fontWeight: 500, cursor: "pointer", transition: "background 150ms", display: "flex", alignItems: "center", gap: 8 }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--accent-hover)")}
                onMouseLeave={e => (e.currentTarget.style.background = "var(--accent)")}>
                Start for free <ArrowRight size={16} />
              </button>
              <button onClick={() => setModal("signin")} style={{ height: 48, padding: "0 28px", background: "transparent", color: "var(--text-primary)", border: "1px solid var(--border-emphasis)", borderRadius: "var(--radius-md)", fontFamily: "var(--font-sans)", fontSize: 15, fontWeight: 500, cursor: "pointer", transition: "all 150ms" }}
                onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-tertiary)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                Sign in
              </button>
            </div>

            {/* Social proof */}
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ display: "flex" }}>
                {["#6c77ff","#22c97b","#f5a623","#fb7185"].map((c, i) => (
                  <div key={c} style={{ width: 28, height: 28, borderRadius: "50%", background: c, border: "2px solid var(--bg-primary)", marginLeft: i > 0 ? -8 : 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff", fontWeight: 500 }}>
                    {["A","M","I","A"][i]}
                  </div>
                ))}
              </div>
              <div>
                <div style={{ display: "flex", gap: 2, marginBottom: 2 }}>
                  {[1,2,3,4,5].map(s => <span key={s} style={{ color: "#f5a623", fontSize: 12 }}>★</span>)}
                </div>
                <p style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Used by real internship programs</p>
              </div>
            </div>
          </div>

          {/* Right product illustration */}
          <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
            <ProductIllustration />
          </div>
        </div>
      </section>

      {/* ── STATS TICKER ──────────────────────────────────────── */}
      <div className="ticker-wrapper">
        <div className="ticker-track">
          {[...stats, ...stats].map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 32, padding: "0 40px", whiteSpace: "nowrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 20, color: "var(--accent)", fontWeight: 500 }}>{s.value}</span>
                <span style={{ fontSize: 13, color: "var(--text-secondary)", marginLeft: 8 }}>{s.label}</span>
              </div>
              <div style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--border-emphasis)" }} />
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURES ──────────────────────────────────────────── */}
      <section id="features" style={{ padding: "100px 40px", maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <p style={{ fontSize: 11, letterSpacing: "0.08em", color: "var(--text-tertiary)", textTransform: "uppercase", marginBottom: 12 }}>FEATURES</p>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 42, color: "var(--text-primary)", fontWeight: 400, marginBottom: 16 }}>
            Everything you need to run<br />a serious internship program
          </h2>
          <p style={{ fontSize: 16, color: "var(--text-secondary)", maxWidth: 520, margin: "0 auto", lineHeight: 1.7 }}>
            Built from real internship pain points. No more WhatsApp groups, Excel tracking, or "trust me I did it."
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
          {features.map((f, i) => (
            <div key={i} className="feature-card reveal" style={{ animationDelay: `${i * 60}ms` }}>
              <div style={{ width: 44, height: 44, borderRadius: "var(--radius-md)", background: f.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <f.icon size={20} color={f.color} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 500, color: "var(--text-primary)", marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────── */}
      <section id="how-it-works" style={{ background: "var(--bg-secondary)", borderTop: "1px solid var(--border-subtle)", borderBottom: "1px solid var(--border-subtle)", padding: "100px 40px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <p style={{ fontSize: 11, letterSpacing: "0.08em", color: "var(--text-tertiary)", textTransform: "uppercase", marginBottom: 12 }}>HOW IT WORKS</p>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 42, color: "var(--text-primary)", fontWeight: 400 }}>
              From zero to running internship in minutes
            </h2>
          </div>

          <div style={{ display: "flex", alignItems: "flex-start", gap: 0, flexWrap: "wrap" }}>
            {steps.map((step, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", flex: 1, minWidth: 180 }}>
                <div style={{ flex: 1, textAlign: "center", padding: "0 12px" }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", border: "2px solid var(--accent-20)", background: "var(--accent-10)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--accent)", fontWeight: 500 }}>
                    {step.n}
                  </div>
                  <h3 style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)", marginBottom: 6 }}>{step.title}</h3>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{step.desc}</p>
                </div>
                {i < steps.length - 1 && (
                  <div style={{ width: 40, height: 1, background: "linear-gradient(90deg, var(--accent-20), transparent)", marginTop: 24, flexShrink: 0 }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROLES ─────────────────────────────────────────────── */}
      <section style={{ padding: "100px 40px", maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <p style={{ fontSize: 11, letterSpacing: "0.08em", color: "var(--text-tertiary)", textTransform: "uppercase", marginBottom: 12 }}>3 ROLES, ONE PLATFORM</p>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 42, color: "var(--text-primary)", fontWeight: 400 }}>Everyone has their place</h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {[
            {
              role: "Admin / HR", color: "#f5a623", icon: Users,
              powers: ["Create internship batches", "Add mentors & interns via email", "View audit log of all actions", "Monitor company-wide stats", "Manage all batch settings"],
            },
            {
              role: "Mentor", color: "var(--accent)", icon: Star,
              powers: ["Create weekly tasks with deadlines", "Set required proof type per task", "Review & approve submissions", "Give feedback on weekly reports", "Score interns on 6 criteria"],
            },
            {
              role: "Intern", color: "var(--success)", icon: GraduationCap,
              powers: ["View all assigned tasks", "Submit with GitHub/URL/Doc proof", "Mark tasks as In Progress", "Submit weekly progress reports", "View evaluation score & certificate"],
            },
          ].map(({ role, color, icon: Icon, powers }) => (
            <div key={role} style={{ background: "var(--bg-secondary)", border: `1px solid ${color}30`, borderRadius: "var(--radius-xl)", padding: 28, transition: "transform 200ms" }}>
              <div style={{ width: 44, height: 44, borderRadius: "var(--radius-md)", background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <Icon size={20} color={color} />
              </div>
              <h3 style={{ fontSize: 18, fontFamily: "var(--font-serif)", color: "var(--text-primary)", marginBottom: 16, fontWeight: 400 }}>{role}</h3>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                {powers.map(p => (
                  <li key={p} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 14, color: "var(--text-secondary)" }}>
                    <CheckCircle2 size={14} color={color} style={{ flexShrink: 0, marginTop: 1 }} />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING ───────────────────────────────────────────── */}
      <section id="pricing" style={{ background: "var(--bg-secondary)", borderTop: "1px solid var(--border-subtle)", borderBottom: "1px solid var(--border-subtle)", padding: "100px 40px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <p style={{ fontSize: 11, letterSpacing: "0.08em", color: "var(--text-tertiary)", textTransform: "uppercase", marginBottom: 12 }}>PRICING</p>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 42, color: "var(--text-primary)", fontWeight: 400, marginBottom: 12 }}>Open source. Self-hosted. Free.</h2>
            <p style={{ fontSize: 16, color: "var(--text-secondary)", maxWidth: 480, margin: "0 auto" }}>
              InternHub is free and open source. You only pay for the infrastructure you use.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
            {[
              { name: "Starter", price: "₹0", desc: "MongoDB Atlas Free Tier", features: ["Up to 3 batches", "Unlimited users", "All features included", "Community support"], cta: "Get started free", variant: "secondary" },
              { name: "Self-Hosted", price: "₹0", desc: "Your own infrastructure", features: ["Unlimited batches", "Unlimited users", "Custom domain", "Full source code"], cta: "Deploy now →", variant: "primary", featured: true },
              { name: "Enterprise", price: "Custom", desc: "Managed hosting available", features: ["Dedicated database", "Priority support", "Custom onboarding", "SLA guarantee"], cta: "Contact us", variant: "secondary" },
            ].map(p => (
              <div key={p.name} className={`pricing-card ${p.featured ? "featured" : ""}`}>
                {p.featured && (
                  <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "var(--accent)", color: "#fff", fontSize: 11, padding: "3px 12px", borderRadius: "var(--radius-pill)", fontWeight: 500, whiteSpace: "nowrap" }}>
                    RECOMMENDED
                  </div>
                )}
                <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 4 }}>{p.name}</p>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 36, color: "var(--text-primary)", marginBottom: 4 }}>{p.price}</p>
                <p style={{ fontSize: 13, color: "var(--text-tertiary)", marginBottom: 20 }}>{p.desc}</p>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                  {p.features.map(f => (
                    <li key={f} style={{ display: "flex", gap: 8, fontSize: 14, color: "var(--text-secondary)" }}>
                      <CheckCircle2 size={14} color="var(--success)" style={{ flexShrink: 0, marginTop: 1 }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => setModal("signup")} style={{
                  width: "100%", height: 40, borderRadius: "var(--radius-md)", cursor: "pointer",
                  fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 500, transition: "all 150ms",
                  background: p.variant === "primary" ? "var(--accent)" : "var(--bg-tertiary)",
                  color: p.variant === "primary" ? "#fff" : "var(--text-primary)",
                  border: p.variant === "secondary" ? "1px solid var(--border-default)" : "none",
                }}>
                  {p.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────── */}
      <section id="faq" style={{ padding: "100px 40px", maxWidth: 760, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <p style={{ fontSize: 11, letterSpacing: "0.08em", color: "var(--text-tertiary)", textTransform: "uppercase", marginBottom: 12 }}>FAQ</p>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 42, color: "var(--text-primary)", fontWeight: 400 }}>Common questions</h2>
        </div>
        {faqs.map(f => <FaqItem key={f.q} q={f.q} a={f.a} />)}
      </section>

      {/* ── CTA FOOTER ────────────────────────────────────────── */}
      <section style={{ background: "var(--bg-secondary)", borderTop: "1px solid var(--border-subtle)", padding: "100px 40px", textAlign: "center" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div style={{ width: 56, height: 56, borderRadius: "var(--radius-lg)", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
            <GraduationCap size={24} color="#fff" />
          </div>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 44, color: "var(--text-primary)", fontWeight: 400, marginBottom: 16 }}>
            Ready to transform your<br />internship program?
          </h2>
          <p style={{ fontSize: 16, color: "var(--text-secondary)", marginBottom: 32, lineHeight: 1.7 }}>
            Join companies using InternHub to bring structure, accountability, and data to their internship programs.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => setModal("signup")} style={{ height: 48, padding: "0 32px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", fontFamily: "var(--font-sans)", fontSize: 15, fontWeight: 500, cursor: "pointer", transition: "background 150ms", display: "flex", alignItems: "center", gap: 8 }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--accent-hover)")}
              onMouseLeave={e => (e.currentTarget.style.background = "var(--accent)")}>
              Start for free <ArrowRight size={16} />
            </button>
            <button onClick={() => setModal("signin")} style={{ height: 48, padding: "0 32px", background: "transparent", color: "var(--text-primary)", border: "1px solid var(--border-emphasis)", borderRadius: "var(--radius-md)", fontFamily: "var(--font-sans)", fontSize: 15, fontWeight: 500, cursor: "pointer" }}>
              Sign in
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────── */}
      <footer style={{ background: "var(--bg-primary)", borderTop: "1px solid var(--border-subtle)", padding: "48px 40px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 40 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: "var(--radius-sm)", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <GraduationCap size={14} color="#fff" />
              </div>
              <span style={{ fontFamily: "var(--font-serif)", fontSize: 16, color: "var(--text-primary)" }}>InternHub</span>
            </div>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, maxWidth: 240 }}>
              The professional intern management & evaluation platform. Structured. Accountable. Data-driven.
            </p>
          </div>
          {[
            { label: "Product", links: ["Features", "How it works", "Pricing", "FAQ"] },
            { label: "Platform", links: ["Admin Dashboard", "Mentor Tools", "Intern Portal", "Certificates"] },
            { label: "Legal", links: ["Privacy Policy", "Terms of Service", "Security", "Contact"] },
          ].map(col => (
            <div key={col.label}>
              <p style={{ fontSize: 12, fontWeight: 500, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>{col.label}</p>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                {col.links.map(l => (
                  <li key={l}><a href="#" style={{ fontSize: 14, color: "var(--text-secondary)", textDecoration: "none", transition: "color 150ms" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
                    onMouseLeave={e => (e.currentTarget.style.color = "var(--text-secondary)")}>{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ maxWidth: 1280, margin: "32px auto 0", paddingTop: 24, borderTop: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontSize: 13, color: "var(--text-tertiary)" }}>© 2026 InternHub. Open source, self-hosted.</p>
          <p style={{ fontSize: 13, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>v2.0.0</p>
        </div>
      </footer>

      {/* Auth Modal */}
      {modal && (
        <AuthModal mode={modal} onClose={() => setModal(null)} onSuccess={handleAuthSuccess} />
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 900px) {
          section > div { grid-template-columns: 1fr !important; }
          .product-card { max-width: 100% !important; }
        }
      `}</style>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomePageContent />
    </Suspense>
  );
}
