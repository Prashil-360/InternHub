import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/core/auth/authOptions";
import dbConnect from "@/core/db/dbConnect";
import Batch, { BatchStatus } from "@/models/batch.model";
import { DEFAULT_EVALUATION_CRITERIA } from "@/lib/utils";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = session.user as any;
    await dbConnect();

    let query: any = { companyId: user.companyId };

    // Mentors only see batches they're in
    if (user.role === "MENTOR") {
      query.mentorIds = user.id;
    }
    // Interns only see batches they're in
    if (user.role === "INTERN") {
      query.internIds = user.id;
    }

    const batches = await Batch.find(query)
      .sort({ createdAt: -1 })
      .populate("mentorIds", "name email avatarUrl")
      .populate("internIds", "name email avatarUrl");

    return NextResponse.json(batches);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description, startDate, durationInWeeks } = await req.json();
    if (!name || !startDate) {
      return NextResponse.json({ error: "Name and start date are required" }, { status: 400 });
    }

    await dbConnect();

    const batch = await Batch.create({
      companyId: user.companyId,
      name,
      description,
      startDate: new Date(startDate),
      durationInWeeks: durationInWeeks || 8,
      currentStatus: BatchStatus.PLANNED,
      mentorIds: [],
      internIds: [],
      evaluationCriteria: DEFAULT_EVALUATION_CRITERIA,
      allowedProofTypes: ["GITHUB", "URL", "DOC", "IMAGE", "OTHER"],
      weeklyReportingEnabled: true,
    });

    return NextResponse.json(batch, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
