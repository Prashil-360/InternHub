"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, X, Loader2, Users, Mail, UserPlus } from "lucide-react";
import { getInitials, formatDate, statusBadgeClass } from "@/lib/utils";

function AddUserModal({ batchId, role, onClose, onDone }: { batchId: string; role: "MENTOR"|"INTERN"; onClose: () => void; onDone: () => void }) {
  const [tab, setTab] = useState<"new"|"existing">("new");
  const [form, setForm] = useState({ name: "", email: "" });
  const [existing, setExisting] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tab === "existing") fetch(`/api/users?role=${role}`).then(r => r.json()).then(d => setExisting(Array.isArray(d) ? d : []));
  }, [tab, role]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const body = tab === "new" ? { role, ...form } : { role, userId: selectedId };
      const res = await fetch(`/api/batches/${batchId}/add-user`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`${role === "MENTOR" ? "Mentor" : "Intern"} added! ${tab === "new" ? "Invite email sent." : ""}`);
      onDone(); onClose();
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box anim-scale-in">
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 500, color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Add {role === "MENTOR" ? "Mentor" : "Intern"}</h2>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>Invite a new person or add an existing user to this batch.</p>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ width: 32, padding: 0 }}><X size={14} /></button>
        </div>
        <div style={{ display: "flex", borderBottom: "1px solid var(--border-subtle)" }}>
          {(["new","existing"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, height: 40, border: "none", background: "none", cursor: "pointer",
              fontSize: 14, fontFamily: "var(--font-sans)", fontWeight: 500,
              color: tab === t ? "var(--accent)" : "var(--text-secondary)",
              borderBottom: tab === t ? "2px solid var(--accent)" : "2px solid transparent",
              transition: "all 150ms",
            }}>{t === "new" ? "Invite New Person" : "Add Existing User"}</button>
          ))}
        </div>
        <form onSubmit={submit}>
          <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {tab === "new" ? (
              <>
                <div>
                  <label className="label">Full Name *</label>
                  <input className="input" placeholder="John Doe" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
                </div>
                <div>
                  <label className="label">Work Email *</label>
                  <input className="input" type="email" placeholder="john@company.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "var(--accent-10)", borderRadius: "var(--radius-md)", fontSize: 13, color: "var(--accent)" }}>
                  <Mail size={14} />
                  They'll receive an invite email to set their password.
                </div>
              </>
            ) : (
              <div>
                <label className="label">Select {role === "MENTOR" ? "Mentor" : "Intern"}</label>
                <select className="input select" value={selectedId} onChange={e => setSelectedId(e.target.value)} required style={{ appearance: "none" }}>
                  <option value="">— Choose a user —</option>
                  {existing.map(u => <option key={u._id} value={u._id}>{u.name} ({u.email})</option>)}
                </select>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <Loader2 size={14} className="animate-spin" /> : <><UserPlus size={14} /> Add</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UserCard({ user, role, batchId, onRemove }: { user: any; role: string; batchId: string; onRemove: () => void }) {
  const [removing, setRemoving] = useState(false);
  const accentByRole = role === "MENTOR" ? "#6c77ff" : "#22c97b";

  async function remove() {
    if (!confirm(`Remove ${user.name} from this batch?`)) return;
    setRemoving(true);
    const res = await fetch(`/api/batches/${batchId}/remove-user`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user._id, role }),
    });
    if (res.ok) { toast.success("Removed"); onRemove(); }
    else { toast.error("Failed to remove"); setRemoving(false); }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border-subtle)" }}>
      <div style={{ width: 36, height: 36, borderRadius: "var(--radius-md)", background: accentByRole + "18", color: accentByRole, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 500, flexShrink: 0 }}>
        {getInitials(user.name)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</p>
        <p style={{ fontSize: 12, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</p>
      </div>
      <button onClick={remove} disabled={removing} className="btn btn-secondary btn-sm" style={{ width: 28, padding: 0, color: "var(--error)", borderColor: "var(--error)", opacity: removing ? 0.5 : 1 }}>
        {removing ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
      </button>
    </div>
  );
}

export default function BatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [batch, setBatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"MENTOR"|"INTERN"|null>(null);
  const [updating, setUpdating] = useState(false);

  const load = () => { fetch(`/api/batches/${id}`).then(r => r.json()).then(d => { setBatch(d); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { load(); }, [id]);

  async function updateStatus(status: string) {
    setUpdating(true);
    const res = await fetch(`/api/batches/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentStatus: status }) });
    if (res.ok) { toast.success("Status updated"); load(); }
    setUpdating(false);
  }

  if (loading) return <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>{[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 80 }} />)}</div>;
  if (!batch) return <div className="empty-state"><h3>Batch not found</h3></div>;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
        <Link href="/admin/batches" className="btn btn-secondary btn-sm" style={{ width: 32, padding: 0 }}><ArrowLeft size={14} /></Link>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 28, color: "var(--text-primary)", fontWeight: 400 }}>{batch.name}</h1>
            <span className={statusBadgeClass(batch.currentStatus)}>{batch.currentStatus}</span>
          </div>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 4, fontFamily: "var(--font-mono)" }}>
            Started {formatDate(batch.startDate)} · {batch.durationInWeeks} weeks
          </p>
        </div>
        <select value={batch.currentStatus} onChange={e => updateStatus(e.target.value)}
          disabled={updating} className="input select" style={{ width: "auto", appearance: "none" }}>
          {["PLANNED","ONGOING","COMPLETED"].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <hr className="divider" style={{ marginBottom: 24 }} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px,1fr))", gap: 16 }}>
        {/* Mentors */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)" }}>Mentors <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-tertiary)" }}>({batch.mentorIds?.length ?? 0})</span></h2>
            </div>
            <button onClick={() => setModal("MENTOR")} className="btn btn-ghost btn-sm"><Plus size={12} /> Add</button>
          </div>
          <div style={{ padding: "0 20px 16px" }}>
            {batch.mentorIds?.length === 0 ? (
              <div style={{ padding: "24px 0", textAlign: "center", color: "var(--text-tertiary)", fontSize: 14 }}>No mentors added yet</div>
            ) : (
              batch.mentorIds.map((m: any) => <UserCard key={m._id} user={m} role="MENTOR" batchId={id} onRemove={load} />)
            )}
          </div>
        </div>

        {/* Interns */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)" }}>Interns <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-tertiary)" }}>({batch.internIds?.length ?? 0})</span></h2>
            </div>
            <button onClick={() => setModal("INTERN")} className="btn btn-ghost btn-sm"><Plus size={12} /> Add</button>
          </div>
          <div style={{ padding: "0 20px 16px", maxHeight: 400, overflowY: "auto" }}>
            {batch.internIds?.length === 0 ? (
              <div style={{ padding: "24px 0", textAlign: "center", color: "var(--text-tertiary)", fontSize: 14 }}>No interns added yet</div>
            ) : (
              batch.internIds.map((intern: any) => <UserCard key={intern._id} user={intern} role="INTERN" batchId={id} onRemove={load} />)
            )}
          </div>
        </div>
      </div>

      {modal && <AddUserModal batchId={id} role={modal} onClose={() => setModal(null)} onDone={load} />}
    </div>
  );
}
