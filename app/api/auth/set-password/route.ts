import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/core/db/dbConnect";
import User from "@/models/user.model";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();
    if (!token || !password) {
      return NextResponse.json({ error: "Token and password required" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findOne({
      inviteToken: token,
      inviteTokenExpiry: { $gt: new Date() },
    }).select("+inviteToken +inviteTokenExpiry");

    if (!user) {
      return NextResponse.json({ error: "Invalid or expired link. Please contact your admin." }, { status: 400 });
    }

    user.password = await bcrypt.hash(password, 12);
    user.inviteToken = undefined;
    user.inviteTokenExpiry = undefined;
    user.isActive = true;
    user.hasCompletedOnboarding = true;
    await user.save();

    return NextResponse.json({ message: "Password set successfully. You can now log in." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
