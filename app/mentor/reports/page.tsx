"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FileText, MessageSquare, X, Loader2 } from "lucide-react";
import { getInitials, timeAgo } from "@/lib/utils";

function FeedbackModal({ report, onClose, onDone }: { report: any; onClose: () => void; onDone: () => void }) {
  const [feedback, setFeedback] = useState(report.mentorFeedback || "");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/${report._id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mentorFeedback: feedback }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Feedback saved!"); onDone(); onClose();
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box anim-scale-in">
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 500, color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Week {report.weekNumber} Report</h2>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>{report.internId?.name} · {timeAgo(report.submittedAt)}</p>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ width: 32, padding: 0 }}><X size={14} /></button>
        </div>
        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            { label: "WORK DONE THIS WEEK", value: report.workDone },
            { label: "CHALLENGES FACED", value: report.challenges },
            { label: "KEY LEARNINGS", value: report.learnings },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: "var(--bg-tertiary)", borderRadius: "var(--radius-md)", padding: 14 }}>
              <p className="section-label" style={{ marginBottom: 6 }}>{label}</p>
              <p style={{ fontSize: 14, color: "var(--text-primary)", lineHeight: 1.6 }}>{value}</p>
            </div>
          ))}
          {report.hoursSpent > 0 && (
            <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              Estimated hours: <span className="num" style={{ color: "var(--text-primary)", fontWeight: 500 }}>{report.hoursSpent}h</span>
            </p>
          )}
          <form id="feedback-form" onSubmit={submit} style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 14 }}>
            <label className="label">Your Feedback</label>
            <textarea className="textarea" placeholder="Add feedback for this intern…" value={feedback} onChange={e => setFeedback(e.target.value)} style={{ minHeight: 80 }} />
          </form>
        </div>
        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn btn-secondary">Close</button>
          <button type="submit" form="feedback-form" className="btn btn-primary" disabled={loading}>
            {loading ? <Loader2 size={14} className="animate-spin" /> : "Save Feedback"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MentorReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [batchFilter, setBatchFilter] = useState("ALL");
  const [batches, setBatches] = useState<any[]>([]);

  const load = () => {
    Promise.all([
      fetch("/api/reports").then(r => r.json()),
      fetch("/api/batches").then(r => r.json()),
    ]).then(([r, b]) => {
      setReports(Array.isArray(r) ? r : []);
      setBatches(Array.isArray(b) ? b : []);
      setLoading(false);
    });
  };
  useEffect(() => { load(); }, []);

  const filtered = batchFilter === "ALL" ? reports : reports.filter(r => r.batchId === batchFilter || r.batchId?._id === batchFilter);

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <p className="section-label" style={{ marginBottom: 6 }}>MENTOR</p>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 32, color: "var(--text-primary)", fontWeight: 400 }}>Weekly Reports</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 4 }}>Review intern progress and provide feedback</p>
      </div>
      <hr className="divider" style={{ marginBottom: 24 }} />

      <div style={{ marginBottom: 20 }}>
        <select className="input select" value={batchFilter} onChange={e => setBatchFilter(e.target.value)} style={{ width: "auto", minWidth: 200, appearance: "none" }}>
          <option value="ALL">All Batches</option>
          {batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 80 }} />)}</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state card">
          <FileText size={32} /><h3>No reports yet</h3>
          <p>Reports will appear when interns submit their weekly updates.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(report => (
            <div key={report._id} className="card" style={{ padding: 16, display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: "var(--radius-md)", background: "var(--accent-10)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 500, flexShrink: 0 }}>
                {getInitials(report.internId?.name || "?")}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>{report.internId?.name}</p>
                  <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: "var(--radius-sm)", background: "var(--accent-10)", color: "var(--accent)", fontWeight: 500 }}>Week {report.weekNumber}</span>
                  {report.mentorFeedback ? (
                    <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: "var(--radius-sm)", background: "var(--success-10)", color: "var(--success)", fontWeight: 500 }}>Feedback given</span>
                  ) : (
                    <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: "var(--radius-sm)", background: "var(--warning-10)", color: "var(--warning)", fontWeight: 500 }}>Needs feedback</span>
                  )}
                </div>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{report.workDone}</p>
              </div>
              <button onClick={() => setSelected(report)} className="btn btn-secondary btn-sm" style={{ flexShrink: 0, gap: 6 }}>
                <MessageSquare size={12} /> {report.mentorFeedback ? "Edit" : "Review"}
              </button>
            </div>
          ))}
        </div>
      )}
      {selected && <FeedbackModal report={selected} onClose={() => setSelected(null)} onDone={load} />}
    </div>
  );
}
