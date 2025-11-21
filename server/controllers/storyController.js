import fs from "fs";
import User from "../models/user.js";
import Story from "../models/Story.js";
import imagekit from "../configs/imageKit.js";
import { inngest } from "../inngest/index.js";

// ✅ Add Story
export const addUserStory = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { content, media_type, background_color } = req.body;
    const media = req.file;

    let media_url = "";

    // ✅ Upload image/video if provided
    if (media && (media_type === "image" || media_type === "video")) {
      const fileBuffer = fs.readFileSync(media.path);
      const uploadResponse = await imagekit.upload({
        file: fileBuffer,
        fileName: media.originalname,
        folder: "stories",
      });
      media_url = uploadResponse.url;
      fs.unlinkSync(media.path); // remove local temp file
    }

    // ✅ Save story
    const story = await Story.create({
      user: userId,
      content,
      media_type,
      media_url,
      background_color,
    });

    // ✅ Schedule delete after 24 hours from creation time
    await inngest.send({
      name: "app/story.delete",
      data: { 
        storyId: story._id,
        createdAt: story.createdAt 
      },
    });

    res.json({ success: true, story });
  } catch (error) {
    console.error("Story creation error:", error);
    res.json({ success: false, message: error.message });
  }
};

// ✅ Get all stories (user + connections)
export const getStories = async (req, res) => {
  try {
    const { userId } = req.auth();
    const user = await User.findById(userId);

    if (!user) return res.json({ success: false, message: "User not found" });

    const userIds = [userId, ...(user.connections || []), ...(user.following || [])];

    const stories = await Story.find({ user: { $in: userIds } })
      .populate("user", "full_name username profile_picture")
      .sort({ createdAt: -1 });

    res.json({ success: true, stories });
  } catch (error) {
    console.error("Get stories error:", error);
    res.json({ success: false, message: error.message });
  }
};

// ✅ Cleanup old stories (older than 24 hours)
export const cleanupOldStories = async (req, res) => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = await Story.deleteMany({
      createdAt: { $lt: oneDayAgo }
    });

    res.json({ 
      success: true, 
      message: `Deleted ${result.deletedCount} old stories.`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error("Cleanup stories error:", error);
    res.json({ success: false, message: error.message });
  }
};
