import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICompany extends Document {
  name: string;
  industry: string;
  internshipPhilosophy?: string;
  isActive: boolean;
  logoUrl?: string;
  website?: string;
  hrSignatureUrl?: string;
  companyStampUrl?: string;
  certificateTemplateUrl?: string;
  certificateFooterText?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema = new Schema<ICompany>(
  {
    name: { type: String, required: true, trim: true },
    industry: { type: String, required: true, default: "Technology" },
    internshipPhilosophy: { type: String },
    isActive: { type: Boolean, default: true },
    logoUrl: { type: String },
    website: { type: String },
    hrSignatureUrl: { type: String },
    companyStampUrl: { type: String },
    certificateTemplateUrl: { type: String },
    certificateFooterText: { type: String },
  },
  { timestamps: true }
);

const Company: Model<ICompany> =
  mongoose.models.Company || mongoose.model<ICompany>("Company", CompanySchema);

export default Company;
