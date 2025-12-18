import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import http from "http";
import { Server } from "socket.io";
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
import newsletterRoutes from "./routes/newsletterRoutes.js";
import subjectTopicRoutes from "./routes/subjectTopicRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import attemptRoutes from "./routes/attemptRoutes.js";
import subjectsRoutes from "./routes/subjectsRoutes.js";
import topicsRoutes from "./routes/topicsRoutes.js";
import studyMaterialRoutes from "./routes/studyMaterialRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import classRoutes from "./routes/classRoutes.js";
import boardRoutes from "./routes/boardRoutes.js";

const app = express();

/* ---------- Security & Core ---------- */
app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(
  cors({
    origin: [
      "https://eec-b2-c.vercel.app",
      "http://localhost:5173",
      "http://localhost:5000",
    ],
    methods: ["GET", "POST", "DELETE", "PUT"],
    credentials: true,
  })
);

// basic rate limiting
const limiter = rateLimit({ windowMs: 60 * 1000, max: 60 });
app.use("/api/auth", limiter);

app.get("/", (req, res) => {
  res.send("EEC Platform Backend is running...");
});

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
app.use("/api/newsletter", newsletterRoutes);
app.use("/api", subjectTopicRoutes);
app.use("/api/chat", chatRoutes);
app.use("/users", userRouter);
app.use("/api/attempt", attemptRoutes);
app.use("/api/subjects", subjectsRoutes);
app.use("/api/topics", topicsRoutes);
app.use("/api/study-materials", studyMaterialRoutes);
app.use("/api/webhooks/razorpay", express.raw({ type: "application/json" }));
app.use("/api/notifications", notificationRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/boards", boardRoutes);

/* ---------- Boot ---------- */
const PORT = process.env.PORT || 5000;

connectDB(process.env.MONGO_URI).then(() => {
  const httpServer = http.createServer(app);

  /* ---------- Socket.io Server ---------- */
  const io = new Server(httpServer, {
    cors: {
      origin: ["http://localhost:5173", "https://eec-b2-c.vercel.app"],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("🟢 Connected:", socket.id);

    // Everyone joins one global room
    socket.join("global-room");
    console.log("User joined global room");

    socket.on("send_message", (data) => {
      // Broadcast to all except sender
      io.to("global-room").emit("receive_message", data);
    });

    socket.on("message_read", (userId) => {
      io.to("global-room").emit("update_read", { userId });
    });

    socket.on("disconnect", () => {
      console.log("🔴 Disconnected:", socket.id);
    });
  });

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server + Socket.io running on port: ${PORT}`);
  });
});
