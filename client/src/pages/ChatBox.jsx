import React, { useRef, useState, useEffect } from "react";
import {
  SendHorizonal,
  Image as ImageIcon,
  File as FileIcon,
  Music as MusicIcon,
  Mic,
  X,
  Check,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { useSelector } from "react-redux";
import api from "../api/axios";
import toast from "react-hot-toast";
import Loading from "../components/Loading";
import moment from "moment";

const ChatBox = () => {
  const { userId: otherUserId } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const currentUser = useSelector((state) => state.user.value);
  
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const messagesEndRef = useRef(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch messages function
  const fetchMessages = async () => {
    if (!otherUserId || !currentUser) return;
    
    try {
      const token = await getToken();
      const msgRes = await api.post(
        "/api/message/get",
        { to_user_id: otherUserId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (msgRes.data.success) {
        // Messages are already sorted oldest first from backend
        setMessages(msgRes.data.messages || []);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  // Fetch user profile and messages
  useEffect(() => {
    const fetchData = async () => {
      if (!otherUserId || !currentUser) return;
      
      try {
        const token = await getToken();
        
        // Fetch user profile
        const userRes = await api.post(
          "/api/user/profiles",
          { profileId: otherUserId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (userRes.data.success) {
          setUser(userRes.data.profile);
        }

        // Fetch messages
        await fetchMessages();
      } catch (error) {
        console.error("Error fetching chat data:", error);
        toast.error("Failed to load chat");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [otherUserId, currentUser, getToken, refreshKey]);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // ✅ Voice Recording (Browser MediaRecorder API)
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(blob);
        setRecording(false);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
    } catch (err) {
      console.error("Microphone access denied:", err);
      alert("Please allow microphone access.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) mediaRecorder.stop();
  };

  // Send message
  const sendMessage = async () => {
    if (!text.trim() && files.length === 0 && !audioBlob) return;
    if (!otherUserId) return;

    try {
      const token = await getToken();
      
      // Handle text message
      if (text.trim() && files.length === 0 && !audioBlob) {
        const { data } = await api.post(
          "/api/message/send",
          {
            to_user_id: otherUserId,
            text: text.trim(),
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (data.success && data.message) {
          // Backend already sends populated message with user data
          setMessages((prev) => [...prev, data.message]);
          setText("");
          toast.success("Message sent!");
          // Refresh messages to ensure consistency
          setTimeout(() => fetchMessages(), 500);
        }
      }
      // Handle file/image messages
      else if (files.length > 0) {
        for (const file of files) {
          const formData = new FormData();
          formData.append("to_user_id", otherUserId);
          formData.append("text", text || "");
          formData.append("image", file);

          const { data } = await api.post("/api/message/send", formData, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          });

          if (data.success && data.message) {
            // Backend already sends populated message with user data
            setMessages((prev) => [...prev, data.message]);
          }
        }
        setText("");
        setFiles([]);
        toast.success("Message sent!");
        // Refresh messages to ensure consistency
        setTimeout(() => fetchMessages(), 500);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  // Format time
  const formatTime = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Render message status ✅
  const renderStatus = (message) => {
    // Handle both populated (object) and unpopulated (string) from_user_id
    const fromUserId = message.from_user_id?._id || message.from_user_id;
    const isMyMessage = String(fromUserId) === String(currentUser?._id);
    
    if (!isMyMessage) return null;
    
    if (message.seen) {
      return (
        <div className="flex ml-1">
          <Check size={14} className="text-blue-500 -mr-1" />
          <Check size={14} className="text-blue-500" />
        </div>
      );
    }
    return (
      <div className="flex ml-1">
        <Check size={14} className="text-gray-400 -mr-1" />
        <Check size={14} className="text-gray-400" />
      </div>
    );
  };

  if (loading) return <Loading />;
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">User not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="flex items-center gap-2 p-2 md:px-10 xl:pl-42 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-300">
        <img
          src={user.profile_picture}
          alt={user.full_name}
          className="size-8 rounded-full"
        />
        <div>
          <p className="font-medium">{user.full_name}</p>
          <p className="text-sm text-gray-500 mt-1.5">@{user.username}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-5 md:px-10 overflow-y-scroll">
        <div className="space-y-4 max-w-4xl mx-auto">
          {messages.length > 0 ? (
            messages.map((message, index) => {
              // Handle both populated (object) and unpopulated (string) from_user_id
              const fromUserId = message.from_user_id?._id || message.from_user_id;
              const isMyMessage = String(fromUserId) === String(currentUser?._id);
              
              return (
                <div
                  key={message._id || index}
                  className={`flex flex-col ${
                    isMyMessage ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`p-2 text-sm max-w-sm bg-white text-slate-700 rounded-lg shadow ${
                      isMyMessage ? "bg-indigo-50" : "rounded-bl-none"
                    }`}
                  >
                    {message.message_type === "image" && message.media_url && (
                      <img
                        src={message.media_url}
                        className="w-full max-w-sm rounded-lg mb-2"
                        alt=""
                      />
                    )}
                    {message.message_type === "audio" && message.media_url && (
                      <audio
                        controls
                        src={message.media_url}
                        className="w-full my-2"
                      />
                    )}
                    {message.text && <p>{message.text}</p>}
                    <div className="flex justify-end items-center gap-1 text-xs text-gray-500 mt-1">
                      {formatTime(message.createdAt)}
                      {renderStatus(message)}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center text-gray-500 mt-10">
              <p>No messages yet. Start the conversation!</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* File Preview */}
      {files.length > 0 && (
        <div className="px-5 flex gap-3 overflow-x-auto pb-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="relative flex flex-col items-center border border-gray-300 rounded-lg p-2 bg-white"
            >
              {file.type.startsWith("image/") ? (
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="h-16 w-16 object-cover rounded"
                />
              ) : file.type.startsWith("audio/") ? (
                <MusicIcon className="text-indigo-500 size-8" />
              ) : (
                <FileIcon className="text-gray-500 size-8" />
              )}
              <p className="text-xs mt-1 w-16 truncate text-gray-600">
                {file.name}
              </p>
              <button
                onClick={() => removeFile(index)}
                className="absolute top-0 right-0 bg-gray-200 hover:bg-gray-300 rounded-full p-0.5"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Audio Preview (Voice Message) */}
      {audioBlob && (
        <div className="px-5 pb-2 flex items-center gap-3">
          <audio
            controls
            src={URL.createObjectURL(audioBlob)}
            className="flex-1"
          />
          <button
            onClick={() => setAudioBlob(null)}
            className="bg-gray-200 hover:bg-gray-300 rounded-full p-1"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Input Section */}
      <div className="px-4">
        <div className="flex items-center gap-3 pl-5 p-1.5 bg-white w-full max-w-xl mx-auto border border-gray-200 shadow rounded-full mb-5">
          <input
            type="text"
            className="flex-1 outline-none text-slate-700"
            placeholder="Type a message..."
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            onChange={(e) => setText(e.target.value)}
            value={text}
          />

          {/* File Upload */}
          <label htmlFor="files" className="cursor-pointer">
            <ImageIcon className="size-7 text-gray-400 hover:text-gray-600" />
            <input
              type="file"
              id="files"
              multiple
              accept="image/*,audio/*,.pdf,.doc,.docx,.txt"
              hidden
              onChange={handleFileChange}
            />
          </label>

          {/* Voice Record Button */}
          {!recording ? (
            <button
              onClick={startRecording}
              className="text-gray-500 hover:text-indigo-600"
              title="Start recording"
            >
              <Mic size={20} />
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="text-red-500 animate-pulse"
              title="Stop recording"
            >
              <Mic size={20} />
            </button>
          )}

          {/* Send */}
          <button
            onClick={sendMessage}
            className="bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-700 hover:to-purple-800 active:scale-95 text-white p-2 rounded-full"
          >
            <SendHorizonal size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
