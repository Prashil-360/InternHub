"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FileText, Plus, X, Loader2, CheckCircle2, MessageSquare } from "lucide-react";
import { timeAgo } from "@/lib/utils";

function SubmitReportModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [batches, setBatches] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [form, setForm] = useState({ batchId: "", weekNumber: "1", workDone: "", challenges: "", learnings: "", hoursSpent: "0", tasksWorkedOn: [] as string[] });
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    fetch("/api/batches").then(r => r.json()).then(d => {
      const b = Array.isArray(d) ? d : [];
      setBatches(b);
      if (b.length) set("batchId", b[0]._id);
    });
  }, []);

  useEffect(() => {
    if (!form.batchId) return;
    fetch(`/api/tasks?batchId=${form.batchId}`).then(r => r.json()).then(d => {
      setTasks(Array.isArray(d.tasks) ? d.tasks : Array.isArray(d) ? d : []);
    });
  }, [form.batchId]);

  function toggleTask(id: string) {
    set("tasksWorkedOn", form.tasksWorkedOn.includes(id) ? form.tasksWorkedOn.filter(t => t !== id) : [...form.tasksWorkedOn, id]);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, weekNumber: parseInt(form.weekNumber), hoursSpent: parseInt(form.hoursSpent) || 0 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Weekly report submitted!"); onDone(); onClose();
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box anim-scale-in" style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 500, color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Submit Weekly Report</h2>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>Share your progress and learnings with your mentor.</p>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ width: 32, padding: 0 }}><X size={14} /></button>
        </div>
        <form id="report-form" onSubmit={submit}>
          <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px,1fr))", gap: 12 }}>
              <div>
                <label className="label">Batch *</label>
                <select className="input select" value={form.batchId} onChange={e => set("batchId", e.target.value)} required style={{ appearance: "none" }}>
                  {batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Week Number *</label>
                <input className="input" type="number" min={1} max={52} value={form.weekNumber} onChange={e => set("weekNumber", e.target.value)} required />
              </div>
            </div>
            {tasks.length > 0 && (
              <div>
                <label className="label">Tasks Worked On</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 140, overflowY: "auto" }}>
                  {tasks.map(task => (
                    <label key={task._id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: "var(--radius-sm)", border: `1px solid ${form.tasksWorkedOn.includes(task._id) ? "var(--accent)" : "var(--border-default)"}`, background: form.tasksWorkedOn.includes(task._id) ? "var(--accent-10)" : "transparent", cursor: "pointer", transition: "all 150ms", fontSize: 13, color: "var(--text-primary)" }}>
                      <input type="checkbox" checked={form.tasksWorkedOn.includes(task._id)} onChange={() => toggleTask(task._id)} style={{ accentColor: "var(--accent)" }} />
                      {task.title}
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div>
              <label className="label">Work Done This Week *</label>
              <textarea className="textarea" placeholder="What did you work on, build, or complete this week?" value={form.workDone} onChange={e => set("workDone", e.target.value)} required style={{ minHeight: 72 }} />
            </div>
            <div>
              <label className="label">Challenges Faced *</label>
              <textarea className="textarea" placeholder="What problems or blockers did you encounter?" value={form.challenges} onChange={e => set("challenges", e.target.value)} required style={{ minHeight: 60 }} />
            </div>
            <div>
              <label className="label">Key Learnings *</label>
              <textarea className="textarea" placeholder="What new concepts, tools, or skills did you learn?" value={form.learnings} onChange={e => set("learnings", e.target.value)} required style={{ minHeight: 60 }} />
            </div>
            <div>
              <label className="label">Estimated Hours Spent</label>
              <input className="input" type="number" min={0} max={168} value={form.hoursSpent} onChange={e => set("hoursSpent", e.target.value)} style={{ width: 120 }} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" form="report-form" className="btn btn-primary" disabled={loading}>
              {loading ? <Loader2 size={14} className="animate-spin" /> : "Submit Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function InternReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const load = () => { fetch("/api/reports").then(r => r.json()).then(d => { setReports(Array.isArray(d) ? d : []); setLoading(false); }); };
  useEffect(() => { load(); }, []);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <p className="section-label" style={{ marginBottom: 6 }}>MY WORK</p>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 32, color: "var(--text-primary)", fontWeight: 400 }}>Weekly Reports</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 4 }}>Submit weekly progress updates and view mentor feedback</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary"><Plus size={14} /> Submit Report</button>
      </div>
      <hr className="divider" style={{ marginBottom: 24 }} />

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 140 }} />)}</div>
      ) : reports.length === 0 ? (
        <div className="empty-state card">
          <FileText size={32} /><h3>No reports yet</h3>
          <p>Submit your first weekly report to keep your mentor updated on your progress.</p>
          <button onClick={() => setShowModal(true)} className="btn btn-primary btn-sm"><Plus size={12} /> Submit First Report</button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {reports.map(report => (
            <div key={report._id} className="card" style={{ padding: 20 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "var(--radius-md)", background: "var(--accent-10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <FileText size={16} color="var(--accent)" />
                  </div>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)" }}>Week {report.weekNumber}</p>
                    <p style={{ fontSize: 12, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>Submitted {timeAgo(report.submittedAt)}</p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {report.hoursSpent > 0 && <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: "var(--radius-sm)", background: "var(--bg-tertiary)", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>{report.hoursSpent}h</span>}
                  {report.mentorFeedback ? (
                    <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: "var(--radius-sm)", background: "var(--success-10)", color: "var(--success)", fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
                      <CheckCircle2 size={11} /> Feedback received
                    </span>
                  ) : (
                    <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: "var(--radius-sm)", background: "var(--warning-10)", color: "var(--warning)", fontWeight: 500 }}>Awaiting feedback</span>
                  )}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px,1fr))", gap: 10 }}>
                {[{ label: "WORK DONE", value: report.workDone }, { label: "CHALLENGES", value: report.challenges }, { label: "LEARNINGS", value: report.learnings }].map(({ label, value }) => (
                  <div key={label} style={{ background: "var(--bg-tertiary)", borderRadius: "var(--radius-sm)", padding: "10px 12px" }}>
                    <p className="section-label" style={{ marginBottom: 4 }}>{label}</p>
                    <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>{value}</p>
                  </div>
                ))}
              </div>
              {report.mentorFeedback && (
                <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--success-10)", border: "1px solid var(--success-10)", display: "flex", gap: 10 }}>
                  <MessageSquare size={14} color="var(--success)" style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <p className="section-label" style={{ color: "var(--success)", marginBottom: 3 }}>MENTOR FEEDBACK</p>
                    <p style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.6 }}>{report.mentorFeedback}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {showModal && <SubmitReportModal onClose={() => setShowModal(false)} onDone={load} />}
    </div>
  );
}
