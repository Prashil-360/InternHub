import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/core/auth/authOptions";
import dbConnect from "@/core/db/dbConnect";
import { Evaluation } from "@/models/report.model";
import User from "@/models/user.model";
import { sendEvaluationEmail } from "@/lib/email";
import { calcWeightedScore } from "@/lib/utils";
import { notify } from "@/lib/notify";
import { audit } from "@/lib/audit";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = session.user as any;
    const { searchParams } = new URL(req.url);
    const batchId  = searchParams.get("batchId");
    const internId = searchParams.get("internId");

    await dbConnect();

    const query: any = {};
    if (batchId) query.batchId = batchId;
    if (user.role === "INTERN") query.internId = user.id;
    else if (internId) query.internId = internId;

    const evaluations = await Evaluation.find(query)
      .populate("internId",  "name email avatarUrl")
      .populate("mentorId",  "name email")
      .populate("batchId",   "name");

    return NextResponse.json(evaluations);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!user || user.role !== "MENTOR") {
      return NextResponse.json({ error: "Only mentors can create evaluations" }, { status: 403 });
    }

    const { batchId, internId, criteriaScores, remarks, completed } = await req.json();
    if (!batchId || !internId || !criteriaScores?.length) {
      return NextResponse.json({ error: "batchId, internId, and criteriaScores are required" }, { status: 400 });
    }

    await dbConnect();

    const finalScore = calcWeightedScore(criteriaScores);
    const isCompleting = completed === true;

    const evaluation = await Evaluation.findOneAndUpdate(
      { batchId, internId },
      {
        mentorId: user.id,
        criteriaScores,
        finalScore,
        remarks: remarks || "",
        completed: isCompleting,
        ...(isCompleting && { completedAt: new Date() }),
      },
      { new: true, upsert: true }
    );

    if (isCompleting) {
      const intern = await User.findById(internId);
      if (intern) {
        try { await sendEvaluationEmail(intern.email, intern.name, finalScore); } catch {}
        await notify({
          userId: internId, companyId: user.companyId,
          type: "EVALUATION_COMPLETE",
          title: "Your evaluation is complete!",
          message: `Your mentor has completed your internship evaluation. Final score: ${finalScore}/100`,
          link: "/intern/evaluation",
        });
      }
      await audit({
        companyId: user.companyId, actorId: user.id,
        actorName: user.name, actorRole: "MENTOR",
        action: "EVALUATION_COMPLETED", targetType: "Intern",
        targetId: internId, targetName: intern?.name,
      });
    }

    return NextResponse.json(evaluation, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
