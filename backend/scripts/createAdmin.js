// scripts/createAdmin.js
import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "../src/models/User.js"; // adjust path if needed

const {
  MONGO_URI,
  ADMIN_NAME = "Admin",
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
} = process.env;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI missing in .env");
  process.exit(1);
}
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error("❌ ADMIN_EMAIL / ADMIN_PASSWORD missing in .env");
  process.exit(1);
}

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected to MongoDB");

  // use same hashing approach as your auth controller
  const SALT_ROUNDS = 10; // matches your controller
  const hash = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS); // :contentReference[oaicite:1]{index=1}

  // upsert admin by email
  const existing = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
  if (existing) {
    // update role + (optionally) password
    existing.role = "admin";
    if (ADMIN_PASSWORD) {
      existing.password = hash;
    }
    await existing.save();
    console.log(`✅ Updated existing user to admin: ${existing.email}`);
  } else {
    const admin = await User.create({
      name: ADMIN_NAME.trim(),
      email: ADMIN_EMAIL.toLowerCase(),
      phone: "",
      password: hash,
      class: "",
      state: "",
      referral: "",
      role: "admin", // NEW role field on your model
    });
    console.log(`✅ Created admin: ${admin.email}`);
  }

  await mongoose.disconnect();
  console.log("🔌 Disconnected");
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
