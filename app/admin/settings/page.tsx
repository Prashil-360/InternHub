"use client";
import { useSession } from "next-auth/react";
import { Settings, Building2, CheckCircle2 } from "lucide-react";

export default function AdminSettingsPage() {
  const { data: session } = useSession();
  const user = session?.user as any;

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <p className="section-label" style={{ marginBottom: 6 }}>SETTINGS</p>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 32, color: "var(--text-primary)", fontWeight: 400 }}>Settings</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 4 }}>Manage your account and organization preferences</p>
      </div>
      <hr className="divider" style={{ marginBottom: 24 }} />

      <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 640 }}>
        <div className="card card-body">
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ width: 40, height: 40, borderRadius: "var(--radius-md)", background: "var(--accent-10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Building2 size={18} color="var(--accent)" />
            </div>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)" }}>Account Information</h2>
              <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Your admin account details</p>
            </div>
          </div>
          {[{ label: "Name", value: user?.name }, { label: "Email", value: user?.email }, { label: "Role", value: "Admin" }].map(({ label, value }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--border-subtle)" }}>
              <span style={{ width: 100, fontSize: 13, color: "var(--text-tertiary)", fontWeight: 500 }}>{label}</span>
              <span style={{ fontSize: 14, color: "var(--text-primary)" }}>{value || "—"}</span>
            </div>
          ))}
        </div>

        <div className="card card-body" style={{ border: "1px solid var(--accent-20)", background: "var(--accent-10)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <Settings size={18} color="var(--accent)" />
            <h3 style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)" }}>How to add team members</h3>
          </div>
          <ol style={{ display: "flex", flexDirection: "column", gap: 10, paddingLeft: 0, listStyle: "none" }}>
            {["Go to Batches and open or create a batch", 'Click "Add Mentor" or "Add Intern"', "Enter their name & work email", "They receive an invite link to set their password", "They log in and can immediately start working"].map((s, i) => (
              <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, color: "var(--text-secondary)" }}>
                <CheckCircle2 size={16} color="var(--accent)" style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
