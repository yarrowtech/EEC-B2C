import mongoose from "mongoose";

const uiClickEventSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    userName: { type: String, default: "" },
    userEmail: { type: String, default: "" },
    userRole: { type: String, default: "" },
    sessionId: { type: String, default: "", index: true },
    buttonLabel: { type: String, required: true, index: true },
    pagePath: { type: String, default: "", index: true },
    pageTitle: { type: String, default: "" },
    elementType: { type: String, default: "button" },
    href: { type: String, default: "" },
    context: { type: mongoose.Schema.Types.Mixed, default: {} },
    userAgent: { type: String, default: "" },
  },
  { timestamps: true }
);

uiClickEventSchema.index({ createdAt: -1 });
uiClickEventSchema.index({ buttonLabel: 1, createdAt: -1 });
uiClickEventSchema.index({ userId: 1, createdAt: -1 });
uiClickEventSchema.index({ pagePath: 1, createdAt: -1 });

export default mongoose.model("UiClickEvent", uiClickEventSchema);
