import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/core/auth/authOptions";
import dbConnect from "@/core/db/dbConnect";
import Batch from "@/models/batch.model";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, role } = await req.json();
    await dbConnect();

    const batch = await Batch.findById(params.id);
    if (!batch) return NextResponse.json({ error: "Batch not found" }, { status: 404 });

    const field = role === "MENTOR" ? "mentorIds" : "internIds";
    await Batch.findByIdAndUpdate(params.id, { $pull: { [field]: userId } });

    return NextResponse.json({ message: "User removed" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
