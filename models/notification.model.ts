/**
 * FIX #4 — In-app Notifications
 */
import mongoose, { Schema, Document, Model } from "mongoose";

export type NotificationType =
  | "TASK_ASSIGNED"
  | "TASK_APPROVED"
  | "TASK_REWORK"
  | "REPORT_SUBMITTED"
  | "REPORT_FEEDBACK"
  | "EVALUATION_COMPLETE"
  | "BATCH_STARTED";

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId:    { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true },
    type:      { type: String, required: true },
    title:     { type: String, required: true },
    message:   { type: String, required: true },
    link:      { type: String },
    read:      { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

// TTL: auto-delete notifications older than 60 days
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 24 * 60 * 60 });

const Notification: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", NotificationSchema);

export default Notification;
