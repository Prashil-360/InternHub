import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/core/auth/authOptions";
import dbConnect from "@/core/db/dbConnect";
import { Evaluation } from "@/models/report.model";
import User from "@/models/user.model";
import Company from "@/models/company.model";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = session.user as any;
    const { searchParams } = new URL(req.url);
    const evaluationId = searchParams.get("evaluationId");
    if (!evaluationId) return NextResponse.json({ error: "evaluationId required" }, { status: 400 });

    await dbConnect();

    const evaluation = await Evaluation.findById(evaluationId)
      .populate("internId",  "name email role companyId college specialization graduationYear")
      .populate("mentorId",  "name")
      .populate("batchId",   "name startDate durationInWeeks");

    if (!evaluation)        return NextResponse.json({ error: "Evaluation not found" }, { status: 404 });
    if (!evaluation.completed) return NextResponse.json({ error: "Internship must be completed first" }, { status: 400 });

    const intern = evaluation.internId as any;
    const mentor = evaluation.mentorId as any;
    const batch  = evaluation.batchId  as any;

    if (user.role === "INTERN" && intern._id.toString() !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const company = await Company.findById(user.companyId);
    const companyName = company?.name || "Your Company";

    const grade = evaluation.finalScore >= 90 ? "With Distinction" :
                  evaluation.finalScore >= 75 ? "With Merit" :
                  evaluation.finalScore >= 60 ? "Satisfactory" : "Completed";

    const completedDate = evaluation.completedAt
      ? new Date(evaluation.completedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
      : new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    const startDate = batch?.startDate ? new Date(batch.startDate).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "";
    const weeks     = batch?.durationInWeeks || 8;
    const months    = (weeks / 4).toFixed(0);
    const duration  = `${months} Month${Number(months) !== 1 ? "s" : ""} (${weeks} Weeks)`;

    const hrSignImg   = company?.hrSignatureUrl  ? `<img src="${company.hrSignatureUrl}"  alt="HR Signature"  style="max-height:48px;max-width:160px;object-fit:contain;"/>` : '<div style="width:120px;height:1px;border-bottom:1px solid #94a3b8;"></div>';
    const stampImg    = company?.companyStampUrl ? `<img src="${company.companyStampUrl}" alt="Company Stamp" style="max-height:72px;max-width:72px;object-fit:contain;opacity:0.85;"/>` : "";
    const logoImg     = company?.logoUrl         ? `<img src="${company.logoUrl}"         alt="${companyName}" style="max-height:36px;max-width:120px;object-fit:contain;"/>` : `<span style="font-size:18px;font-weight:600;color:#6c77ff;">${companyName}</span>`;
    const footerText  = company?.certificateFooterText || `This certificate is issued by ${companyName} as an official recognition of internship completion.`;

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600&family=Geist+Mono&display=swap');
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:'Geist',sans-serif;background:#f8fafc;}
  @media print{@page{size:A4 landscape;margin:0;}body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}.no-print{display:none!important;}}
  .page{width:297mm;height:210mm;padding:14mm 18mm;display:flex;flex-direction:column;background:#fff;position:relative;overflow:hidden;}
  .bg-accent{position:absolute;top:0;left:0;width:100%;height:6mm;background:linear-gradient(90deg,#6c77ff,#7c3aed);}
  .bg-bottom{position:absolute;bottom:0;left:0;width:100%;height:3mm;background:#6c77ff;}
  .bg-left{position:absolute;top:6mm;left:0;width:3mm;height:calc(100% - 9mm);background:rgba(108,119,255,0.08);}
  .content{flex:1;display:flex;flex-direction:column;padding-top:6mm;}
  .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8mm;}
  .cert-label{font-size:3mm;letter-spacing:4px;text-transform:uppercase;color:#94a3b8;margin-bottom:2mm;}
  .main-title{font-family:'Instrument Serif',serif;font-size:7mm;color:#0f172a;margin-bottom:1mm;}
  .intern-name{font-family:'Instrument Serif',serif;font-size:11mm;color:#6c77ff;font-style:italic;line-height:1.1;margin:4mm 0 2mm;}
  .desc{font-size:3.5mm;color:#475569;line-height:1.6;max-width:180mm;}
  .details-row{display:flex;gap:10mm;margin-top:5mm;}
  .detail-box{display:flex;flex-direction:column;gap:0.5mm;}
  .detail-label{font-size:2.8mm;color:#94a3b8;letter-spacing:0.06em;text-transform:uppercase;}
  .detail-value{font-size:3.8mm;font-weight:500;color:#0f172a;}
  .score-badge{display:inline-flex;align-items:center;gap:2mm;background:#6c77ff;color:#fff;padding:1.5mm 4mm;border-radius:2mm;font-size:3.5mm;font-weight:600;font-family:'Geist Mono',monospace;}
  .footer{display:flex;justify-content:space-between;align-items:flex-end;padding-top:6mm;border-top:0.3mm solid #e2e8f0;margin-top:auto;}
  .sig-block{display:flex;flex-direction:column;align-items:center;gap:1mm;}
  .sig-role{font-size:2.8mm;color:#94a3b8;}
  .sig-name{font-size:3.2mm;font-weight:500;color:#0f172a;}
  .cert-id{font-size:2.5mm;color:#cbd5e1;font-family:'Geist Mono',monospace;}
  .print-btn{position:fixed;top:20px;right:20px;background:#6c77ff;color:#fff;border:none;padding:10px 20px;border-radius:8px;font-size:14px;cursor:pointer;font-family:'Geist',sans-serif;font-weight:500;box-shadow:0 4px 12px rgba(108,119,255,0.3);}
</style>
</head>
<body>
<button class="print-btn no-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
<div class="page">
  ${company?.certificateTemplateUrl ? `<img class="bg-template" src="${company.certificateTemplateUrl}" alt=""/>` : ""}
  <div class="bg-accent"></div>
  <div class="bg-bottom"></div>
  <div class="bg-left"></div>
  <div class="content">
    <div class="header">
      <div>
        ${logoImg}
        <div style="margin-top:2mm;font-size:2.8mm;color:#94a3b8;">${companyName} · Internship Program</div>
      </div>
      <div style="text-align:right;">
        ${stampImg}
        <div class="cert-label" style="margin-top:1mm;">Certificate of Completion</div>
        <div class="cert-id">IH-${evaluationId.toString().slice(-8).toUpperCase()}</div>
      </div>
    </div>

    <div class="cert-label">This is to certify that</div>
    <div class="intern-name">${intern.name}</div>
    <p class="desc">has successfully completed the <strong>${batch?.name || "Internship Program"}</strong> internship at <strong>${companyName}</strong>, demonstrating exceptional dedication, technical skill, and professional growth throughout the program.</p>

    <div class="details-row">
      <div class="detail-box">
        <span class="detail-label">Duration</span>
        <span class="detail-value">${duration}${startDate ? ` · ${startDate}` : ""}</span>
      </div>
      <div class="detail-box">
        <span class="detail-label">Role</span>
        <span class="detail-value">Intern${intern.specialization ? ` — ${intern.specialization}` : ""}</span>
      </div>
      <div class="detail-box">
        <span class="detail-label">Final Score</span>
        <span class="score-badge">${evaluation.finalScore}/100 · ${grade}</span>
      </div>
      <div class="detail-box">
        <span class="detail-label">Completed</span>
        <span class="detail-value">${completedDate}</span>
      </div>
    </div>

    <div class="footer">
      <div class="sig-block">
        ${hrSignImg}
        <span class="sig-name">${mentor?.name || "Program Mentor"}</span>
        <span class="sig-role">Mentor · ${companyName}</span>
      </div>
      <div style="text-align:center;max-width:100mm;">
        <div style="font-size:2.8mm;color:#94a3b8;line-height:1.6;">${footerText}</div>
      </div>
      <div class="sig-block">
        <div style="width:80px;height:1px;border-bottom:0.5mm solid #94a3b8;margin-bottom:1mm;"></div>
        <span class="sig-name">HR Department</span>
        <span class="sig-role">${companyName}</span>
      </div>
    </div>
  </div>
</div>
</body>
</html>`;

    return new Response(html, { headers: { "Content-Type": "text/html", "Cache-Control": "no-store" } });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
