import mongoose, { Schema, Document, Model } from "mongoose";

export enum SubmissionStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REWORK = "REWORK",
}

export interface ISubmission extends Document {
  taskId: mongoose.Types.ObjectId;
  batchId: mongoose.Types.ObjectId;
  internId: mongoose.Types.ObjectId;
  proofType: string;
  proofLink: string;
  whatWasImplemented: string;
  whatWasLearned: string;
  attachmentUrl?: string;
  status: SubmissionStatus;
  mentorRemarks?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  reworkCount: number;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SubmissionSchema = new Schema<ISubmission>(
  {
    taskId: { type: Schema.Types.ObjectId, ref: "Task", required: true },
    batchId: { type: Schema.Types.ObjectId, ref: "Batch", required: true },
    internId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    proofType: { type: String, required: true },
    proofLink: { type: String, required: true },
    whatWasImplemented: { type: String, required: true, maxlength: 500 },
    whatWasLearned: { type: String, required: true },
    attachmentUrl: { type: String },
    status: {
      type: String,
      enum: Object.values(SubmissionStatus),
      default: SubmissionStatus.PENDING,
    },
    mentorRemarks: { type: String },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    reworkCount: { type: Number, default: 0 },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Submission: Model<ISubmission> =
  mongoose.models.Submission ||
  mongoose.model<ISubmission>("Submission", SubmissionSchema);

export default Submission;
