"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Login is now handled via the homepage modal
// This redirect ensures /login links still work
export default function LoginPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/?signin=true"); }, [router]);
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid var(--accent)", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
