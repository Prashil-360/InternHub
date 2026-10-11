"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { GraduationCap, Lock, Loader2, CheckCircle, Eye, EyeOff } from "lucide-react";

function ResetPasswordContent() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const strength = !password ? 0 : password.length < 8 ? 1 : password.length < 12 ? 2 : /[A-Z]/.test(password) && /[0-9]/.test(password) ? 4 : 3;
  const strengthColors = ["", "var(--error)", "var(--warning)", "var(--accent)", "var(--success)"];
  const strengthLabels = ["", "Too short", "Fair", "Good", "Strong"];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) { toast.error("Invalid reset link"); return; }
    if (password !== confirm) { toast.error("Passwords don't match"); return; }
    if (password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDone(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="auth-page">
      <div style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32, justifyContent: "center" }}>
          <div style={{ width: 36, height: 36, borderRadius: "var(--radius-md)", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <GraduationCap size={18} color="#fff" />
          </div>
          <span style={{ fontFamily: "var(--font-serif)", fontSize: 22, color: "var(--text-primary)" }}>InternHub</span>
        </div>
        <div className="auth-card anim-scale-in">
          {done ? (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <CheckCircle size={48} color="var(--success)" style={{ margin: "0 auto 16px" }} />
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 24, color: "var(--text-primary)", marginBottom: 8, fontWeight: 400 }}>Password updated!</h2>
              <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Redirecting to login…</p>
            </div>
          ) : (
            <>
              <div style={{ width: 44, height: 44, borderRadius: "var(--radius-md)", background: "var(--accent-10)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                <Lock size={20} color="var(--accent)" />
              </div>
              <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 28, color: "var(--text-primary)", marginBottom: 6, fontWeight: 400 }}>Set new password</h1>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 24 }}>Choose a strong password for your account.</p>
              {!token && <div style={{ background: "var(--error-10)", border: "1px solid var(--error)", borderRadius: "var(--radius-md)", padding: "10px 14px", marginBottom: 16, fontSize: 14, color: "var(--error)" }}>Invalid or expired reset link. Please request a new one.</div>}
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label className="label">New Password</label>
                  <div style={{ position: "relative" }}>
                    <input className="input" type={showPw ? "text" : "password"} placeholder="Min 8 characters" value={password} onChange={e => setPassword(e.target.value)} required style={{ paddingRight: 44 }} />
                    <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)" }}>
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {password && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                        {[1,2,3,4].map(i => <div key={i} style={{ flex: 1, height: 3, borderRadius: "var(--radius-pill)", background: i <= strength ? strengthColors[strength] : "var(--bg-tertiary)", transition: "background 150ms" }} />)}
                      </div>
                      <span style={{ fontSize: 12, color: strengthColors[strength] }}>{strengthLabels[strength]}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="label">Confirm Password</label>
                  <input className="input" type="password" placeholder="Repeat password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
                  {confirm && password !== confirm && <p style={{ fontSize: 12, color: "var(--error)", marginTop: 4 }}>Passwords don't match</p>}
                </div>
                <button type="submit" className="btn btn-primary btn-lg" disabled={loading || !token} style={{ width: "100%", marginTop: 4 }}>
                  {loading ? <Loader2 size={16} className="animate-spin" /> : "Update Password"}
                </button>
              </form>
            </>
          )}
        </div>
        <Link href="/login" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 20, fontSize: 14, color: "var(--text-secondary)", textDecoration: "none" }}>← Back to login</Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}
