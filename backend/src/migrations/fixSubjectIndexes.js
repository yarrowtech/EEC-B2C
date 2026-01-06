import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/eecb2c";

async function fixIndexes() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const db = mongoose.connection.db;

    // Fix Subject indexes
    console.log("\n📋 Checking Subject collection indexes...");
    const subjectIndexes = await db.collection("subjects").indexes();
    console.log("Current indexes:", subjectIndexes.map(i => i.name));

    // Drop the old unique index on 'name' field only
    try {
      await db.collection("subjects").dropIndex("name_1");
      console.log("✅ Dropped old 'name_1' unique index from subjects");
    } catch (err) {
      if (err.code === 27 || err.codeName === "IndexNotFound") {
        console.log("ℹ️  Index 'name_1' doesn't exist (already removed or never existed)");
      } else {
        console.error("❌ Error dropping index:", err.message);
      }
    }

    // Ensure the compound index exists
    await db.collection("subjects").createIndex(
      { board: 1, class: 1, name: 1 },
      { unique: true, name: "board_1_class_1_name_1" }
    );
    console.log("✅ Ensured compound index (board_1_class_1_name_1) exists");

    // Fix Topic indexes
    console.log("\n📋 Checking Topic collection indexes...");
    const topicIndexes = await db.collection("topics").indexes();
    console.log("Current indexes:", topicIndexes.map(i => i.name));

    // Drop old indexes if they exist
    const oldTopicIndexes = ["name_1", "subject_1"];
    for (const indexName of oldTopicIndexes) {
      try {
        await db.collection("topics").dropIndex(indexName);
        console.log(`✅ Dropped old '${indexName}' index from topics`);
      } catch (err) {
        if (err.code === 27 || err.codeName === "IndexNotFound") {
          console.log(`ℹ️  Index '${indexName}' doesn't exist`);
        } else {
          console.error(`❌ Error dropping ${indexName}:`, err.message);
        }
      }
    }

    // Ensure the compound index exists for topics
    await db.collection("topics").createIndex(
      { board: 1, class: 1, subject: 1, name: 1 },
      { unique: true, name: "board_1_class_1_subject_1_name_1" }
    );
    console.log("✅ Ensured compound index (board_1_class_1_subject_1_name_1) exists");

    console.log("\n✅ All indexes fixed successfully!");

    // Show final indexes
    console.log("\n📋 Final Subject indexes:");
    const finalSubjectIndexes = await db.collection("subjects").indexes();
    finalSubjectIndexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    console.log("\n📋 Final Topic indexes:");
    const finalTopicIndexes = await db.collection("topics").indexes();
    finalTopicIndexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("\n👋 Disconnected from MongoDB");
    process.exit(0);
  }
}

fixIndexes();
