"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { GraduationCap, Lock, Loader2, CheckCircle } from "lucide-react";

function SetPasswordContent() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) { toast.error("Invalid link"); return; }
    if (password !== confirm) { toast.error("Passwords don't match"); return; }
    if (password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDone(true);
      setTimeout(() => router.push("/login"), 2000);
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
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 24, color: "var(--text-primary)", marginBottom: 8, fontWeight: 400 }}>All set!</h2>
              <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Redirecting you to login…</p>
            </div>
          ) : (
            <>
              <div style={{ width: 44, height: 44, borderRadius: "var(--radius-md)", background: "var(--accent-10)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                <Lock size={20} color="var(--accent)" />
              </div>
              <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 28, color: "var(--text-primary)", marginBottom: 6, fontWeight: 400 }}>Set your password</h1>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 24 }}>Choose a secure password for your InternHub account.</p>
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label className="label">New Password</label>
                  <input className="input" type="password" placeholder="At least 8 characters" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
                <div>
                  <label className="label">Confirm Password</label>
                  <input className="input" type="password" placeholder="Repeat password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
                </div>
                <button type="submit" className="btn btn-primary btn-lg" disabled={loading || !token} style={{ width: "100%", marginTop: 4 }}>
                  {loading ? <Loader2 size={16} className="animate-spin" /> : "Set Password & Continue"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <SetPasswordContent />
    </Suspense>
  );
}
