"use client";
import { useEffect, useState } from "react";
import { Users, Search } from "lucide-react";
import { getInitials, formatDate } from "@/lib/utils";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  useEffect(() => { fetch("/api/users").then(r => r.json()).then(d => { setUsers(Array.isArray(d) ? d : []); setLoading(false); }); }, []);

  const filtered = users.filter(u => {
    const matchRole = roleFilter === "ALL" || u.role === roleFilter;
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  const roleColor: Record<string, string> = { ADMIN: "#f5a623", MENTOR: "#6c77ff", INTERN: "#22c97b" };

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <p className="section-label" style={{ marginBottom: 6 }}>USERS</p>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 32, color: "var(--text-primary)", fontWeight: 400 }}>All Users</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 4 }}>Everyone in your InternHub organization</p>
      </div>
      <hr className="divider" style={{ marginBottom: 24 }} />

      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200, maxWidth: 320 }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)" }} />
          <input className="input" style={{ paddingLeft: 36 }} placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: "flex", background: "var(--bg-tertiary)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", padding: 4, gap: 2 }}>
          {["ALL","ADMIN","MENTOR","INTERN"].map(r => (
            <button key={r} onClick={() => setRoleFilter(r)} style={{
              padding: "4px 12px", borderRadius: "var(--radius-sm)", border: "none", cursor: "pointer",
              fontSize: 13, fontFamily: "var(--font-sans)", fontWeight: 500, transition: "all 150ms",
              background: roleFilter === r ? "var(--bg-secondary)" : "transparent",
              color: roleFilter === r ? "var(--text-primary)" : "var(--text-secondary)",
              boxShadow: roleFilter === r ? "var(--shadow-subtle)" : "none",
            }}>{r === "ALL" ? "All" : r[0] + r.slice(1).toLowerCase() + "s"}</button>
          ))}
        </div>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>{[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 52 }} />)}</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><Users size={32} /><h3>No users found</h3><p>Try adjusting your search or filter.</p></div>
        ) : (
          <div className="table-responsive" style={{ borderRadius: "var(--radius-lg)", overflow: "hidden" }}><table className="table">
            <thead><tr><th>User</th><th>Role</th><th>Status</th><th>Joined</th></tr></thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u._id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "var(--radius-md)", background: (roleColor[u.role] || "#6c77ff") + "22", color: roleColor[u.role] || "#6c77ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 500, flexShrink: 0 }}>
                        {getInitials(u.name)}
                      </div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>{u.name}</p>
                        <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: "var(--radius-sm)", background: (roleColor[u.role] || "#6c77ff") + "18", color: roleColor[u.role] || "#6c77ff", fontWeight: 500 }}>{u.role}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: "var(--radius-sm)", background: u.hasCompletedOnboarding ? "var(--success-10)" : "var(--warning-10)", color: u.hasCompletedOnboarding ? "var(--success)" : "var(--warning)", fontWeight: 500 }}>
                      {u.hasCompletedOnboarding ? "Active" : "Pending setup"}
                    </span>
                  </td>
                  <td style={{ fontSize: 13, fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>{formatDate(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </div>
    </div>
  );
}
