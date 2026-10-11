import mongoose, { Schema, Document, Model } from "mongoose";

export interface IWeeklyReport extends Document {
  batchId: mongoose.Types.ObjectId;
  internId: mongoose.Types.ObjectId;
  weekNumber: number;
  tasksWorkedOn: mongoose.Types.ObjectId[];
  workDone: string;
  challenges: string;
  learnings: string;
  hoursSpent: number;
  mentorFeedback?: string;
  feedbackGivenBy?: mongoose.Types.ObjectId;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WeeklyReportSchema = new Schema<IWeeklyReport>(
  {
    batchId: { type: Schema.Types.ObjectId, ref: "Batch", required: true },
    internId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    weekNumber: { type: Number, required: true },
    tasksWorkedOn: [{ type: Schema.Types.ObjectId, ref: "Task" }],
    workDone: { type: String, required: true },
    challenges: { type: String, required: true },
    learnings: { type: String, required: true },
    hoursSpent: { type: Number, default: 0 },
    mentorFeedback: { type: String },
    feedbackGivenBy: { type: Schema.Types.ObjectId, ref: "User" },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

WeeklyReportSchema.index({ batchId: 1, internId: 1, weekNumber: 1 }, { unique: true });

export const WeeklyReport: Model<IWeeklyReport> =
  mongoose.models.WeeklyReport ||
  mongoose.model<IWeeklyReport>("WeeklyReport", WeeklyReportSchema);

// ─── Evaluation ────────────────────────────────────────────────────────────────

export interface ICriteriaScore {
  key: string;
  label: string;
  score: number;
  weight: number;
}

export interface IEvaluation extends Document {
  batchId: mongoose.Types.ObjectId;
  internId: mongoose.Types.ObjectId;
  mentorId: mongoose.Types.ObjectId;
  criteriaScores: ICriteriaScore[];
  finalScore: number;
  remarks: string;
  completed: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EvaluationSchema = new Schema<IEvaluation>(
  {
    batchId: { type: Schema.Types.ObjectId, ref: "Batch", required: true },
    internId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    mentorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    criteriaScores: [
      {
        key: { type: String, required: true },
        label: { type: String, required: true },
        score: { type: Number, required: true, min: 0, max: 10 },
        weight: { type: Number, required: true },
      },
    ],
    finalScore: { type: Number, default: 0 },
    remarks: { type: String, default: "" },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

export const Evaluation: Model<IEvaluation> =
  mongoose.models.Evaluation ||
  mongoose.model<IEvaluation>("Evaluation", EvaluationSchema);
