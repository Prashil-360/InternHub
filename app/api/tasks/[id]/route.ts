import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/core/auth/authOptions";
import dbConnect from "@/core/db/dbConnect";
import Task, { TaskStatus } from "@/models/task.model";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await dbConnect();
    const task = await Task.findById(params.id)
      .populate("assignedTo", "name email avatarUrl")
      .populate("createdBy",  "name email");
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
    return NextResponse.json(task);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    await dbConnect();

    const task = await Task.findById(params.id);
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    // Interns may only mark as IN_PROGRESS
    if (user.role === "INTERN") {
      if (!task.assignedTo.map(String).includes(user.id)) {
        return NextResponse.json({ error: "Not assigned to you" }, { status: 403 });
      }
      if (body.status && body.status !== TaskStatus.IN_PROGRESS) {
        return NextResponse.json({ error: "Interns can only set status to IN_PROGRESS" }, { status: 403 });
      }
    }

    const updated = await Task.findByIdAndUpdate(params.id, body, { new: true });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!user || user.role !== "MENTOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await dbConnect();
    await Task.findByIdAndDelete(params.id);
    return NextResponse.json({ message: "Task deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
