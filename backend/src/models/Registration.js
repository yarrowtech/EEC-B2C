import mongoose from "mongoose";

const ChildSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    gender: { type: String, enum: ["male", "female", "other"], required: true },
    board: { type: String, required: true, trim: true },
    class: { type: String, required: true, trim: true },
    schoolName: { type: String, required: true, trim: true },
    // The login account created for this sibling.
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { _id: false }
);

const RegistrationSchema = new mongoose.Schema(
  {
    // Primary child — this is the one a login account is created for.
    name: { type: String, required: true, trim: true },
    gender: { type: String, enum: ["male", "female", "other"], required: true },
    board: { type: String, required: true, trim: true },
    class: { type: String, required: true, trim: true },
    schoolName: { type: String, required: true, trim: true },
    // Any siblings also being registered — each also gets a real login account.
    additionalChildren: { type: [ChildSchema], default: [] },
    parentName: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    // Links to the User account created alongside this registration.
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    // Shared with every account (primary + siblings) created from this submission.
    familyId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },
    status: {
      type: String,
      enum: ["new", "contacted", "closed"],
      default: "new",
    },
  },
  { timestamps: true }
);

const Registration = mongoose.model("Registration", RegistrationSchema);

export default Registration;
