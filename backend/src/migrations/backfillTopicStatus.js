import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/eecb2c";

async function backfillTopicStatus() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const db = mongoose.connection.db;

    const result = await db.collection("topics").updateMany(
      { status: { $exists: false } },
      { $set: { status: "approved" } }
    );
    console.log(`✅ Backfilled status="approved" on ${result.modifiedCount} existing topic(s)`);
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("👋 Disconnected from MongoDB");
    process.exit(0);
  }
}

backfillTopicStatus();
