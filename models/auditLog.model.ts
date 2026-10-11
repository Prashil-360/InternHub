/**
 * FIX #5 — Audit Logs
 * Immutable event log. Every state change is recorded.
 */
import mongoose, { Schema, Document, Model } from "mongoose";

export type AuditAction =
  | "USER_REGISTERED"
  | "USER_INVITED"
  | "USER_LOGIN"
  | "BATCH_CREATED" | "BATCH_UPDATED" | "BATCH_STATUS_CHANGED"
  | "USER_ADDED_TO_BATCH" | "USER_REMOVED_FROM_BATCH"
  | "TASK_CREATED" | "TASK_UPDATED" | "TASK_DELETED"
  | "SUBMISSION_CREATED" | "SUBMISSION_APPROVED" | "SUBMISSION_REWORK"
  | "REPORT_SUBMITTED" | "REPORT_FEEDBACK_GIVEN"
  | "EVALUATION_SAVED" | "EVALUATION_COMPLETED"
  | "PASSWORD_RESET_REQUESTED" | "PASSWORD_RESET_COMPLETED";

export interface IAuditLog extends Document {
  companyId: mongoose.Types.ObjectId;
  actorId: mongoose.Types.ObjectId;
  actorName: string;
  actorRole: string;
  action: AuditAction;
  targetType: string;
  targetId?: string;
  targetName?: string;
  metadata?: Record<string, any>;
  ip?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    companyId:  { type: Schema.Types.ObjectId, required: true, index: true },
    actorId:    { type: Schema.Types.ObjectId, required: true },
    actorName:  { type: String, required: true },
    actorRole:  { type: String, required: true },
    action:     { type: String, required: true, index: true },
    targetType: { type: String, required: true },
    targetId:   { type: String },
    targetName: { type: String },
    metadata:   { type: Schema.Types.Mixed },
    ip:         { type: String },
  },
  { timestamps: true }
);

// Keep audit logs for 1 year
AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog ||
  mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);

export default AuditLog;
