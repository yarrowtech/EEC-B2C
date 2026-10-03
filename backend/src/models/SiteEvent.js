import mongoose from "mongoose";

const siteEventSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["pageview", "ping", "login"], required: true, index: true },
    sessionId: { type: String, default: "", index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    pagePath: { type: String, default: "" },
    referrer: { type: String, default: "" },
    isCampaign: { type: Boolean, default: false },
    device: { type: String, enum: ["desktop", "mobile", "tablet", ""], default: "" },
  },
  { timestamps: true }
);

siteEventSchema.index({ type: 1, createdAt: -1 });

export default mongoose.model("SiteEvent", siteEventSchema);
