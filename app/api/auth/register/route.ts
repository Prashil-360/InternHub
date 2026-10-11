import { NextResponse } from "next/server";
import dbConnect from "@/core/db/dbConnect";
import User, { UserRole } from "@/models/user.model";
import Company from "@/models/company.model";
import bcrypt from "bcryptjs";
import { rateLimit, getIP, LIMITS } from "@/lib/rateLimit";
import { parseBody, RegisterSchema } from "@/lib/validation";
import { audit } from "@/lib/audit";

const PUBLIC_DOMAINS = [
  "gmail.com","yahoo.com","hotmail.com","outlook.com","aol.com",
  "icloud.com","protonmail.com","zoho.com","yandex.com","mail.com",
];

export async function POST(req: Request) {
  // FIX #1 — Rate limit registrations: 5 per hour per IP
  const ip = getIP(req);
  const rl = rateLimit(`register:${ip}`, LIMITS.register);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many registration attempts. Try again in an hour." },
      { status: 429 }
    );
  }

  // FIX #2 — Validate + sanitize with Zod
  const parsed = parseBody(RegisterSchema, await req.json());
  if (!parsed.success) return parsed.response;
  const { companyName, industry, name, email, password } = parsed.data;

  try {
    const domain = email.split("@")[1]?.toLowerCase();
    if (PUBLIC_DOMAINS.includes(domain)) {
      return NextResponse.json(
        { error: "Please use your work email. Public email providers are not allowed." },
        { status: 400 }
      );
    }

    await dbConnect();

    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const company = await Company.create({ name: companyName, industry });
    const user = await User.create({
      companyId: company._id,
      name,
      email,
      password: hashedPassword,
      role: UserRole.ADMIN,
      isActive: true,
      hasCompletedOnboarding: true,
    });

    // FIX #5 — Audit
    await audit({
      companyId:  company._id.toString(),
      actorId:    user._id.toString(),
      actorName:  name,
      actorRole:  "ADMIN",
      action:     "USER_REGISTERED",
      targetType: "Company",
      targetId:   company._id.toString(),
      targetName: companyName,
      ip,
    });

    return NextResponse.json(
      { message: "Registration successful", companyId: company._id, userId: user._id },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
