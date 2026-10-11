"use client";
import { useEffect, useState } from "react";
import { Shield, RefreshCw } from "lucide-react";
import { formatDateTime, getInitials } from "@/lib/utils";

const ACTION_COLOR: Record<string, string> = {
  SUBMISSION_APPROVED: "var(--success)", TASK_CREATED: "var(--accent)",
  SUBMISSION_REWORK: "var(--error)", USER_INVITED: "#6c77ff",
  EVALUATION_COMPLETED: "var(--warning)", BATCH_CREATED: "var(--info)",
  USER_LOGIN: "var(--text-tertiary)", USER_REGISTERED: "var(--success)",
  PASSWORD_RESET_COMPLETED: "var(--warning)",
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => { setLoading(true); fetch("/api/audit").then(r => r.json()).then(d => { setLogs(Array.isArray(d.logs) ? d.logs : []); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <p className="section-label" style={{ marginBottom: 6 }}>SYSTEM</p>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 32, color: "var(--text-primary)", fontWeight: 400, display: "flex", alignItems: "center", gap: 12 }}>
            <Shield size={28} color="var(--accent)" /> Audit Log
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 4 }}>Immutable record of all actions in your organization.</p>
        </div>
        <button onClick={load} className="btn btn-secondary">
          <RefreshCw size={14} style={{ animation: loading ? "spin 0.8s linear infinite" : "none" }} /> Refresh
        </button>
      </div>
      <hr className="divider" style={{ marginBottom: 24 }} />

      <div className="card" style={{ overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>{[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 56 }} />)}</div>
        ) : logs.length === 0 ? (
          <div className="empty-state"><Shield size={32} /><h3>No activity yet</h3><p>Events will appear here as your team uses InternHub.</p></div>
        ) : (
          <table className="table">
            <thead><tr><th>Actor</th><th>Action</th><th>Target</th><th>Time</th></tr></thead>
            <tbody>
              {logs.map(log => (
                <tr key={log._id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: "var(--radius-sm)", background: "var(--bg-tertiary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 500, color: "var(--text-secondary)", flexShrink: 0 }}>
                        {getInitials(log.actorName || "?")}
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{log.actorName}</p>
                        <p style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{log.actorRole}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: "var(--radius-sm)", background: (ACTION_COLOR[log.action] || "var(--accent)") + "18", color: ACTION_COLOR[log.action] || "var(--accent)", fontWeight: 500, fontFamily: "var(--font-mono)" }}>
                      {log.action.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td style={{ fontSize: 13, color: "var(--text-secondary)" }}>{log.targetName || log.targetType || "—"}</td>
                  <td style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--text-tertiary)" }}>{formatDateTime(log.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
