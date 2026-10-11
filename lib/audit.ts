import dbConnect from "@/core/db/dbConnect";
import AuditLog, { AuditAction } from "@/models/auditLog.model";

interface AuditPayload {
  companyId: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: AuditAction;
  targetType: string;
  targetId?: string;
  targetName?: string;
  metadata?: Record<string, any>;
  ip?: string;
}

export async function audit(payload: AuditPayload) {
  try {
    await dbConnect();
    await AuditLog.create(payload);
  } catch (e) {
    // Non-fatal
    console.error("Audit log failed:", e);
  }
}
