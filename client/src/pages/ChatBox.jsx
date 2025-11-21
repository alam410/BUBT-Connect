import React, { useRef, useState, useEffect } from "react";
import {
  SendHorizonal,
  Image as ImageIcon,
  File as FileIcon,
  Music as MusicIcon,
  Mic,
  X,
  Check,
  Play,
  Pause,
  Trash2,
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
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const audioRefs = useRef({});

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
    if (mediaRecorder) {
      mediaRecorder.stop();
      // Stop all tracks to release microphone
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
  };

  // Delete message
  const deleteMessage = async (messageId) => {
    if (!messageId) return;
    
    // Confirm deletion
    if (!window.confirm("Are you sure you want to delete this message?")) {
      return;
    }

    try {
      const token = await getToken();
      const { data } = await api.post(
        "/api/message/delete",
        { messageId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        // Remove message from local state
        setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
        toast.success("Message deleted");
      } else {
        toast.error(data.message || "Failed to delete message");
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Failed to delete message");
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!text.trim() && files.length === 0 && !audioBlob) return;
    if (!otherUserId) return;

    try {
      const token = await getToken();
      
      // Handle voice message (audio)
      if (audioBlob) {
        const formData = new FormData();
        formData.append("to_user_id", otherUserId);
        formData.append("text", text || "");
        // Convert blob to file
        const audioFile = new File([audioBlob], `voice-${Date.now()}.webm`, {
          type: "audio/webm",
        });
        formData.append("file", audioFile);

        const { data } = await api.post("/api/message/send", formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });

        if (data.success && data.message) {
          setMessages((prev) => [...prev, data.message]);
          setText("");
          setAudioBlob(null);
          toast.success("Voice message sent!");
          setTimeout(() => fetchMessages(), 500);
        }
        return;
      }
      
      // Handle text message
      if (text.trim() && files.length === 0) {
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
          setMessages((prev) => [...prev, data.message]);
          setText("");
          toast.success("Message sent!");
          setTimeout(() => fetchMessages(), 500);
        }
        return;
      }
      
      // Handle file/image messages
      if (files.length > 0) {
        for (const file of files) {
          const formData = new FormData();
          formData.append("to_user_id", otherUserId);
          formData.append("text", text || "");
          formData.append("file", file);

          const { data } = await api.post("/api/message/send", formData, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          });

          if (data.success && data.message) {
            setMessages((prev) => [...prev, data.message]);
          }
        }
        setText("");
        setFiles([]);
        toast.success("Message sent!");
        setTimeout(() => fetchMessages(), 500);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  // Audio Player Component
  const AudioPlayer = ({ messageId, audioUrl, isMyMessage, playingAudioId, setPlayingAudioId, audioRefs }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [hasError, setHasError] = useState(false);
    const audioRef = useRef(null);

    // Use callback ref to ensure ref is set properly
    const setAudioRef = (element) => {
      audioRef.current = element;
      if (element) {
        audioRefs.current[messageId] = element;
      } else {
        delete audioRefs.current[messageId];
      }
    };

    useEffect(() => {
      const audio = audioRef.current;
      if (!audio || !audioUrl) return;

      console.log("AudioPlayer - Setting up audio:", { messageId, audioUrl });

      // Set src when audioUrl changes
      if (audio.src !== audioUrl) {
        console.log("AudioPlayer - Setting audio src to:", audioUrl);
        audio.src = audioUrl;
        setHasError(false);
        
        // Test URL accessibility - try to fetch it
        // This will help detect 400/404 errors early
        fetch(audioUrl, { method: 'HEAD', mode: 'no-cors' })
          .then(() => {
            // In no-cors mode, we can't read the response, but the request is made
            console.log("AudioPlayer - URL test request sent (check Network tab for status)");
          })
          .catch((err) => {
            console.warn("AudioPlayer - URL fetch test error:", err);
            // This is expected in no-cors mode, but check Network tab for actual status
          });
        
        // Also check if URL looks like it might be from old format
        // Old format might have issues, so we'll monitor for errors
        console.log("AudioPlayer - Monitoring audio element for errors...");
      }
      
      // Monitor audio state to catch silent failures
      let loadTimeout;
      const stateCheckInterval = setInterval(() => {
        // Check for errors
        if (audio.error) {
          console.error("AudioPlayer - Audio error detected:", {
            code: audio.error.code,
            message: audio.error.message,
            networkState: audio.networkState,
            readyState: audio.readyState,
            src: audio.src
          });
          if (!hasError) {
            clearInterval(stateCheckInterval);
            clearTimeout(loadTimeout);
            handleError({ target: audio });
          }
        } 
        // Check if stuck loading
        else if (audio.networkState === 3) { // NETWORK_NO_SOURCE
          console.error("AudioPlayer - Network state: NO_SOURCE");
          if (!hasError && isLoading) {
            clearInterval(stateCheckInterval);
            clearTimeout(loadTimeout);
            setIsLoading(false);
            setHasError(true);
            toast.error("Audio file not found or inaccessible");
          }
        } 
        // Check if stuck in loading state for too long
        else if (audio.readyState === 0 && audio.networkState === 2 && isLoading) {
          // EMPTY and LOADING - might be stuck
          console.warn("AudioPlayer - Audio appears stuck in loading state");
          // Set a timeout - if still loading after 5 seconds, show error
          if (!loadTimeout) {
            loadTimeout = setTimeout(() => {
              if (audio.readyState === 0 && !hasError) {
                console.error("AudioPlayer - Loading timeout - file likely inaccessible");
                clearInterval(stateCheckInterval);
                setIsLoading(false);
                setHasError(true);
                toast.error("Audio file failed to load. It may be unavailable.");
              }
            }, 5000);
          }
        }
        // If loaded successfully, clear timeout
        else if (audio.readyState > 0) {
          if (loadTimeout) {
            clearTimeout(loadTimeout);
            loadTimeout = null;
          }
        }
      }, 1000);

      const updateTime = () => setCurrentTime(audio.currentTime);
      const updateDuration = () => {
        if (audio.duration && !isNaN(audio.duration)) {
          setDuration(audio.duration);
          setIsLoading(false);
          console.log("AudioPlayer - Duration loaded:", audio.duration);
        }
      };
      const handleEnded = () => {
        setIsPlaying(false);
        setPlayingAudioId(null);
        setCurrentTime(0);
      };
      const handlePlay = () => {
        setIsPlaying(true);
        setPlayingAudioId(messageId);
        console.log("AudioPlayer - Started playing");
      };
      const handlePause = () => {
        setIsPlaying(false);
        if (playingAudioId === messageId) {
          setPlayingAudioId(null);
        }
      };
      const handleLoadStart = () => {
        setIsLoading(true);
        setHasError(false);
        console.log("AudioPlayer - Loading started");
      };
      const handleCanPlay = () => {
        setIsLoading(false);
        setHasError(false);
        console.log("AudioPlayer - Can play");
      };
      const handleLoadedMetadata = () => {
        updateDuration();
        console.log("AudioPlayer - Metadata loaded");
      };
      const handleError = (e) => {
        const audio = e.target;
        setHasError(true);
        setIsLoading(false);
        setIsPlaying(false);
        
        const errorDetails = {
          error: e,
          src: audio.src,
          networkState: audio.networkState,
          errorCode: audio.error?.code,
          errorMessage: audio.error?.message,
          readyState: audio.readyState,
          url: audioUrl
        };
        
        console.error("AudioPlayer - Error:", errorDetails);
        
        // Provide more specific error messages
        if (audio.error) {
          switch (audio.error.code) {
            case audio.error.MEDIA_ERR_ABORTED:
              toast.error("Audio playback was aborted");
              break;
            case audio.error.MEDIA_ERR_NETWORK:
              toast.error("Network error loading audio. The file may not be accessible.");
              break;
            case audio.error.MEDIA_ERR_DECODE:
              toast.error("Audio format not supported or file is corrupted");
              break;
            case audio.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
              toast.error("Audio format not supported by your browser. WebM may not be supported.");
              break;
            default:
              toast.error("Failed to play audio message. The file may be unavailable.");
          }
        } else {
          toast.error("Failed to play audio message");
        }
      };

      audio.addEventListener("timeupdate", updateTime);
      audio.addEventListener("loadedmetadata", handleLoadedMetadata);
      audio.addEventListener("ended", handleEnded);
      audio.addEventListener("play", handlePlay);
      audio.addEventListener("pause", handlePause);
      audio.addEventListener("loadstart", handleLoadStart);
      audio.addEventListener("canplay", handleCanPlay);
      audio.addEventListener("error", handleError);

      return () => {
        clearInterval(stateCheckInterval);
        if (loadTimeout) clearTimeout(loadTimeout);
        audio.removeEventListener("timeupdate", updateTime);
        audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
        audio.removeEventListener("ended", handleEnded);
        audio.removeEventListener("play", handlePlay);
        audio.removeEventListener("pause", handlePause);
        audio.removeEventListener("loadstart", handleLoadStart);
        audio.removeEventListener("canplay", handleCanPlay);
        audio.removeEventListener("error", handleError);
      };
    }, [messageId, playingAudioId, setPlayingAudioId, audioUrl, hasError, isLoading]);

    // Pause this audio if another one starts playing
    useEffect(() => {
      if (playingAudioId && playingAudioId !== messageId && isPlaying) {
        const audio = audioRef.current;
        if (audio) {
          audio.pause();
          setIsPlaying(false);
        }
      }
    }, [playingAudioId, messageId, isPlaying]);

    const togglePlayPause = async () => {
      console.log("AudioPlayer - togglePlayPause called", { messageId, audioUrl, isPlaying, isLoading, hasError });
      
      const audio = audioRef.current;
      if (!audio) {
        console.error("AudioPlayer - Audio element not found");
        toast.error("Audio player not ready");
        return;
      }

      if (!audioUrl) {
        console.error("AudioPlayer - Audio URL is missing");
        toast.error("Audio file not available");
        return;
      }

      // If there's an error, don't try to play
      if (hasError) {
        console.log("AudioPlayer - Has error, cannot play");
        toast.error("This audio file is unavailable. Please send a new message.");
        return;
      }

      console.log("AudioPlayer - Toggle play/pause clicked:", { 
        messageId, 
        audioUrl, 
        isPlaying, 
        readyState: audio.readyState,
        networkState: audio.networkState 
      });

      // Validate URL format
      try {
        new URL(audioUrl);
      } catch (e) {
        console.error("AudioPlayer - Invalid audio URL:", audioUrl);
        toast.error("Invalid audio file URL");
        return;
      }

      // Test if URL is accessible (this will show CORS errors but that's OK)
      try {
        const response = await fetch(audioUrl, { method: 'HEAD', mode: 'no-cors' });
        console.log("AudioPlayer - URL test initiated (no-cors mode)");
        // In no-cors mode, we can't read the response, but the request will still show in network tab
      } catch (fetchError) {
        console.warn("AudioPlayer - URL test error (expected):", fetchError);
        // Continue anyway - CORS errors are expected but file might still be accessible
      }
      
      // Log current audio state
      console.log("AudioPlayer - Current audio state:", {
        readyState: audio.readyState,
        networkState: audio.networkState,
        error: audio.error,
        src: audio.src,
        paused: audio.paused
      });

      try {
        // Pause any other playing audio
        Object.keys(audioRefs.current).forEach((id) => {
          if (id !== messageId && audioRefs.current[id]) {
            audioRefs.current[id].pause();
          }
        });

        if (isPlaying) {
          audio.pause();
          console.log("AudioPlayer - Paused");
        } else {
          setIsLoading(true);
          setHasError(false);
          
          // Ensure src is set correctly
          if (audio.src !== audioUrl) {
            console.log("AudioPlayer - Setting src before play");
            audio.src = audioUrl;
          }
          
          // Load the audio
          audio.load();
          console.log("AudioPlayer - Loading audio, readyState:", audio.readyState);
          
          // Check if already ready
          if (audio.readyState >= 3) {
            console.log("AudioPlayer - Already ready, readyState:", audio.readyState);
            setIsLoading(false);
          } else {
            // Wait for audio to load with better error handling
            try {
              await new Promise((resolve, reject) => {
                let resolved = false;
                
                const handleCanPlay = () => {
                  if (resolved) return;
                  resolved = true;
                  cleanup();
                  setIsLoading(false);
                  console.log("AudioPlayer - Can play, ready to start");
                  resolve();
                };
                
                const handleLoadError = (e) => {
                  if (resolved) return;
                  resolved = true;
                  cleanup();
                  setIsLoading(false);
                  setHasError(true);
                  console.error("AudioPlayer - Load error:", e, {
                    error: audio.error,
                    networkState: audio.networkState,
                    readyState: audio.readyState
                  });
                  reject(new Error("Failed to load audio file"));
                };
                
                const cleanup = () => {
                  audio.removeEventListener("canplay", handleCanPlay);
                  audio.removeEventListener("canplaythrough", handleCanPlay);
                  audio.removeEventListener("loadeddata", handleCanPlay);
                  audio.removeEventListener("error", handleLoadError);
                };
                
                // Check if already ready
                if (audio.readyState >= 3) {
                  cleanup();
                  setIsLoading(false);
                  resolve();
                  return;
                }
                
                // Check for existing error
                if (audio.error) {
                  cleanup();
                  handleLoadError({ target: audio });
                  return;
                }
                
                audio.addEventListener("canplay", handleCanPlay);
                audio.addEventListener("canplaythrough", handleCanPlay);
                audio.addEventListener("loadeddata", handleCanPlay);
                audio.addEventListener("error", handleLoadError);
                
                // Timeout after 5 seconds
                setTimeout(() => {
                  if (!resolved) {
                    resolved = true;
                    cleanup();
                    setIsLoading(false);
                    setHasError(true);
                    console.error("AudioPlayer - Load timeout after 5s", {
                      readyState: audio.readyState,
                      networkState: audio.networkState,
                      error: audio.error
                    });
                    reject(new Error("Audio loading timeout"));
                  }
                }, 5000);
              });
            } catch (err) {
              console.error("AudioPlayer - Loading error:", err);
              setHasError(true);
              throw err;
            }
          }
          
          // Try to play the audio
          console.log("AudioPlayer - Attempting to play");
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            await playPromise;
            console.log("AudioPlayer - Play started successfully");
          }
        }
      } catch (error) {
        console.error("AudioPlayer - Error playing audio:", error);
        setIsLoading(false);
        setIsPlaying(false);
        setHasError(true);
        if (error.name === "NotAllowedError") {
          toast.error("Please allow audio playback in your browser");
        } else if (error.name === "NotSupportedError") {
          toast.error("Audio format not supported");
        } else if (error.message === "Failed to load audio file") {
          toast.error("Failed to load audio file. It may be unavailable or corrupted.");
        } else if (error.message === "Audio loading timeout") {
          toast.error("Audio took too long to load. Please try again.");
        } else {
          toast.error("Failed to play audio. Please try again.");
        }
      }
    };

    const formatTime = (seconds) => {
      if (!seconds || isNaN(seconds)) return "0:00";
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
      <div className={`my-2 flex items-center gap-3 ${isMyMessage ? "flex-row-reverse" : ""}`}>
        <audio 
          ref={setAudioRef} 
          src={audioUrl} 
          preload="none"
          className="hidden"
        />
        
        <button
          onClick={togglePlayPause}
          disabled={isLoading || hasError}
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            hasError
              ? "bg-red-500 hover:bg-red-600 text-white"
              : isMyMessage
              ? "bg-indigo-600 hover:bg-indigo-700 text-white"
              : "bg-white hover:bg-gray-100 text-indigo-600 border border-gray-200 shadow-sm"
          }`}
          title={hasError ? "Audio file error - check console for details" : ""}
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : hasError ? (
            <X size={18} className="fill-current" />
          ) : isPlaying ? (
            <Pause size={18} className="fill-current" />
          ) : (
            <Play size={18} className="fill-current ml-0.5" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`absolute top-0 left-0 h-full transition-all ${
                isMyMessage ? "bg-indigo-500" : "bg-indigo-400"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    );
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
                    className={`group p-2 text-sm max-w-sm bg-white text-slate-700 rounded-lg shadow ${
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
                      <AudioPlayer
                        messageId={message._id}
                        audioUrl={message.media_url}
                        isMyMessage={isMyMessage}
                        playingAudioId={playingAudioId}
                        setPlayingAudioId={setPlayingAudioId}
                        audioRefs={audioRefs}
                      />
                    )}
                    {message.text && <p>{message.text}</p>}
                    <div className="flex justify-between items-center gap-2 mt-1">
                      <div className="flex justify-end items-center gap-1 text-xs text-gray-500">
                        {formatTime(message.createdAt)}
                        {renderStatus(message)}
                      </div>
                      {isMyMessage && (
                        <button
                          onClick={() => deleteMessage(message._id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded-full text-red-500 hover:text-red-600"
                          title="Delete message"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
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
