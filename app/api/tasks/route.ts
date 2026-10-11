import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/core/auth/authOptions";
import dbConnect from "@/core/db/dbConnect";
import Task, { TaskStatus } from "@/models/task.model";
import User from "@/models/user.model";
import { sendTaskAssignedEmail } from "@/lib/email";
import { notify } from "@/lib/notify";
import { audit } from "@/lib/audit";
import { parseBody, CreateTaskSchema } from "@/lib/validation";
import { rateLimit, getIP, LIMITS } from "@/lib/rateLimit";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = session.user as any;
    const { searchParams } = new URL(req.url);

    // FIX #9 — Pagination + search
    const batchId  = searchParams.get("batchId");
    const internId = searchParams.get("internId");
    const status   = searchParams.get("status");
    const search   = searchParams.get("search")?.trim();
    const page     = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit    = Math.min(50, parseInt(searchParams.get("limit") || "20"));
    const skip     = (page - 1) * limit;

    await dbConnect();

    let query: any = { companyId: user.companyId };
    if (batchId)  query.batchId = batchId;
    if (status)   query.status  = status;
    if (user.role === "INTERN")       query.assignedTo = user.id;
    else if (internId)                query.assignedTo = internId;
    if (search) query.title = { $regex: search, $options: "i" };

    const [tasks, total] = await Promise.all([
      Task.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("assignedTo", "name email avatarUrl")
        .populate("createdBy", "name email"),
      Task.countDocuments(query),
    ]);

    // Auto-mark overdue
    const now = new Date();
    const result = tasks.map((t) => {
      const obj = t.toObject();
      if (obj.deadline < now && obj.status !== TaskStatus.APPROVED && obj.status !== TaskStatus.OVERDUE) {
        obj.status = TaskStatus.OVERDUE;
      }
      return obj;
    });

    return NextResponse.json({ tasks: result, total, page, pages: Math.ceil(total / limit) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!user || user.role !== "MENTOR") {
      return NextResponse.json({ error: "Only mentors can create tasks" }, { status: 403 });
    }

    const ip = getIP(req);
    const rl = rateLimit(`tasks:${user.id}`, LIMITS.api);
    if (!rl.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

    // FIX #2 — Validate with Zod
    const parsed = parseBody(CreateTaskSchema, await req.json());
    if (!parsed.success) return parsed.response;
    const body = parsed.data;

    await dbConnect();

    const task = await Task.create({
      batchId:           body.batchId,
      companyId:         user.companyId,
      title:             body.title,
      description:       body.description,
      assignedTo:        body.assignedTo,
      createdBy:         user.id,
      weekNumber:        body.weekNumber,
      deadline:          new Date(body.deadline),
      priority:          body.priority,
      requiredProofType: body.requiredProofType,
      status:            TaskStatus.ASSIGNED,
      tags:              body.tags,
    });

    // FIX #5 — Audit
    await audit({
      companyId:  user.companyId,
      actorId:    user.id,
      actorName:  user.name,
      actorRole:  "MENTOR",
      action:     "TASK_CREATED",
      targetType: "Task",
      targetId:   task._id.toString(),
      targetName: body.title,
      ip,
    });

    // Email + FIX #4 — In-app notifications
    const interns = await User.find({ _id: { $in: body.assignedTo } });
    for (const intern of interns) {
      try { await sendTaskAssignedEmail(intern.email, intern.name, body.title); } catch {}
      await notify({
        userId:    intern._id.toString(),
        companyId: user.companyId,
        type:      "TASK_ASSIGNED",
        title:     "New task assigned",
        message:   `"${body.title}" has been assigned to you. Due: ${new Date(body.deadline).toLocaleDateString()}`,
        link:      "/intern/tasks",
      });
    }

    return NextResponse.json(task, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
