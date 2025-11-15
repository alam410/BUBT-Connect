import React, { useState } from "react";
import { X, Image as ImageIcon } from "lucide-react";
import toast from "react-hot-toast";
import { useUser, useAuth } from "@clerk/clerk-react";
import api from "../api/axios.js"; // adjust path if needed

const CreatePost = () => {
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const { user } = useUser();
  const { getToken } = useAuth();

  const username =
    user?.username ||
    user?.primaryEmailAddress?.emailAddress?.split("@")[0] ||
    "user";

  const handleSubmit = async () => {
    if (!content.trim() && images.length === 0) {
      toast.error("Please add text or at least one image.");
      return;
    }

    setLoading(true);

    // Determine post type
    let postType;
    if (images.length > 0 && content) postType = "text_with_image";
    else if (images.length > 0) postType = "image";
    else postType = "text";

    const formData = new FormData();
    formData.append("content", content);
    formData.append("post_type", postType);
    images.forEach((img) => formData.append("images", img));

    try {
      const token = await getToken();
      const { data } = await api.post("/api/post/add", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (data.success) {
        toast.success("✅ Post Added Successfully!");
        setContent("");
        setImages([]);
      } else {
        toast.error(data.message || "Something went wrong!");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Post upload failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages((prev) => [...prev, ...files]);
  };

  const handleRemoveImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-6xl mx-auto p-6">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            📋 Create Post
          </h1>
          <p className="text-slate-600">Share your thoughts with the world</p>
        </div>

        {/* Form */}
        <div className="max-w-xl bg-white p-6 rounded-xl shadow-md space-y-4">
          {/* Header */}
          <div className="flex items-center space-x-4">
            <img
              src={user.imageUrl}
              alt={user.fullName || "Profile"}
              className="w-12 h-12 rounded-full shadow"
            />
            <div>
              <h2 className="font-semibold">{user.fullName}</h2>
              <p className="text-sm text-gray-500">@{username}</p>
            </div>
          </div>

          {/* Textarea */}
          <textarea
            className="w-full resize-none min-h-[100px] mt-4 text-sm border border-gray-200 rounded-md p-3 focus:ring-2 focus:ring-indigo-500 outline-none placeholder-gray-400"
            placeholder="What's happening?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          {/* Image Preview */}
          {images.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {images.map((image, i) => (
                <div key={i} className="relative group">
                  <img
                    src={URL.createObjectURL(image)}
                    className="h-24 w-24 object-cover rounded-md"
                    alt=""
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(i)}
                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Bottom Bar */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-200">
            <label
              htmlFor="images"
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 cursor-pointer"
            >
              <ImageIcon className="size-6" />
              Add Image
            </label>

            <input
              type="file"
              id="images"
              accept="image/*"
              hidden
              multiple
              onChange={handleImageChange}
            />

            <button
              disabled={loading}
              onClick={() =>
                toast.promise(handleSubmit(), {
                  loading: "Uploading...",
                  success: "✅ Uploaded successfully!",
                  error: "❌ Upload failed.",
                })
              }
              className={`text-sm bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-95 transition text-white font-medium px-8 py-2 rounded-md ${
                loading ? "opacity-70 cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              {loading ? "Publishing..." : "Publish Post"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
