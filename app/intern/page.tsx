"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardList, FileText, BarChart2, ArrowUpRight } from "lucide-react";
import { statusBadgeClass } from "@/lib/utils";

export default function InternDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetch("/api/dashboard").then(r => r.json()).then(d => { setStats(d); setLoading(false); }); }, []);

  const completionRate = stats?.completionRate ?? 0;
  const r = 54, c = 2 * Math.PI * r;
  const filled = (completionRate / 100) * c;
  const rateColor = completionRate >= 75 ? "var(--success)" : completionRate >= 50 ? "var(--warning)" : "var(--error)";

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <p className="section-label" style={{ marginBottom: 6 }}>MY INTERNSHIP</p>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 36, color: "var(--text-primary)", fontWeight: 400 }}>Dashboard</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 15, marginTop: 4 }}>Track your tasks, reports, and overall progress.</p>
      </div>
      <hr className="divider" style={{ marginBottom: 32 }} />

      {/* Hero completion card */}
      <div className="card" style={{ padding: 28, marginBottom: 24, background: "linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)", display: "flex", alignItems: "center", gap: 28, flexWrap: "wrap" }}>
        <div style={{ position: "relative", width: 120, height: 120, flexShrink: 0 }}>
          <svg width={120} height={120} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={60} cy={60} r={r} fill="none" stroke="var(--bg-quaternary)" strokeWidth={10} />
            <circle cx={60} cy={60} r={r} fill="none" stroke={rateColor} strokeWidth={10}
              strokeDasharray={`${loading ? 0 : filled} ${c}`} strokeLinecap="round"
              style={{ transition: "stroke-dasharray 800ms ease-out" }} />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 24, fontFamily: "var(--font-mono)", fontWeight: 500, color: rateColor }}>{loading ? "—" : completionRate}%</span>
          </div>
        </div>
        <div>
          <h2 style={{ fontSize: 22, fontFamily: "var(--font-serif)", color: "var(--text-primary)", fontWeight: 400, marginBottom: 6 }}>Task Completion Rate</h2>
          <p style={{ fontSize: 15, color: "var(--text-secondary)", marginBottom: 16 }}>
            <span className="num" style={{ color: "var(--success)" }}>{stats?.approvedTasks ?? 0}</span> of{" "}
            <span className="num">{stats?.totalTasks ?? 0}</span> tasks approved by your mentor
          </p>
          <div style={{ display: "flex", gap: 20 }}>
            {[
              { label: "Pending", value: stats?.pendingTasks ?? 0, color: "var(--warning)" },
              { label: "Reports", value: stats?.totalReports ?? 0, color: "var(--accent)" },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <p style={{ fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</p>
                <p style={{ fontSize: 20, fontFamily: "var(--font-mono)", color }}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats row */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px,1fr))", gap: 12, marginBottom: 20 }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 88 }} />)}
        </div>
      ) : (
        <div className="stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 24 }}>
          {[
            { label: "TOTAL TASKS", value: stats?.totalTasks, color: "var(--accent)" },
            { label: "APPROVED", value: stats?.approvedTasks, color: "var(--success)" },
            { label: "PENDING", value: stats?.pendingTasks, color: "var(--warning)" },
            { label: "REPORTS", value: stats?.totalReports, color: "var(--info)" },
          ].map(t => (
            <div key={t.label} className="stat-tile anim-fade-up">
              <p className="stat-tile-label">{t.label}</p>
              <p className="stat-tile-value num" style={{ color: t.color }}>{t.value ?? "—"}</p>
            </div>
          ))}
        </div>
      )}

      {/* Task breakdown */}
      {stats?.tasksByStatus && (
        <div className="card card-body" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)", marginBottom: 14 }}>Task Status Breakdown</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {Object.entries(stats.tasksByStatus).map(([status, count]: any) => count > 0 && (
              <div key={status} className={statusBadgeClass(status)} style={{ fontSize: 13, padding: "4px 10px", gap: 6 }}>
                <span className="num">{count}</span>
                <span>{status.replace("_", " ")}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick nav */}
      <div className="stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        {[
          { href: "/intern/tasks", label: "My Tasks", sub: "View, start, and submit tasks with proof", icon: ClipboardList, color: "var(--accent)" },
          { href: "/intern/reports", label: "Weekly Reports", sub: "Submit your weekly progress updates", icon: FileText, color: "var(--info)" },
          { href: "/intern/evaluation", label: "My Evaluation", sub: "View your performance scores", icon: BarChart2, color: "var(--success)" },
        ].map(({ href, label, sub, icon: Icon, color }) => (
          <Link key={href} href={href} style={{ textDecoration: "none" }}>
            <div className="card anim-fade-up" style={{ padding: 20, cursor: "pointer", transition: "border-color 150ms" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--accent)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border-default)")}>
              <div style={{ width: 40, height: 40, borderRadius: "var(--radius-md)", background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                <Icon size={18} color={color} />
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)", marginBottom: 4 }}>{label}</h3>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 12 }}>{sub}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--accent)", fontSize: 13 }}>
                Open <ArrowUpRight size={12} />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
