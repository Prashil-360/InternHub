"use client";
import { useEffect, useRef, useState } from "react";
import { BarChart2, TrendingUp, Users, CheckCircle2, Loader2 } from "lucide-react";

function ChartCard({ title, subtitle, children, loading }: { title: string; subtitle?: string; children: React.ReactNode; loading?: boolean }) {
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div className="card-header">
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>{title}</h3>
          {subtitle && <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>{subtitle}</p>}
        </div>
      </div>
      <div style={{ padding: "20px 20px 16px", position: "relative", minHeight: 220 }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200 }}>
            <Loader2 size={20} color="var(--accent)" style={{ animation: "spin 0.8s linear infinite" }} />
          </div>
        ) : children}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData]       = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Chart canvas refs
  const lineRef     = useRef<HTMLCanvasElement>(null);
  const doughnutRef = useRef<HTMLCanvasElement>(null);
  const barRef      = useRef<HTMLCanvasElement>(null);
  const roleRef     = useRef<HTMLCanvasElement>(null);

  // Chart instances for cleanup
  const charts = useRef<any[]>([]);

  useEffect(() => {
    fetch("/api/analytics")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!data || loading) return;

    // Destroy old charts
    charts.current.forEach(c => { try { c.destroy(); } catch {} });
    charts.current = [];

    // Load Chart.js from CDN then render
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js";
    script.onload = () => renderCharts();
    document.head.appendChild(script);
    return () => { try { document.head.removeChild(script); } catch {} };
  }, [data, loading]);

  function renderCharts() {
    const C = (window as any).Chart;
    if (!C) return;

    const dark = document.documentElement.getAttribute("data-theme") !== "light";
    const gridColor  = dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
    const tickColor  = dark ? "#9090a8" : "#8a8aa8";
    const fontFamily = "'Geist', system-ui, sans-serif";

    C.defaults.font.family = fontFamily;
    C.defaults.color       = tickColor;

    const pluginDefaults = {
      legend: { labels: { color: tickColor, font: { family: fontFamily, size: 12 }, boxWidth: 12, padding: 16 } },
      tooltip: {
        backgroundColor: dark ? "#1a1a24" : "#ffffff",
        borderColor: dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)",
        borderWidth: 1,
        titleColor: dark ? "#f0f0f5" : "#0a0a0f",
        bodyColor: dark ? "#9090a8" : "#4a4a62",
        padding: 10,
        cornerRadius: 8,
      },
    };

    // 1. Line chart — weekly trend
    if (lineRef.current && data.weeklyTrend) {
      const ctx = lineRef.current.getContext("2d");
      if (ctx) {
        charts.current.push(new C(ctx, {
          type: "line",
          data: {
            labels: data.weeklyTrend.map((w: any) => w.label),
            datasets: [
              {
                label: "Tasks Created",
                data: data.weeklyTrend.map((w: any) => w.created),
                borderColor: "#6c77ff",
                backgroundColor: "rgba(108,119,255,0.12)",
                fill: true,
                tension: 0.4,
                pointBackgroundColor: "#6c77ff",
                pointRadius: 4,
                pointHoverRadius: 6,
                borderWidth: 2,
              },
              {
                label: "Approved",
                data: data.weeklyTrend.map((w: any) => w.approved),
                borderColor: "#22c97b",
                backgroundColor: "rgba(34,201,123,0.08)",
                fill: true,
                tension: 0.4,
                pointBackgroundColor: "#22c97b",
                pointRadius: 4,
                pointHoverRadius: 6,
                borderWidth: 2,
              },
            ],
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: pluginDefaults,
            scales: {
              x: { grid: { color: gridColor }, ticks: { color: tickColor, font: { family: fontFamily, size: 11 } } },
              y: { grid: { color: gridColor }, ticks: { color: tickColor, font: { family: fontFamily, size: 11 }, stepSize: 1 }, beginAtZero: true },
            },
          },
        }));
      }
    }

    // 2. Doughnut — task status
    if (doughnutRef.current && data.taskStatus) {
      const ts = data.taskStatus;
      const ctx = doughnutRef.current.getContext("2d");
      if (ctx) {
        charts.current.push(new C(ctx, {
          type: "doughnut",
          data: {
            labels: Object.keys(ts),
            datasets: [{
              data: Object.values(ts),
              backgroundColor: ["#6c77ff","#f5a623","#00b4d8","#22c97b","#ff5252","#e879f9"],
              borderWidth: 0,
              hoverOffset: 6,
            }],
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            cutout: "68%",
            plugins: {
              ...pluginDefaults,
              legend: { ...pluginDefaults.legend, position: "bottom" as const },
            },
          },
        }));
      }
    }

    // 3. Bar — batch performance
    if (barRef.current && data.batchPerformance?.length) {
      const ctx = barRef.current.getContext("2d");
      if (ctx) {
        charts.current.push(new C(ctx, {
          type: "bar",
          data: {
            labels: data.batchPerformance.map((b: any) => b.name),
            datasets: [
              {
                label: "Interns",
                data: data.batchPerformance.map((b: any) => b.interns),
                backgroundColor: "rgba(108,119,255,0.75)",
                borderRadius: 5,
                borderSkipped: false,
              },
              {
                label: "Completion %",
                data: data.batchPerformance.map((b: any) => b.completion),
                backgroundColor: "rgba(34,201,123,0.75)",
                borderRadius: 5,
                borderSkipped: false,
              },
            ],
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: pluginDefaults,
            scales: {
              x: { grid: { color: gridColor }, ticks: { color: tickColor, font: { family: fontFamily, size: 11 } } },
              y: { grid: { color: gridColor }, ticks: { color: tickColor, font: { family: fontFamily, size: 11 } }, beginAtZero: true },
            },
          },
        }));
      }
    }

    // 4. Pie — role breakdown
    if (roleRef.current && data.roleBreakdown) {
      const rb = data.roleBreakdown;
      const ctx = roleRef.current.getContext("2d");
      if (ctx) {
        charts.current.push(new C(ctx, {
          type: "pie",
          data: {
            labels: ["Admins", "Mentors", "Interns"],
            datasets: [{
              data: [rb.ADMIN || 0, rb.MENTOR || 0, rb.INTERN || 0],
              backgroundColor: ["#f5a623","#6c77ff","#22c97b"],
              borderWidth: 0,
              hoverOffset: 6,
            }],
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
              ...pluginDefaults,
              legend: { ...pluginDefaults.legend, position: "bottom" as const },
            },
          },
        }));
      }
    }
  }

  // Summary stat cards
  const summaryCards = data ? [
    { label: "Total Tasks",    value: data.totals?.tasks ?? 0,       color: "var(--accent)",  icon: CheckCircle2 },
    { label: "Total Batches",  value: data.totals?.batches ?? 0,     color: "var(--info)",    icon: BarChart2 },
    { label: "Total Users",    value: data.totals?.users ?? 0,       color: "var(--success)", icon: Users },
    { label: "Submissions",    value: data.totals?.submissions ?? 0, color: "var(--warning)", icon: TrendingUp },
  ] : [];

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <p className="section-label" style={{ marginBottom: 6 }}>ADMIN · ANALYTICS</p>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 32, color: "var(--text-primary)", fontWeight: 400 }}>Analytics</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 4 }}>
          Live charts powered by your MongoDB data — task trends, batch performance, and team breakdown.
        </p>
      </div>
      <hr className="divider" style={{ marginBottom: 24 }} />

      {/* Summary row */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 14, marginBottom: 24 }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 90 }} />)}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 14, marginBottom: 24 }}>
          {summaryCards.map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="stat-tile">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <p className="stat-tile-label">{label}</p>
                <div style={{ width: 30, height: 30, borderRadius: "var(--radius-md)", background: color + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={14} color={color} />
                </div>
              </div>
              <p className="stat-tile-value num" style={{ fontSize: 28 }}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Charts grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: 18, marginBottom: 18 }}>
        <ChartCard title="Task Activity (8-Week Trend)" subtitle="Tasks created vs approved per week" loading={loading}>
          <div style={{ height: 220 }}><canvas ref={lineRef} /></div>
        </ChartCard>

        <ChartCard title="Task Status Distribution" subtitle="Current breakdown across all tasks" loading={loading}>
          <div style={{ height: 220 }}><canvas ref={doughnutRef} /></div>
        </ChartCard>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: 18 }}>
        <ChartCard title="Batch Performance" subtitle="Interns enrolled vs completion % per batch" loading={loading}>
          {data?.batchPerformance?.length === 0
            ? <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, flexDirection: "column", gap: 8 }}>
                <BarChart2 size={28} color="var(--text-tertiary)" />
                <p style={{ fontSize: 13, color: "var(--text-tertiary)" }}>No batches yet — create your first batch</p>
              </div>
            : <div style={{ height: 220 }}><canvas ref={barRef} /></div>
          }
        </ChartCard>

        <ChartCard title="Team Composition" subtitle="Distribution of admins, mentors & interns" loading={loading}>
          <div style={{ height: 220 }}><canvas ref={roleRef} /></div>
        </ChartCard>
      </div>

      {/* Data freshness note */}
      {!loading && (
        <p style={{ fontSize: 12, color: "var(--text-tertiary)", textAlign: "right", marginTop: 16 }}>
          Live data · Refreshed on page load · {new Date().toLocaleTimeString()}
        </p>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
