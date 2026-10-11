import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/core/auth/authOptions";
import dbConnect from "@/core/db/dbConnect";
import User from "@/models/user.model";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = session.user as any;
    await dbConnect();
    const me = await User.findById(user.id).select("-password -inviteToken -inviteTokenExpiry");
    if (!me) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json(me);
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = session.user as any;
    const body = await req.json();
    const allowed: any = {};

    if (body.name?.trim())       allowed.name       = body.name.trim().slice(0, 80);
    if (body.phone !== undefined) allowed.phone     = body.phone.slice(0, 20);
    if (body.bio   !== undefined) allowed.bio       = body.bio.slice(0, 500);
    if (body.department !== undefined) allowed.department = body.department.slice(0, 80);
    if (body.avatarUrl  !== undefined) allowed.avatarUrl  = body.avatarUrl;
    if (body.linkedIn   !== undefined) allowed.linkedIn   = body.linkedIn.slice(0, 200);
    if (body.github     !== undefined) allowed.github     = body.github.slice(0, 200);
    if (body.college    !== undefined) allowed.college    = body.college.slice(0, 100);
    if (body.graduationYear !== undefined) allowed.graduationYear = body.graduationYear;
    if (body.specialization !== undefined) allowed.specialization = body.specialization?.slice(0, 80);
    if (body.skills !== undefined)     allowed.skills     = body.skills;

    if (body.currentPassword && body.newPassword) {
      await dbConnect();
      const fullUser = await User.findById(user.id).select("+password");
      if (!fullUser?.password) return NextResponse.json({ error: "Cannot change password" }, { status: 400 });
      const ok = await bcrypt.compare(body.currentPassword, fullUser.password);
      if (!ok) return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
      if (body.newPassword.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
      allowed.password = await bcrypt.hash(body.newPassword, 12);
    }

    await dbConnect();
    const updated = await User.findByIdAndUpdate(user.id, { $set: allowed }, { new: true })
      .select("-password -inviteToken -inviteTokenExpiry");
    return NextResponse.json(updated);
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
