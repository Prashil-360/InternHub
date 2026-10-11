import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/core/auth/authOptions";
import dbConnect from "@/core/db/dbConnect";
import Company from "@/models/company.model";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = session.user as any;
    await dbConnect();
    const company = await Company.findById(user.companyId)
      .select("name hrSignatureUrl companyStampUrl certificateTemplateUrl certificateFooterText logoUrl");
    if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });
    return NextResponse.json(company);
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Admin only" }, { status: 403 });
    const body = await req.json();
    const allowed: any = {};
    if (body.hrSignatureUrl          !== undefined) allowed.hrSignatureUrl          = body.hrSignatureUrl;
    if (body.companyStampUrl         !== undefined) allowed.companyStampUrl         = body.companyStampUrl;
    if (body.certificateTemplateUrl  !== undefined) allowed.certificateTemplateUrl  = body.certificateTemplateUrl;
    if (body.certificateFooterText   !== undefined) allowed.certificateFooterText   = body.certificateFooterText?.slice(0, 300);
    if (body.logoUrl                 !== undefined) allowed.logoUrl                 = body.logoUrl;
    await dbConnect();
    const company = await Company.findByIdAndUpdate(user.companyId, { $set: allowed }, { new: true });
    return NextResponse.json(company);
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
