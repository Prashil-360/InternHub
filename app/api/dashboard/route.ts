import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/core/auth/authOptions";
import dbConnect from "@/core/db/dbConnect";
import Batch from "@/models/batch.model";
import Task from "@/models/task.model";
import Submission from "@/models/submission.model";
import { WeeklyReport } from "@/models/report.model";
import User from "@/models/user.model";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();

    if (user.role === "ADMIN") {
      const [batches, mentors, interns, tasks] = await Promise.all([
        Batch.find({ companyId: user.companyId }),
        User.countDocuments({ companyId: user.companyId, role: "MENTOR" }),
        User.countDocuments({ companyId: user.companyId, role: "INTERN" }),
        Task.find({ companyId: user.companyId }),
      ]);

      const ongoing = batches.filter((b) => b.currentStatus === "ONGOING").length;
      const completed = batches.filter((b) => b.currentStatus === "COMPLETED").length;
      const approvedTasks = tasks.filter((t) => t.status === "APPROVED").length;

      return NextResponse.json({
        totalBatches: batches.length,
        ongoingBatches: ongoing,
        completedBatches: completed,
        totalMentors: mentors,
        totalInterns: interns,
        totalTasks: tasks.length,
        approvedTasks,
        recentBatches: batches.slice(0, 5),
      });
    }

    if (user.role === "MENTOR") {
      const batches = await Batch.find({ mentorIds: user.id });
      const batchIds = batches.map((b) => b._id);

      const [tasks, submissions, reports] = await Promise.all([
        Task.find({ batchId: { $in: batchIds }, createdBy: user.id }),
        Submission.find({ batchId: { $in: batchIds }, status: "PENDING" })
          .populate("internId", "name avatarUrl")
          .populate("taskId", "title"),
        WeeklyReport.find({ batchId: { $in: batchIds } }),
      ]);

      return NextResponse.json({
        totalBatches: batches.length,
        totalTasks: tasks.length,
        pendingReviews: submissions.length,
        totalReports: reports.length,
        recentSubmissions: submissions.slice(0, 5),
        tasksByStatus: {
          ASSIGNED: tasks.filter((t) => t.status === "ASSIGNED").length,
          IN_PROGRESS: tasks.filter((t) => t.status === "IN_PROGRESS").length,
          SUBMITTED: tasks.filter((t) => t.status === "SUBMITTED").length,
          APPROVED: tasks.filter((t) => t.status === "APPROVED").length,
          REWORK: tasks.filter((t) => t.status === "REWORK").length,
        },
      });
    }

    if (user.role === "INTERN") {
      const batches = await Batch.find({ internIds: user.id });
      const batchIds = batches.map((b) => b._id);

      const [tasks, submissions, reports] = await Promise.all([
        Task.find({ batchId: { $in: batchIds }, assignedTo: user.id }),
        Submission.find({ internId: user.id }),
        WeeklyReport.find({ internId: user.id }),
      ]);

      const completionRate = tasks.length
        ? Math.round((tasks.filter((t) => t.status === "APPROVED").length / tasks.length) * 100)
        : 0;

      return NextResponse.json({
        totalTasks: tasks.length,
        approvedTasks: tasks.filter((t) => t.status === "APPROVED").length,
        pendingTasks: tasks.filter((t) => ["ASSIGNED", "IN_PROGRESS", "REWORK"].includes(t.status)).length,
        totalSubmissions: submissions.length,
        totalReports: reports.length,
        completionRate,
        tasksByStatus: {
          ASSIGNED: tasks.filter((t) => t.status === "ASSIGNED").length,
          IN_PROGRESS: tasks.filter((t) => t.status === "IN_PROGRESS").length,
          SUBMITTED: tasks.filter((t) => t.status === "SUBMITTED").length,
          APPROVED: tasks.filter((t) => t.status === "APPROVED").length,
          REWORK: tasks.filter((t) => t.status === "REWORK").length,
          OVERDUE: tasks.filter((t) => t.status === "OVERDUE").length,
        },
        recentTasks: tasks.slice(0, 5),
      });
    }

    return NextResponse.json({});
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
