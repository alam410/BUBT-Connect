import React, { useState, useEffect, useRef } from "react";
import {
  BadgeCheck,
  Heart,
  MessageCircle,
  Share2,
  ThumbsUp,
  Laugh,
  Lightbulb,
  PartyPopper,
  Trash2,
} from "lucide-react";
import moment from "moment";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios.js";
import toast from "react-hot-toast";

// ✅ Reaction options
const reactionsList = [
  { type: "like", icon: <ThumbsUp className="text-blue-500" />, label: "Like" },
  { type: "love", icon: <Heart className="text-red-500 fill-red-500" />, label: "Love" },
  { type: "celebrate", icon: <PartyPopper className="text-yellow-500" />, label: "Celebrate" },
  { type: "insightful", icon: <Lightbulb className="text-orange-500" />, label: "Insightful" },
  { type: "funny", icon: <Laugh className="text-yellow-400" />, label: "Funny" },
];

const PostCard = ({ post, onDelete }) => {
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.user.value);
  const { getToken } = useAuth();

  const [reactionCounts, setReactionCounts] = useState(post.reactionCounts || {});
  const [userReaction, setUserReaction] = useState(post.userReaction || null);
  const [showReactions, setShowReactions] = useState(false);
  const [commentCount, setCommentCount] = useState(post.commentCount || post.comments?.length || 0);
  const [comments, setComments] = useState(post.comments || []);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const soundRef = useRef(null);

  const postWithHashtags = post.content?.replace(
    /(#\w+)/g,
    '<span class="text-blue-400">$1</span>'
  );

  // Load sound once
  useEffect(() => {
    soundRef.current = new Audio("../../public/sounds/react_sound.mp3"); // <-- put your mp3 in /public/sounds
  }, []);

  // Sync reaction data when post prop changes
  useEffect(() => {
    if (post.reactionCounts) {
      setReactionCounts(post.reactionCounts);
    }
    if (post.userReaction !== undefined) {
      setUserReaction(post.userReaction);
    }
    if (post.commentCount !== undefined) {
      setCommentCount(post.commentCount);
    }
  }, [post.reactionCounts, post.userReaction, post.commentCount]);

  const totalReactions =
    Object.values(reactionCounts).reduce((a, b) => a + b, 0) || 0;

  const selectedReaction =
    reactionsList.find((r) => r.type === userReaction) || null;

  // Fetch comments
  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const token = await getToken();
      const { data } = await api.get(`/api/post/${post._id}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast.error("Failed to load comments");
    } finally {
      setLoadingComments(false);
    }
  };

  // Add comment
  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    
    try {
      const token = await getToken();
      const { data } = await api.post(
        "/api/post/comment",
        { postId: post._id, content: commentText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (data.success) {
        setComments((prev) => [data.comment, ...prev]);
        setCommentCount((prev) => prev + 1);
        setCommentText("");
        toast.success("Comment added!");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    }
  };

// ✅ Send reaction update to backend
const handleReaction = async (reactionType) => {
  try {
    const token = await getToken();
    const { data } = await api.post(
      "/api/post/react",
      { postId: post._id, reactionType },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (data.success) {
      // ✅ Play sound when reacting (optional)
      if (soundRef.current) soundRef.current.play().catch(() => {});

      // ✅ Show proper message from backend or fallback
      toast.success(
        data.message ||
          (data.isReacted ? "Post Reacted" : "Post Unreacted")
      );

      // ✅ Update local state correctly
      setReactionCounts(data.reactions);
      setUserReaction(data.isReacted ? reactionType : null);
    } else {
      toast.error(data.message || "Something went wrong");
    }
  } catch (error) {
    console.error("Reaction error:", error);
    toast.error("Failed to update reaction");
  }
};



  // ✅ Delete Post - Only trigger confirmation, don't delete directly
  const handleDelete = () => {
    // Just trigger the onDelete callback which will show the confirmation modal
    // The actual deletion will be handled by the parent component (Feed) after confirmation
    onDelete?.(post._id);
  };

  // ✅ Share Post
  const handleShare = async () => {
    const postUrl = `${window.location.origin}/post/${post._id}`;
    const shareData = {
      title: `${post?.user?.full_name}'s Post`,
      text: post?.content?.substring(0, 100) || "Check out this post!",
      url: postUrl,
    };

    try {
      // Try using Web Share API if available (mobile devices)
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        toast.success("Post shared!");
      } else {
        // Fallback: Copy link to clipboard
        await navigator.clipboard.writeText(postUrl);
        toast.success("Post link copied to clipboard!");
      }
    } catch (error) {
      // If user cancels share, don't show error
      if (error.name !== "AbortError") {
        // Fallback: Copy link to clipboard
        try {
          await navigator.clipboard.writeText(postUrl);
          toast.success("Post link copied to clipboard!");
        } catch (clipboardError) {
          console.error("Failed to copy:", clipboardError);
          toast.error("Failed to share post");
        }
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-4 space-y-4 w-full max-w-2xl">
      {/* User Info */}
      <div
        onClick={() => navigate("/profile/" + post?.user?._id)}
        className="inline-flex items-center gap-3 cursor-pointer"
      >
        <img
          src={post?.user?.profile_picture}
          alt=""
          className="w-10 h-10 rounded-full shadow"
        />
        <div>
          <div className="flex items-center space-x-1">
            <span className="font-semibold">{post?.user?.full_name}</span>
            <BadgeCheck className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-gray-500 text-sm">
            @{post?.user?.username} · {moment(post?.createdAt).fromNow()}
          </div>
        </div>
      </div>

      {/* Post Content */}
      {post?.content && (
        <div
          className="text-gray-800 text-sm whitespace-pre-line"
          dangerouslySetInnerHTML={{ __html: postWithHashtags }}
        />
      )}

      {/* Images */}
      {post?.image_urls?.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {post.image_urls.map((img, index) => (
            <img
              key={index}
              src={img}
              className={`w-full h-48 object-cover rounded-lg ${
                post.image_urls.length === 1 && "col-span-2 h-auto"
              }`}
              alt=""
            />
          ))}
        </div>
      )}

      {/* Reaction Summary */}
      {totalReactions > 0 && (
        <div className="flex items-center gap-3 pt-1 text-gray-400 text-sm">
          <div className="flex -space-x-1">
            {reactionsList
              .filter((r) => reactionCounts[r.type] > 0)
              .map((r) => (
                <span
                  key={r.type}
                  className="w-4 h-4 flex items-center justify-center bg-white rounded-full border shadow-sm"
                >
                  {r.icon}
                </span>
              ))}
          </div>
          <span className="text-indigo-700 text-xs">{totalReactions}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-4 text-gray-600 text-sm pt-2 border-t border-gray-200 relative">
        {/* Like / Reactions */}
        <div
          className="relative flex items-center gap-1 cursor-pointer"
          onMouseEnter={() => setShowReactions(true)}
          onMouseLeave={() => setShowReactions(false)}
        >
          <motion.div
            whileTap={{ scale: 0.85 }}
            className="flex items-center gap-1"
            onClick={() => handleReaction("like")}
          >
            {selectedReaction ? (
              <motion.div
                key={selectedReaction.type}
                initial={{ scale: 0 }}
                animate={{ scale: 1.2 }}
                transition={{ duration: 0.2 }}
              >
                {selectedReaction.icon}
              </motion.div>
            ) : (
              <ThumbsUp className="w-5 h-5" />
            )}
            <span className="capitalize">
              {selectedReaction ? selectedReaction.label : "Like"}
            </span>
          </motion.div>

          <AnimatePresence>
            {showReactions && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-8 left-0 bg-white shadow-lg rounded-full px-3 py-2 flex gap-3 border border-gray-200 z-10"
              >
                {reactionsList.map((r) => (
                  <motion.div
                    key={r.type}
                    whileHover={{ scale: 1.3 }}
                    whileTap={{ scale: 0.9 }}
                    className="cursor-pointer flex flex-col items-center"
                    onClick={() => handleReaction(r.type)}
                  >
                    {r.icon}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Comment */}
        <div
          className="flex items-center gap-1 cursor-pointer"
          onClick={() => {
            setShowComments(!showComments);
            if (!showComments && comments.length === 0) {
              fetchComments();
            }
          }}
        >
          <MessageCircle className="w-5 h-5" />
          <span>{commentCount}</span>
        </div>

        {/* Share */}
        <div 
          className="flex items-center gap-1 cursor-pointer hover:text-indigo-600 transition-colors"
          onClick={handleShare}
        >
          <Share2 className="w-5 h-5" />
          <span>Share</span>
        </div>

        {/* Delete */}
        {post?.user?._id === currentUser?._id && (
          <button
            onClick={handleDelete}
            className="ml-2 text-red-500 text-sm font-semibold flex items-center gap-1 hover:underline"
          >
            <Trash2 size={16} /> Delete
          </button>
        )}
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-gray-200 pt-4 space-y-3">
          {/* Add Comment */}
          <div className="flex gap-2">
            <img
              src={currentUser?.profile_picture || "/default-avatar.png"}
              alt=""
              className="w-8 h-8 rounded-full"
            />
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key === "Enter" && commentText.trim()) {
                    await handleAddComment();
                  }
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
              <button
                onClick={handleAddComment}
                disabled={!commentText.trim()}
                className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Post
              </button>
            </div>
          </div>

          {/* Comments List */}
          {loadingComments ? (
            <p className="text-gray-500 text-sm">Loading comments...</p>
          ) : comments.length > 0 ? (
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment._id || comment} className="flex gap-2">
                  <img
                    src={comment.user?.profile_picture || "/default-avatar.png"}
                    alt=""
                    className="w-8 h-8 rounded-full"
                  />
                  <div className="flex-1">
                    <div className="bg-gray-100 rounded-lg px-3 py-2">
                      <p className="font-semibold text-sm text-gray-800">
                        {comment.user?.full_name || "Unknown"}
                      </p>
                      <p className="text-sm text-gray-700">{comment.content}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {moment(comment.createdAt).fromNow()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm italic">No comments yet.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default PostCard;
