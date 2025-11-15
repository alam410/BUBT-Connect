import fs from "fs";
import Message from "../models/Message.js";
import imagekit from "../configs/imageKit.js";

const connections = {}; // সব clients সংরক্ষণ করবে

export const sseController = (req, res) => {
  const { userId } = req.params;
  console.log("New client connected: ", userId);

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Client সংরক্ষণ
  connections[userId] = res;

  // Initial event
  res.write("event: log\n");
  res.write("data: Connected to SSE stream\n\n");

  // Client disconnect হলে cleanup
  req.on("close", () => {
    delete connections[userId];
    console.log(`Client disconnected: ${userId}`);
  });
};

//send message
export const sendMessage = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { to_user_id, text } = req.body;
    const image = req.file;

    let media_url = "";
    let message_type = image ? "image" : "text";

    // Upload image if present
    if (message_type === "image") {
      const fileBuffer = fs.readFileSync(image.path); // বা fs.promises.readFile
      const response = await imagekit.upload({
        file: fileBuffer,
        fileName: image.originalname,
        folder: "messages",
      });

      media_url = imagekit.url({
        path: response.filePath,
        transformation: [
          { quality: "auto" },
          { format: "webp" },
          { width: "1280" },
        ],
      });

      // Optionally delete local file
      fs.unlinkSync(image.path);
    }

    // Create message
    const message = await Message.create({
      from_user_id: userId,
      to_user_id,
      text,
      message_type,
      media_url,
    });

    // Get message with populated user data
    const messageWithUserData = await Message.findById(message._id).populate(
      "from_user_id",
      "full_name username profile_picture"
    );

    res.json({ success: true, message: messageWithUserData });

    // Send via SSE if the user is connected
    if (connections[to_user_id]) {
      connections[to_user_id].write(
        `event: message\ndata: ${JSON.stringify(messageWithUserData)}\n\n`
      );
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//get chat messages
export const getChatMessages = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { to_user_id } = req.body;

    // Fetch messages between two users
    const messages = await Message.find({
      $or: [
        { from_user_id: userId, to_user_id: to_user_id },
        { from_user_id: to_user_id, to_user_id: userId },
      ],
    })
      .sort({ createdAt: 1 }) // Oldest first for proper chat display
      .populate("from_user_id", "full_name username profile_picture"); // user details

    // Mark messages as seen
    await Message.updateMany(
      { from_user_id: to_user_id, to_user_id: userId },
      { seen: true }
    );

    res.json({ success: true, messages });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export const getUserRecentMessages = async (req, res) => {
  try {
    const { userId } = req.auth();

    // Fetch messages where user is the receiver
    const messages = await Message.find({ to_user_id: userId })
      .populate("from_user_id")
      .populate("to_user_id")
      .sort({ createdAt: -1 }); // latest first

    res.json({ success: true, messages });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};
