import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/core/auth/authOptions";
import dbConnect from "@/core/db/dbConnect";
import { WeeklyReport } from "@/models/report.model";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();
    const report = await WeeklyReport.findById(params.id)
      .populate("internId", "name email avatarUrl")
      .populate("tasksWorkedOn", "title status priority");

    if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });
    return NextResponse.json(report);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!user || user.role !== "MENTOR") {
      return NextResponse.json({ error: "Only mentors can give feedback" }, { status: 403 });
    }

    const { mentorFeedback } = await req.json();
    await dbConnect();

    const report = await WeeklyReport.findByIdAndUpdate(
      params.id,
      { mentorFeedback, feedbackGivenBy: user.id },
      { new: true }
    );

    if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });
    return NextResponse.json(report);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
