import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    email: { type: String, required: true },
    full_name: { type: String, required: true },
    username: { type: String, unique: true, required: true },
    bio: { type: String, default: "Hey there! I am using BUBT_connect." },
    profile_picture: { type: String, default: "" },
    cover_photo: { type: String, default: "" },
    location: { type: String, default: "" },
    
    // --- Model Relationships ---
    followers: [{ type: String, ref: "User" }],
    following: [{ type: String, ref: "User" }],
    connections: [{ type: String, ref: "User" }],

  
    posts: [{ type: String, ref: "Post", default: [] }],


    stories: [{ type: String, ref: "Story", default: [] }],
    
    is_verified: { type: Boolean, default: false },
    graduation_year: { type: Number, default: null },
    current_work: { type: String, default: "" },
    department: { type: String, default: "" },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    minimize: false,
  }
);

const User = mongoose.model("User", userSchema);

export default User;