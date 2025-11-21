import imagekit from "../configs/imageKit.js";
import { inngest } from "../inngest/index.js";
import Connection from "../models/Connection.js";
import Post from "../models/Post.js";
import User from "../models/user.js";
import fs from "fs";

/* -------------------------
   other controllers (unchanged)
   ------------------------- */

/* Get User Data */
export const getUserData = async (req, res) => {
  try {
    const { userId } = await req.auth();
    if (!userId) return res.json({ success: false, message: "Not authenticated" });
    const user = await User.findById(userId);
    if (!user) return res.json({ success: false, message: "User not found" });
    res.json({ success: true, user });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

/* Update User Data */
export const updateUserData = async (req, res) => {
  try {
    const { userId } = await req.auth(); // use await, consistent with getUserData
    let { username, bio, location, full_name, 
      graduation_year,
      current_work,
      department } = req.body || {}; // safe fallback

    const tempUser = await User.findById(userId);
    if (!tempUser) return res.json({ success: false, message: "User not found" });

    if (!username) username = tempUser.username;

    if (tempUser.username !== username) {
      const userExists = await User.findOne({ username });
      if (userExists) username = tempUser.username;
    }

    const updatedData = { username, bio, location, full_name, graduation_year, current_work, department };

    const profile = req.files?.profile?.[0];
    const cover = req.files?.cover?.[0];

    if (profile) {
      const buffer = fs.readFileSync(profile.path);
      const response = await imagekit.upload({
        file: buffer,
        fileName: profile.originalname,
      });

      const url = imagekit.url({
        path: response.filePath,
        transformation: [
          { quality: "auto" },
          { format: "webp" },
          { width: "512" },
        ],
      });

      updatedData.profile_picture = url;
    }

    if (cover) {
      const buffer = fs.readFileSync(cover.path);
      const response = await imagekit.upload({
        file: buffer,
        fileName: cover.originalname, // was profile.originalname before
      });

      const url = imagekit.url({
        path: response.filePath,
        transformation: [
          { quality: "auto" },
          { format: "webp" },
          { width: "1280" },
        ],
      });

      updatedData.cover_photo = url;
    }

    const user = await User.findByIdAndUpdate(userId, updatedData, { new: true });
    res.json({ success: true, user, message: "Profile updated successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

/* Discover users */
export const discoverUsers = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const { input } = req.body || {};
    const allUsers = await User.find({
      $or: [
        { username: new RegExp(input || "", "i") },
        { email: new RegExp(input || "", "i") },
        { full_name: new RegExp(input || "", "i") },
        { location: new RegExp(input || "", "i") },
        { department: new RegExp(input || "", "i") },
      ],
    });
    const filteredUsers = allUsers.filter((user) => user._id.toString() !== userId);
    res.json({ success: true, users: filteredUsers });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

/* Follow */
export const followUser = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const { id } = req.body || {};
    const user = await User.findById(userId);
    if (!user) return res.json({ success: false, message: "User not found" });

    if (user.following.includes(id)) {
      return res.json({ success: false, message: "You are already following this user" });
    }

    user.following.push(id);
    await user.save();

    const toUser = await User.findById(id);
    toUser.followers.push(userId);
    await toUser.save();

    res.json({ success: true, message: "Now you are following this user" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

/* Unfollow */
export const unfollowUser = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const { id } = req.body || {};

    const user = await User.findById(userId);
    user.following = user.following.filter((user) => user !== id);
    await user.save();

    const toUser = await User.findById(id);
    toUser.followers = toUser.followers.filter((user) => user !== userId);
    await toUser.save();

    res.json({ success: true, message: "You are no longer following this user" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

/* Send Connection Request */
export const sendConnectionRequest = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const { id } = req.body || {};

    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const connectionRequests = await Connection.find({
      from_user_id: userId,
      createdAt: { $gt: last24Hours },
    });

    if (connectionRequests.length >= 20) {
      return res.json({
        success: false,
        message: "You have sent more than 20 connection requests in the last 24 hours",
      });
    }

    const connection = await Connection.findOne({
      $or: [
        { from_user_id: userId, to_user_id: id },
        { from_user_id: id, to_user_id: userId },
      ],
    });

    if (!connection) {
      const newConnection = await Connection.create({
        from_user_id: userId,
        to_user_id: id,
      });

      await inngest.send({
        name: "app/connection-request",
        data: { connectionId: newConnection._id },
      });

      return res.json({ success: true, message: "Connection request sent successfully" });
    } else if (connection.status === "accepted") {
      return res.json({ success: false, message: "You are already connected with this user" });
    } else {
      return res.json({ success: false, message: "Connection request is already pending" });
    }
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

/* Get User Connections */
export const getUserConnections = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const user = await User.findById(userId)
      .populate("connections", "full_name username profile_picture bio location graduation_year current_work department")
      .populate("followers", "full_name username profile_picture bio location graduation_year current_work department")
      .populate("following", "full_name username profile_picture bio location graduation_year current_work department");

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    // Get incoming pending connections (where current user is recipient)
    const incomingPendingData = await Connection.find({
      to_user_id: userId,
      status: "pending",
    }).populate("from_user_id", "full_name username profile_picture bio location graduation_year current_work department");

    const incomingPending = incomingPendingData
      .map((conn) => conn.from_user_id)
      .filter((user) => user !== null); // Filter out any null values

    // Get outgoing pending connections (where current user is sender)
    const outgoingPendingData = await Connection.find({
      from_user_id: userId,
      status: "pending",
    }).populate("to_user_id", "full_name username profile_picture bio location graduation_year current_work department");

    const outgoingPending = outgoingPendingData
      .map((conn) => conn.to_user_id)
      .filter((user) => user !== null); // Filter out any null values

    res.json({
      success: true,
      connections: user.connections || [],
      followers: user.followers || [],
      following: user.following || [],
      pendingConnections: incomingPending || [],
      sentPendingConnections: outgoingPending || [], // New field for outgoing pending connections
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

/* Accept Connection Request - bugfix: use toUser.save() not to.save() */
export const acceptConnectionRequest = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const { id } = req.body || {};

    const connection = await Connection.findOne({
      from_user_id: id,
      to_user_id: userId,
    });

    if (!connection) return res.json({ success: false, message: "Connection not found" });

    const user = await User.findById(userId);
    user.connections.push(id);
    await user.save();

    const toUser = await User.findById(id);
    toUser.connections.push(userId);
    await toUser.save(); // fixed here

    connection.status = "accepted";
    await connection.save();

    res.json({ success: true, message: "Connection accepted successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

/* Reject Connection Request */
export const rejectConnectionRequest = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const { id } = req.body || {};

    const connection = await Connection.findOne({
      from_user_id: id,
      to_user_id: userId,
      status: "pending",
    });

    if (!connection) {
      return res.json({ success: false, message: "Connection request not found" });
    }

    // Delete the connection request
    await Connection.findByIdAndDelete(connection._id);

    res.json({ success: true, message: "Connection request rejected" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

/* Cancel Connection Request (for outgoing requests) */
export const cancelConnectionRequest = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const { id } = req.body || {};

    const connection = await Connection.findOne({
      from_user_id: userId,
      to_user_id: id,
      status: "pending",
    });

    if (!connection) {
      return res.json({ success: false, message: "Connection request not found" });
    }

    // Delete the connection request
    await Connection.findByIdAndDelete(connection._id);

    res.json({ success: true, message: "Connection request cancelled" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

/* Disconnect from User (Remove Connection) */
export const disconnectUser = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const { id } = req.body || {};

    if (!id) {
      return res.json({ success: false, message: "User ID is required" });
    }

    // Find the accepted connection
    const connection = await Connection.findOne({
      $or: [
        { from_user_id: userId, to_user_id: id, status: "accepted" },
        { from_user_id: id, to_user_id: userId, status: "accepted" },
      ],
    });

    if (!connection) {
      return res.json({ success: false, message: "Connection not found" });
    }

    // Remove from both users' connections arrays
    const currentUser = await User.findById(userId);
    const otherUser = await User.findById(id);

    if (currentUser) {
      currentUser.connections = currentUser.connections.filter(
        (connId) => String(connId) !== String(id)
      );
      await currentUser.save();
    }

    if (otherUser) {
      otherUser.connections = otherUser.connections.filter(
        (connId) => String(connId) !== String(userId)
      );
      await otherUser.save();
    }

    // Delete the connection document
    await Connection.findByIdAndDelete(connection._id);

    res.json({ success: true, message: "Disconnected successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

/* Get User Profiles */
export const getUserProfiles = async (req, res) => {
  try {
    const { profileId } = req.body || {};
    const { userId } = req.auth(); // Get current user ID for reaction checking
    
    const profile = await User.findById(profileId);
    if (!profile) return res.json({ success: false, message: "Profile not found" });

    const posts = await Post.find({ user: profileId })
      .populate("user", "full_name username profile_picture")
      .populate({
        path: "comments",
        populate: { path: "user", select: "full_name username profile_picture" },
        options: { sort: { createdAt: -1 }, limit: 3 }, // Get latest 3 comments
      })
      .sort({ createdAt: -1 })
      .lean(); // Convert to plain JS objects

    // Calculate reaction counts and user reactions (same as getFeedPosts)
    const formattedPosts = posts.map((post) => {
      const reactions = post.reactions || {};

      // Count total per reaction type
      const counts = Object.fromEntries(
        Object.entries(reactions).map(([type, arr]) => [type, arr.length])
      );

      // Find which reaction current user gave (if any)
      const userReaction =
        Object.entries(reactions).find(([type, arr]) =>
          arr.some((id) => String(id) === String(userId))
        )?.[0] || null;

      return {
        ...post,
        reactionCounts: counts,
        userReaction,
        commentCount: post.comments?.length || 0,
      };
    });

    return res.json({ success: true, profile, posts: formattedPosts });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

/* -------------------------
   The FIXED getOrCreateUser
   ------------------------- */
export const getOrCreateUser = async (req, res) => {
  try {
    // Debugging: log the incoming body
    console.log("Incoming /get-or-create-user body:", req.body);

    // Guard against missing body
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: "Request body missing or not JSON. Make sure Content-Type: application/json header is set.",
      });
    }

    // safe destructuring
    const {
      id: clerkId, // Renaming 'id' from Clerk to 'clerkId'
      email_addresses,
      primary_email_address_id,
      first_name,
      last_name,
      image_url,
      username: clerkUsername,
    } = req.body;

    // Validate required data
    if (!clerkId || !email_addresses || !Array.isArray(email_addresses)) {
      return res.status(400).json({ success: false, message: "Invalid user data" });
    }

    // 1. Find by clerkId
    //    We check both _id and clerkId to be safe, but _id should be the primary key.
    let user = await User.findOne({ _id: clerkId });
    if (user) return res.status(200).json({ success: true, user });

    // 2. Determine primary email
    const primaryEmail =
      (email_addresses.find((e) => e.id === primary_email_address_id)?.email_address) ||
      (email_addresses[0]?.email_address) ||
      "no-email@example.com"; // Fallback email

    // 3. Build username fallback
    const newUsername =
      clerkUsername || primaryEmail.split("@")[0] || `user_${String(clerkId).slice(-6)}`;

    // 4. Create user
    //
    //    vvv --- THIS IS THE FIX --- vvv
    //    You must provide the '_id' field as your schema requires it.
    //
    user = new User({
      _id: clerkId, // <-- ADD THIS LINE
      clerkId: clerkId, // <-- Include this if your schema *also* has a clerkId field
      full_name: `${first_name || ""} ${last_name || ""}`.trim(),
      username: newUsername,
      email: primaryEmail,
      profile_picture: image_url || "",
      bio: "",
      location: "",
      graduation_year: null,
      current_work: "",
      cover_photo: "",
      connections: [],
      followers: [],
      following: [],
    });

    await user.save();

    return res.status(201).json({ success: true, user });
  } catch (error) {
    console.error("Error in getOrCreateUser:", error);
    
    // Send back more specific validation error if available
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message, details: error.errors });
    }
    
    return res.status(500).json({ success: false, message: error.message });
  }
};