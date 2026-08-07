import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/eecb2c";

// Sibling accounts created via family registration intentionally share the
// parent's email (differentiated by familyId instead), so the unique index
// on User.email must be dropped to allow that.
async function dropUserEmailUniqueIndex() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const db = mongoose.connection.db;
    try {
      await db.collection("users").dropIndex("email_1");
      console.log("✅ Dropped unique index 'email_1' on users collection");
    } catch (err) {
      if (err.code === 27 || err.codeName === "IndexNotFound") {
        console.log("ℹ️  Index 'email_1' doesn't exist (already dropped)");
      } else {
        throw err;
      }
    }

    // Recreate as a plain (non-unique) index — email is still looked up
    // frequently (login, duplicate checks), just no longer required unique.
    await db.collection("users").createIndex({ email: 1 }, { unique: false, name: "email_1" });
    console.log("✅ Recreated 'email_1' as a non-unique index");
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("👋 Disconnected from MongoDB");
    process.exit(0);
  }
}

dropUserEmailUniqueIndex();
