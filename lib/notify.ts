/**
 * FIX #4 — Notification creation helper
 * Call this after any significant event in API routes.
 */
import dbConnect from "@/core/db/dbConnect";
import Notification, { NotificationType } from "@/models/notification.model";
import mongoose from "mongoose";

interface NotifyPayload {
  userId: string | mongoose.Types.ObjectId;
  companyId: string | mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

export async function notify(payload: NotifyPayload) {
  try {
    await dbConnect();
    await Notification.create(payload);
  } catch (e) {
    // Non-fatal — never let notification failure break the main flow
    console.error("Notification creation failed:", e);
  }
}

/** Notify multiple users at once */
export async function notifyMany(
  userIds: (string | mongoose.Types.ObjectId)[],
  payload: Omit<NotifyPayload, "userId">
) {
  try {
    await dbConnect();
    await Notification.insertMany(
      userIds.map((userId) => ({ ...payload, userId }))
    );
  } catch (e) {
    console.error("Bulk notification failed:", e);
  }
}
