"use client";
import { useEffect, useState } from "react";
import { Layers, Users, Calendar, TrendingUp, CheckCircle2, Clock, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { formatDate, statusBadgeClass, getInitials } from "@/lib/utils";

export default function MentorBatchesPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/batches").then(r => r.json()),
      fetch("/api/tasks?limit=50").then(r => r.json()),
    ]).then(([b, t]) => {
      setBatches(Array.isArray(b) ? b : []);
      const taskArr = Array.isArray(t.tasks) ? t.tasks : Array.isArray(t) ? t : [];
      setTasks(taskArr);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  function getBatchStats(batchId: string) {
    const batchTasks = tasks.filter(t => (t.batchId?._id || t.batchId) === batchId);
    const approved = batchTasks.filter(t => t.status === "APPROVED").length;
    const total = batchTasks.length;
    const progress = total ? Math.round((approved / total) * 100) : 0;
    return { total, approved, progress };
  }

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <p className="section-label" style={{ marginBottom: 6 }}>MENTOR</p>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 32, color: "var(--text-primary)", fontWeight: 400 }}>My Batches</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 4 }}>
          All internship batches you are assigned to as a mentor
        </p>
      </div>
      <hr className="divider" style={{ marginBottom: 24 }} />

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 16 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 220 }} />)}
        </div>
      ) : batches.length === 0 ? (
        <div className="empty-state card">
          <Layers size={32} />
          <h3>No batches assigned</h3>
          <p>Your admin hasn't assigned you to any batches yet. Contact your admin to get added.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 16 }}>
          {batches.map(batch => {
            const stats = getBatchStats(batch._id);
            return (
              <div key={batch._id} className="card" style={{ padding: 24 }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "var(--radius-md)", background: "var(--accent-10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Layers size={20} color="var(--accent)" />
                  </div>
                  <span className={statusBadgeClass(batch.currentStatus)}>{batch.currentStatus}</span>
                </div>

                <h3 style={{ fontSize: 16, fontWeight: 500, color: "var(--text-primary)", marginBottom: 6 }}>{batch.name}</h3>
                {batch.description && (
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 14, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                    {batch.description}
                  </p>
                )}

                {/* Stats row */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(80px,1fr))", gap: 10, marginBottom: 16 }}>
                  {[
                    { icon: Users, label: "Interns", value: batch.internIds?.length ?? 0 },
                    { icon: CheckCircle2, label: "Approved", value: stats.approved },
                    { icon: Clock, label: "Total Tasks", value: stats.total },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} style={{ background: "var(--bg-tertiary)", borderRadius: "var(--radius-sm)", padding: "8px 10px", textAlign: "center" }}>
                      <p style={{ fontSize: 18, fontFamily: "var(--font-mono)", color: "var(--text-primary)", fontWeight: 500 }}>{value}</p>
                      <p style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 2 }}>{label}</p>
                    </div>
                  ))}
                </div>

                {/* Progress bar */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Task Progress</span>
                    <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--accent)" }}>{stats.progress}%</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${stats.progress}%` }} />
                  </div>
                </div>

                {/* Meta */}
                <div style={{ display: "flex", gap: 12, fontSize: 12, color: "var(--text-secondary)" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Calendar size={12} />
                    <span style={{ fontFamily: "var(--font-mono)" }}>{formatDate(batch.startDate)}</span>
                  </span>
                  <span>{batch.durationInWeeks}w duration</span>
                </div>

                {/* Intern avatars */}
                {batch.internIds?.length > 0 && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ display: "flex" }}>
                      {batch.internIds.slice(0, 5).map((intern: any, i: number) => (
                        <div key={intern._id} style={{
                          width: 28, height: 28, borderRadius: "50%",
                          background: "var(--accent-20)", color: "var(--accent)",
                          border: "2px solid var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 11, fontWeight: 500, marginLeft: i > 0 ? -8 : 0,
                        }}>
                          {getInitials(intern.name || "?")}
                        </div>
                      ))}
                    </div>
                    {batch.internIds.length > 5 && (
                      <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>+{batch.internIds.length - 5} more</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
