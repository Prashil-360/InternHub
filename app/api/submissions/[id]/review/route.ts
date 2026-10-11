import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/core/auth/authOptions";
import dbConnect from "@/core/db/dbConnect";
import Submission, { SubmissionStatus } from "@/models/submission.model";
import Task, { TaskStatus } from "@/models/task.model";
import User from "@/models/user.model";
import { sendTaskReviewedEmail } from "@/lib/email";
import { notify } from "@/lib/notify";
import { audit } from "@/lib/audit";
import { parseBody, ReviewSubmissionSchema } from "@/lib/validation";
import { getIP } from "@/lib/rateLimit";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!user || user.role !== "MENTOR") {
      return NextResponse.json({ error: "Only mentors can review submissions" }, { status: 403 });
    }

    const parsed = parseBody(ReviewSubmissionSchema, await req.json());
    if (!parsed.success) return parsed.response;
    const { status, remarks } = parsed.data;
    const ip = getIP(req);

    await dbConnect();

    const submission = await Submission.findById(params.id);
    if (!submission) return NextResponse.json({ error: "Submission not found" }, { status: 404 });

    submission.status       = status as SubmissionStatus;
    submission.mentorRemarks = remarks;
    submission.reviewedBy   = user.id;
    submission.reviewedAt   = new Date();
    if (status === "REWORK") submission.reworkCount += 1;
    await submission.save();

    const taskStatus = status === "APPROVED" ? TaskStatus.APPROVED : TaskStatus.REWORK;
    await Task.findByIdAndUpdate(submission.taskId, { status: taskStatus });

    const [intern, task] = await Promise.all([
      User.findById(submission.internId),
      Task.findById(submission.taskId),
    ]);

    if (intern && task) {
      // Email notification
      try { await sendTaskReviewedEmail(intern.email, intern.name, task.title, status, remarks); } catch {}

      // FIX #4 — In-app notification
      await notify({
        userId:    intern._id.toString(),
        companyId: user.companyId,
        type:      status === "APPROVED" ? "TASK_APPROVED" : "TASK_REWORK",
        title:     status === "APPROVED" ? "Task approved! ✅" : "Rework required 🔄",
        message:   `"${task.title}" — ${remarks || (status === "APPROVED" ? "Great work!" : "Please revise and resubmit.")}`,
        link:      "/intern/tasks",
      });

      // FIX #5 — Audit log
      await audit({
        companyId:  user.companyId,
        actorId:    user.id,
        actorName:  user.name,
        actorRole:  "MENTOR",
        action:     status === "APPROVED" ? "SUBMISSION_APPROVED" : "SUBMISSION_REWORK",
        targetType: "Task",
        targetId:   task._id.toString(),
        targetName: task.title,
        metadata:   { internId: intern._id.toString(), internName: intern.name, remarks },
        ip,
      });
    }

    return NextResponse.json({ message: "Review submitted", status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
