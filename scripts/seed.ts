import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) { console.error("❌  Set MONGODB_URI in .env.local"); process.exit(1); }

const CompanySchema = new mongoose.Schema({ name: String, industry: String, isActive: { type: Boolean, default: true } }, { timestamps: true });
const UserSchema = new mongoose.Schema({
  companyId: mongoose.Schema.Types.ObjectId,
  name: String, email: { type: String, lowercase: true }, password: String,
  role: String, isActive: { type: Boolean, default: true }, hasCompletedOnboarding: { type: Boolean, default: false },
}, { timestamps: true });

const Company = mongoose.models.Company || mongoose.model("Company", CompanySchema);
const User    = mongoose.models.User    || mongoose.model("User",    UserSchema);

async function seed() {
  await mongoose.connect(MONGODB_URI!);
  console.log("✅  Connected to MongoDB");

  const existingAdmin = await User.findOne({ email: "admin@coreco.com" });
  if (existingAdmin) {
    console.log("ℹ️   Seed data already exists. Skipping.");
    process.exit(0);
  }

  const company = await Company.create({ name: "Coreco Technologies", industry: "Software & IT", isActive: true });
  const hash = await bcrypt.hash("admin123", 12);
  const admin = await User.create({ companyId: company._id, name: "Admin User", email: "admin@coreco.com", password: hash, role: "ADMIN", isActive: true, hasCompletedOnboarding: true });

  console.log("\n🎉  Seed complete!\n");
  console.log("  Company: ", company.name);
  console.log("  Email:   ", admin.email);
  console.log("  Password:", "admin123");
  console.log("\n  → Login at http://localhost:3000/login\n");
  process.exit(0);
}

seed().catch(e => { console.error("❌  Seed failed:", e); process.exit(1); });
