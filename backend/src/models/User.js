import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, default: "" },
    password: { type: String, required: true },
    role: { type: String, default: "student" },

    // Old DB field
    class: { type: String, default: "" },

    // New fields used by frontend
    className: { type: String, default: "" },
    gender: { type: String, default: "" },
    dob: { type: String, default: "" },
    address: { type: String, default: "" },
    state: { type: String, default: "" },
    department: { type: String, default: "" },
    bio: { type: String, default: "" },
    avatar: { type: String, default: "" },

    username: { type: String, default: "" },
    language: { type: String, default: "en" },

    emailNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: false },
    pushNotifications: { type: Boolean, default: true },
    fatherName: { type: String, default: "" },
    fatherOccupation: { type: String, default: "" },
    motherName: { type: String, default: "" },
    motherOccupation: { type: String, default: "" },
    points: { type: Number, default: 0 },
    fatherContact: { type: String, default: "" },
    motherContact: { type: String, default: "" },
    wallet: { type: Number, default: 0 },
    // models/User.js
    purchasedMaterials: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "StudyMaterial",
      },
    ],
    board: {
      type: String,
      enum: ["CBSE", "ICSE", "WB Board", "State Board"],
      required: false,
    },
    registrationYear: {
      type: Number,
      default: null, // Year when user registered (e.g., 2024)
    },
    registrationMonth: {
      type: Number,
      default: null, // Month when user registered (1-12)
    },
    initialClass: {
      type: String,
      default: "", // Class when user first registered (e.g., "1", "2", "10")
    },
    lastPromotedYear: {
      type: Number,
      default: null,
    },
    canChangeClass: {
      type: Boolean,
      default: false, // Students cannot manually change class after registration
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);
