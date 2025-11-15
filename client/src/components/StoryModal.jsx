import { ArrowLeft, Sparkle, Upload, Music, Smile } from "lucide-react";
import React, { useState } from "react";
import EmojiPicker from "emoji-picker-react";
import toast from "react-hot-toast";
import { useAuth } from "@clerk/clerk-react"; // adjust path as needed
import api from "../api/axios.js";

const StoryModal = ({ setShowModal, fetchStories }) => {
  const bgColors = [
    "#4f46e5","#a2cb9eff","#46a0e5ff","#24c4b1ff",
    "#f1572dff","#000000ff","#c47ce1ff","#c8e041ff",
    "#e62d77ff","#4698e5c0"
  ];

  const [background, setBackground] = useState(bgColors[0]);
  const [text, setText] = useState("");
  const [media, setMedia] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [music, setMusic] = useState(null);
  const [musicUrl, setMusicUrl] = useState(null);
  const [mode, setMode] = useState("text");

  const { getToken } = useAuth();

  const MAX_VIDEO_DURATION = 60; // seconds
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

  const handleMediaUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith("video/")) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error("Video file size exceeds 50MB limit.");
        setMedia(null);
        setPreviewUrl(null);
        return;
      }
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        if (video.duration > MAX_VIDEO_DURATION) {
          toast.error(`Video duration exceeds ${MAX_VIDEO_DURATION}s limit.`);
          setMedia(null);
          setPreviewUrl(null);
        } else {
          setMedia(file);
          setPreviewUrl(URL.createObjectURL(file));
          setText("");
          setMode("media");
        }
      };
      video.src = URL.createObjectURL(file);
    } else if (file.type.startsWith("image/")) {
      setMedia(file);
      setPreviewUrl(URL.createObjectURL(file));
      setText("");
      setMode("media");
    } else {
      toast.error("Unsupported file type for media.");
    }
  };

  const handleMusicUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMusic(file);
    setMusicUrl(URL.createObjectURL(file));
  };

  const handleCreateStory = async () => {
    try {
      const media_type =
        mode === "media"
          ? (media?.type?.startsWith("image") ? "image" : "video")
          : "text";

      if (media_type === "text" && !text.trim()) {
        throw new Error("Please enter some text");
      }

      const formData = new FormData();
      formData.append("content", text);
      formData.append("media_type", media_type);
      formData.append("background_color", background);
      if (media) formData.append("media", media);
      if (music) formData.append("music", music);

      // If you use a token-provider getToken, get it:
      const token = getToken ? await getToken() : localStorage.getItem("token");

      const { data } = await api.post("/api/story/create", formData, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          "Content-Type": "multipart/form-data",
        },
      });

      if (data.success) {
        setShowModal(false);
        toast.success("Story created successfully");
        fetchStories?.();
      } else {
        toast.error(data.message || "Failed to create story");
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || err.message || "Error");
    }
  };

  const onEmojiClick = (emojiObject) => {
    setText((prev) => prev + emojiObject.emoji);
  };

  return (
    <div className="fixed inset-0 z-[110] min-h-screen bg-black/80 backdrop-blur text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-4 flex items-center justify-between">
          <button onClick={() => setShowModal(false)} className="text-white p-2">
            <ArrowLeft />
          </button>
          <h2 className="text-lg font-semibold">Create Story</h2>
          <span className="w-10" />
        </div>

        <div className="rounded-lg h-96 flex items-center justify-center relative overflow-hidden"
             style={{ backgroundColor: previewUrl ? "black" : background }}>
          {previewUrl ? (
            media?.type?.startsWith("image") ? (
              <img src={previewUrl} alt="" className="object-contain max-h-full w-full" />
            ) : (
              <video src={previewUrl} className="object-contain max-h-full w-full" controls />
            )
          ) : null}

          <textarea
            className="absolute inset-0 bg-transparent text-white w-full h-full p-6 text-lg resize-none focus:outline-none text-center"
            placeholder="Write something..."
            onChange={(e) => setText(e.target.value)}
            value={text}
          />

          <button type="button" onClick={() => setShowEmojiPicker(prev => !prev)}
                  className="absolute bottom-3 right-3 bg-black/40 p-2 rounded-full hover:bg-black/60">
            <Smile size={20} />
          </button>

          {showEmojiPicker && (
            <div className="absolute bottom-14 right-3 z-50">
              <EmojiPicker onEmojiClick={onEmojiClick} theme="dark" />
            </div>
          )}

          {musicUrl && <audio src={musicUrl} autoPlay loop />}
        </div>

        {!previewUrl && (
          <div className="flex mt-4 gap-2">
            {bgColors.map(color => (
              <button key={color}
                      className="w-6 h-6 rounded-full ring cursor-pointer"
                      style={{ backgroundColor: color }}
                      onClick={() => setBackground(color)} />
            ))}
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <label className="flex-1 flex items-center justify-center gap-2 p-2 rounded cursor-pointer bg-zinc-800">
            <input onChange={handleMediaUpload} type="file" accept="image/*,video/*" className="hidden" />
            <Upload size={18} /> Photo/Video
          </label>

          <label className="flex-1 flex items-center justify-center gap-2 p-2 rounded cursor-pointer bg-zinc-800">
            <input onChange={handleMusicUpload} type="file" accept="audio/*" className="hidden" />
            <Music size={18} /> Music
          </label>
        </div>

        <button onClick={() => toast.promise(handleCreateStory(), {
            loading: 'Saving...',
            success: 'Story created!',
            error: 'Failed to create story.'
          })}
          className="flex items-center justify-center gap-2 text-white py-3 mt-4 w-full rounded bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-95 transition">
          <Sparkle size={14} /> Create Story
        </button>
      </div>
    </div>
  );
};

export default StoryModal;
