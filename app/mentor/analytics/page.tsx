"use client";
import { useEffect, useRef, useState } from "react";
import { BarChart2, Loader2 } from "lucide-react";

export default function MentorAnalyticsPage() {
  const [data, setData]       = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const lineRef     = useRef<HTMLCanvasElement>(null);
  const doughnutRef = useRef<HTMLCanvasElement>(null);
  const barRef      = useRef<HTMLCanvasElement>(null);
  const charts      = useRef<any[]>([]);

  useEffect(() => {
    fetch("/api/analytics").then(r=>r.json()).then(d=>{setData(d);setLoading(false);}).catch(()=>setLoading(false));
  }, []);

  useEffect(() => {
    if (!data || loading) return;
    charts.current.forEach(c=>{try{c.destroy();}catch{}});
    charts.current = [];
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js";
    s.onload = () => {
      const C = (window as any).Chart;
      if (!C) return;
      const dark = document.documentElement.getAttribute("data-theme") !== "light";
      const grid = dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
      const tick = dark ? "#9090a8" : "#8a8aa8";
      const ff = "'Geist',system-ui,sans-serif";
      C.defaults.font.family = ff;
      const tips = {backgroundColor:dark?"#1a1a24":"#fff",borderColor:dark?"rgba(255,255,255,0.12)":"rgba(0,0,0,0.1)",borderWidth:1,titleColor:dark?"#f0f0f5":"#0a0a0f",bodyColor:dark?"#9090a8":"#4a4a62",padding:10,cornerRadius:8};
      const leg = {labels:{color:tick,font:{family:ff,size:11},boxWidth:10}};

      if (lineRef.current && data.weeklyTrend) {
        const ctx = lineRef.current.getContext("2d");
        if (ctx) charts.current.push(new C(ctx,{type:"line",data:{labels:data.weeklyTrend.map((w:any)=>w.label),datasets:[{label:"Created",data:data.weeklyTrend.map((w:any)=>w.created),borderColor:"#6c77ff",backgroundColor:"rgba(108,119,255,0.12)",fill:true,tension:0.4,pointRadius:4,borderWidth:2},{label:"Approved",data:data.weeklyTrend.map((w:any)=>w.approved),borderColor:"#22c97b",backgroundColor:"rgba(34,201,123,0.08)",fill:true,tension:0.4,pointRadius:4,borderWidth:2}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:leg,tooltip:tips},scales:{x:{grid:{color:grid},ticks:{color:tick}},y:{grid:{color:grid},ticks:{color:tick},beginAtZero:true}}}}));
      }
      if (doughnutRef.current && data.taskStatus) {
        const ts = data.taskStatus;
        const ctx = doughnutRef.current.getContext("2d");
        if (ctx) charts.current.push(new C(ctx,{type:"doughnut",data:{labels:Object.keys(ts),datasets:[{data:Object.values(ts),backgroundColor:["#6c77ff","#f5a623","#00b4d8","#22c97b","#ff5252"],borderWidth:0,hoverOffset:5}]},options:{responsive:true,maintainAspectRatio:false,cutout:"65%",plugins:{legend:{...leg,position:"bottom"},tooltip:tips}}}));
      }
      if (barRef.current && data.batchPerformance?.length) {
        const ctx = barRef.current.getContext("2d");
        if (ctx) charts.current.push(new C(ctx,{type:"bar",data:{labels:data.batchPerformance.map((b:any)=>b.name),datasets:[{label:"Interns",data:data.batchPerformance.map((b:any)=>b.interns),backgroundColor:"rgba(108,119,255,0.75)",borderRadius:5},{label:"Completion %",data:data.batchPerformance.map((b:any)=>b.completion),backgroundColor:"rgba(34,201,123,0.75)",borderRadius:5}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:leg,tooltip:tips},scales:{x:{grid:{color:grid},ticks:{color:tick}},y:{grid:{color:grid},ticks:{color:tick},beginAtZero:true}}}}));
      }
    };
    document.head.appendChild(s);
    return () => {try{document.head.removeChild(s);}catch{}};
  }, [data, loading]);

  const ts = data?.taskStatus || {};
  const totalTasks = (Object.values(ts) as number[]).reduce((a,b)=>a+b,0);
  const approved   = (ts.APPROVED||0) as number;
  const pct        = totalTasks>0 ? Math.round((approved/totalTasks)*100) : 0;

  return (
    <div>
      <div style={{marginBottom:28}}>
        <p className="section-label" style={{marginBottom:6}}>MENTOR · ANALYTICS</p>
        <h1 style={{fontFamily:"var(--font-serif)",fontSize:32,color:"var(--text-primary)",fontWeight:400}}>My Analytics</h1>
        <p style={{color:"var(--text-secondary)",fontSize:14,marginTop:4}}>Task activity, batch performance and status breakdown across your batches.</p>
      </div>
      <hr className="divider" style={{marginBottom:24}}/>

      {loading ? (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:14,marginBottom:24}}>
          {[1,2,3,4].map(i=><div key={i} className="skeleton" style={{height:90}}/>)}
        </div>
      ) : (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:14,marginBottom:24}}>
          <div className="stat-tile"><p className="stat-tile-label">TOTAL TASKS</p><p className="stat-tile-value num">{totalTasks}</p></div>
          <div className="stat-tile"><p className="stat-tile-label">APPROVED</p><p className="stat-tile-value num" style={{color:"var(--success)"}}>{approved}</p></div>
          <div className="stat-tile"><p className="stat-tile-label">APPROVAL RATE</p><p className="stat-tile-value num" style={{color:"var(--accent)"}}>{pct}%</p></div>
          <div className="stat-tile"><p className="stat-tile-label">MY BATCHES</p><p className="stat-tile-value num">{data?.totals?.batches??0}</p></div>
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:18,marginBottom:18}}>
        {[
          {title:"Task Activity (8-Week Trend)", ref:lineRef},
          {title:"Task Status Distribution",    ref:doughnutRef},
        ].map(({title,ref})=>(
          <div key={title} className="card" style={{padding:0}}>
            <div className="card-header"><h3 style={{fontSize:14,fontWeight:500,color:"var(--text-primary)"}}>{title}</h3></div>
            <div style={{padding:"18px 18px 14px"}}>
              {loading
                ? <div style={{height:200,display:"flex",alignItems:"center",justifyContent:"center"}}><Loader2 size={20} color="var(--accent)" style={{animation:"spin 0.8s linear infinite"}}/></div>
                : <div style={{height:200}}><canvas ref={ref}/></div>}
            </div>
          </div>
        ))}
      </div>
      <div className="card" style={{padding:0}}>
        <div className="card-header"><h3 style={{fontSize:14,fontWeight:500,color:"var(--text-primary)"}}>Batch Performance</h3></div>
        <div style={{padding:"18px 18px 14px"}}>
          {loading
            ? <div style={{height:200,display:"flex",alignItems:"center",justifyContent:"center"}}><Loader2 size={20} color="var(--accent)" style={{animation:"spin 0.8s linear infinite"}}/></div>
            : data?.batchPerformance?.length
              ? <div style={{height:200}}><canvas ref={barRef}/></div>
              : <div style={{height:200,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8}}><BarChart2 size={28} color="var(--text-tertiary)"/><p style={{fontSize:13,color:"var(--text-tertiary)"}}>No batches assigned yet</p></div>}
        </div>
      </div>
      <style>{"@keyframes spin{to{transform:rotate(360deg);}}"}</style>
    </div>
  );
}
