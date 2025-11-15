import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./configs/db.js";
import { inngest, functions } from "./inngest/index.js";
import { serve } from "inngest/express";
import { clerkMiddleware } from "@clerk/express";

import userRouter from "./routes/userRoutes.js";
import postRouter from "./routes/postRoutes.js";
import storyRouter from "./routes/storyRoutes.js";
import messageRouter from "./routes/messageRoutes.js";

const app = express();

// Connect MongoDB
connectDB();

// Middlewares - order matters
app.use(express.json());

// ✅ CORS: allow frontend origin + credentials
const allowedOrigins = ["http://localhost:5173"]; // your frontend
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true, // must allow cookies/auth headers
  })
);

// Clerk middleware
app.use(clerkMiddleware());

// Routes
app.get("/", (req, res) => res.send("Server is running"));

// Inngest webhook endpoint
app.use("/api/inngest", serve({ client: inngest, functions }));

// User-related APIs
app.use("/api/user", userRouter);
app.use("/api/post", postRouter);
app.use("/api/story", storyRouter);
app.use("/api/message", messageRouter);

// Test MongoDB connection
app.get("/api/test", async (req, res) => {
  try {
    const mongoose = await import("mongoose").then((m) => m.default);
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();
    res.json({ message: "MongoDB connected!", collections });
  } catch (error) {
    res
      .status(500)
      .json({ message: "MongoDB connection failed", error: error.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
