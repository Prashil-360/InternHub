"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, X, Loader2, ExternalLink, CheckCircle2, RotateCcw, ClipboardList } from "lucide-react";
import { formatDate, statusBadgeClass, getInitials, timeAgo } from "@/lib/utils";

function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [batches, setBatches] = useState<any[]>([]);
  const [interns, setInterns] = useState<any[]>([]);
  const [form, setForm] = useState({ batchId: "", title: "", description: "", deadline: "", priority: "MEDIUM", requiredProofType: "GITHUB", weekNumber: "1", assignedTo: [] as string[] });
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => { fetch("/api/batches").then(r => r.json()).then(d => setBatches(Array.isArray(d) ? d : [])); }, []);
  useEffect(() => {
    if (!form.batchId) return;
    const batch = batches.find(b => b._id === form.batchId);
    setInterns(batch?.internIds || []);
    set("assignedTo", []);
  }, [form.batchId, batches]);

  function toggleIntern(id: string) {
    set("assignedTo", form.assignedTo.includes(id) ? form.assignedTo.filter(i => i !== id) : [...form.assignedTo, id]);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.assignedTo.length) { toast.error("Assign to at least one intern"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, weekNumber: parseInt(form.weekNumber), tags: [] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Task created! Interns notified."); onCreated(); onClose();
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box anim-scale-in" style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 500, color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Create New Task</h2>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>Assign work to interns with mandatory proof requirements.</p>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ width: 32, padding: 0 }}><X size={14} /></button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label className="label">Batch *</label>
              <select className="input select" value={form.batchId} onChange={e => set("batchId", e.target.value)} required style={{ appearance: "none" }}>
                <option value="">— Select batch —</option>
                {batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Task Title *</label>
              <input className="input" placeholder="e.g. Build Authentication API" value={form.title} onChange={e => set("title", e.target.value)} required />
            </div>
            <div>
              <label className="label">Description *</label>
              <textarea className="textarea" placeholder="Describe what the intern needs to build or research…" value={form.description} onChange={e => set("description", e.target.value)} style={{ minHeight: 80 }} required />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px,1fr))", gap: 10 }}>
              <div>
                <label className="label">Deadline *</label>
                <input className="input" type="date" value={form.deadline} onChange={e => set("deadline", e.target.value)} required />
              </div>
              <div>
                <label className="label">Priority</label>
                <select className="input select" value={form.priority} onChange={e => set("priority", e.target.value)} style={{ appearance: "none" }}>
                  {["LOW","MEDIUM","HIGH"].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Week #</label>
                <input className="input" type="number" min={1} max={52} value={form.weekNumber} onChange={e => set("weekNumber", e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label">Required Proof Type</label>
              <select className="input select" value={form.requiredProofType} onChange={e => set("requiredProofType", e.target.value)} style={{ appearance: "none" }}>
                {["GITHUB","URL","DOC","IMAGE","OTHER"].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            {interns.length > 0 && (
              <div>
                <label className="label">Assign To * ({form.assignedTo.length} selected)</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 160, overflowY: "auto", padding: "4px 0" }}>
                  {interns.map((intern: any) => (
                    <label key={intern._id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: "var(--radius-md)", border: `1px solid ${form.assignedTo.includes(intern._id) ? "var(--accent)" : "var(--border-default)"}`, background: form.assignedTo.includes(intern._id) ? "var(--accent-10)" : "transparent", cursor: "pointer", transition: "all 150ms" }}>
                      <input type="checkbox" checked={form.assignedTo.includes(intern._id)} onChange={() => toggleIntern(intern._id)} style={{ accentColor: "var(--accent)" }} />
                      <div style={{ width: 24, height: 24, borderRadius: "var(--radius-sm)", background: "var(--success-10)", color: "var(--success)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 500 }}>{getInitials(intern.name)}</div>
                      <span style={{ fontSize: 14, color: "var(--text-primary)", fontWeight: 500 }}>{intern.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <Loader2 size={14} className="animate-spin" /> : <><Plus size={14} /> Create Task</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ReviewModal({ sub, onClose, onDone }: { sub: any; onClose: () => void; onDone: () => void }) {
  const [status, setStatus] = useState<"APPROVED"|"REWORK">("APPROVED");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/submissions/${sub._id}/review`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, remarks }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(status === "APPROVED" ? "Task approved!" : "Rework requested"); onDone(); onClose();
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box anim-scale-in">
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 500, color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Review Submission</h2>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>{sub.taskId?.title}</p>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ width: 32, padding: 0 }}><X size={14} /></button>
        </div>
        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: "var(--bg-tertiary)", borderRadius: "var(--radius-md)", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <p className="section-label" style={{ marginBottom: 4 }}>WHAT WAS IMPLEMENTED</p>
              <p style={{ fontSize: 14, color: "var(--text-primary)", lineHeight: 1.6 }}>{sub.whatWasImplemented}</p>
            </div>
            <div>
              <p className="section-label" style={{ marginBottom: 4 }}>WHAT WAS LEARNED</p>
              <p style={{ fontSize: 14, color: "var(--text-primary)", lineHeight: 1.6 }}>{sub.whatWasLearned}</p>
            </div>
            <div>
              <p className="section-label" style={{ marginBottom: 4 }}>PROOF LINK ({sub.proofType})</p>
              <a href={sub.proofLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, color: "var(--accent)", display: "flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
                <ExternalLink size={14} /> {sub.proofLink.slice(0, 60)}{sub.proofLink.length > 60 ? "…" : ""}
              </a>
            </div>
            {sub.reworkCount > 0 && <div style={{ fontSize: 12, color: "var(--warning)", background: "var(--warning-10)", padding: "6px 10px", borderRadius: "var(--radius-sm)" }}>⚠ Reworked {sub.reworkCount} time{sub.reworkCount > 1 ? "s" : ""}</div>}
          </div>
          <form id="review-form" onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {(["APPROVED","REWORK"] as const).map(s => (
                <button key={s} type="button" onClick={() => setStatus(s)} style={{
                  height: 44, borderRadius: "var(--radius-md)", border: `2px solid ${status === s ? (s === "APPROVED" ? "var(--success)" : "var(--error)") : "var(--border-default)"}`,
                  background: status === s ? (s === "APPROVED" ? "var(--success-10)" : "var(--error-10)") : "transparent",
                  color: status === s ? (s === "APPROVED" ? "var(--success)" : "var(--error)") : "var(--text-secondary)",
                  cursor: "pointer", fontSize: 14, fontWeight: 500, fontFamily: "var(--font-sans)",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all 150ms",
                }}>
                  {s === "APPROVED" ? <CheckCircle2 size={14} /> : <RotateCcw size={14} />}
                  {s === "APPROVED" ? "Approve" : "Needs Rework"}
                </button>
              ))}
            </div>
            <div>
              <label className="label">Feedback {status === "REWORK" && "*"}</label>
              <textarea className="textarea" placeholder="Add feedback for the intern…" value={remarks} onChange={e => setRemarks(e.target.value)} required={status === "REWORK"} style={{ minHeight: 80 }} />
            </div>
          </form>
        </div>
        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button type="submit" form="review-form" className="btn" disabled={loading} style={{
            background: status === "APPROVED" ? "var(--success)" : "var(--error)", color: "#fff",
            display: "flex", alignItems: "center", gap: 6, height: 36, padding: "0 16px", borderRadius: "var(--radius-md)", border: "none", cursor: loading ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 500,
          }}>
            {loading ? <Loader2 size={14} className="animate-spin" /> : "Submit Review"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MentorTasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"reviews"|"tasks">("reviews");
  const [showCreate, setShowCreate] = useState(false);
  const [reviewSub, setReviewSub] = useState<any>(null);

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

  const pending = submissions.filter(s => s.status === "PENDING");

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <p className="section-label" style={{ marginBottom: 6 }}>MENTOR</p>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 32, color: "var(--text-primary)", fontWeight: 400 }}>Tasks & Reviews</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 4 }}>Create tasks and review intern submissions</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn btn-primary"><Plus size={14} /> New Task</button>
      </div>
      <hr className="divider" style={{ marginBottom: 24 }} />

      <div style={{ display: "flex", background: "var(--bg-tertiary)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", padding: 4, gap: 2, marginBottom: 24, width: "fit-content" }}>
        {[
          { key: "reviews", label: "Pending Reviews", count: pending.length },
          { key: "tasks", label: "All Tasks" },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)} style={{
            padding: "6px 16px", borderRadius: "var(--radius-sm)", border: "none", cursor: "pointer",
            fontSize: 14, fontFamily: "var(--font-sans)", fontWeight: 500, transition: "all 150ms",
            background: tab === t.key ? "var(--bg-secondary)" : "transparent",
            color: tab === t.key ? "var(--text-primary)" : "var(--text-secondary)",
            boxShadow: tab === t.key ? "var(--shadow-subtle)" : "none",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            {t.label}
            {t.count != null && t.count > 0 && <span style={{ background: "var(--accent)", color: "#fff", borderRadius: "var(--radius-pill)", fontSize: 11, fontFamily: "var(--font-mono)", padding: "1px 6px" }}>{t.count}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 80 }} />)}</div>
      ) : tab === "reviews" ? (
        pending.length === 0 ? (
          <div className="empty-state card"><CheckCircle2 size={32} /><h3>All caught up!</h3><p>No pending submissions to review right now.</p></div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {pending.map(sub => (
              <div key={sub._id} className="card" style={{ padding: 16, display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: "var(--radius-md)", background: "var(--success-10)", color: "var(--success)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 500, flexShrink: 0 }}>
                  {getInitials(sub.internId?.name || "?")}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub.taskId?.title}</p>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>{sub.internId?.name} · {timeAgo(sub.submittedAt)} · <span style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>{sub.proofType}</span></p>
                </div>
                <a href={sub.proofLink} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ flexShrink: 0 }}>
                  <ExternalLink size={12} /> Proof
                </a>
                <button onClick={() => setReviewSub(sub)} className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}>Review</button>
              </div>
            ))}
          </div>
        )
      ) : (
        tasks.length === 0 ? (
          <div className="empty-state card"><ClipboardList size={32} /><h3>No tasks yet</h3><p>Create your first task to assign work to interns.</p><button onClick={() => setShowCreate(true)} className="btn btn-primary btn-sm"><Plus size={12} /> Create Task</button></div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {tasks.map(task => (
              <div key={task._id} className="card" style={{ padding: 16 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: task.status === "APPROVED" ? "var(--success)" : task.status === "SUBMITTED" ? "var(--accent)" : task.status === "REWORK" || task.status === "OVERDUE" ? "var(--error)" : task.status === "IN_PROGRESS" ? "var(--warning)" : "var(--text-tertiary)", marginTop: 6, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>{task.title}</p>
                      <span className={statusBadgeClass(task.status)}>{task.status.replace("_"," ")}</span>
                      <span className={statusBadgeClass(task.priority)}>{task.priority}</span>
                    </div>
                    <p style={{ fontSize: 12, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>Week {task.weekNumber} · Due {formatDate(task.deadline)} · {task.assignedTo?.length ?? 0} intern(s)</p>
                    <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4, lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{task.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreated={load} />}
      {reviewSub && <ReviewModal sub={reviewSub} onClose={() => setReviewSub(null)} onDone={load} />}
    </div>
  );
}
