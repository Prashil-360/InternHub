"use client";
import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, Layers, Users, ClipboardList, FileText,
  BarChart2, Settings, LogOut, Bell, Moon, Sun,
  Shield, GraduationCap, Star, TrendingUp, Award,
  UserCircle, ChevronDown, X
} from "lucide-react";
import { cn, getInitials, timeAgo } from "@/lib/utils";

/* ─── Theme helpers (localStorage-persisted) ─────────────── */
const THEME_KEY = "internhub-theme";

function getInitialTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "dark";
  return (localStorage.getItem(THEME_KEY) as "dark" | "light") || "dark";
}

function applyTheme(theme: "dark" | "light") {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);
}

/* ─── Nav config ─────────────────────────────────────────── */
const ADMIN_NAV = [
  { label: "OVERVIEW",     links: [{ href: "/admin",                      icon: LayoutDashboard, label: "Dashboard"         },
                                    { href: "/admin/analytics",            icon: BarChart2,       label: "Analytics"         },
                                    { href: "/admin/performance",          icon: TrendingUp,      label: "Performance"       }] },
  { label: "MANAGEMENT",   links: [{ href: "/admin/batches",              icon: Layers,          label: "Batches"           },
                                    { href: "/admin/users",                icon: Users,           label: "Users"             }] },
  { label: "CERTIFICATES", links: [{ href: "/admin/certificate-settings", icon: Award,           label: "Certificate Assets"}] },
  { label: "SYSTEM",       links: [{ href: "/admin/audit",                icon: Shield,          label: "Audit Log"         },
                                    { href: "/admin/settings",            icon: Settings,        label: "Settings"          }] },
];
const MENTOR_NAV = [
  { label: "OVERVIEW",   links: [{ href: "/mentor",           icon: LayoutDashboard, label: "Dashboard"       },
                                  { href: "/mentor/analytics", icon: BarChart2,       label: "Analytics"       },
                                  { href: "/mentor/performance",icon: TrendingUp,     label: "Performance"     }] },
  { label: "MY BATCHES", links: [{ href: "/mentor/batches",   icon: Layers,          label: "My Batches"      },
                                  { href: "/mentor/interns",   icon: Users,           label: "Intern Progress" }] },
  { label: "WORK",       links: [{ href: "/mentor/tasks",     icon: ClipboardList,   label: "Tasks & Reviews" },
                                  { href: "/mentor/reports",   icon: FileText,        label: "Weekly Reports"  },
                                  { href: "/mentor/evaluations",icon: Star,           label: "Evaluations"     }] },
];
const INTERN_NAV = [
  { label: "OVERVIEW", links: [{ href: "/intern",            icon: LayoutDashboard, label: "Dashboard"     }] },
  { label: "MY WORK",  links: [{ href: "/intern/tasks",      icon: ClipboardList,   label: "My Tasks"      },
                                 { href: "/intern/reports",   icon: FileText,        label: "Weekly Reports"},
                                 { href: "/intern/evaluation",icon: BarChart2,       label: "My Evaluation" }] },
];
const NAV_MAP: Record<string, typeof ADMIN_NAV> = { ADMIN: ADMIN_NAV, MENTOR: MENTOR_NAV, INTERN: INTERN_NAV };

const MOBILE_NAV: Record<string, Array<{ href: string; icon: any; label: string }>> = {
  ADMIN:  [
    { href: "/admin",              icon: LayoutDashboard, label: "Home"      },
    { href: "/admin/performance",  icon: TrendingUp,      label: "Analytics" },
    { href: "/admin/batches",      icon: Layers,          label: "Batches"   },
    { href: "/admin/users",        icon: Users,           label: "Users"     },
    { href: "/profile",            icon: UserCircle,      label: "Profile"   },
  ],
  MENTOR: [
    { href: "/mentor",             icon: LayoutDashboard, label: "Home"    },
    { href: "/mentor/performance", icon: TrendingUp,      label: "Perf"    },
    { href: "/mentor/batches",     icon: Layers,          label: "Batches" },
    { href: "/mentor/tasks",       icon: ClipboardList,   label: "Tasks"   },
    { href: "/profile",            icon: UserCircle,      label: "Profile" },
  ],
  INTERN: [
    { href: "/intern",            icon: LayoutDashboard, label: "Home"    },
    { href: "/intern/tasks",      icon: ClipboardList,   label: "Tasks"   },
    { href: "/intern/reports",    icon: FileText,        label: "Reports" },
    { href: "/intern/evaluation", icon: BarChart2,       label: "Score"   },
    { href: "/profile",           icon: UserCircle,      label: "Profile" },
  ],
};

/* ─── Page transition ────────────────────────────────────── */
function PageWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 40);
    return () => clearTimeout(t);
  }, [pathname]);
  return (
    <div style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(5px)", transition: "opacity 200ms ease-out, transform 200ms ease-out" }}>
      {children}
    </div>
  );
}

/* ─── Theme Toggle ───────────────────────────────────────── */
function ThemeToggle() {
  const [theme, setTheme] = useState<"dark"|"light">("dark");

  useEffect(() => {
    const stored = getInitialTheme();
    setTheme(stored);
    applyTheme(stored);
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  }

  return (
    <button onClick={toggle} aria-label="Toggle theme"
      style={{ width: 34, height: 34, border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", background: "var(--bg-tertiary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)", flexShrink: 0, transition: "all 150ms" }}>
      {theme === "dark" ? <Sun size={15} strokeWidth={1.5} /> : <Moon size={15} strokeWidth={1.5} />}
    </button>
  );
}

/* ─── Notification Bell ──────────────────────────────────── */
function NotifBell() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<any>({ notifications: [], unreadCount: 0 });
  const ref = useRef<HTMLDivElement>(null);

  async function load() { try { const r = await fetch("/api/notifications"); if (r.ok) setData(await r.json()); } catch {} }
  async function markAll() {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ markAll: true }) });
    setData((p: any) => ({ ...p, unreadCount: 0, notifications: p.notifications.map((n: any) => ({ ...n, read: true })) }));
  }
  useEffect(() => { load(); const t = setInterval(load, 30_000); return () => clearInterval(t); }, []);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => { setOpen(o => !o); if (!open) load(); }} aria-label="Notifications"
        style={{ width: 34, height: 34, border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", background: "var(--bg-tertiary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)", position: "relative", flexShrink: 0 }}>
        <Bell size={15} strokeWidth={1.5} />
        {data.unreadCount > 0 && (
          <span style={{ position: "absolute", top: -4, right: -4, background: "var(--error)", color: "#fff", fontSize: 9, fontWeight: 500, borderRadius: "var(--radius-pill)", minWidth: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" }}>
            {data.unreadCount > 9 ? "9+" : data.unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", width: 300, background: "var(--bg-secondary)", border: "1px solid var(--border-emphasis)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-strong)", zIndex: 200, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>Notifications</span>
            {data.unreadCount > 0 && <button onClick={markAll} style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: 12, fontFamily: "var(--font-sans)" }}>Mark all read</button>}
          </div>
          <div style={{ maxHeight: 340, overflowY: "auto" }}>
            {data.notifications.length === 0 ? (
              <div style={{ padding: "28px 16px", textAlign: "center", color: "var(--text-tertiary)", fontSize: 13 }}><Bell size={20} style={{ margin: "0 auto 8px", display: "block", opacity: 0.3 }} />No notifications</div>
            ) : data.notifications.map((n: any) => (
              <div key={n._id} style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-subtle)", background: n.read ? "transparent" : "var(--accent-10)" }}>
                <p style={{ fontSize: 13, fontWeight: n.read ? 400 : 500, color: "var(--text-primary)", marginBottom: 2 }}>{n.title}</p>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 4 }}>{n.message}</p>
                <p style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-tertiary)" }}>{timeAgo(n.createdAt)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Profile dropdown ───────────────────────────────────── */
function ProfileDropdown({ user }: { user: any }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const role = user?.role || "";
  const cc: Record<string, string> = { ADMIN: "#f5a623", MENTOR: "#6c77ff", INTERN: "#22c97b" };
  const c = cc[role] || "#6c77ff";

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ display: "flex", alignItems: "center", gap: 8, height: 36, padding: "0 10px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-default)", background: "var(--bg-tertiary)", cursor: "pointer", transition: "all 150ms" }}>
        {user?.avatarUrl
          ? <img src={user.avatarUrl} alt="" style={{ width: 24, height: 24, borderRadius: "var(--radius-sm)", objectFit: "cover" }} />
          : <div style={{ width: 24, height: 24, borderRadius: "var(--radius-sm)", background: c + "22", color: c, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 500, flexShrink: 0 }}>{getInitials(user?.name || "U")}</div>
        }
        <div className="desktop-only" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", lineHeight: 1.2, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.name}</span>
          <span style={{ fontSize: 10, color: "var(--text-tertiary)", lineHeight: 1.2 }}>{role}</span>
        </div>
        <ChevronDown size={12} color="var(--text-tertiary)" style={{ transition: "transform 150ms", transform: open ? "rotate(180deg)" : "none" }} />
      </button>
      {open && (
        <div style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", width: 200, background: "var(--bg-secondary)", border: "1px solid var(--border-emphasis)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-medium)", zIndex: 200, overflow: "hidden" }}>
          <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border-subtle)" }}>
            {user?.avatarUrl
              ? <img src={user.avatarUrl} alt="" style={{ width: 36, height: 36, borderRadius: "var(--radius-md)", objectFit: "cover", marginBottom: 8 }} />
              : <div style={{ width: 36, height: 36, borderRadius: "var(--radius-md)", background: c + "22", color: c, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 500, marginBottom: 8 }}>{getInitials(user?.name || "U")}</div>
            }
            <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.name}</p>
            <p style={{ fontSize: 11, color: "var(--text-tertiary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email}</p>
            <span style={{ fontSize: 10, marginTop: 4, display: "inline-block", padding: "1px 6px", borderRadius: "var(--radius-pill)", background: c + "22", color: c, fontWeight: 500 }}>{role}</span>
          </div>
          <div style={{ padding: 4 }}>
            <Link href="/profile" onClick={() => setOpen(false)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 10px", borderRadius: "var(--radius-sm)", fontSize: 13, color: "var(--text-secondary)", textDecoration: "none", transition: "all 150ms" }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-tertiary)"; e.currentTarget.style.color = "var(--text-primary)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; }}>
              <UserCircle size={14} /> My Profile
            </Link>
            <button onClick={() => { setOpen(false); signOut({ callbackUrl: "/login" }); }}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "9px 10px", borderRadius: "var(--radius-sm)", border: "none", background: "transparent", cursor: "pointer", fontSize: 13, color: "var(--error)", fontFamily: "var(--font-sans)", textAlign: "left", transition: "all 150ms" }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--error-10)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── NavItem — FIX: exact match for dashboard roots ─────── */
function NavItem({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
  const pathname = usePathname();

  // Roots that should ONLY be active on exact match (not prefix)
  const exactOnlyPaths = ["/admin", "/mentor", "/intern"];
  const active = exactOnlyPaths.includes(href)
    ? pathname === href
    : pathname === href || pathname.startsWith(href + "/");

  return (
    <Link href={href} style={{
      display: "flex", alignItems: "center", gap: 10, height: 37, padding: "0 10px 0 12px",
      borderRadius: "var(--radius-md)",
      borderLeft: `3px solid ${active ? "var(--accent)" : "transparent"}`,
      background: active ? "var(--accent-10)" : "transparent",
      color: active ? "var(--accent)" : "var(--text-secondary)",
      textDecoration: "none", fontSize: 13.5, transition: "all 150ms", marginLeft: -3,
    }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "var(--text-primary)"; } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; } }}>
      <Icon size={16} strokeWidth={active ? 2 : 1.5} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
    </Link>
  );
}

/* ─── Mobile NavItem ─────────────────────────────────────── */
function MobileNavItem({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
  const pathname = usePathname();
  const exactOnly = ["/admin", "/mentor", "/intern"];
  const active = exactOnly.includes(href)
    ? pathname === href
    : pathname === href || pathname.startsWith(href + "/");
  return (
    <Link href={href} className={cn("mobile-nav-item", active && "active")}>
      <Icon size={20} strokeWidth={active ? 2 : 1.5} />
      <span>{label}</span>
    </Link>
  );
}

/* ─── Sidebar ────────────────────────────────────────────── */
function Sidebar({ user, onClose }: { user: any; onClose: () => void }) {
  const role: string = user?.role || "";
  const router = useRouter();
  const navGroups = NAV_MAP[role] || [];

  function goHome() {
    router.push("/");
  }

  return (
    <aside style={{ position: "fixed", top: 0, left: 0, height: "100vh", width: 240, zIndex: 60, background: "var(--bg-secondary)", borderRight: "1px solid var(--border-default)", display: "flex", flexDirection: "column" }}>
      {/* Logo → homepage */}
      <div style={{ padding: "16px 14px 12px", borderBottom: "1px solid var(--border-subtle)", flexShrink: 0 }}>
        <button onClick={goHome} style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", padding: 0, borderRadius: "var(--radius-md)", transition: "opacity 150ms" }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "0.7")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
          <div style={{ width: 30, height: 30, borderRadius: "var(--radius-md)", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <GraduationCap size={15} color="#fff" />
          </div>
          <span style={{ fontFamily: "var(--font-serif)", fontSize: 17, color: "var(--text-primary)" }}>InternHub</span>
        </button>
      </div>

      {/* User → profile */}
      <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border-subtle)", flexShrink: 0 }}>
        <Link href="/profile" style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 9px", borderRadius: "var(--radius-md)", background: "var(--bg-tertiary)", textDecoration: "none", transition: "background 150ms" }}
          onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-quaternary)")}
          onMouseLeave={e => (e.currentTarget.style.background = "var(--bg-tertiary)")}>
          {user?.avatarUrl
            ? <img src={user.avatarUrl} alt="" style={{ width: 28, height: 28, borderRadius: "var(--radius-sm)", objectFit: "cover", flexShrink: 0 }} />
            : <div style={{ width: 28, height: 28, borderRadius: "var(--radius-md)", background: "var(--accent-20)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 500, flexShrink: 0 }}>{getInitials(user?.name || "U")}</div>
          }
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.name}</p>
            <p style={{ fontSize: 10, color: "var(--text-tertiary)" }}>View profile →</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "8px 14px", overflowY: "auto" }}>
        {navGroups.map((group, gi) => (
          <div key={gi} style={{ marginBottom: 18 }}>
            <p style={{ fontSize: 9.5, fontWeight: 500, letterSpacing: "0.08em", color: "var(--text-tertiary)", padding: "5px 10px 3px", textTransform: "uppercase" }}>{group.label}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {group.links.map(l => <NavItem key={l.href} href={l.href} icon={l.icon} label={l.label} />)}
            </div>
          </div>
        ))}
        <div style={{ marginBottom: 18 }}>
          <p style={{ fontSize: 9.5, fontWeight: 500, letterSpacing: "0.08em", color: "var(--text-tertiary)", padding: "5px 10px 3px", textTransform: "uppercase" }}>ACCOUNT</p>
          <NavItem href="/profile" icon={UserCircle} label="My Profile" />
        </div>
      </nav>

      {/* Sign out */}
      <div style={{ padding: "10px 14px", borderTop: "1px solid var(--border-subtle)", flexShrink: 0 }}>
        <button onClick={() => signOut({ callbackUrl: "/login" })}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, height: 36, padding: "0 10px 0 12px", borderRadius: "var(--radius-md)", border: "none", background: "transparent", cursor: "pointer", color: "var(--error)", fontSize: 13.5, fontFamily: "var(--font-sans)", transition: "background 150ms", borderLeft: "3px solid transparent" }}
          onMouseEnter={e => (e.currentTarget.style.background = "var(--error-10)")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
          <LogOut size={16} strokeWidth={1.5} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}

/* ─── Topbar ─────────────────────────────────────────────── */
function Topbar({ user }: { user: any }) {
  return (
    <header style={{ height: 54, position: "sticky", top: 0, zIndex: 40, background: "var(--bg-secondary)", borderBottom: "1px solid var(--border-default)", display: "flex", alignItems: "center", padding: "0 20px", gap: 10 }}>
      <div style={{ flex: 1 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <ThemeToggle />
        <NotifBell />
        <ProfileDropdown user={user} />
      </div>
    </header>
  );
}

/* ─── Mobile bottom nav ──────────────────────────────────── */
function MobileNav({ user }: { user: any }) {
  const role = user?.role || "";
  const links = MOBILE_NAV[role] || [];
  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
      <div className="mobile-bottom-nav-inner">
        {links.map(l => <MobileNavItem key={l.href} href={l.href} icon={l.icon} label={l.label} />)}
        <button onClick={() => signOut({ callbackUrl: "/login" })} className="mobile-nav-item" aria-label="Sign out">
          <LogOut size={20} strokeWidth={1.5} />
          <span>Out</span>
        </button>
      </div>
    </nav>
  );
}

/* ─── Mobile sidebar drawer ──────────────────────────────── */
function MobileSidebar({ user, open, onClose }: { user: any; open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", zIndex: 55 }} />
      <div style={{ position: "fixed", top: 0, left: 0, height: "100vh", width: 260, zIndex: 60, display: "flex", flexDirection: "column", animation: "slideInLeft 250ms ease-out" }}>
        <Sidebar user={user} onClose={onClose} />
      </div>
    </>
  );
}

/* ─── Shell ──────────────────────────────────────────────── */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = session?.user as any;
  const pathname = usePathname();

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Apply persisted theme on mount
  useEffect(() => {
    const stored = getInitialTheme();
    applyTheme(stored);
  }, []);

  if (status === "loading") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)", flexDirection: "column", gap: 16 }}>
        <div style={{ width: 40, height: 40, borderRadius: "var(--radius-md)", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <GraduationCap size={20} color="#fff" />
        </div>
        <div style={{ width: 24, height: 24, borderRadius: "50%", border: "2px solid var(--accent)", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      <div className="desktop-only" style={{ position: "fixed", top: 0, left: 0, width: 240, height: "100vh", zIndex: 50 }}>
        <Sidebar user={user} onClose={() => {}} />
      </div>
      <MobileSidebar user={user} open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="main-wrapper" style={{ marginLeft: 240, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <Topbar user={user} />
        <main id="main" style={{ flex: 1, padding: "28px 32px", maxWidth: 1280, width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
          <PageWrapper>{children}</PageWrapper>
        </main>
      </div>
      <MobileNav user={user} />
      <style>{`
        @media (max-width: 768px) { .main-wrapper { margin-left: 0 !important; } .main-wrapper main { padding: 16px 12px 90px !important; } }
        @media (min-width: 769px) and (max-width: 1024px) { .main-wrapper { margin-left: 200px !important; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.96) translateY(-4px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes slideInLeft { from { transform: translateX(-100%); } to { transform: translateX(0); } }
      `}</style>
    </div>
  );
}
