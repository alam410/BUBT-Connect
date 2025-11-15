import express from "express";
import { upload } from "../configs/multer.js";
import { protect } from "../middlewares/auth.js";
import { addPost, getFeedPosts, reactToPost, deletePost, addComment, getComments } from "../controllers/postController.js";

const postRouter = express.Router();

postRouter.post("/add", upload.array("images", 4), protect, addPost);
postRouter.get("/feed", protect, getFeedPosts);
postRouter.post("/react", protect, (req, res, next) => {
  console.log("✅ /api/post/react route hit");
  next();
}, reactToPost);

//postRouter.post("/react", protect, reactToPost);
postRouter.delete("/:postId", protect, deletePost); // note the param name matches controller

// Comment routes
postRouter.post("/comment", protect, addComment);
postRouter.get("/:postId/comments", protect, getComments);

export default postRouter;
