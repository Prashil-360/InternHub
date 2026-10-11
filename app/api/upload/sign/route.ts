import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/core/auth/authOptions";
import crypto from "crypto";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey    = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || cloudName === "your_cloud_name") {
      return NextResponse.json({ error: "CLOUDINARY_CLOUD_NAME is not configured in .env.local" }, { status: 503 });
    }
    if (!apiKey || apiKey === "your_api_key") {
      return NextResponse.json({ error: "CLOUDINARY_API_KEY is not configured in .env.local" }, { status: 503 });
    }
    if (!apiSecret || apiSecret === "your_api_secret") {
      return NextResponse.json({ error: "CLOUDINARY_API_SECRET is not configured in .env.local" }, { status: 503 });
    }

    const { searchParams } = new URL(req.url);
    const folder    = searchParams.get("folder") || "internhub/uploads";
    const timestamp = Math.round(Date.now() / 1000);

    // CRITICAL: Sign ONLY the params you actually send to Cloudinary.
    // Cloudinary recomputes the signature from what it receives.
    // Any mismatch (extra or missing params) = "Invalid Signature".
    // Here we only send folder + timestamp, so we only sign folder + timestamp.
    const paramsToSign = { folder, timestamp };

    // Sort keys alphabetically, join as key=value pairs, then append api_secret
    const stringToSign = Object.entries(paramsToSign)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join("&");

    const signature = crypto
      .createHash("sha256")
      .update(stringToSign + apiSecret)
      .digest("hex");

    return NextResponse.json({
      signature,
      timestamp,
      folder,
      apiKey,
      cloudName,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
