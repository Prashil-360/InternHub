import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/core/auth/authOptions";
import dbConnect from "@/core/db/dbConnect";
import Batch from "@/models/batch.model";
import { Evaluation } from "@/models/report.model";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const batchId  = searchParams.get("batchId");
    const internId = searchParams.get("internId");
    if (!batchId) return NextResponse.json({ success: false, error: "batchId is required" }, { status: 400 });

    const batch = await Batch.findOne({ _id: batchId, companyId: user.companyId })
      .populate("internIds", "name email avatarUrl");
    if (!batch) return NextResponse.json({ success: false, error: "Batch not found" }, { status: 404 });

    const query: any = { batchId: batch._id, completed: true };
    if (internId) query.internId = internId;

    const evaluations = await Evaluation.find(query)
      .sort({ createdAt: 1 })
      .populate("internId", "name email avatarUrl")
      .populate("mentorId",  "name email");

    const allInterns = (batch.internIds || []).map((intern: any) => ({
      _id: String(intern._id), name: intern.name, email: intern.email, avatarUrl: intern.avatarUrl || null,
    }));

    const internSummary = allInterns.map((intern: any) => {
      const evs = evaluations.filter((ev: any) => String(ev.internId?._id || ev.internId) === String(intern._id));
      if (!evs.length) return { ...intern, evaluationsCount: 0, latestScore: null, averageScore: null, bestScore: null, lastEvaluatedAt: null };
      const scores = evs.map((ev: any) => Number(ev.finalScore || 0));
      const latest = evs[evs.length - 1];
      return {
        ...intern, evaluationsCount: evs.length,
        latestScore: Number(latest.finalScore || 0),
        averageScore: Number((scores.reduce((s, n) => s + n, 0) / scores.length).toFixed(1)),
        bestScore: Math.max(...scores),
        lastEvaluatedAt: latest.completedAt || latest.createdAt,
      };
    });

    let internAnalytics = null;
    if (internId) {
      const selectedIntern = allInterns.find((i: any) => String(i._id) === String(internId));
      const selectedEvals  = evaluations.filter((ev: any) => String(ev.internId?._id || ev.internId) === String(internId));
      const trend = selectedEvals.map((ev: any, idx: number) => ({
        index: idx + 1, label: `Eval ${idx + 1}`,
        date: new Date(ev.completedAt || ev.createdAt).toISOString(),
        score: Number(ev.finalScore || 0),
      }));
      const criteriaMap: Record<string, { key: string; label: string; weight: number; total: number; count: number }> = {};
      selectedEvals.forEach((ev: any) => {
        (ev.criteriaScores || []).forEach((c: any) => {
          const k = c.key || c.label;
          if (!criteriaMap[k]) criteriaMap[k] = { key: c.key || k, label: c.label || k, weight: Number(c.weight || 0), total: 0, count: 0 };
          criteriaMap[k].total += Number(c.score || 0);
          criteriaMap[k].count += 1;
        });
      });
      const criteriaAverage = Object.values(criteriaMap).map(c => ({ key: c.key, label: c.label, weight: c.weight, avgScore: Number((c.total / Math.max(c.count, 1)).toFixed(2)) }));
      const finalScores = selectedEvals.map((ev: any) => Number(ev.finalScore || 0));
      internAnalytics = {
        intern: selectedIntern || null, evaluationsCount: selectedEvals.length,
        latestScore:   finalScores.length ? finalScores[finalScores.length - 1] : null,
        averageScore:  finalScores.length ? Number((finalScores.reduce((s, n) => s + n, 0) / finalScores.length).toFixed(1)) : null,
        bestScore:     finalScores.length ? Math.max(...finalScores) : null,
        worstScore:    finalScores.length ? Math.min(...finalScores) : null,
        scoreTrend: trend, criteriaAverage,
      };
    }

    return NextResponse.json({ success: true, batch: { _id: String(batch._id), name: batch.name }, interns: allInterns, internSummary, internAnalytics });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
