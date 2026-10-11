import { NextResponse } from "next/server";
import crypto from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/core/auth/authOptions";
import dbConnect from "@/core/db/dbConnect";
import Batch from "@/models/batch.model";
import User, { UserRole } from "@/models/user.model";
import { sendInviteEmail } from "@/lib/email";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const adminUser = session?.user as any;
    if (!adminUser || adminUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, email, name, userId } = await req.json();
    const batchId = params.id;

    if (!role || !batchId) {
      return NextResponse.json({ error: "Role and batch ID required" }, { status: 400 });
    }

    await dbConnect();

    const batch = await Batch.findById(batchId);
    if (!batch) return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    if (batch.companyId.toString() !== adminUser.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    let targetUserId = userId;

    if (userId) {
      const existing = await User.findById(userId);
      if (!existing) return NextResponse.json({ error: "User not found" }, { status: 404 });
      targetUserId = existing._id;
    } else if (email && name) {
      let user = await User.findOne({ email: email.toLowerCase() });
      if (user) {
        if (user.companyId.toString() !== adminUser.companyId) {
          return NextResponse.json({ error: "User belongs to another company" }, { status: 400 });
        }
        targetUserId = user._id;
      } else {
        const token = crypto.randomBytes(32).toString("hex");
        const expiry = new Date(Date.now() + 48 * 60 * 60 * 1000);
        user = await User.create({
          companyId: adminUser.companyId,
          name,
          email: email.toLowerCase(),
          role: role === "MENTOR" ? UserRole.MENTOR : UserRole.INTERN,
          inviteToken: token,
          inviteTokenExpiry: expiry,
          hasCompletedOnboarding: false,
          isActive: true,
        });
        try {
          await sendInviteEmail(email, token, name, role);
        } catch (e) {
          console.error("Email failed:", e);
        }
        targetUserId = user._id;
      }
    } else {
      return NextResponse.json({ error: "User ID or email+name required" }, { status: 400 });
    }

    const field = role === "MENTOR" ? "mentorIds" : "internIds";
    await Batch.findByIdAndUpdate(batchId, { $addToSet: { [field]: targetUserId } });

    return NextResponse.json({ message: "User added", userId: targetUserId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
