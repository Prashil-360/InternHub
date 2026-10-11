import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/core/auth/authOptions";
import dbConnect from "@/core/db/dbConnect";
import Task from "@/models/task.model";
import Batch from "@/models/batch.model";
import User from "@/models/user.model";
import Submission from "@/models/submission.model";
import { WeeklyReport } from "@/models/report.model";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();

    if (user.role === "ADMIN") {
      const [tasks, batches, users, submissions] = await Promise.all([
        Task.find({ companyId: user.companyId }).select("status createdAt batchId"),
        Batch.find({ companyId: user.companyId }).select("name currentStatus internIds startDate durationInWeeks"),
        User.find({ companyId: user.companyId }).select("role createdAt"),
        Submission.find({ companyId: user.companyId }).select("status createdAt submittedAt"),
      ]);

      // Task status distribution (for doughnut chart)
      const taskStatus = {
        ASSIGNED:    tasks.filter(t => t.status === "ASSIGNED").length,
        IN_PROGRESS: tasks.filter(t => t.status === "IN_PROGRESS").length,
        SUBMITTED:   tasks.filter(t => t.status === "SUBMITTED").length,
        APPROVED:    tasks.filter(t => t.status === "APPROVED").length,
        REWORK:      tasks.filter(t => t.status === "REWORK").length,
        OVERDUE:     tasks.filter(t => t.status === "OVERDUE").length,
      };

      // Batch performance (for bar chart) — interns per batch + task completion
      const batchPerformance = batches.slice(0, 8).map(b => {
        const batchTasks = tasks.filter(t => t.batchId?.toString() === b._id.toString());
        const approved   = batchTasks.filter(t => t.status === "APPROVED").length;
        const total      = batchTasks.length;
        return {
          name: b.name.length > 18 ? b.name.slice(0, 18) + "…" : b.name,
          interns: b.internIds?.length || 0,
          completion: total > 0 ? Math.round((approved / total) * 100) : 0,
          totalTasks: total,
          approvedTasks: approved,
        };
      });

      // Weekly task creation trend (last 8 weeks for line chart)
      const now = Date.now();
      const weekMs = 7 * 24 * 60 * 60 * 1000;
      const weeklyTrend = Array.from({ length: 8 }, (_, i) => {
        const weekStart = now - (7 - i) * weekMs;
        const weekEnd   = weekStart + weekMs;
        const label = new Date(weekStart).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const created  = tasks.filter(t => {
          const d = new Date(t.createdAt).getTime();
          return d >= weekStart && d < weekEnd;
        }).length;
        const approved = tasks.filter(t => {
          const d = new Date(t.createdAt).getTime();
          return d >= weekStart && d < weekEnd && t.status === "APPROVED";
        }).length;
        return { label, created, approved };
      });

      // User growth (line chart)
      const userGrowth = Array.from({ length: 8 }, (_, i) => {
        const weekStart = now - (7 - i) * weekMs;
        const weekEnd   = weekStart + weekMs;
        const label = new Date(weekStart).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const count = users.filter(u => {
          const d = new Date(u.createdAt).getTime();
          return d >= weekStart && d < weekEnd;
        }).length;
        return { label, count };
      });

      // Role breakdown (for pie)
      const roleBreakdown = {
        ADMIN:  users.filter(u => u.role === "ADMIN").length,
        MENTOR: users.filter(u => u.role === "MENTOR").length,
        INTERN: users.filter(u => u.role === "INTERN").length,
      };

      return NextResponse.json({
        taskStatus,
        batchPerformance,
        weeklyTrend,
        userGrowth,
        roleBreakdown,
        totals: {
          tasks: tasks.length,
          batches: batches.length,
          users: users.length,
          submissions: submissions.length,
        },
      });
    }

    if (user.role === "MENTOR") {
      const myBatches = await Batch.find({ mentorIds: user.id }).select("name internIds");
      const batchIds  = myBatches.map(b => b._id);
      const [tasks, reports] = await Promise.all([
        Task.find({ batchId: { $in: batchIds }, createdBy: user.id }).select("status createdAt batchId"),
        WeeklyReport.find({ batchId: { $in: batchIds } }).select("status createdAt"),
      ]);

      const taskStatus = {
        ASSIGNED:    tasks.filter(t => t.status === "ASSIGNED").length,
        IN_PROGRESS: tasks.filter(t => t.status === "IN_PROGRESS").length,
        SUBMITTED:   tasks.filter(t => t.status === "SUBMITTED").length,
        APPROVED:    tasks.filter(t => t.status === "APPROVED").length,
        REWORK:      tasks.filter(t => t.status === "REWORK").length,
      };

      const batchPerformance = myBatches.map(b => {
        const batchTasks = tasks.filter(t => t.batchId?.toString() === b._id.toString());
        const approved   = batchTasks.filter(t => t.status === "APPROVED").length;
        const total      = batchTasks.length;
        return {
          name: b.name.length > 18 ? b.name.slice(0, 18) + "…" : b.name,
          interns: b.internIds?.length || 0,
          completion: total > 0 ? Math.round((approved / total) * 100) : 0,
          totalTasks: total,
          approvedTasks: approved,
        };
      });

      const now   = Date.now();
      const weekMs = 7 * 24 * 60 * 60 * 1000;
      const weeklyTrend = Array.from({ length: 8 }, (_, i) => {
        const weekStart = now - (7 - i) * weekMs;
        const weekEnd   = weekStart + weekMs;
        const label = new Date(weekStart).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const created  = tasks.filter(t => { const d = new Date(t.createdAt).getTime(); return d >= weekStart && d < weekEnd; }).length;
        const approved = tasks.filter(t => { const d = new Date(t.createdAt).getTime(); return d >= weekStart && d < weekEnd && t.status === "APPROVED"; }).length;
        return { label, created, approved };
      });

      return NextResponse.json({ taskStatus, batchPerformance, weeklyTrend, totals: { tasks: tasks.length, batches: myBatches.length } });
    }

    if (user.role === "INTERN") {
      const myBatches = await Batch.find({ internIds: user.id });
      const batchIds  = myBatches.map(b => b._id);
      const tasks = await Task.find({ batchId: { $in: batchIds }, assignedTo: user.id }).select("status createdAt");

      const taskStatus = {
        ASSIGNED:    tasks.filter(t => t.status === "ASSIGNED").length,
        IN_PROGRESS: tasks.filter(t => t.status === "IN_PROGRESS").length,
        SUBMITTED:   tasks.filter(t => t.status === "SUBMITTED").length,
        APPROVED:    tasks.filter(t => t.status === "APPROVED").length,
        REWORK:      tasks.filter(t => t.status === "REWORK").length,
        OVERDUE:     tasks.filter(t => t.status === "OVERDUE").length,
      };

      return NextResponse.json({ taskStatus, totals: { tasks: tasks.length } });
    }

    return NextResponse.json({});
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
