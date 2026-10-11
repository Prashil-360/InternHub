"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Layers, Users, CheckCircle2, TrendingUp, ArrowUpRight, Plus, Activity, Calendar, Zap } from "lucide-react";
import { formatDate, statusBadgeClass, getInitials } from "@/lib/utils";

function StatTile({ label, value, sub, icon: Icon, color }: any) {
  return (
    <div className="stat-tile anim-fade-up">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <p className="stat-tile-label">{label}</p>
        <div style={{ width: 32, height: 32, borderRadius: "var(--radius-md)", background: color + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={16} color={color} />
        </div>
      </div>
      <p className="stat-tile-value num">{value ?? "—"}</p>
      {sub && <p className="stat-tile-delta">{sub}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<any>(null);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const user = session?.user as any;

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard").then(r => r.json()),
      fetch("/api/batches").then(r => r.json()),
    ]).then(([d, b]) => {
      setStats(d);
      setBatches(Array.isArray(b) ? b : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const activeBatches = batches.filter(b => b.currentStatus === "ONGOING");
  const plannedBatches = batches.filter(b => b.currentStatus === "PLANNED");

  return (
    <div>
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 12 }}>
        <div>
          <p className="section-label" style={{ marginBottom: 6 }}>ADMIN DASHBOARD</p>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 36, color: "var(--text-primary)", fontWeight: 400, marginBottom: 6 }}>
            Good to see you, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 15 }}>Here's an overview of your internship program.</p>
        </div>
        <Link href="/admin/batches" className="btn btn-primary" style={{ flexShrink: 0, gap: 6 }}>
          <Zap size={14} /> New Program
        </Link>
      </div>

      <hr className="divider" style={{ marginBottom: 32 }} />

      {/* Stats */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))", gap: 16, marginBottom: 32 }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 100 }} />)}
        </div>
      ) : (
        <div className="stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
          <StatTile label="TOTAL BATCHES" value={stats?.totalBatches} sub={`${stats?.ongoingBatches ?? 0} ongoing`} icon={Layers} color="var(--accent)" />
          <StatTile label="TOTAL INTERNS" value={stats?.totalInterns} sub={`${stats?.totalMentors ?? 0} mentors`} icon={Users} color="var(--success)" />
          <StatTile label="TASKS APPROVED" value={stats?.approvedTasks} sub={`of ${stats?.totalTasks ?? 0} total`} icon={CheckCircle2} color="var(--warning)" />
          <StatTile label="COMPLETED" value={stats?.completedBatches} sub="batches" icon={TrendingUp} color="var(--info)" />
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, marginBottom: 24, flexWrap: "wrap" }}>
        {/* Recent batches table */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)" }}>Recent Batches</h2>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>Latest internship cohorts</p>
            </div>
            <Link href="/admin/batches" className="btn btn-ghost btn-sm" style={{ gap: 4 }}>
              View all <ArrowUpRight size={12} />
            </Link>
          </div>
          <div>
            {loading ? (
              <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
                {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 56 }} />)}
              </div>
            ) : !stats?.recentBatches?.length ? (
              <div className="empty-state" style={{ padding: "48px 24px" }}>
                <Layers size={32} />
                <h3>No batches yet</h3>
                <p>Create your first program with the guided wizard.</p>
                <Link href="/admin/batches" className="btn btn-primary btn-sm"><Plus size={12} /> Create Program</Link>
              </div>
            ) : (
              <table className="table">
                <thead><tr>
                  <th>Batch</th><th>Status</th><th>Interns</th><th>Mentors</th><th>Started</th>
                </tr></thead>
                <tbody>
                  {stats.recentBatches.map((b: any) => (
                    <tr key={b._id} style={{ cursor: "pointer" }} onClick={() => window.location.href = `/admin/batches/${b._id}`}>
                      <td>
                        <p style={{ fontWeight: 500, color: "var(--text-primary)", fontSize: 14 }}>{b.name}</p>
                        {b.description && <p style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 2 }}>{b.description.slice(0, 40)}…</p>}
                      </td>
                      <td><span className={statusBadgeClass(b.currentStatus)}>{b.currentStatus}</span></td>
                      <td><span className="num" style={{ fontSize: 14 }}>{b.internIds?.length ?? 0}</span></td>
                      <td><span className="num" style={{ fontSize: 14 }}>{b.mentorIds?.length ?? 0}</span></td>
                      <td style={{ fontSize: 13, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>{formatDate(b.startDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card card-body">
            <h3 style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)", marginBottom: 16 }}>Quick Actions</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { href: "/admin/batches", label: "Launch new program", icon: Zap, accent: true },
                { href: "/admin/users", label: "View all users", icon: Users },
                { href: "/admin/audit", label: "View audit log", icon: Activity },
              ].map(a => (
                <Link key={a.href} href={a.href} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 12px", borderRadius: "var(--radius-md)",
                  background: a.accent ? "var(--accent-10)" : "var(--bg-tertiary)",
                  border: `1px solid ${a.accent ? "var(--accent-20)" : "var(--border-subtle)"}`,
                  textDecoration: "none", color: a.accent ? "var(--accent)" : "var(--text-secondary)",
                  fontSize: 14, transition: "all 150ms",
                }}>
                  <a.icon size={14} />
                  {a.label}
                  <ArrowUpRight size={12} style={{ marginLeft: "auto", opacity: 0.5 }} />
                </Link>
              ))}
            </div>
          </div>

          <div className="card card-body" style={{ background: "var(--accent-10)", border: "1px solid var(--accent-20)" }}>
            <p className="section-label" style={{ color: "var(--accent)", marginBottom: 8 }}>PROGRAM FLOW</p>
            <ol style={{ display: "flex", flexDirection: "column", gap: 8, paddingLeft: 16 }}>
              {["Create program via wizard", "Mentor gets invite email", "Interns get invite emails", "Mentor assigns weekly tasks", "Interns submit with proof", "Mentor reviews & evaluates"].map((s, i) => (
                <li key={i} style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  <span style={{ color: "var(--accent)", fontFamily: "var(--font-mono)", marginRight: 4 }}>{i+1}.</span>{s}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* Active Batches Section */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 18, fontFamily: "var(--font-serif)", color: "var(--text-primary)", fontWeight: 400 }}>Active Batches</h2>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>Currently running internship programs</p>
          </div>
          {plannedBatches.length > 0 && (
            <span style={{ fontSize: 13, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>
              + {plannedBatches.length} planned
            </span>
          )}
        </div>

        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px,1fr))", gap: 12 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 140 }} />)}
          </div>
        ) : activeBatches.length === 0 ? (
          <div className="card" style={{ padding: 32, textAlign: "center" }}>
            <p style={{ fontSize: 15, color: "var(--text-secondary)", marginBottom: 8 }}>No active batches right now</p>
            <p style={{ fontSize: 13, color: "var(--text-tertiary)", marginBottom: 16 }}>Change a batch status to ONGOING or create a new program</p>
            <Link href="/admin/batches" className="btn btn-primary btn-sm"><Zap size={12} /> New Program</Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px,1fr))", gap: 12 }}>
            {activeBatches.map(batch => (
              <Link key={batch._id} href={`/admin/batches/${batch._id}`} style={{ textDecoration: "none" }}>
                <div className="card" style={{ padding: 18, cursor: "pointer", transition: "border-color 150ms" }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--success)")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border-default)")}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)", lineHeight: 1.4 }}>{batch.name}</h3>
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: "var(--radius-sm)", background: "var(--success-10)", color: "var(--success)", fontWeight: 500, flexShrink: 0, marginLeft: 8 }}>ACTIVE</span>
                  </div>

                  {/* Intern avatars */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <div style={{ display: "flex" }}>
                      {(batch.internIds || []).slice(0, 4).map((intern: any, i: number) => (
                        <div key={intern._id || i} style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--accent-20)", color: "var(--accent)", border: "2px solid var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 500, marginLeft: i > 0 ? -6 : 0 }}>
                          {getInitials(intern.name || "?")}
                        </div>
                      ))}
                    </div>
                    <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                      <span className="num">{batch.internIds?.length ?? 0}</span> interns
                      · <span className="num">{batch.mentorIds?.length ?? 0}</span> mentor{batch.mentorIds?.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>
                    <Calendar size={11} />
                    Started {formatDate(batch.startDate)} · {batch.durationInWeeks}w
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
