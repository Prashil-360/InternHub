"use client";
import { useEffect, useState } from "react";
import { Users, ChevronDown, ChevronRight, BarChart2, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { getInitials, statusBadgeClass } from "@/lib/utils";

export default function InternProgressPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIntern, setExpandedIntern] = useState<string | null>(null);
  const [filterBatch, setFilterBatch] = useState("ALL");

  useEffect(() => {
    Promise.all([
      fetch("/api/batches").then(r => r.json()),
      fetch("/api/tasks?limit=100").then(r => r.json()),
      fetch("/api/submissions").then(r => r.json()),
      fetch("/api/evaluations").then(r => r.json()),
    ]).then(([b, t, s, e]) => {
      setBatches(Array.isArray(b) ? b : []);
      setTasks(Array.isArray(t.tasks) ? t.tasks : Array.isArray(t) ? t : []);
      setSubmissions(Array.isArray(s) ? s : []);
      setEvaluations(Array.isArray(e) ? e : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Collect all unique interns across all mentor's batches
  const allInterns: any[] = [];
  const seenIds = new Set();
  batches.forEach(b => {
    if (filterBatch !== "ALL" && b._id !== filterBatch) return;
    (b.internIds || []).forEach((intern: any) => {
      if (!seenIds.has(intern._id)) {
        seenIds.add(intern._id);
        allInterns.push({ ...intern, batchName: b.name, batchId: b._id });
      }
    });
  });

  function getInternStats(internId: string) {
    const internTasks = tasks.filter(t => {
      const assigned = t.assignedTo || [];
      return assigned.some((a: any) => (a._id || a) === internId);
    });
    const approved = internTasks.filter(t => t.status === "APPROVED").length;
    const rework = internTasks.filter(t => t.status === "REWORK").length;
    const overdue = internTasks.filter(t => t.status === "OVERDUE").length;
    const submitted = internTasks.filter(t => t.status === "SUBMITTED").length;
    const total = internTasks.length;
    const completion = total ? Math.round((approved / total) * 100) : 0;
    const internSubs = submissions.filter(s => (s.internId?._id || s.internId) === internId);
    const reworkCount = internSubs.reduce((sum: number, s: any) => sum + (s.reworkCount || 0), 0);
    const eval_ = evaluations.find(e => (e.internId?._id || e.internId) === internId);
    return { total, approved, rework, overdue, submitted, completion, reworkCount, eval: eval_, internTasks };
  }

  const scoreColor = (score: number) => score >= 75 ? "var(--success)" : score >= 50 ? "var(--warning)" : "var(--error)";

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <p className="section-label" style={{ marginBottom: 6 }}>MENTOR</p>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 32, color: "var(--text-primary)", fontWeight: 400 }}>Intern Progress</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 4 }}>
            Track task completion, performance, and evaluation status for each intern
          </p>
        </div>
        <select className="input select" value={filterBatch} onChange={e => setFilterBatch(e.target.value)}
          style={{ width: "auto", minWidth: 200, appearance: "none" }}>
          <option value="ALL">All Batches</option>
          {batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
        </select>
      </div>
      <hr className="divider" style={{ marginBottom: 24 }} />

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 80 }} />)}
        </div>
      ) : allInterns.length === 0 ? (
        <div className="empty-state card">
          <Users size={32} />
          <h3>No interns found</h3>
          <p>No interns are assigned to your batches yet.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {allInterns.map(intern => {
            const s = getInternStats(intern._id);
            const isExpanded = expandedIntern === intern._id;
            return (
              <div key={intern._id} className="card" style={{ overflow: "hidden" }}>
                {/* Collapsed row */}
                <div
                  style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}
                  onClick={() => setExpandedIntern(isExpanded ? null : intern._id)}
                >
                  {/* Avatar */}
                  <div style={{ width: 40, height: 40, borderRadius: "var(--radius-md)", background: "var(--accent-20)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 500, flexShrink: 0 }}>
                    {getInitials(intern.name)}
                  </div>

                  {/* Name + batch */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)" }}>{intern.name}</p>
                    <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>{intern.batchName}</p>
                  </div>

                  {/* Task completion mini-bar */}
                  <div style={{ width: 120 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>Tasks</span>
                      <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>{s.approved}/{s.total}</span>
                    </div>
                    <div className="progress-track" style={{ height: 5 }}>
                      <div className="progress-fill" style={{ width: `${s.completion}%`, height: "100%" }} />
                    </div>
                  </div>

                  {/* Completion % */}
                  <div style={{ textAlign: "right", minWidth: 56 }}>
                    <p style={{ fontSize: 20, fontFamily: "var(--font-mono)", fontWeight: 500, color: s.eval ? scoreColor(s.eval.finalScore) : "var(--text-primary)" }}>
                      {s.eval ? `${s.eval.finalScore}` : `${s.completion}%`}
                    </p>
                    <p style={{ fontSize: 10, color: "var(--text-tertiary)" }}>{s.eval ? "score" : "done"}</p>
                  </div>

                  {/* Status badges */}
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    {s.overdue > 0 && <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: "var(--radius-sm)", background: "var(--error-10)", color: "var(--error)" }}>{s.overdue} overdue</span>}
                    {s.rework > 0 && <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: "var(--radius-sm)", background: "var(--warning-10)", color: "var(--warning)" }}>{s.rework} rework</span>}
                    {s.eval?.completed && <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: "var(--radius-sm)", background: "var(--success-10)", color: "var(--success)", display: "flex", alignItems: "center", gap: 3 }}><CheckCircle2 size={10} /> Done</span>}
                  </div>

                  {/* Expand chevron */}
                  <div style={{ color: "var(--text-tertiary)" }}>
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div style={{ padding: "0 20px 20px", borderTop: "1px solid var(--border-subtle)" }}>
                    <div style={{ paddingTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))", gap: 12 }}>
                      {/* Task breakdown */}
                      <div style={{ background: "var(--bg-tertiary)", borderRadius: "var(--radius-md)", padding: 14 }}>
                        <p className="section-label" style={{ marginBottom: 12 }}>TASK BREAKDOWN</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {[
                            { label: "Approved", value: s.approved, color: "var(--success)" },
                            { label: "In Progress", value: s.internTasks.filter((t:any) => t.status === "IN_PROGRESS").length, color: "var(--warning)" },
                            { label: "Submitted", value: s.submitted, color: "var(--accent)" },
                            { label: "Rework", value: s.rework, color: "var(--error)" },
                            { label: "Overdue", value: s.overdue, color: "var(--error)" },
                          ].map(({ label, value, color }) => (
                            <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{label}</span>
                              <span style={{ fontSize: 14, fontFamily: "var(--font-mono)", fontWeight: 500, color }}>{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Performance metrics */}
                      <div style={{ background: "var(--bg-tertiary)", borderRadius: "var(--radius-md)", padding: 14 }}>
                        <p className="section-label" style={{ marginBottom: 12 }}>PERFORMANCE</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Completion Rate</span>
                            <span style={{ fontSize: 14, fontFamily: "var(--font-mono)", color: "var(--accent)" }}>{s.completion}%</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Total Reworks</span>
                            <span style={{ fontSize: 14, fontFamily: "var(--font-mono)", color: s.reworkCount > 3 ? "var(--error)" : "var(--text-primary)" }}>{s.reworkCount}</span>
                          </div>
                          {s.eval && (
                            <>
                              <div style={{ height: 1, background: "var(--border-subtle)", margin: "4px 0" }} />
                              <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Final Score</span>
                                <span style={{ fontSize: 18, fontFamily: "var(--font-mono)", fontWeight: 500, color: scoreColor(s.eval.finalScore) }}>{s.eval.finalScore}/100</span>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Status</span>
                                <span style={{ fontSize: 13, color: s.eval.completed ? "var(--success)" : "var(--warning)" }}>{s.eval.completed ? "Completed" : "Draft"}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Criteria scores if evaluation exists */}
                      {s.eval?.criteriaScores?.length > 0 && (
                        <div style={{ background: "var(--bg-tertiary)", borderRadius: "var(--radius-md)", padding: 14 }}>
                          <p className="section-label" style={{ marginBottom: 12 }}>CRITERIA SCORES</p>
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {s.eval.criteriaScores.map((c: any) => (
                              <div key={c.key}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                                  <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{c.label}</span>
                                  <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: c.score >= 7 ? "var(--success)" : "var(--warning)" }}>{c.score}/10</span>
                                </div>
                                <div className="progress-track" style={{ height: 4 }}>
                                  <div className="progress-fill" style={{ width: `${c.score * 10}%`, height: "100%", background: c.score >= 7 ? "var(--success)" : "var(--warning)" }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Recent tasks list */}
                    {s.internTasks.length > 0 && (
                      <div style={{ marginTop: 14 }}>
                        <p className="section-label" style={{ marginBottom: 10 }}>RECENT TASKS</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {s.internTasks.slice(0, 5).map((task: any) => (
                            <div key={task._id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "var(--bg-tertiary)", borderRadius: "var(--radius-sm)" }}>
                              <div style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, background: task.status === "APPROVED" ? "var(--success)" : task.status === "REWORK" || task.status === "OVERDUE" ? "var(--error)" : task.status === "SUBMITTED" ? "var(--accent)" : "var(--text-tertiary)" }} />
                              <span style={{ flex: 1, fontSize: 13, color: "var(--text-primary)" }}>{task.title}</span>
                              <span className={statusBadgeClass(task.status)} style={{ fontSize: 11 }}>{task.status.replace("_", " ")}</span>
                            </div>
                          ))}
                        </div>
                      </div>
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
