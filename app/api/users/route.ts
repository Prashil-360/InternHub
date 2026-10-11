import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/core/auth/authOptions";
import dbConnect from "@/core/db/dbConnect";
import User from "@/models/user.model";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");

    await dbConnect();

    let query: any = { companyId: user.companyId, isActive: true };
    if (role) query.role = role;

    const users = await User.find(query).sort({ name: 1 }).select("-password -inviteToken -inviteTokenExpiry");

    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
