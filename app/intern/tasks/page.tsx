"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ClipboardList, X, Loader2, ExternalLink, CheckCircle2, RotateCcw, Clock, AlertCircle, Play } from "lucide-react";
import { formatDate, statusBadgeClass, isOverdue, timeAgo } from "@/lib/utils";

function SubmitModal({ task, onClose, onDone }: { task: any; onClose: () => void; onDone: () => void }) {
  const [form, setForm] = useState({ proofLink: "", whatWasImplemented: "", whatWasLearned: "" });
  const [batchId, setBatchId] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    fetch("/api/batches").then(r => r.json()).then(d => {
      const b = Array.isArray(d) ? d : [];
      const taskBatchId = typeof task.batchId === "object" ? task.batchId?._id : task.batchId;
      const match = b.find((batch: any) => batch._id === taskBatchId);
      setBatchId(match ? match._id : b[0]?._id || "");
    });
  }, [task]);

  const proofPlaceholders: Record<string, string> = {
    GITHUB: "https://github.com/username/repo", URL: "https://your-app.vercel.app",
    DOC: "https://docs.google.com/document/d/...", IMAGE: "https://drive.google.com/...", OTHER: "https://...",
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!batchId) { toast.error("Could not determine batch. Please refresh."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: task._id, batchId, proofType: task.requiredProofType, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Submitted for mentor review!"); onDone(); onClose();
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box anim-scale-in">
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 500, color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Submit Task</h2>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>{task.title}</p>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ width: 32, padding: 0 }}><X size={14} /></button>
        </div>
        <form id="submit-form" onSubmit={submit}>
          <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "var(--warning-10)", borderRadius: "var(--radius-md)", fontSize: 13, color: "var(--warning)" }}>
              <AlertCircle size={14} style={{ flexShrink: 0 }} />
              Required proof type: <strong>{task.requiredProofType}</strong>. Mentor will review before marking complete.
            </div>
            <div>
              <label className="label">Proof Link * ({task.requiredProofType})</label>
              <input className="input" placeholder={proofPlaceholders[task.requiredProofType] || "https://"} value={form.proofLink} onChange={e => set("proofLink", e.target.value)} required />
            </div>
            <div>
              <label className="label">What did you implement? * <span style={{ fontWeight: 400, color: "var(--text-tertiary)" }}>({form.whatWasImplemented.length}/500)</span></label>
              <textarea className="textarea" placeholder="Describe what you built or completed in detail…" value={form.whatWasImplemented} onChange={e => set("whatWasImplemented", e.target.value.slice(0, 500))} required style={{ minHeight: 80 }} />
            </div>
            <div>
              <label className="label">What did you learn? *</label>
              <textarea className="textarea" placeholder="Key concepts, tools, or skills you gained…" value={form.whatWasLearned} onChange={e => set("whatWasLearned", e.target.value)} required style={{ minHeight: 80 }} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" form="submit-form" className="btn btn-primary" disabled={loading}>
              {loading ? <Loader2 size={14} className="animate-spin" /> : "Submit for Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function InternTasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [submitTask, setSubmitTask] = useState<any>(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/tasks").then(r => r.json()),
      fetch("/api/submissions").then(r => r.json()),
    ]).then(([t, s]) => {
      setTasks(Array.isArray(t.tasks) ? t.tasks : Array.isArray(t) ? t : []);
      setSubmissions(Array.isArray(s) ? s : []);
      setLoading(false);
    });
  };
  useEffect(() => { load(); }, []);

  async function startTask(taskId: string) {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "IN_PROGRESS" }),
    });
    if (res.ok) { toast.success("Marked as In Progress"); load(); }
    else { toast.error("Failed to update status"); }
  }

  const getSubmission = (taskId: string) => submissions.find(s => (s.taskId?._id || s.taskId) === taskId);
  const filtered = filter === "ALL" ? tasks : tasks.filter(t => t.status === filter);
  const filters = ["ALL","ASSIGNED","IN_PROGRESS","SUBMITTED","REWORK","APPROVED","OVERDUE"];

  const statusIcon: Record<string, any> = {
    ASSIGNED: Clock, IN_PROGRESS: Play, SUBMITTED: Clock,
    APPROVED: CheckCircle2, REWORK: RotateCcw, OVERDUE: AlertCircle,
  };

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <p className="section-label" style={{ marginBottom: 6 }}>MY WORK</p>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 32, color: "var(--text-primary)", fontWeight: 400 }}>My Tasks</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 4 }}>Complete tasks with proof of work to get mentor approval</p>
      </div>
      <hr className="divider" style={{ marginBottom: 24 }} />

      {/* Filter pills */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 24 }}>
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "5px 12px", borderRadius: "var(--radius-pill)", border: `1px solid ${filter === f ? "var(--accent)" : "var(--border-default)"}`,
            background: filter === f ? "var(--accent-10)" : "transparent", color: filter === f ? "var(--accent)" : "var(--text-secondary)",
            cursor: "pointer", fontSize: 13, fontFamily: "var(--font-sans)", fontWeight: 500, transition: "all 150ms",
            display: "flex", alignItems: "center", gap: 5,
          }}>
            {f.replace("_", " ")}
            {f !== "ALL" && <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, opacity: 0.7 }}>{tasks.filter(t => t.status === f).length}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 120 }} />)}</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state card"><ClipboardList size={32} /><h3>No {filter !== "ALL" ? filter.replace("_", " ").toLowerCase() : ""} tasks</h3><p>Tasks assigned to you by your mentor will appear here.</p></div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(task => {
            const sub = getSubmission(task._id);
            const Icon = statusIcon[task.status] || Clock;
            const overdue = isOverdue(task.deadline) && !["APPROVED"].includes(task.status);
            const iconColor = task.status === "APPROVED" ? "var(--success)" : task.status === "REWORK" || task.status === "OVERDUE" || overdue ? "var(--error)" : task.status === "SUBMITTED" ? "var(--accent)" : task.status === "IN_PROGRESS" ? "var(--warning)" : "var(--text-tertiary)";
            const borderStyle = task.status === "APPROVED" ? "var(--success-10)" : (task.status === "OVERDUE" || overdue) ? "var(--error-10)" : "transparent";

            return (
              <div key={task._id} className="card" style={{ padding: 16, background: borderStyle, transition: "background 150ms" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "var(--radius-md)", background: iconColor + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={16} color={iconColor} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <p style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)" }}>{task.title}</p>
                      <span className={statusBadgeClass(task.status)}>{task.status.replace("_", " ")}</span>
                      <span className={statusBadgeClass(task.priority)}>{task.priority}</span>
                    </div>
                    <p style={{ fontSize: 12, color: "var(--text-secondary)", fontFamily: "var(--font-mono)", marginBottom: 6 }}>
                      Week {task.weekNumber} · Due {formatDate(task.deadline)}{overdue ? <span style={{ color: "var(--error)", marginLeft: 8 }}>OVERDUE</span> : ""}
                    </p>
                    <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{task.description}</p>
                    <div style={{ marginTop: 8 }}>
                      <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: "var(--radius-sm)", background: "var(--bg-tertiary)", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                        Requires: {task.requiredProofType}
                      </span>
                    </div>
                    {sub?.mentorRemarks && (
                      <div style={{ marginTop: 8, padding: "8px 12px", borderRadius: "var(--radius-sm)", background: sub.status === "APPROVED" ? "var(--success-10)" : "var(--error-10)", color: sub.status === "APPROVED" ? "var(--success)" : "var(--error)", fontSize: 13, lineHeight: 1.5 }}>
                        <strong>Mentor:</strong> {sub.mentorRemarks}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "row", gap: 6, flexWrap: "wrap", flexShrink: 0 }}>
                    {task.status === "ASSIGNED" && (
                      <button onClick={() => startTask(task._id)} className="btn btn-secondary btn-sm"><Play size={12} /> Start</button>
                    )}
                    {["IN_PROGRESS", "REWORK", "ASSIGNED"].includes(task.status) && (
                      <button onClick={() => setSubmitTask(task)} className="btn btn-primary btn-sm">Submit</button>
                    )}
                    {sub?.proofLink && (
                      <a href={sub.proofLink} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                        <ExternalLink size={12} /> Proof
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {submitTask && <SubmitModal task={submitTask} onClose={() => setSubmitTask(null)} onDone={load} />}
    </div>
  );
}
