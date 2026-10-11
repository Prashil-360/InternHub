import { NextResponse } from "next/server";
import dbConnect from "@/core/db/dbConnect";

export async function GET() {
  try {
    await dbConnect();
    return NextResponse.json({ status: "ok", timestamp: new Date().toISOString(), version: "2.0.0", db: "connected" });
  } catch (error: any) {
    return NextResponse.json({ status: "error", db: "disconnected", error: error.message }, { status: 503 });
  }
}
