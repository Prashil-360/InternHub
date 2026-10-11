import { NextResponse } from "next/server";
import crypto from "crypto";
import dbConnect from "@/core/db/dbConnect";
import User from "@/models/user.model";
import { rateLimit, getIP, LIMITS } from "@/lib/rateLimit";
import { parseBody, ForgotPasswordSchema } from "@/lib/validation";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  // Rate limit: 3 requests per hour per IP
  const ip = getIP(req);
  const rl = rateLimit(`forgot:${ip}`, LIMITS.passwordReset);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Try again in an hour." },
      { status: 429 }
    );
  }

  const body = parseBody(ForgotPasswordSchema, await req.json());
  if (!body.success) return body.response;

  // Always return same message to prevent email enumeration
  const genericMsg = { message: "If that email exists, a reset link has been sent." };

  try {
    await dbConnect();
    const user = await User.findOne({ email: body.data.email, isActive: true });
    if (!user) return NextResponse.json(genericMsg);

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.inviteToken = token;
    user.inviteTokenExpiry = expiry;
    await user.save();

    const resetLink = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: Number(process.env.EMAIL_SERVER_PORT) || 587,
      auth: { user: process.env.EMAIL_SERVER_USER, pass: process.env.EMAIL_SERVER_PASSWORD },
    });

    await transporter.sendMail({
      from: `"InternHub" <${process.env.EMAIL_FROM}>`,
      to: user.email,
      subject: "Reset your InternHub password",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
          <h2 style="color:#0ea5e9;">Reset your password</h2>
          <p>Hi ${user.name}, click below to reset your password. This link expires in <strong>1 hour</strong>.</p>
          <a href="${resetLink}" style="display:inline-block;background:#0ea5e9;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">
            Reset Password
          </a>
          <p style="color:#94a3b8;font-size:12px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });

    return NextResponse.json(genericMsg);
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return NextResponse.json(genericMsg); // Never expose errors
  }
}
