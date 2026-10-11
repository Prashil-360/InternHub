import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/core/auth/authOptions";
import dbConnect from "@/core/db/dbConnect";
import { WeeklyReport } from "@/models/report.model";
import User from "@/models/user.model";
import Batch from "@/models/batch.model";
import { sendWeeklyReportNotification } from "@/lib/email";
import { notify, notifyMany } from "@/lib/notify";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = session.user as any;
    const { searchParams } = new URL(req.url);
    const batchId    = searchParams.get("batchId");
    const internId   = searchParams.get("internId");
    const weekNumber = searchParams.get("weekNumber");

    await dbConnect();

    const query: any = {};
    if (batchId)    query.batchId    = batchId;
    if (weekNumber) query.weekNumber = parseInt(weekNumber);
    if (user.role === "INTERN")  query.internId = user.id;
    else if (internId)           query.internId = internId;

    const reports = await WeeklyReport.find(query)
      .sort({ weekNumber: -1 })
      .populate("internId",      "name email avatarUrl")
      .populate("tasksWorkedOn", "title status");

    return NextResponse.json(reports);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!user || user.role !== "INTERN") {
      return NextResponse.json({ error: "Only interns can submit weekly reports" }, { status: 403 });
    }

    const { batchId, weekNumber, tasksWorkedOn, workDone, challenges, learnings, hoursSpent } = await req.json();
    if (!batchId || !weekNumber || !workDone || !challenges || !learnings) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    await dbConnect();

    const existing = await WeeklyReport.findOne({ batchId, internId: user.id, weekNumber });
    if (existing) return NextResponse.json({ error: "You already submitted a report for this week" }, { status: 400 });

    const report = await WeeklyReport.create({
      batchId, internId: user.id, weekNumber,
      tasksWorkedOn: tasksWorkedOn || [],
      workDone, challenges, learnings,
      hoursSpent: hoursSpent || 0,
    });

    // Notify mentors
    try {
      const batch = await Batch.findById(batchId);
      const intern = await User.findById(user.id);
      if (batch?.mentorIds?.length && intern) {
        const mentorIds = batch.mentorIds.map(String);
        await notifyMany(mentorIds, {
          companyId: user.companyId,
          type: "REPORT_SUBMITTED",
          title: "New weekly report submitted",
          message: `${intern.name} submitted their Week ${weekNumber} report`,
          link: "/mentor/reports",
        });
        const mentors = await User.find({ _id: { $in: mentorIds } });
        for (const mentor of mentors) {
          try { await sendWeeklyReportNotification(mentor.email, intern.name, weekNumber); } catch {}
        }
      }
    } catch (e) { console.error("Report notification failed:", e); }

    return NextResponse.json(report, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
