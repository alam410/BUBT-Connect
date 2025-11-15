import React, { useState, useRef, useEffect } from "react";
import {
  BadgeCheck,
  X,
  Send,
  ThumbsUp,
  Heart,
  Smile,
  Lightbulb,
  Pause,
  Play,
} from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios";
import toast from "react-hot-toast";

const StoryViewer = ({ viewStory, setViewStory }) => {
  const { getToken } = useAuth();
  const [message, setMessage] = useState("");
  const [reaction, setReaction] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef(null);
  

  if (!viewStory) return null;

  const handleClose = () => setViewStory(null);

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    try {
      const token = await getToken();
      await api.post(
        "/api/message/send",
        {
          to_user_id: viewStory.user?._id || viewStory.user,
          text: message,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Message sent!");
      setMessage("");
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 2000);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  const handleReaction = async (type) => {
    setReaction(type);
    // Story reactions can be stored locally or sent to backend
    // For now, just show visual feedback
    toast.success(`Reacted with ${type}!`);
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  useEffect(() => {
    let progressInterval;

    if (viewStory && viewStory.media_type !== "video") {
      setProgress(0);

      const duration = 10000; // total duration in ms
      const interval = 100; // update interval
      let elapsed = 0;

      progressInterval = setInterval(() => {
        elapsed += interval;
        const newProgress = (elapsed / duration) * 100;

        if (newProgress >= 100) {
          setProgress(100);
          clearInterval(progressInterval);
          setTimeout(() => setViewStory(null), 300); // add small delay for smooth exit
        } else {
          setProgress(newProgress);
        }
      }, interval);
    }

    setIsPlaying(true);
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }

    return () => clearInterval(progressInterval); // clean up when unmounting or switching story
  }, [viewStory]);


  const renderContent = () => {
    switch (viewStory.media_type) {
      case "image":
        return (
          <img
            src={viewStory.media_url}
            alt=""
            className="max-w-full max-h-screen object-contain"
          />
        );

      case "video":
        return (
          <div className="relative flex items-center justify-center w-full h-full">
            <video
              ref={videoRef}
              src={viewStory.media_url}
              className="max-h-[85vh] max-w-full rounded-md"
              autoPlay
              muted
              onEnded={() => setViewStory(null)}
            />
          {/* Pause/Play Button (Centered) */}
          <button
            onClick={togglePlayPause}
            className="absolute inset-0 flex items-center justify-center z-20"
          >
            <div className="bg-black/60 hover:bg-black/80 text-white p-4 rounded-full transition shadow-lg">
              {isPlaying ? <Pause size={28} /> : <Play size={28} />}
            </div>
          </button>
          </div>
        );

      case "text":
        return (
          <div className="w-full h-full flex items-center justify-center p-8 text-white text-2xl text-center">
            {viewStory.content}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="fixed inset-0 h-screen bg-black bg-opacity-90 z-50 flex flex-col items-center justify-center"
      style={{
        backgroundColor:
          viewStory.media_type === "text"
            ? viewStory.background_color
            : "#000000",
      }}
    >
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gray-700">
        <div
          className="h-full bg-white transition-all duration-100 linear"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* User Info */}
      <div className="absolute top-4 left-4 flex items-center space-x-3 p-2 px-4 sm:p-4 sm:px-8 backdrop-blur-2xl rounded bg-black/50">
        <img
          src={viewStory.user?.profile_picture}
          alt=""
          className="size-7 sm:size-8 rounded-full object-cover border border-white"
        />
        <div className="text-white font-medium flex items-center gap-1.5">
          <span>{viewStory.user?.full_name}</span>
          <BadgeCheck size={18} />
        </div>
      </div>

      {/* Close Button */}
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 text-white text-3xl font-bold focus:outline-none"
      >
        <X className="w-8 h-8 hover:scale-110 transition cursor-pointer" />
      </button>

      {/* Main Content */}
      <div className="max-w-[90vw] max-h-[85vh] flex items-center justify-center relative">
        {renderContent()}
      </div>

      {/* Reaction Bar */}
      <div className="absolute bottom-20 flex space-x-6 bg-black/40 p-3 rounded-2xl backdrop-blur-md z-30">
        <button
          onClick={() => handleReaction("like")}
          className={`transition transform hover:scale-125 ${
            reaction === "like" ? "text-blue-400" : "text-white"
          }`}
        >
          <ThumbsUp size={26} />
        </button>

        <button
          onClick={() => handleReaction("love")}
          className={`transition transform hover:scale-125 ${
            reaction === "love" ? "text-pink-400" : "text-white"
          }`}
        >
          <Heart size={26} />
        </button>

        <button
          onClick={() => handleReaction("insightful")}
          className={`transition transform hover:scale-125 ${
            reaction === "insightful" ? "text-yellow-300" : "text-white"
          }`}
        >
          <Lightbulb size={26} />
        </button>

        <button
          onClick={() => handleReaction("funny")}
          className={`transition transform hover:scale-125 ${
            reaction === "funny" ? "text-green-400" : "text-white"
          }`}
        >
          <Smile size={26} />
        </button>
      </div>

      {/* Send Message Box */}
      <div className="absolute bottom-4 flex items-center w-[90%] max-w-md bg-black/40 backdrop-blur-md rounded-full px-4 py-2 text-white z-30">
        <input
          type="text"
          placeholder="Send message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="bg-transparent flex-1 outline-none text-sm sm:text-base placeholder-gray-300"
        />
        <button
          onClick={handleSendMessage}
          className="text-white hover:text-blue-400 transition"
        >
          <Send size={22} />
        </button>
      </div>

      {/* Message Sent Popup */}
      {showPopup && (
        <div className="absolute bottom-24 bg-white/10 text-white px-4 py-2 rounded-full text-sm backdrop-blur-md animate-fadeInOut z-40">
          Message sent ✅
        </div>
      )}
    </div>
  );
};

export default StoryViewer;
