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
    const file = req.file;

    let media_url = "";
    let message_type = "text";

    // Upload file if present (image or audio)
    if (file) {
      const fileBuffer = fs.readFileSync(file.path);
      
      // Determine message type based on file mimetype
      if (file.mimetype.startsWith("image/")) {
        message_type = "image";
        const response = await imagekit.upload({
          file: fileBuffer,
          fileName: file.originalname,
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
      } else if (file.mimetype.startsWith("audio/")) {
        message_type = "audio";
        const response = await imagekit.upload({
          file: fileBuffer,
          fileName: file.originalname,
          folder: "messages/audio",
        });

        // Try using imagekit.url() to ensure proper URL generation
        // This ensures the URL is correctly formatted and accessible
        media_url = imagekit.url({
          path: response.filePath,
          // No transformations for audio files
        });
        
        // Log for debugging
        console.log("Audio uploaded:", {
          fileName: file.originalname,
          filePath: response.filePath,
          directUrl: response.url,
          generatedUrl: media_url,
          fileId: response.fileId
        });
      }

      // Delete local file after upload
      fs.unlinkSync(file.path);
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

    // Fetch all messages where user is either sender or receiver
    const allMessages = await Message.find({
      $or: [
        { from_user_id: userId },
        { to_user_id: userId }
      ]
    })
      .populate("from_user_id", "full_name username profile_picture")
      .populate("to_user_id", "full_name username profile_picture")
      .sort({ createdAt: -1 }); // latest first

    // Group messages by conversation partner and get the most recent message from each
    const conversationMap = new Map();
    
    allMessages.forEach((msg) => {
      // Determine the other user in the conversation
      // User IDs are strings (Clerk IDs), and populated users have _id as string
      const fromUserId = msg.from_user_id?._id || msg.from_user_id;
      const toUserId = msg.to_user_id?._id || msg.to_user_id;
      
      // Find the other user in the conversation
      const otherUserId = String(fromUserId) === String(userId) ? String(toUserId) : String(fromUserId);
      const otherUser = String(fromUserId) === String(userId) ? msg.to_user_id : msg.from_user_id;

      // If we haven't seen this conversation yet, add it
      // Since messages are sorted by createdAt desc, first one is most recent
      if (!conversationMap.has(otherUserId)) {
        // Check if this message is unread (only for messages received by current user)
        const isUnread = String(toUserId) === String(userId) && !msg.seen;
        
        conversationMap.set(otherUserId, {
          ...msg.toObject(),
          from_user_id: otherUser, // Always set from_user_id as the other user for display
          conversation_partner: otherUser,
          isUnread: isUnread, // Mark if this specific message is unread
          originalFromUserId: fromUserId, // Keep original for unread count calculation
          originalToUserId: toUserId
        });
      }
    });

    // Calculate unread counts for each conversation
    const recentMessages = Array.from(conversationMap.values()).map((msg) => {
      // Count unread messages for this conversation (only messages received by current user)
      const unreadCount = allMessages.filter((m) => {
        const mFromUserId = m.from_user_id?._id || m.from_user_id;
        const mToUserId = m.to_user_id?._id || m.to_user_id;
        const otherUserId = String(mFromUserId) === String(userId) ? String(mToUserId) : String(mFromUserId);
        const msgOtherUserId = msg.originalFromUserId === String(userId) ? String(msg.originalToUserId) : String(msg.originalFromUserId);
        
        return (
          String(otherUserId) === String(msgOtherUserId) &&
          String(mToUserId) === String(userId) && // Only messages received by current user
          !m.seen // Only unread messages
        );
      }).length;

      return {
        ...msg,
        unreadCount
      };
    });

    res.json({ success: true, messages: recentMessages });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Delete message
export const deleteMessage = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { messageId } = req.body;

    if (!messageId) {
      return res.json({ success: false, message: "Message ID is required" });
    }

    // Find the message
    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.json({ success: false, message: "Message not found" });
    }

    // Check if user is the sender (only sender can delete)
    if (String(message.from_user_id) !== String(userId)) {
      return res.json({ success: false, message: "You can only delete your own messages" });
    }

    // Delete the message
    await Message.findByIdAndDelete(messageId);

    res.json({ success: true, message: "Message deleted successfully" });

    // Notify the other user via SSE if connected
    if (connections[message.to_user_id]) {
      connections[message.to_user_id].write(
        `event: messageDeleted\ndata: ${JSON.stringify({ messageId })}\n\n`
      );
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};
