"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Star, X, Loader2, BarChart2, Users, CheckCircle2 } from "lucide-react";
import { getInitials, calcWeightedScore, scoreGrade, DEFAULT_EVALUATION_CRITERIA } from "@/lib/utils";

function EvalModal({ intern, batchId, existing, onClose, onDone }: { intern: any; batchId: string; existing?: any; onClose: () => void; onDone: () => void }) {
  const [scores, setScores] = useState<Record<string, number>>(
    existing?.criteriaScores?.reduce((a: any, c: any) => ({ ...a, [c.key]: c.score }), {}) ||
    DEFAULT_EVALUATION_CRITERIA.reduce((a, c) => ({ ...a, [c.key]: 7 }), {})
  );
  const [remarks, setRemarks] = useState(existing?.remarks || "");
  const [completed, setCompleted] = useState(existing?.completed || false);
  const [loading, setLoading] = useState(false);

  const criteriaScores = DEFAULT_EVALUATION_CRITERIA.map(c => ({ key: c.key, label: c.label, score: scores[c.key] ?? 7, weight: c.weight }));
  const finalScore = calcWeightedScore(criteriaScores);
  const grade = scoreGrade(finalScore);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/evaluations", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId, internId: intern._id, criteriaScores, remarks, completed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(completed ? "Internship completed! Intern notified." : "Draft saved."); onDone(); onClose();
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box anim-scale-in" style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: "var(--radius-md)", background: "var(--success-10)", color: "var(--success)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 500 }}>
              {getInitials(intern.name)}
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 500, color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Evaluate {intern.name}</h2>
              <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>{intern.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ width: 32, padding: 0 }}><X size={14} /></button>
        </div>

        {/* Score preview bar */}
        <div style={{ padding: "12px 24px", background: "var(--bg-tertiary)", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Projected Score</span>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 28, fontFamily: "var(--font-mono)", fontWeight: 500, color: grade.color }}>{finalScore}</span>
            <span style={{ fontSize: 14, color: "var(--text-tertiary)" }}>/100</span>
            <span style={{ fontSize: 13, padding: "2px 8px", borderRadius: "var(--radius-sm)", background: grade.color + "18", color: grade.color, fontWeight: 500 }}>{grade.label}</span>
          </div>
        </div>

        <form id="eval-form" onSubmit={submit}>
          <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {DEFAULT_EVALUATION_CRITERIA.map(c => (
              <div key={c.key}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>{c.label}</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 14, fontFamily: "var(--font-mono)", fontWeight: 500, color: "var(--text-primary)" }}>{scores[c.key] ?? 7}/10</span>
                    <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>×{c.weight}%</span>
                  </div>
                </div>
                <input type="range" min={0} max={10} value={scores[c.key] ?? 7}
                  onChange={e => setScores(p => ({ ...p, [c.key]: parseInt(e.target.value) }))}
                  style={{ width: "100%", minWidth: 120, accentColor: "var(--accent)", cursor: "pointer" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-tertiary)", marginTop: 2 }}>
                  <span>Poor</span><span>Average</span><span>Excellent</span>
                </div>
              </div>
            ))}
            <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 14 }}>
              <label className="label">Overall Remarks</label>
              <textarea className="textarea" placeholder="Summary of intern's performance…" value={remarks} onChange={e => setRemarks(e.target.value)} style={{ minHeight: 80 }} />
            </div>
            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px", borderRadius: "var(--radius-md)", border: `2px solid ${completed ? "var(--success)" : "var(--border-default)"}`, background: completed ? "var(--success-10)" : "transparent", cursor: "pointer", transition: "all 150ms" }}>
              <input type="checkbox" checked={completed} onChange={e => setCompleted(e.target.checked)} style={{ accentColor: "var(--success)", marginTop: 2 }} />
              <div>
                <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>Mark internship as completed</p>
                <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Intern will be notified with their final score via email.</p>
              </div>
            </label>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" form="eval-form" className="btn btn-primary" disabled={loading}>
              {loading ? <Loader2 size={14} className="animate-spin" /> : <><Star size={14} />{completed ? "Complete & Notify" : "Save Draft"}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MentorEvaluationsPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [evalIntern, setEvalIntern] = useState<any>(null);

  useEffect(() => {
    fetch("/api/batches").then(r => r.json()).then(d => {
      const b = Array.isArray(d) ? d : [];
      setBatches(b);
      if (b.length) setSelectedBatch(b[0]);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedBatch) return;
    fetch(`/api/evaluations?batchId=${selectedBatch._id}`).then(r => r.json()).then(d => setEvaluations(Array.isArray(d) ? d : []));
  }, [selectedBatch]);

  const loadEvals = () => {
    if (selectedBatch) fetch(`/api/evaluations?batchId=${selectedBatch._id}`).then(r => r.json()).then(d => setEvaluations(Array.isArray(d) ? d : []));
  };

  const getEval = (internId: string) => evaluations.find(e => (e.internId?._id || e.internId) === internId);

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <p className="section-label" style={{ marginBottom: 6 }}>MENTOR</p>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 32, color: "var(--text-primary)", fontWeight: 400 }}>Evaluations</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 4 }}>Score interns and finalize their internship evaluations</p>
      </div>
      <hr className="divider" style={{ marginBottom: 24 }} />

      {batches.length > 1 && (
        <div style={{ marginBottom: 20 }}>
          <select className="input select" value={selectedBatch?._id || ""} onChange={e => setBatches(p => { const b = p.find(b => b._id === e.target.value); if (b) setSelectedBatch(b); return p; })} style={{ width: "auto", minWidth: 200, appearance: "none" }}>
            {batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
          </select>
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 72 }} />)}</div>
      ) : !selectedBatch ? (
        <div className="empty-state card"><BarChart2 size={32} /><h3>No batches assigned</h3><p>You're not assigned to any batches yet.</p></div>
      ) : !selectedBatch.internIds?.length ? (
        <div className="empty-state card"><Users size={32} /><h3>No interns in this batch</h3><p>Ask your admin to add interns to this batch.</p></div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {selectedBatch.internIds.map((intern: any) => {
            const ev = getEval(intern._id);
            const grade = ev ? scoreGrade(ev.finalScore) : null;
            return (
              <div key={intern._id} className="card" style={{ padding: 16, display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: "var(--radius-md)", background: "var(--success-10)", color: "var(--success)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 500, flexShrink: 0 }}>
                  {getInitials(intern.name)}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>{intern.name}</p>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>{intern.email}</p>
                </div>
                {ev ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                      <span style={{ fontSize: 20, fontFamily: "var(--font-mono)", fontWeight: 500, color: grade!.color }}>{ev.finalScore}</span>
                      <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>/100</span>
                    </div>
                    {ev.completed ? (
                      <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: "var(--radius-sm)", background: "var(--success-10)", color: "var(--success)", fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
                        <CheckCircle2 size={12} /> Completed
                      </span>
                    ) : (
                      <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: "var(--radius-sm)", background: "var(--warning-10)", color: "var(--warning)", fontWeight: 500 }}>Draft</span>
                    )}
                    <button onClick={() => setEvalIntern(intern)} className="btn btn-secondary btn-sm">Edit</button>
                  </div>
                ) : (
                  <button onClick={() => setEvalIntern(intern)} className="btn btn-primary btn-sm"><Star size={12} /> Evaluate</button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {evalIntern && selectedBatch && (
        <EvalModal intern={evalIntern} batchId={selectedBatch._id} existing={getEval(evalIntern._id)} onClose={() => setEvalIntern(null)} onDone={loadEvals} />
      )}
    </div>
  );
}
