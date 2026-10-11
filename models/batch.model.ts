import mongoose, { Schema, Document, Model } from "mongoose";

export enum BatchStatus {
  PLANNED = "PLANNED",
  ONGOING = "ONGOING",
  COMPLETED = "COMPLETED",
}

export interface IBatch extends Document {
  companyId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  startDate: Date;
  durationInWeeks: number;
  currentStatus: BatchStatus;
  mentorIds: mongoose.Types.ObjectId[];
  internIds: mongoose.Types.ObjectId[];
  evaluationCriteria: Array<{
    key: string;
    label: string;
    weight: number;
    enabled: boolean;
  }>;
  allowedProofTypes: string[];
  weeklyReportingEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BatchSchema = new Schema<IBatch>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    startDate: { type: Date, required: true },
    durationInWeeks: { type: Number, default: 8 },
    currentStatus: {
      type: String,
      enum: Object.values(BatchStatus),
      default: BatchStatus.PLANNED,
    },
    mentorIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    internIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    evaluationCriteria: [
      {
        key: { type: String, required: true },
        label: { type: String, required: true },
        weight: { type: Number, default: 20 },
        enabled: { type: Boolean, default: true },
      },
    ],
    allowedProofTypes: {
      type: [String],
      default: ["GITHUB", "URL", "DOC", "IMAGE", "OTHER"],
    },
    weeklyReportingEnabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Batch: Model<IBatch> =
  mongoose.models.Batch || mongoose.model<IBatch>("Batch", BatchSchema);

export default Batch;
