import React, { useEffect, useState } from "react";
import Loading from "../components/Loading";
import StoriesBar from "../components/StoriesBar";
import PostCard from "../components/PostCard";
import RecentsMessages from "../components/RecentsMessages";
import api from "../api/axios.js";
import toast from "react-hot-toast";
import { useUser, useAuth } from "@clerk/clerk-react";
import { Menu, X, Bell } from "lucide-react";

const Feed = () => {
  const [feeds, setFeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postToDelete, setPostToDelete] = useState(null); // track which post is being deleted
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false); // right sidebar toggle state
  const [unreadCount, setUnreadCount] = useState(0); // track total unread messages
  const { user } = useUser();
  const { getToken } = useAuth();

  const fetchFeeds = async () => {
    try {
      const token = await getToken();
      const { data } = await api.get("/api/post/feed", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) setFeeds(data.posts);
      else toast.error(data.message || "Failed to fetch posts");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Error fetching feed");
    } finally {
      setLoading(false);
    }
  };

  // Calculate unread count from messages
  const calculateUnreadCount = (messages) => {
    if (!messages || !Array.isArray(messages)) return 0;
    
    const currentUserId = user?.id;
    let totalUnread = 0;
    
    messages.forEach((msg) => {
      // Use unreadCount from backend if available
      if (typeof msg?.unreadCount === 'number') {
        totalUnread += msg.unreadCount;
        return;
      }
      
      // Fallback: check if message is unread
      const messageFromUserId = msg?.originalFromUserId || msg?.from_user_id?._id || msg?.from_user_id;
      const messageToUserId = msg?.originalToUserId || msg?.to_user_id?._id || msg?.to_user_id;
      
      // Only count messages received by current user (not sent by current user)
      if (currentUserId && String(messageToUserId) === String(currentUserId)) {
        if (String(messageFromUserId) !== String(currentUserId)) {
          if (msg?.isUnread === true || (typeof msg?.seen === 'boolean' && !msg.seen)) {
            totalUnread += 1;
          }
        }
      }
    });
    
    return totalUnread;
  };

  // Fetch unread messages count
  const fetchUnreadCount = async () => {
    try {
      const token = await getToken();
      const { data } = await api.get('/api/user/recent-message', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success && data.messages) {
        const totalUnread = calculateUnreadCount(data.messages);
        setUnreadCount(totalUnread);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  useEffect(() => {
    fetchFeeds();
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchUnreadCount();
      
      // Refresh unread count every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const confirmDelete = (postId) => {
    setPostToDelete(postId); // open modal
  };

  const handleDeletePost = async () => {
    if (!postToDelete) return;
    try {
      const token = await getToken();
      const { data } = await api.delete(`/api/post/${postToDelete}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        setFeeds((prev) => prev.filter((post) => post._id !== postToDelete));
        toast.success("Post deleted successfully!");
      } else {
        toast.error(data.message || "Failed to delete post");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Error deleting post");
    } finally {
      setPostToDelete(null); // close modal
    }
  };

  if (loading) return <Loading />;

  return (
    <>
      {/* Mobile Right Sidebar Toggle Button - Positioned on right side, middle to bottom */}
      <button
        onClick={() => {
          setRightSidebarOpen(!rightSidebarOpen);
          // Refresh unread count when opening sidebar
          if (!rightSidebarOpen) {
            fetchUnreadCount();
          }
        }}
        className="fixed right-0 top-1/2 -translate-y-1/2 p-3 z-[60] bg-white hover:bg-gray-50 rounded-l-lg shadow-xl w-12 h-16 text-gray-600 lg:hidden cursor-pointer flex items-center justify-center transition-all duration-300 relative border border-r-0 border-gray-200"
        style={{ 
          right: '0',
          top: '50%',
          transform: 'translateY(-50%)'
        }}
        aria-label="Toggle right sidebar"
      >
        {rightSidebarOpen ? (
          <X className="w-5 h-5 text-gray-600" />
        ) : (
          <>
            <Bell className="w-5 h-5 text-gray-600" />
            {/* Unread count badge */}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 border-2 border-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </>
        )}
      </button>

      <div className="h-full overflow-x-auto overflow-y-auto py-10 px-4 md:px-6 lg:px-8 xl:pr-5 relative">

      {/* Overlay for mobile when right sidebar is open */}
      {rightSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setRightSidebarOpen(false)}
        />
      )}

      {/* Main Content Container */}
      <div className="flex flex-col lg:flex-row items-start justify-center gap-4 md:gap-6 lg:gap-8">
        {/* Left: Feed Section */}
        <div className="flex-1 max-w-2xl min-w-0 w-full">
          <StoriesBar />
          <div className="p-4 space-y-6">
            {feeds.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                currentUser={user}
                onDelete={() => confirmDelete(post._id)}
              />
            ))}
          </div>
        </div>

        {/* Right Sidebar - Toggleable on mobile, always visible and sticky on desktop */}
        <div
          className={`w-80 bg-slate-50 lg:bg-transparent fixed lg:sticky top-0 right-0 h-full lg:h-fit z-40 lg:z-auto 
            transform transition-transform duration-300 ease-in-out
            ${rightSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
            overflow-y-auto lg:overflow-visible
            pt-16 lg:pt-0 px-4 lg:px-0
            `}
        >
          {/* Close button for mobile */}
          <button
            onClick={() => setRightSidebarOpen(false)}
            className="absolute top-3 right-3 p-2 lg:hidden bg-white rounded-md shadow-md w-8 h-8 text-gray-600 cursor-pointer flex items-center justify-center z-10"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-full max-w-xs mx-auto lg:mx-0 bg-white text-xs p-4 rounded-2xl flex flex-col items-center gap-3 shadow-lg border-2 border-indigo-400 hover:shadow-indigo-300 transition-all duration-300">
            <h2 className="text-slate-800 font-bold text-base mb-2">
              🎉 Upcoming Event
            </h2>
            <img
              src="https://scontent.fdac198-1.fna.fbcdn.net/v/t39.30808-6/574622748_1137792358468576_1541383656874462563_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=833d8c&_nc_ohc=NCTJZ5vxbDcQ7kNvwFWQn_E&_nc_oc=AdnPmyshCki6a4YncmF9jHx3dEQkizRVnher9tORLJ_M-m01TMzZTjgN8UFdPyfQHEA&_nc_zt=23&_nc_ht=scontent.fdac198-1.fna&_nc_gid=sd1sAAyivMBncyyH783QfA&oh=00_AfiFBo1ygWLlipGpIOhMJglxdKxsU1Y_YHUjI260gWTtNA&oe=692DA5F0"              className="w-full h-40 object-cover rounded-lg border border-indigo-300"
              alt="Event Banner"
            />
            <p className="text-slate-600 font-bold text-center">
              Don't miss out! Register before seats run out.
            </p>
            <a
              href="https://forms.gle/LT3MjTrCiXhPL3FA9"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-full w-16 h-16 flex flex-col items-center justify-center shadow-md hover:shadow-lg transition-all duration-300"
            >
              Join
              <br />
              Now
            </a>
          </div>

          <RecentsMessages />
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {postToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              Delete Post?
            </h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this post? This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
                onClick={() => setPostToDelete(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                onClick={handleDeletePost}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default Feed;
