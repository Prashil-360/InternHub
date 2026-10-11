import mongoose, { Schema, Document, Model } from "mongoose";

export enum TaskPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
}

export enum TaskStatus {
  ASSIGNED = "ASSIGNED",
  IN_PROGRESS = "IN_PROGRESS",
  SUBMITTED = "SUBMITTED",
  APPROVED = "APPROVED",
  REWORK = "REWORK",
  OVERDUE = "OVERDUE",
}

export enum ProofType {
  GITHUB = "GITHUB",
  URL = "URL",
  DOC = "DOC",
  IMAGE = "IMAGE",
  OTHER = "OTHER",
}

export interface ITask extends Document {
  batchId: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  assignedTo: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;
  weekNumber: number;
  deadline: Date;
  priority: TaskPriority;
  requiredProofType: ProofType;
  status: TaskStatus;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    batchId:           { type: Schema.Types.ObjectId, ref: "Batch",   required: true },
    companyId:         { type: Schema.Types.ObjectId, ref: "Company", required: true },
    title:             { type: String, required: true, trim: true },
    description:       { type: String, required: true },
    assignedTo:        [{ type: Schema.Types.ObjectId, ref: "User" }],
    createdBy:         { type: Schema.Types.ObjectId, ref: "User", required: true },
    weekNumber:        { type: Number, required: true },
    deadline:          { type: Date, required: true },
    priority:          { type: String, enum: Object.values(TaskPriority), default: TaskPriority.MEDIUM },
    requiredProofType: { type: String, enum: Object.values(ProofType),    default: ProofType.GITHUB },
    status:            { type: String, enum: Object.values(TaskStatus),   default: TaskStatus.ASSIGNED },
    tags:              [{ type: String }],
  },
  { timestamps: true }
);

// FIX #9 — Indexes for fast filtered queries
TaskSchema.index({ companyId: 1, status: 1 });
TaskSchema.index({ batchId: 1, status: 1 });
TaskSchema.index({ assignedTo: 1, status: 1 });
TaskSchema.index({ companyId: 1, createdAt: -1 });

const Task: Model<ITask> =
  mongoose.models.Task || mongoose.model<ITask>("Task", TaskSchema);

export default Task;
