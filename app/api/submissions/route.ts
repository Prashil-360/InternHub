import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/core/auth/authOptions";
import dbConnect from "@/core/db/dbConnect";
import Submission, { SubmissionStatus } from "@/models/submission.model";
import Task, { TaskStatus } from "@/models/task.model";
import { notify } from "@/lib/notify";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = session.user as any;
    const { searchParams } = new URL(req.url);
    const taskId   = searchParams.get("taskId");
    const batchId  = searchParams.get("batchId");
    const internId = searchParams.get("internId");
    const status   = searchParams.get("status");

    await dbConnect();

    const query: any = {};
    if (taskId)  query.taskId  = taskId;
    if (batchId) query.batchId = batchId;
    if (status)  query.status  = status;

    if (user.role === "INTERN") {
      query.internId = user.id;
    } else if (internId) {
      query.internId = internId;
    }

    const submissions = await Submission.find(query)
      .sort({ submittedAt: -1 })
      .populate("taskId",     "title requiredProofType deadline weekNumber")
      .populate("internId",   "name email avatarUrl")
      .populate("reviewedBy", "name");

    return NextResponse.json(submissions);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!user || user.role !== "INTERN") {
      return NextResponse.json({ error: "Only interns can submit tasks" }, { status: 403 });
    }

    const { taskId, batchId, proofType, proofLink, whatWasImplemented, whatWasLearned, attachmentUrl } = await req.json();

    if (!taskId || !batchId || !proofLink || !whatWasImplemented || !whatWasLearned) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    await dbConnect();

    // Verify task is assigned to this intern
    const task = await Task.findById(taskId);
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
    if (!task.assignedTo.map(String).includes(user.id)) {
      return NextResponse.json({ error: "This task is not assigned to you" }, { status: 403 });
    }

    // Block re-submission if already pending
    const existing = await Submission.findOne({ taskId, internId: user.id, status: SubmissionStatus.PENDING });
    if (existing) return NextResponse.json({ error: "You already have a pending submission for this task" }, { status: 400 });

    const submission = await Submission.create({
      taskId, batchId,
      internId: user.id,
      proofType: proofType || task.requiredProofType,
      proofLink,
      whatWasImplemented: whatWasImplemented.slice(0, 500),
      whatWasLearned,
      attachmentUrl: attachmentUrl || "",
      status: SubmissionStatus.PENDING,
    });

    await Task.findByIdAndUpdate(taskId, { status: TaskStatus.SUBMITTED });

    // Notify mentor
    await notify({
      userId:    task.createdBy.toString(),
      companyId: user.companyId,
      type:      "REPORT_SUBMITTED",
      title:     "Task submitted for review",
      message:   `${user.name} submitted "${task.title}"`,
      link:      "/mentor/tasks",
    });

    return NextResponse.json(submission, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
