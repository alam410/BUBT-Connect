import express from "express";
import { getBUBTNotices } from "../controllers/announcementController.js";
import { protect } from "../middlewares/auth.js";

const announcementRouter = express.Router();

// Get BUBT notices (protected route)
announcementRouter.get("/bubt-notices", protect, getBUBTNotices);

export default announcementRouter;

