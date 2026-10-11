"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart2, TrendingUp, Users, Star } from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Tooltip, Legend,
} from "chart.js";
import { Bar, Line, Pie } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend);

const API = "/api/mentor/performance";

const scoreColor = (s: number | null) =>
  s == null ? "#7d8898" : s >= 80 ? "#22c97b" : s >= 60 ? "#f5a623" : "#ff5d5d";

export default function MentorPerformance() {
  const [batches,         setBatches        ] = useState<any[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [selectedInternId,setSelectedInternId] = useState("");
  const [loadingBatches,  setLoadingBatches ] = useState(true);
  const [loadingAnalytics,setLoadingAnalytics] = useState(false);
  const [error,           setError          ] = useState("");
  const [analyticsData,   setAnalyticsData  ] = useState<any>(null);

  useEffect(() => {
    (async () => {
      setLoadingBatches(true); setError("");
      try {
        const res  = await fetch("/api/batches"); // returns only mentor's batches by role
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        setBatches(list);
        if (list.length) setSelectedBatchId(String(list[0]._id));
      } catch { setError("Failed to load batches"); }
      finally { setLoadingBatches(false); }
    })();
  }, []);

  async function loadAnalytics(batchId: string, internId?: string) {
    if (!batchId) return;
    setLoadingAnalytics(true); setError("");
    try {
      const qp = new URLSearchParams({ batchId });
      if (internId) qp.set("internId", internId);
      const res    = await fetch(`${API}?${qp}`);
      const result = await res.json();
      if (!res.ok || !result.success) { setError(result.error || "Unable to fetch data"); setAnalyticsData(null); return; }
      setAnalyticsData(result);
    } catch { setError("Unable to fetch performance data"); setAnalyticsData(null); }
    finally { setLoadingAnalytics(false); }
  }

  useEffect(() => { if (!selectedBatchId) return; setSelectedInternId(""); loadAnalytics(selectedBatchId); }, [selectedBatchId]);
  useEffect(() => { if (!selectedBatchId || !selectedInternId) return; loadAnalytics(selectedBatchId, selectedInternId); }, [selectedInternId]);

  const internSummary    = analyticsData?.internSummary    || [];
  const internAnalytics  = analyticsData?.internAnalytics  || null;

  useEffect(() => {
    if (!internSummary.length || selectedInternId) return;
    setSelectedInternId(String(internSummary[0]._id));
  }, [internSummary]);

  const dark = typeof window !== "undefined" && document.documentElement.getAttribute("data-theme") !== "light";
  const gridColor = "rgba(255,255,255,0.07)";
  const tickColor = "#9090a8";

  const internWiseData = useMemo(() => ({
    labels: internSummary.map((i: any) => i.name),
    datasets: [{ label: "Latest Score", data: internSummary.map((i: any) => i.latestScore ?? 0), backgroundColor: internSummary.map((i: any) => scoreColor(i.latestScore)), borderRadius: 7 }],
  }), [internSummary]);

  const barOpts: any = {
    responsive: true, maintainAspectRatio: false,
    scales: { x: { ticks: { color: tickColor }, grid: { display: false } }, y: { min: 0, max: 100, ticks: { color: tickColor }, grid: { color: gridColor } } },
    plugins: { legend: { display: false }, tooltip: { backgroundColor: "#1a1a24", borderColor: "rgba(255,255,255,0.12)", borderWidth: 1, titleColor: "#f0f0f5", bodyColor: "#9090a8", padding: 10, cornerRadius: 8 } },
  };

  const trendData = useMemo(() => ({
    labels: (internAnalytics?.scoreTrend || []).map((w: any) => w.label),
    datasets: [{ label: "Score", data: (internAnalytics?.scoreTrend || []).map((w: any) => w.score), borderColor: "#6c77ff", backgroundColor: "rgba(108,119,255,0.15)", fill: true, tension: 0.4, pointRadius: 5, pointBackgroundColor: "#6c77ff", borderWidth: 2 }],
  }), [internAnalytics]);

  const lineOpts: any = {
    responsive: true, maintainAspectRatio: false,
    scales: { x: { ticks: { color: tickColor }, grid: { display: false } }, y: { min: 0, max: 100, ticks: { color: tickColor }, grid: { color: gridColor } } },
    plugins: { legend: { display: false }, tooltip: { backgroundColor: "#1a1a24", borderColor: "rgba(255,255,255,0.12)", borderWidth: 1, titleColor: "#f0f0f5", bodyColor: "#9090a8", padding: 10, cornerRadius: 8 } },
  };

  const criteriaData = useMemo(() => {
    const crit = internAnalytics?.criteriaAverage || [];
    return {
      labels: crit.map((c: any) => c.label),
      datasets: [{ data: crit.map((c: any) => c.avgScore), backgroundColor: ["#6c77ff","#22c97b","#f5a623","#00b4d8","#ff5252","#a78bfa","#f97316"], borderWidth: 0, hoverOffset: 6 }],
    };
  }, [internAnalytics]);

  const pieOpts: any = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { position: "right", labels: { color: tickColor, boxWidth: 12, usePointStyle: true, pointStyle: "circle", padding: 14, font: { size: 12 } } },
      tooltip: { backgroundColor: "#1a1a24", borderColor: "rgba(255,255,255,0.12)", borderWidth: 1, titleColor: "#f0f0f5", bodyColor: "#9090a8", padding: 10, cornerRadius: 8,
        callbacks: { label: (ctx: any) => ` ${ctx.label}: ${ctx.parsed}/10` } },
    },
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <p className="section-label" style={{ marginBottom: 6 }}>MENTOR · ANALYTICS</p>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 32, color: "var(--text-primary)", fontWeight: 400 }}>My Interns Performance</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 4 }}>Select one of your batches, choose an intern, and view their evaluation analytics.</p>
      </div>
      <hr className="divider" style={{ marginBottom: 24 }} />

      {/* Batch selector */}
      <div className="card card-body" style={{ marginBottom: 16 }}>
        <label className="label">Choose Batch</label>
        <select className="input" value={selectedBatchId} onChange={e => setSelectedBatchId(e.target.value)} disabled={loadingBatches || !batches.length} style={{ maxWidth: 360 }}>
          {!batches.length ? <option value="">No batches available</option>
            : batches.map((b: any) => <option key={b._id} value={b._id}>{b.name}</option>)}
        </select>
      </div>

      {error && <div className="card card-body" style={{ borderColor: "var(--error)", marginBottom: 16 }}><p style={{ color: "var(--error)", fontSize: 14 }}>{error}</p></div>}

      {loadingAnalytics ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 16 }}>
          {[1,2].map(i => <div key={i} className="skeleton" style={{ height: 320 }} />)}
        </div>
      ) : (
        <>
          {/* Top row: bar + intern list */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 }}>
            <div className="card">
              <div className="card-header">
                <div><h2 style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>Intern-wise Latest Score</h2>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>{analyticsData?.batch?.name || "—"}</p></div>
                <BarChart2 size={15} color="var(--accent)" />
              </div>
              <div style={{ height: 300, padding: "12px 16px 16px" }}>
                {!internSummary.length
                  ? <div className="empty-state" style={{ height: "100%" }}><Users size={28} /><h3>No interns or evaluations</h3><p>Add interns and complete mentor evaluations.</p></div>
                  : <Bar data={internWiseData} options={barOpts} />}
              </div>
            </div>

            <div className="card card-body" style={{ maxHeight: 420, overflow: "auto" }}>
              <h2 style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)", marginBottom: 12 }}>Interns</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {internSummary.map((intern: any) => (
                  <button key={intern._id} onClick={() => setSelectedInternId(intern._id)} style={{
                    textAlign: "left", padding: "10px 12px", borderRadius: "var(--radius-md)",
                    border: `1px solid ${selectedInternId === intern._id ? "var(--accent)" : "var(--border-default)"}`,
                    background: selectedInternId === intern._id ? "var(--accent-10)" : "var(--bg-tertiary)",
                    cursor: "pointer", transition: "all 150ms",
                  }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{intern.name}</p>
                    <p style={{ fontSize: 11, color: "var(--text-secondary)" }}>{intern.email}</p>
                    <p style={{ fontSize: 12, color: scoreColor(intern.latestScore), marginTop: 4, fontFamily: "var(--font-mono)" }}>
                      Score: {intern.latestScore ?? "No evals yet"}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Intern detail analytics */}
          {selectedInternId && internAnalytics && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12, marginBottom: 16 }}>
                {[
                  { label: "LATEST SCORE",  value: internAnalytics.latestScore  ?? "N/A", color: scoreColor(internAnalytics.latestScore) },
                  { label: "AVERAGE SCORE", value: internAnalytics.averageScore ?? "N/A", color: "var(--text-primary)" },
                  { label: "BEST SCORE",    value: internAnalytics.bestScore    ?? "N/A", color: "var(--success)" },
                  { label: "EVALUATIONS",   value: internAnalytics.evaluationsCount ?? 0, color: "var(--accent)" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="stat-tile">
                    <p className="stat-tile-label">{label}</p>
                    <p className="stat-tile-value num" style={{ color }}>{value}</p>
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 16 }}>
                {/* Score trend */}
                <div className="card">
                  <div className="card-header">
                    <div><h2 style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>Score Trend</h2>
                      <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>{internAnalytics.intern?.name}</p></div>
                    <TrendingUp size={15} color="var(--accent)" />
                  </div>
                  <div style={{ height: 280, padding: "12px 16px 16px" }}>
                    {internAnalytics.scoreTrend?.length
                      ? <Line data={trendData} options={lineOpts} />
                      : <div className="empty-state" style={{ height: "100%" }}><TrendingUp size={24} /><h3>No trend data</h3><p>Needs multiple evaluations.</p></div>}
                  </div>
                </div>

                {/* Criteria pie */}
                <div className="card">
                  <div className="card-header">
                    <div><h2 style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>Criteria-wise Distribution</h2>
                      <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>Average score per evaluation criterion (out of 10)</p></div>
                    <Star size={15} color="var(--warning)" />
                  </div>
                  <div style={{ height: 280, padding: "12px 16px 16px" }}>
                    {criteriaData.labels.length
                      ? <Pie data={criteriaData} options={pieOpts} />
                      : <div className="empty-state" style={{ height: "100%" }}><Star size={24} /><h3>No criteria data</h3><p>Mentor hasn't submitted criteria scores yet.</p></div>}
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
