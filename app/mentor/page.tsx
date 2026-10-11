"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardList, FileText, Star, ArrowUpRight, CheckCircle2, Clock } from "lucide-react";
import { getInitials, timeAgo, statusBadgeClass } from "@/lib/utils";

export default function MentorDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetch("/api/dashboard").then(r => r.json()).then(d => { setStats(d); setLoading(false); }); }, []);

  const tiles = [
    { label: "TASKS CREATED", value: stats?.totalTasks, color: "var(--accent)" },
    { label: "PENDING REVIEWS", value: stats?.pendingReviews, color: "var(--warning)" },
    { label: "WEEKLY REPORTS", value: stats?.totalReports, color: "var(--info)" },
    { label: "TASKS APPROVED", value: stats?.tasksByStatus?.APPROVED, color: "var(--success)" },
  ];

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <p className="section-label" style={{ marginBottom: 6 }}>MENTOR DASHBOARD</p>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 36, color: "var(--text-primary)", fontWeight: 400 }}>Your Dashboard</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 15, marginTop: 4 }}>Manage tasks, review submissions, and evaluate your interns.</p>
      </div>
      <hr className="divider" style={{ marginBottom: 32 }} />

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))", gap: 12, marginBottom: 28 }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 96 }} />)}
        </div>
      ) : (
        <div className="stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 32 }}>
          {tiles.map(t => (
            <div key={t.label} className="stat-tile anim-fade-up">
              <p className="stat-tile-label">{t.label}</p>
              <p className="stat-tile-value num" style={{ color: t.color }}>{t.value ?? "—"}</p>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
        {/* Pending reviews */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)" }}>Pending Reviews</h2>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>Submissions waiting for your feedback</p>
            </div>
            <Link href="/mentor/tasks" className="btn btn-ghost btn-sm" style={{ gap: 4 }}>View all <ArrowUpRight size={12} /></Link>
          </div>
          <div style={{ padding: "8px 0" }}>
            {loading ? (
              <div style={{ padding: "12px 20px", display: "flex", flexDirection: "column", gap: 10 }}>{[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 60 }} />)}</div>
            ) : !stats?.recentSubmissions?.length ? (
              <div className="empty-state" style={{ padding: "32px 24px" }}><CheckCircle2 size={28} /><h3>All caught up!</h3><p>No pending submissions to review.</p></div>
            ) : stats.recentSubmissions.map((sub: any) => (
              <div key={sub._id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 20px", borderBottom: "1px solid var(--border-subtle)" }}>
                <div style={{ width: 32, height: 32, borderRadius: "var(--radius-md)", background: "var(--success-10)", color: "var(--success)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 500, flexShrink: 0 }}>
                  {getInitials(sub.internId?.name || "?")}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub.taskId?.title}</p>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>{sub.internId?.name} · {timeAgo(sub.submittedAt)}</p>
                </div>
                <Link href="/mentor/tasks" className="btn btn-primary btn-sm">Review</Link>
              </div>
            ))}
          </div>
        </div>

        {/* Nav cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { href: "/mentor/tasks", label: "Tasks & Reviews", sub: "Create tasks, review submissions", icon: ClipboardList, color: "var(--accent)" },
            { href: "/mentor/reports", label: "Weekly Reports", sub: "View & give feedback", icon: FileText, color: "var(--info)" },
            { href: "/mentor/evaluations", label: "Evaluations", sub: "Score and finalize", icon: Star, color: "var(--warning)" },
          ].map(({ href, label, sub, icon: Icon, color }) => (
            <Link key={href} href={href} style={{ textDecoration: "none" }}>
              <div className="card" style={{ padding: 16, display: "flex", alignItems: "center", gap: 12, cursor: "pointer", transition: "border-color 150ms" }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--accent)")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border-default)")}>
                <div style={{ width: 36, height: 36, borderRadius: "var(--radius-md)", background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={16} color={color} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>{label}</p>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>{sub}</p>
                </div>
                <ArrowUpRight size={14} color="var(--text-tertiary)" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
