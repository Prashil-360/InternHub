"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Star, CheckCircle2, Download, Loader2, BarChart2 } from "lucide-react";
import { scoreGrade } from "@/lib/utils";

function ScoreBar({ label, score, weight }: { label: string; score: number; weight: number }) {
  const pct = (score / 10) * 100;
  const color = score >= 8 ? "var(--success)" : score >= 6 ? "var(--warning)" : "var(--error)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      <div style={{ width: 120, flexShrink: 0, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>{label}</p>
        <p style={{ fontSize: 11, color: "var(--text-tertiary)" }}>Weight: {weight}%</p>
      </div>
      <div className="progress-track" style={{ flex: 1 }}>
        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span style={{ width: 48, textAlign: "right", fontSize: 14, fontFamily: "var(--font-mono)", fontWeight: 500, color, flexShrink: 0 }}>{score}/10</span>
    </div>
  );
}

function CertificateButton({ evaluationId }: { evaluationId: string }) {
  const [loading, setLoading] = useState(false);
  async function download() {
    setLoading(true);
    try {
      const res = await fetch(`/api/certificate?evaluationId=${evaluationId}`);
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      const html = await res.text();
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const win = window.open(url, "_blank");
      if (win) win.onload = () => setTimeout(() => { win.print(); URL.revokeObjectURL(url); }, 500);
      toast.success("Certificate opened — Print → Save as PDF");
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  }
  return (
    <button onClick={download} disabled={loading} className="btn btn-primary btn-sm">
      {loading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />} Download Certificate
    </button>
  );
}

export default function InternEvaluationPage() {
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetch("/api/evaluations").then(r => r.json()).then(d => { setEvaluations(Array.isArray(d) ? d : []); setLoading(false); }); }, []);

  if (loading) return (
    <div>
      <div style={{ marginBottom: 32 }}><p className="section-label" style={{ marginBottom: 6 }}>MY EVALUATION</p><h1 style={{ fontFamily: "var(--font-serif)", fontSize: 32, color: "var(--text-primary)", fontWeight: 400 }}>Performance Evaluation</h1></div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{[1,2].map(i => <div key={i} className="skeleton" style={{ height: 200 }} />)}</div>
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <p className="section-label" style={{ marginBottom: 6 }}>MY EVALUATION</p>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 32, color: "var(--text-primary)", fontWeight: 400 }}>Performance Evaluation</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 4 }}>Your performance scores and feedback from your mentor</p>
      </div>
      <hr className="divider" style={{ marginBottom: 24 }} />

      {evaluations.length === 0 ? (
        <div className="empty-state card">
          <Star size={32} /><h3>No evaluation yet</h3>
          <p>Your mentor will evaluate your performance at the end of your internship. Keep submitting tasks and weekly reports!</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {evaluations.map(ev => {
            const grade = scoreGrade(ev.finalScore);
            const r = 54, circ = 2 * Math.PI * r;
            const filled = (ev.finalScore / 100) * circ;
            return (
              <div key={ev._id} className="card" style={{ overflow: "hidden" }}>
                {/* Header */}
                <div style={{ padding: "24px 28px", background: "linear-gradient(135deg, var(--bg-tertiary) 0%, var(--bg-quaternary) 100%)", display: "flex", flexDirection: "row", alignItems: "center", gap: 28, flexWrap: "wrap", borderBottom: "1px solid var(--border-subtle)" }}>
                  <div style={{ position: "relative", width: 128, height: 128, flexShrink: 0 }}>
                    <svg width={128} height={128} style={{ transform: "rotate(-90deg)" }}>
                      <circle cx={64} cy={64} r={r} fill="none" stroke="var(--bg-secondary)" strokeWidth={10} />
                      <circle cx={64} cy={64} r={r} fill="none" stroke={grade.color} strokeWidth={10}
                        strokeDasharray={`${filled} ${circ}`} strokeLinecap="round"
                        style={{ transition: "stroke-dasharray 800ms ease-out" }} />
                    </svg>
                    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 28, fontFamily: "var(--font-mono)", fontWeight: 500, color: grade.color }}>{ev.finalScore}</span>
                      <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>/100</span>
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                      {ev.completed ? (
                        <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: "var(--radius-pill)", background: "var(--success-10)", color: "var(--success)", fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
                          <CheckCircle2 size={12} /> Internship Completed
                        </span>
                      ) : (
                        <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: "var(--radius-pill)", background: "var(--warning-10)", color: "var(--warning)", fontWeight: 500 }}>Draft Evaluation</span>
                      )}
                      <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: "var(--radius-pill)", background: grade.color + "18", color: grade.color, fontWeight: 500 }}>{grade.label}</span>
                    </div>
                    <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 24, color: "var(--text-primary)", fontWeight: 400, marginBottom: 4 }}>
                      {ev.finalScore >= 80 ? "Excellent Performance" : ev.finalScore >= 60 ? "Good Performance" : "Needs Improvement"}
                    </h2>
                    <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>
                      Evaluated by {ev.mentorId?.name || "Your Mentor"}
                      {ev.completedAt && <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, marginLeft: 8 }}>· {new Date(ev.completedAt).toLocaleDateString()}</span>}
                    </p>
                    {ev.completed && <CertificateButton evaluationId={ev._id} />}
                  </div>
                </div>

                {/* Score bars */}
                <div style={{ padding: "20px 28px", borderBottom: "1px solid var(--border-subtle)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                    <BarChart2 size={16} color="var(--accent)" />
                    <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>Criteria Scores</p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {ev.criteriaScores?.map((c: any) => <ScoreBar key={c.key} label={c.label} score={c.score} weight={c.weight} />)}
                  </div>
                </div>

                {/* Remarks */}
                {ev.remarks && (
                  <div style={{ padding: "16px 28px" }}>
                    <p className="section-label" style={{ marginBottom: 8 }}>MENTOR'S REMARKS</p>
                    <p style={{ fontSize: 14, color: "var(--text-primary)", lineHeight: 1.7 }}>{ev.remarks}</p>
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
