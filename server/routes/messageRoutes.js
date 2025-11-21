import express from "express";
import {
  getChatMessages,
  sendMessage,
  sseController,
  deleteMessage,
} from "../controllers/messageController.js";
import { upload } from "../configs/multer.js";
import { protect } from "../middlewares/auth.js";

const messageRouter = express.Router();

messageRouter.get("/:userId", sseController);
messageRouter.post("/send", upload.single("file"), protect, sendMessage);
messageRouter.post("/get", protect, getChatMessages);
messageRouter.post("/delete", protect, deleteMessage);

export default messageRouter;
