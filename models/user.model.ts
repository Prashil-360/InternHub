import mongoose, { Schema, Document, Model } from "mongoose";

export enum UserRole {
  ADMIN  = "ADMIN",
  MENTOR = "MENTOR",
  INTERN = "INTERN",
}

export interface IUser extends Document {
  companyId: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  isActive: boolean;
  hasCompletedOnboarding: boolean;
  inviteToken?: string;
  inviteTokenExpiry?: Date;
  avatarUrl?: string;
  department?: string;
  phone?: string;
  bio?: string;
  linkedIn?: string;
  github?: string;
  college?: string;
  graduationYear?: number;
  specialization?: string;
  skills?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    companyId:              { type: Schema.Types.ObjectId, ref: "Company", required: true },
    name:                   { type: String, required: true, trim: true },
    email:                  { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:               { type: String, select: false },
    role:                   { type: String, enum: Object.values(UserRole), required: true },
    isActive:               { type: Boolean, default: true },
    hasCompletedOnboarding: { type: Boolean, default: false },
    inviteToken:            { type: String, select: false },
    inviteTokenExpiry:      { type: Date,   select: false },
    avatarUrl:              { type: String },
    department:             { type: String },
    phone:                  { type: String },
    bio:                    { type: String },
    linkedIn:               { type: String },
    github:                 { type: String },
    college:                { type: String },
    graduationYear:         { type: Number },
    specialization:         { type: String },
    skills:                 [{ type: String }],
  },
  { timestamps: true }
);

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
export default User;
