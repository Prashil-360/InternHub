import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/core/auth/authOptions";
import dbConnect from "@/core/db/dbConnect";
import Notification from "@/models/notification.model";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get("unread") === "true";

  await dbConnect();

  const query: any = { userId: user.id };
  if (unreadOnly) query.read = false;

  const [notifications, unreadCount] = await Promise.all([
    Notification.find(query).sort({ createdAt: -1 }).limit(30),
    Notification.countDocuments({ userId: user.id, read: false }),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  const { ids, markAll } = await req.json();

  await dbConnect();

  if (markAll) {
    await Notification.updateMany({ userId: user.id, read: false }, { read: true });
  } else if (ids?.length) {
    await Notification.updateMany(
      { _id: { $in: ids }, userId: user.id },
      { read: true }
    );
  }

  return NextResponse.json({ message: "Marked as read" });
}
