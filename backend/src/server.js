import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import userRouter from "./routes/users.js";
import questionsRouter from "./routes/questions.js";
import examsRouter from "./routes/exams.js";
import heroRoutes from "./routes/heroRoutes.js";
import whyEecRoutes from "./routes/whyEecRoutes.js";
import featuresRoutes from "./routes/featuresRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import aboutUsRoutes from "./routes/aboutUsRoutes.js";
import careerPageRoutes from "./routes/careerPageRoutes.js";
import officePageRoutes from "./routes/officePageRoutes.js";

const app = express();

/* ---------- Security & Core ---------- */
app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN?.split(",") || "*",
    credentials: true,
  })
);

// basic rate limiting on auth endpoints
const limiter = rateLimit({ windowMs: 60 * 1000, max: 60 });
app.use("/api/auth", limiter);

app.get("/", (req, res) => {
  res.send("EEC Platform Backend is running...");
})

/* ---------- Routes ---------- */
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/users", userRouter);
app.use("/api/questions", questionsRouter);
app.use("/api/exams", examsRouter);
app.use("/api/hero-settings", heroRoutes);
app.use("/api/why-eec", whyEecRoutes);
app.use("/api/features", featuresRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/about-us", aboutUsRoutes);
app.use("/api/settings", careerPageRoutes);
app.use("/api/office", officePageRoutes);


/* ---------- Boot ---------- */
const PORT = process.env.PORT || 5000;
connectDB(process.env.MONGO_URI).then(() => {
  app.listen(PORT, () => console.log(`🚀 Server listening on :${PORT}`));
});
