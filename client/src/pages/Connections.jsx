import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageSquare,
  UserCheck,
  UserPlus,
  UserRoundPen,
  Users,
  UserMinus,
  MapPin,
  Calendar,
  Briefcase,
  GraduationCap,
} from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios";
import toast from "react-hot-toast";
import Loading from "../components/Loading";

const Connections = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [currentTab, setCurrentTab] = useState("Followers");
  const [loading, setLoading] = useState(true);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [pendingConnections, setPendingConnections] = useState([]);
  const [connections, setConnections] = useState([]);

  // Fetch connections data from backend
  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const token = await getToken();
        const { data } = await api.get("/api/user/connections", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (data.success) {
          setFollowers(data.followers || []);
          setFollowing(data.following || []);
          setPendingConnections(data.pendingConnections || []);
          setConnections(data.connections || []);
        }
      } catch (error) {
        console.error("Error fetching connections:", error);
        toast.error("Failed to load connections");
      } finally {
        setLoading(false);
      }
    };
    fetchConnections();
  }, [getToken]);

  const dataArray = [
    { label: "Followers", value: followers, icon: Users },
    { label: "Following", value: following, icon: UserCheck },
    { label: "Pending", value: pendingConnections, icon: UserRoundPen },
    { label: "Connections", value: connections, icon: UserPlus },
  ];

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            🫱🏾‍🫲🏼 Connections
          </h1>
          <p className="text-slate-600">Grow Your Network 🪴</p>
        </div>

        {/* Tabs */}
        <div className="cursor-pointer inline-flex flex-wrap items-center border border-gray-200 rounded-md p-1 bg-white shadow-sm">
          {dataArray.map((tab) => (
            <button
              onClick={() => setCurrentTab(tab.label)}
              key={tab.label}
              className={`flex items-center px-3 py-1 text-sm rounded-md transition-colors ${
                currentTab === tab.label
                  ? "bg-white font-medium text-black shadow"
                  : "text-gray-500 hover:text-black"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="ml-1">{tab.label}</span>
              <span className="ml-2 text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                {tab.value.length}
              </span>
            </button>
          ))}
        </div>

        {/* Connections List */}
        <div className="mt-6">
          {(() => {
            const currentTabData = dataArray.find((item) => item.label === currentTab);
            const users = currentTabData?.value || [];

            if (users.length === 0) {
              return (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <p className="text-gray-500 text-lg">
                    {currentTab === "Followers" && "No followers yet"}
                    {currentTab === "Following" && "You're not following anyone yet"}
                    {currentTab === "Pending" && "No pending connection requests"}
                    {currentTab === "Connections" && "No connections yet"}
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    {currentTab === "Connections" && "Start connecting with people to build your network!"}
                    {currentTab === "Following" && "Discover people to follow from the Discover page"}
                    {currentTab === "Pending" && "Connection requests will appear here"}
                    {currentTab === "Followers" && "People who follow you will appear here"}
                  </p>
                </div>
              );
            }

            return (
              <div className="flex flex-wrap gap-6">
                {users.map((user) => {
                  // Handle both populated and unpopulated user data
                  const userId = user._id || user;
                  const userName = user.full_name || "Unknown User";
                  const userUsername = user.username || "unknown";
                  const userBio = user.bio || "";
                  const userProfilePic = user.profile_picture || "/default-avatar.png";
                  const userLocation = user.location || "";
                  const userGraduationYear = user.graduation_year || null;
                  const userCurrentWork = user.current_work || "";
                  const userDepartment = user.department || "";

                  return (
                    <div
                      key={userId}
                      className="w-full max-w-88 flex gap-5 p-6 bg-white shadow rounded-md hover:shadow-lg transition-shadow"
                    >
                      <img
                        src={userProfilePic}
                        alt={userName}
                        className="rounded-full w-12 h-12 shadow-md object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-700">{userName}</p>
                        <p className="text-slate-500 text-sm">@{userUsername}</p>

                        {/* Additional Information */}
                        <div className="mt-3 space-y-1.5">
                          {/* Location */}
                          {userLocation && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                              <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                              <span className="truncate">{userLocation}</span>
                            </div>
                          )}

                          {/* Department */}
                          {userDepartment && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                              <GraduationCap className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                              <span className="truncate">{userDepartment}</span>
                            </div>
                          )}

                          {/* Graduation Year */}
                          {userGraduationYear && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                              <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                              <span>Graduated {userGraduationYear}</span>
                            </div>
                          )}

                          {/* Current Work */}
                          {userCurrentWork && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                              <Briefcase className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                              <span className="truncate">{userCurrentWork}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap max-sm:flex-col gap-2.5 mt-4">
                          {currentTab !== "Connections" && (
                            <button
                              onClick={() => navigate(`/profile/${userId}`)}
                              className="flex-1 min-w-[120px] px-4 py-2.5 text-sm font-medium rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-[0.98] transition-all duration-200 text-white shadow-md hover:shadow-lg cursor-pointer"
                            >
                              View Profile
                            </button>
                          )}

                          {currentTab === "Following" && (
                            <button
                              onClick={async () => {
                                try {
                                  const token = await getToken();
                                  const { data } = await api.post(
                                    "/api/user/unfollow",
                                    { id: userId },
                                    { headers: { Authorization: `Bearer ${token}` } }
                                  );
                                  if (data.success) {
                                    toast.success("Unfollowed successfully");
                                    setFollowing((prev) => prev.filter((u) => (u._id || u) !== userId));
                                  }
                                } catch (error) {
                                  console.error("Unfollow error:", error);
                                  toast.error(error.response?.data?.message || "Failed to unfollow");
                                }
                              }}
                              className="flex-1 min-w-[120px] px-4 py-2.5 text-sm font-medium rounded-lg bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 active:scale-[0.98] transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
                            >
                              Unfollow
                            </button>
                          )}

                          {currentTab === "Pending" && (
                            <>
                              <button
                                onClick={async () => {
                                  try {
                                    const token = await getToken();
                                    const { data } = await api.post(
                                      "/api/user/accept",
                                      { id: userId },
                                      { headers: { Authorization: `Bearer ${token}` } }
                                    );
                                    if (data.success) {
                                      toast.success("Connection accepted");
                                      setPendingConnections((prev) => prev.filter((u) => (u._id || u) !== userId));
                                      setConnections((prev) => [...prev, user]);
                                    }
                                  } catch (error) {
                                    console.error("Accept error:", error);
                                    toast.error(error.response?.data?.message || "Failed to accept connection");
                                  }
                                }}
                                className="flex-1 min-w-[100px] px-4 py-2.5 text-sm font-medium rounded-lg bg-green-500 hover:bg-green-600 text-white active:scale-[0.98] transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                <UserCheck className="w-4 h-4" />
                                Accept
                              </button>
                              <button
                                onClick={async () => {
                                  try {
                                    const token = await getToken();
                                    // Reject connection request
                                    await api.post(
                                      "/api/user/reject",
                                      { id: userId },
                                      { headers: { Authorization: `Bearer ${token}` } }
                                    );
                                    toast.success("Connection request rejected");
                                    setPendingConnections((prev) => prev.filter((u) => (u._id || u) !== userId));
                                  } catch (error) {
                                    console.error("Reject error:", error);
                                    // If reject endpoint doesn't exist, just remove from pending
                                    setPendingConnections((prev) => prev.filter((u) => (u._id || u) !== userId));
                                  }
                                }}
                                className="flex-1 min-w-[100px] px-4 py-2.5 text-sm font-medium rounded-lg bg-white border-2 border-red-200 hover:border-red-300 hover:bg-red-50 text-red-600 active:scale-[0.98] transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {currentTab === "Connections" && (
                            <>
                              <button
                                onClick={() => navigate(`/profile/${userId}`)}
                                className="flex-1 min-w-[110px] px-4 py-2.5 text-sm font-medium rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-[0.98] transition-all duration-200 text-white shadow-md hover:shadow-lg cursor-pointer"
                              >
                                View Profile
                              </button>
                              <button
                                onClick={() => navigate(`/messages/${userId}`)}
                                className="flex-1 min-w-[110px] px-4 py-2.5 text-sm font-medium rounded-lg bg-white border-2 border-indigo-200 hover:border-indigo-300 hover:bg-indigo-50 text-indigo-700 active:scale-[0.98] transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                <MessageSquare className="w-4 h-4" />
                                Message
                              </button>
                              <button
                                onClick={async () => {
                                  if (!window.confirm("Are you sure you want to disconnect from this user?")) {
                                    return;
                                  }
                                  try {
                                    const token = await getToken();
                                    const { data } = await api.post(
                                      "/api/user/disconnect",
                                      { id: userId },
                                      { headers: { Authorization: `Bearer ${token}` } }
                                    );
                                    if (data.success) {
                                      toast.success("Disconnected successfully");
                                      setConnections((prev) => prev.filter((u) => (u._id || u) !== userId));
                                    } else {
                                      toast.error(data.message || "Failed to disconnect");
                                    }
                                  } catch (error) {
                                    console.error("Disconnect error:", error);
                                    toast.error(error.response?.data?.message || "Failed to disconnect");
                                  }
                                }}
                                className="flex-1 min-w-[110px] px-4 py-2.5 text-sm font-medium rounded-lg bg-white border-2 border-red-200 hover:border-red-300 hover:bg-red-50 text-red-600 active:scale-[0.98] transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                <UserMinus className="w-4 h-4" />
                                Disconnect
                              </button>
                            </>
                          )}

                          {currentTab === "Followers" && (
                            <button
                              onClick={async () => {
                                try {
                                  const token = await getToken();
                                  // Check if already following
                                  const isFollowing = following.some((u) => (u._id || u) === userId);
                                  if (!isFollowing) {
                                    await api.post(
                                      "/api/user/follow",
                                      { id: userId },
                                      { headers: { Authorization: `Bearer ${token}` } }
                                    );
                                    toast.success("Now following!");
                                    // Refresh connections to update following list
                                    const { data } = await api.get("/api/user/connections", {
                                      headers: { Authorization: `Bearer ${token}` },
                                    });
                                    if (data.success) {
                                      setFollowing(data.following || []);
                                    }
                                  }
                                } catch (error) {
                                  console.error("Follow error:", error);
                                  toast.error(error.response?.data?.message || "Failed to follow");
                                }
                              }}
                              className="flex-1 min-w-[120px] px-4 py-2.5 text-sm font-medium rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-[0.98] transition-all duration-200 text-white shadow-md hover:shadow-lg cursor-pointer"
                            >
                              Follow Back
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default Connections;
