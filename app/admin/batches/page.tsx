"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Plus, Layers, Users, Calendar, ArrowUpRight, Search, X, Loader2,
  ChevronRight, ChevronLeft, Check, Settings, ClipboardList, UserPlus,
  BookOpen, Award, FileText, Zap
} from "lucide-react";
import { formatDate, statusBadgeClass, DEFAULT_EVALUATION_CRITERIA } from "@/lib/utils";

/* ── 7-Step Program Creation Wizard ───────────────────────────── */
const STEPS = [
  { n: 1, icon: BookOpen,    title: "Program Basics",       sub: "Name, type and description" },
  { n: 2, icon: Calendar,    title: "Schedule & Duration",  sub: "Dates and timeline" },
  { n: 3, icon: ClipboardList, title: "Task Settings",      sub: "Proof types and requirements" },
  { n: 4, icon: Award,       title: "Evaluation Criteria",  sub: "Scoring weights" },
  { n: 5, icon: UserPlus,    title: "Add Mentor",           sub: "Assign a mentor" },
  { n: 6, icon: Users,       title: "Add Interns",          sub: "Invite intern emails" },
  { n: 7, icon: Zap,         title: "Review & Launch",      sub: "Confirm and create" },
];

function WizardStep({ step, current }: { step: typeof STEPS[0]; current: number }) {
  const done = step.n < current;
  const active = step.n === current;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}>
      <div style={{
        width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: done ? "var(--success)" : active ? "var(--accent)" : "var(--bg-quaternary)",
        border: `2px solid ${done ? "var(--success)" : active ? "var(--accent)" : "var(--border-default)"}`,
        transition: "all 200ms",
      }}>
        {done ? <Check size={14} color="#fff" /> : <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: active ? "#fff" : "var(--text-tertiary)", fontWeight: 500 }}>{step.n}</span>}
      </div>
      <div style={{ display: step.n === current || step.n < current ? "block" : "block" }}>
        <p style={{ fontSize: 13, fontWeight: active ? 500 : 400, color: active ? "var(--text-primary)" : done ? "var(--text-secondary)" : "var(--text-tertiary)" }}>{step.title}</p>
        <p style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{step.sub}</p>
      </div>
    </div>
  );
}

interface WizardData {
  name: string; programType: string; description: string;
  startDate: string; durationInWeeks: string; endDate: string;
  proofTypes: string[]; weeklyReporting: boolean;
  criteria: Array<{ key: string; label: string; weight: number; enabled: boolean }>;
  mentorName: string; mentorEmail: string;
  internEmails: string; internNames: string;
}

function ProgramWizard({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<WizardData>({
    name: "", programType: "TECHNICAL", description: "",
    startDate: "", durationInWeeks: "8", endDate: "",
    proofTypes: ["GITHUB", "URL", "DOC"],
    weeklyReporting: true,
    criteria: DEFAULT_EVALUATION_CRITERIA.map(c => ({ ...c })),
    mentorName: "", mentorEmail: "",
    internEmails: "", internNames: "",
  });
  const set = (k: keyof WizardData, v: any) => setData(p => ({ ...p, [k]: v }));

  // Auto-calculate end date
  useEffect(() => {
    if (data.startDate && data.durationInWeeks) {
      const start = new Date(data.startDate);
      start.setDate(start.getDate() + parseInt(data.durationInWeeks) * 7);
      set("endDate", start.toISOString().split("T")[0]);
    }
  }, [data.startDate, data.durationInWeeks]);

  const totalWeight = data.criteria.filter(c => c.enabled).reduce((s, c) => s + c.weight, 0);

  function toggleProof(p: string) {
    set("proofTypes", data.proofTypes.includes(p)
      ? data.proofTypes.filter(x => x !== p)
      : [...data.proofTypes, p]);
  }

  function updateCriteriaWeight(key: string, weight: number) {
    set("criteria", data.criteria.map(c => c.key === key ? { ...c, weight } : c));
  }

  function toggleCriteria(key: string) {
    set("criteria", data.criteria.map(c => c.key === key ? { ...c, enabled: !c.enabled } : c));
  }

  async function handleLaunch() {
    if (!data.name || !data.startDate) { toast.error("Batch name and start date are required"); return; }
    setLoading(true);
    try {
      // Step 1: Create batch
      const batchRes = await fetch("/api/batches", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name, description: data.description,
          startDate: data.startDate, durationInWeeks: parseInt(data.durationInWeeks),
        }),
      });
      const batch = await batchRes.json();
      if (!batchRes.ok) throw new Error(batch.error);

      // Step 2: Add mentor if provided
      if (data.mentorEmail && data.mentorName) {
        await fetch(`/api/batches/${batch._id}/add-user`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: "MENTOR", name: data.mentorName, email: data.mentorEmail }),
        });
      }

      // Step 3: Add interns if provided
      const emails = data.internEmails.split("\n").map(e => e.trim()).filter(Boolean);
      const names = data.internNames.split("\n").map(n => n.trim()).filter(Boolean);
      for (let i = 0; i < emails.length; i++) {
        const email = emails[i];
        const name = names[i] || email.split("@")[0];
        await fetch(`/api/batches/${batch._id}/add-user`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: "INTERN", name, email }),
        }).catch(() => {});
      }

      toast.success(`Program "${data.name}" launched! Invite emails sent.`);
      onCreated(); onClose();
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  }

  const canNext = () => {
    if (step === 1) return data.name.trim().length > 0;
    if (step === 2) return data.startDate.length > 0;
    return true;
  };

  const inputStyle = { width: "100%", height: 40, padding: "0 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-default)", background: "var(--bg-quaternary)", color: "var(--text-primary)", fontFamily: "var(--font-sans)", fontSize: 14, outline: "none" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-emphasis)", borderRadius: "var(--radius-xl)", maxWidth: 800, maxHeight: "92vh", width: "calc(100vw - 24px)", display: "flex", flexDirection: "column", boxShadow: "0 32px 80px rgba(0,0,0,0.5)", overflow: "hidden" }}>

        {/* Wizard header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 22, color: "var(--text-primary)", fontWeight: 400 }}>New Internship Program</h2>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>Step {step} of {STEPS.length} — {STEPS[step-1].title}</p>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", background: "var(--bg-tertiary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)" }}>
            <X size={14} />
          </button>
        </div>

        <div className="wizard-layout" style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* Left stepper */}
          <div className="wizard-stepper" style={{ width: 220, borderRight: "1px solid var(--border-subtle)", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 4, flexShrink: 0, overflowY: "auto" }}>
            {STEPS.map(s => (
              <div key={s.n}>
                <WizardStep step={s} current={step} />
                {s.n < STEPS.length && <div style={{ width: 1, height: 12, background: "var(--border-subtle)", margin: "0 15px" }} />}
              </div>
            ))}
          </div>

          {/* Right content */}
          <div className="wizard-content" style={{ flex: 1, padding: "24px 28px", overflowY: "auto" }}>

            {step === 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>Program Name *</label>
                  <input style={inputStyle} placeholder="e.g. Summer 2026 — Backend Engineering" value={data.name} onChange={e => set("name", e.target.value)} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>Program Type</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                    {["TECHNICAL","DESIGN","RESEARCH"].map(t => (
                      <button key={t} onClick={() => set("programType", t)} type="button" style={{
                        padding: "10px 0", border: `2px solid ${data.programType === t ? "var(--accent)" : "var(--border-default)"}`,
                        borderRadius: "var(--radius-md)", background: data.programType === t ? "var(--accent-10)" : "transparent",
                        color: data.programType === t ? "var(--accent)" : "var(--text-secondary)",
                        cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: "var(--font-sans)", transition: "all 150ms",
                      }}>{t}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>Description</label>
                  <textarea style={{ ...inputStyle, height: "auto", minHeight: 90, padding: "10px 12px", resize: "vertical" as const }}
                    placeholder="Describe the internship program goals and focus areas…"
                    value={data.description} onChange={e => set("description", e.target.value)} />
                </div>
              </div>
            )}

            {step === 2 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>Start Date *</label>
                    <input type="date" style={inputStyle} value={data.startDate} onChange={e => set("startDate", e.target.value)} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>Duration</label>
                    <select style={{ ...inputStyle, appearance: "none" as const }} value={data.durationInWeeks} onChange={e => set("durationInWeeks", e.target.value)}>
                      {[4,6,8,10,12,16,20,24].map(w => <option key={w} value={w}>{w} weeks ({Math.round(w/4)} months)</option>)}
                    </select>
                  </div>
                </div>
                {data.startDate && (
                  <div style={{ padding: "14px 16px", background: "var(--accent-10)", border: "1px solid var(--accent-20)", borderRadius: "var(--radius-md)", fontSize: 14, color: "var(--accent)" }}>
                    📅 Estimated end date: <strong>{data.endDate ? new Date(data.endDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—"}</strong>
                    <span style={{ color: "var(--text-secondary)", marginLeft: 8 }}>({data.durationInWeeks} weeks)</span>
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 10 }}>Allowed Proof Types</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {["GITHUB","URL","DOC","IMAGE","OTHER"].map(p => (
                      <button key={p} onClick={() => toggleProof(p)} type="button" style={{
                        padding: "8px 14px", border: `2px solid ${data.proofTypes.includes(p) ? "var(--accent)" : "var(--border-default)"}`,
                        borderRadius: "var(--radius-md)", background: data.proofTypes.includes(p) ? "var(--accent-10)" : "transparent",
                        color: data.proofTypes.includes(p) ? "var(--accent)" : "var(--text-secondary)",
                        cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: "var(--font-sans)", transition: "all 150ms",
                        display: "flex", alignItems: "center", gap: 6,
                      }}>
                        {data.proofTypes.includes(p) && <Check size={12} />} {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                    <input type="checkbox" checked={data.weeklyReporting} onChange={e => set("weeklyReporting", e.target.checked)} style={{ accentColor: "var(--accent)", width: 16, height: 16 }} />
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>Enable weekly reports</p>
                      <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>Interns submit a structured weekly progress report every week</p>
                    </div>
                  </label>
                </div>
                <div style={{ padding: 14, background: "var(--bg-tertiary)", borderRadius: "var(--radius-md)", fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  💡 <strong style={{ color: "var(--text-primary)" }}>Proof types</strong> determine what interns must provide when submitting a task. Choose at least one.
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, alignItems: "center" }}>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Set weights for evaluation criteria (total must ideally equal 100%)</p>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: totalWeight === 100 ? "var(--success)" : totalWeight > 100 ? "var(--error)" : "var(--warning)", fontWeight: 500 }}>
                    {totalWeight}/100
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {data.criteria.map(c => (
                    <div key={c.key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "var(--bg-tertiary)", borderRadius: "var(--radius-md)" }}>
                      <input type="checkbox" checked={c.enabled} onChange={() => toggleCriteria(c.key)} style={{ accentColor: "var(--accent)", width: 15, height: 15, flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 14, color: c.enabled ? "var(--text-primary)" : "var(--text-tertiary)", fontWeight: c.enabled ? 500 : 400 }}>{c.label}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <input type="range" min={5} max={40} step={5} value={c.weight}
                          onChange={e => updateCriteriaWeight(c.key, parseInt(e.target.value))}
                          disabled={!c.enabled}
                          style={{ width: 100, accentColor: "var(--accent)", opacity: c.enabled ? 1 : 0.4 }} />
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: c.enabled ? "var(--accent)" : "var(--text-tertiary)", minWidth: 36, textAlign: "right" }}>{c.weight}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 5 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ padding: "12px 16px", background: "var(--info-10)", borderRadius: "var(--radius-md)", fontSize: 13, color: "var(--info)" }}>
                  ℹ️ The mentor will receive an invite email to set their password and join the program. Skip this step to add mentors later.
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>Mentor Full Name</label>
                  <input style={inputStyle} placeholder="e.g. Priya Sharma" value={data.mentorName} onChange={e => set("mentorName", e.target.value)} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>Mentor Work Email</label>
                  <input type="email" style={inputStyle} placeholder="mentor@company.com" value={data.mentorEmail} onChange={e => set("mentorEmail", e.target.value)} />
                </div>
                {(!data.mentorEmail && !data.mentorName) && (
                  <p style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Leave blank to skip — you can add mentors later from the batch detail page.</p>
                )}
              </div>
            )}

            {step === 6 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ padding: "12px 16px", background: "var(--success-10)", borderRadius: "var(--radius-md)", fontSize: 13, color: "var(--success)" }}>
                  ✉️ Each intern will get an invite email with a link to set their password. Skip to add interns later.
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>
                    Intern Names <span style={{ color: "var(--text-tertiary)", fontWeight: 400 }}>(one per line)</span>
                  </label>
                  <textarea style={{ ...inputStyle, height: "auto", minHeight: 100, padding: "10px 12px", resize: "vertical" as const, fontFamily: "var(--font-mono)", fontSize: 13 }}
                    placeholder={"Rahul Mehta\nPriya Singh\nAditya Kumar"}
                    value={data.internNames} onChange={e => set("internNames", e.target.value)} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>
                    Intern Emails <span style={{ color: "var(--text-tertiary)", fontWeight: 400 }}>(one per line, same order as names)</span>
                  </label>
                  <textarea style={{ ...inputStyle, height: "auto", minHeight: 100, padding: "10px 12px", resize: "vertical" as const, fontFamily: "var(--font-mono)", fontSize: 13 }}
                    placeholder={"rahul@company.com\npriya@company.com\naditya@company.com"}
                    value={data.internEmails} onChange={e => set("internEmails", e.target.value)} />
                </div>
              </div>
            )}

            {step === 7 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ background: "var(--bg-tertiary)", borderRadius: "var(--radius-md)", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Program Name</span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>{data.name || "—"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Type</span>
                    <span style={{ fontSize: 13, color: "var(--text-primary)" }}>{data.programType}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Start Date</span>
                    <span style={{ fontSize: 13, fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>{data.startDate || "—"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Duration</span>
                    <span style={{ fontSize: 13, fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>{data.durationInWeeks} weeks</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Proof Types</span>
                    <span style={{ fontSize: 13, color: "var(--text-primary)" }}>{data.proofTypes.join(", ") || "None"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Weekly Reports</span>
                    <span style={{ fontSize: 13, color: data.weeklyReporting ? "var(--success)" : "var(--text-tertiary)" }}>{data.weeklyReporting ? "Enabled" : "Disabled"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Mentor</span>
                    <span style={{ fontSize: 13, color: "var(--text-primary)" }}>{data.mentorName || "Add later"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Interns to invite</span>
                    <span style={{ fontSize: 13, fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
                      {data.internEmails.split("\n").filter(Boolean).length} interns
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Eval Criteria</span>
                    <span style={{ fontSize: 13, color: totalWeight === 100 ? "var(--success)" : "var(--warning)" }}>
                      {data.criteria.filter(c => c.enabled).length} criteria · {totalWeight}% total
                    </span>
                  </div>
                </div>
                {totalWeight !== 100 && (
                  <div style={{ padding: "10px 14px", background: "var(--warning-10)", border: "1px solid rgba(245,166,35,0.3)", borderRadius: "var(--radius-md)", fontSize: 13, color: "var(--warning)" }}>
                    ⚠️ Evaluation criteria weights total {totalWeight}%. Ideally should be 100%.
                  </div>
                )}
                {!data.name && (
                  <div style={{ padding: "10px 14px", background: "var(--error-10)", border: "1px solid rgba(255,82,82,0.3)", borderRadius: "var(--radius-md)", fontSize: 13, color: "var(--error)" }}>
                    ❌ Program name is required.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={() => step > 1 ? setStep(s => s - 1) : onClose()}
            style={{ height: 36, padding: "0 16px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", background: "transparent", color: "var(--text-secondary)", cursor: "pointer", fontSize: 14, fontFamily: "var(--font-sans)", display: "flex", alignItems: "center", gap: 6 }}>
            <ChevronLeft size={14} /> {step > 1 ? "Back" : "Cancel"}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Progress dots */}
            <div style={{ display: "flex", gap: 5 }}>
              {STEPS.map(s => <div key={s.n} style={{ width: 6, height: 6, borderRadius: "50%", background: s.n <= step ? "var(--accent)" : "var(--border-default)", transition: "background 200ms" }} />)}
            </div>
            {step < 7 ? (
              <button onClick={() => canNext() && setStep(s => s + 1)} disabled={!canNext()}
                style={{ height: 36, padding: "0 20px", background: canNext() ? "var(--accent)" : "var(--bg-quaternary)", color: canNext() ? "#fff" : "var(--text-tertiary)", border: "none", borderRadius: "var(--radius-md)", cursor: canNext() ? "pointer" : "not-allowed", fontSize: 14, fontWeight: 500, fontFamily: "var(--font-sans)", display: "flex", alignItems: "center", gap: 6 }}>
                Next <ChevronRight size={14} />
              </button>
            ) : (
              <button onClick={handleLaunch} disabled={loading || !data.name}
                style={{ height: 36, padding: "0 24px", background: "var(--success)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", cursor: loading || !data.name ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 500, fontFamily: "var(--font-sans)", display: "flex", alignItems: "center", gap: 6, opacity: !data.name ? 0.5 : 1 }}>
                {loading ? <Loader2 size={14} style={{ animation: "spin 0.8s linear infinite" }} /> : <><Zap size={14} /> Launch Program</>}
              </button>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ── Batches List Page ─────────────────────────────────────────── */
export default function BatchesPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showWizard, setShowWizard] = useState(false);

  const load = () => {
    setLoading(true);
    fetch("/api/batches").then(r => r.json()).then(d => {
      setBatches(Array.isArray(d) ? d : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const filtered = batches.filter(b => b.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <p className="section-label" style={{ marginBottom: 6 }}>BATCHES</p>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 32, color: "var(--text-primary)", fontWeight: 400 }}>Internship Batches</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 4 }}>Create and manage internship cohorts</p>
        </div>
        <button onClick={() => setShowWizard(true)} className="btn btn-primary">
          <Plus size={14} /> New Program
        </button>
      </div>
      <hr className="divider" style={{ marginBottom: 24 }} />

      <div style={{ position: "relative", maxWidth: 320, marginBottom: 24 }}>
        <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)" }} />
        <input className="input" style={{ paddingLeft: 36 }} placeholder="Search batches…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 160 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state card" style={{ padding: "60px 24px" }}>
          <Layers size={32} />
          <h3>{search ? "No batches match your search" : "No batches yet"}</h3>
          <p>Create your first internship program with the guided 7-step wizard.</p>
          {!search && (
            <button onClick={() => setShowWizard(true)} className="btn btn-primary btn-sm">
              <Plus size={12} /> Create Program
            </button>
          )}
        </div>
      ) : (
        <div className="stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
          {filtered.map(batch => (
            <Link key={batch._id} href={`/admin/batches/${batch._id}`} style={{ textDecoration: "none" }}>
              <div className="card anim-fade-up" style={{ padding: 20, cursor: "pointer", transition: "border-color 150ms" }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--accent)")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border-default)")}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "var(--radius-md)", background: "var(--accent-10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Layers size={18} color="var(--accent)" />
                  </div>
                  <span className={statusBadgeClass(batch.currentStatus)}>{batch.currentStatus}</span>
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)", marginBottom: 4 }}>{batch.name}</h3>
                {batch.description && (
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12, lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                    {batch.description}
                  </p>
                )}
                <div style={{ display: "flex", gap: 16, fontSize: 13, color: "var(--text-secondary)" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Users size={12} /><span className="num">{batch.internIds?.length ?? 0}</span> interns
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Calendar size={12} /><span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{formatDate(batch.startDate)}</span>
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", marginTop: 12, color: "var(--accent)", fontSize: 13 }}>
                  Manage <ArrowUpRight size={12} style={{ marginLeft: 4 }} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showWizard && <ProgramWizard onClose={() => setShowWizard(false)} onCreated={load} />}
    </div>
  );
}
