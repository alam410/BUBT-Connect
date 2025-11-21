import express from "express";
import {
  acceptConnectionRequest,
  discoverUsers,
  followUser,
  getUserConnections,
  getUserData,
  getUserProfiles,
  sendConnectionRequest,
  unfollowUser,
  updateUserData,
  getOrCreateUser,
  rejectConnectionRequest,
  cancelConnectionRequest,
  disconnectUser,
} from "../controllers/userController.js";
import { protect } from "../middlewares/auth.js";
import { upload } from "../configs/multer.js";
import { getUserRecentMessages } from "../controllers/messageController.js";

const userRouter = express.Router();

// Public endpoint - used immediately after Clerk sign-in to create or fetch user
userRouter.post("/get-or-create-user", getOrCreateUser);

// All routes below are protected
userRouter.use(protect);

userRouter.get("/data", getUserData);
userRouter.put(
  "/update-profile", // Change URL to match frontend
  upload.fields([
    { name: "profile", maxCount: 1 },
    { name: "cover", maxCount: 1 },
  ]),
  updateUserData
);
userRouter.post("/discover", discoverUsers);
userRouter.post("/follow", followUser);
userRouter.post("/unfollow", unfollowUser);
userRouter.post("/connect", sendConnectionRequest);
userRouter.post("/accept", acceptConnectionRequest);
userRouter.post("/reject", rejectConnectionRequest);
userRouter.post("/cancel-request", cancelConnectionRequest);
userRouter.post("/disconnect", disconnectUser);
userRouter.get("/connections", getUserConnections);
userRouter.get("/recent-message", getUserRecentMessages);
userRouter.post("/profiles", getUserProfiles);

export default userRouter;
