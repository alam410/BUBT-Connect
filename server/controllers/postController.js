import fs from "fs";
import imagekit from "../configs/imageKit.js";
import Post from "../models/Post.js";
import User from "../models/user.js";
import Comment from "../models/Comment.js";

// ✅ Add Post
export const addPost = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { content, post_type } = req.body;
    const images = req.files || [];

    let image_urls = [];

    // ✅ Upload images if any
    if (images.length > 0) {
      image_urls = await Promise.all(
        images.map(async (image) => {
          const fileBuffer = fs.readFileSync(image.path);
          const uploaded = await imagekit.upload({
            file: fileBuffer,
            fileName: image.originalname,
            folder: "posts",
          });

          return uploaded.url; // ImageKit returns direct URL
        })
      );
    }

    // ✅ Create post
    await Post.create({
      user: userId,
      content,
      image_urls,
      post_type,
    });

    res.json({ success: true, message: "Post created successfully" });
  } catch (error) {
    console.error("Add Post Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get Feed Posts
export const getFeedPosts = async (req, res) => {
  try {
    const { userId } = req.auth();
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const userIds = [userId, ...user.connections, ...user.following];

    const posts = await Post.find({ user: { $in: userIds } })
      .populate("user")
      .populate({
        path: "comments",
        populate: { path: "user", select: "full_name username profile_picture" },
        options: { sort: { createdAt: -1 }, limit: 3 }, // Get latest 3 comments
      })
      .sort({ createdAt: -1 })
      .lean(); // <- convert to plain JS objects

    // 🔁 Add reaction counts + current user's reaction
    const formattedPosts = posts.map((post) => {
      const reactions = post.reactions || {};

      // Count total per reaction type
      const counts = Object.fromEntries(
        Object.entries(reactions).map(([type, arr]) => [type, arr.length])
      );

      // Find which reaction current user gave
      const userReaction =
        Object.entries(reactions).find(([type, arr]) =>
          arr.some((id) => id.toString() === userId.toString())
        )?.[0] || null;

      return {
        ...post,
        reactionCounts: counts,
        userReaction,
        commentCount: post.comments?.length || 0,
      };
    });

    res.json({ success: true, posts: formattedPosts });
  } catch (error) {
    console.error("Get Feed Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
export const reactToPost = async (req, res) => {
  try {
    const { postId, reactionType } = req.body;
    const { userId } = req.auth();

    console.log("✅ /api/post/react route hit");
    console.log("📩 Incoming reaction:", req.body);
    console.log("👤 Auth userId:", userId);

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    // Ensure reactions structure exists
    if (!post.reactions) post.reactions = {};
    if (!post.reactions[reactionType]) post.reactions[reactionType] = [];

    const hasReacted = post.reactions[reactionType].includes(userId);

    // 1️⃣ Remove user from ALL reaction arrays
    const pullOps = {};
    for (const key of Object.keys(post.reactions)) {
      pullOps[`reactions.${key}`] = userId;
    }
    await Post.updateOne({ _id: postId }, { $pull: pullOps });
    console.log("🧹 Cleared old reactions for user");

    let isReacted = false;

    // 2️⃣ Add the new reaction only if user hadn’t already reacted with it
    if (!hasReacted) {
      await Post.updateOne(
        { _id: postId },
        { $addToSet: { [`reactions.${reactionType}`]: userId } }
      );
      console.log("✨ Adding new reaction:", reactionType);
      isReacted = true;
    }

    // Fetch updated post and reaction counts
    const updatedPost = await Post.findById(postId).lean();

    const reactionCounts = {};
    for (const [type, arr] of Object.entries(updatedPost.reactions || {})) {
      reactionCounts[type] = arr.length;
    }

    console.log("✅ Reaction updated successfully");

    res.status(200).json({
      success: true,
      isReacted,
      message: isReacted ? "Post Reacted" : "Post Unreacted",
      reactions: reactionCounts,
    });
  } catch (error) {
    console.error("❌ React To Post Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};






// ✅ Delete Post
export const deletePost = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    // ✅ Ensure only the post owner can delete
    if (post.user.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this post" });
    }

    // ✅ Delete post images from ImageKit
    if (post.image_urls && post.image_urls.length > 0) {
      await Promise.all(
        post.image_urls.map(async (url) => {
          try {
            // Extract fileId if stored, or skip deletion
            const path = url.split("/").pop();
            if (path) await imagekit.deleteFile(path);
          } catch (err) {
            console.warn("ImageKit delete error:", err.message);
          }
        })
      );
    }

    // ✅ Delete the post
    await Post.findByIdAndDelete(postId);

    res.json({ success: true, message: "Post deleted successfully" });
  } catch (error) {
    console.error("Delete Post Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Add Comment
export const addComment = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { postId, content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: "Comment content is required" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    const comment = await Comment.create({
      post: postId,
      user: userId,
      content: content.trim(),
    });

    // Add comment to post
    post.comments.push(comment._id);
    await post.save();

    const commentWithUser = await Comment.findById(comment._id).populate("user", "full_name username profile_picture");

    res.json({ success: true, comment: commentWithUser });
  } catch (error) {
    console.error("Add Comment Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get Comments for a Post
export const getComments = async (req, res) => {
  try {
    const { postId } = req.params;

    const comments = await Comment.find({ post: postId })
      .populate("user", "full_name username profile_picture")
      .sort({ createdAt: -1 });

    res.json({ success: true, comments });
  } catch (error) {
    console.error("Get Comments Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
