"use client";
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { GraduationCap, Mail, Loader2, CheckCircle, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSent(true);
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
          {sent ? (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <CheckCircle size={48} color="var(--success)" style={{ margin: "0 auto 16px" }} />
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 24, color: "var(--text-primary)", marginBottom: 8, fontWeight: 400 }}>Check your inbox</h2>
              <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.7 }}>
                If <strong style={{ color: "var(--text-primary)" }}>{email}</strong> is registered, you'll receive a reset link within a few minutes. Check your spam folder if not.
              </p>
              <button onClick={() => setSent(false)} className="btn btn-ghost" style={{ marginTop: 20 }}>Send again</button>
            </div>
          ) : (
            <>
              <div style={{ width: 44, height: 44, borderRadius: "var(--radius-md)", background: "var(--accent-10)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                <Mail size={20} color="var(--accent)" />
              </div>
              <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 28, color: "var(--text-primary)", marginBottom: 6, fontWeight: 400 }}>Forgot password?</h1>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 24, lineHeight: 1.7 }}>Enter your work email and we'll send you a reset link.</p>
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label className="label">Work Email</label>
                  <input className="input" type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: "100%" }}>
                  {loading ? <Loader2 size={16} className="animate-spin" /> : "Send Reset Link"}
                </button>
              </form>
            </>
          )}
        </div>
        <Link href="/login" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 20, fontSize: 14, color: "var(--text-secondary)", textDecoration: "none" }}>
          <ArrowLeft size={14} /> Back to login
        </Link>
      </div>
    </div>
  );
}
