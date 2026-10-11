import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/core/db/dbConnect";
import User from "@/models/user.model";
import { parseBody, ResetPasswordSchema } from "@/lib/validation";
import { rateLimit, getIP, LIMITS } from "@/lib/rateLimit";
import { audit } from "@/lib/audit";

export async function POST(req: Request) {
  const ip = getIP(req);
  const rl = rateLimit(`reset:${ip}`, LIMITS.passwordReset);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const body = parseBody(ResetPasswordSchema, await req.json());
  if (!body.success) return body.response;

  const { token, password } = body.data;

  try {
    await dbConnect();

    const user = await User.findOne({
      inviteToken: token,
      inviteTokenExpiry: { $gt: new Date() },
    }).select("+inviteToken +inviteTokenExpiry");

    if (!user) {
      return NextResponse.json(
        { error: "Reset link is invalid or has expired. Please request a new one." },
        { status: 400 }
      );
    }

    user.password = await bcrypt.hash(password, 12);
    user.inviteToken = undefined;
    user.inviteTokenExpiry = undefined;
    user.isActive = true;
    user.hasCompletedOnboarding = true;
    await user.save();

    await audit({
      companyId: user.companyId.toString(),
      actorId: user._id.toString(),
      actorName: user.name,
      actorRole: user.role,
      action: "PASSWORD_RESET_COMPLETED",
      targetType: "User",
      targetId: user._id.toString(),
      ip,
    });

    return NextResponse.json({ message: "Password reset successfully. You can now log in." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
