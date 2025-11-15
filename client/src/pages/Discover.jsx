import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";
import UserCard from "../components/UserCard";
import { useSelector, useDispatch } from "react-redux"; // 1. Import Redux hooks
import { fetchAllUsers } from "../features/users/usersSlice"; // 2. Import the new action
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios";

const Discover = () => {
  const dispatch = useDispatch();

  // 3. Get the master user list and status from the NEW 'users' slice
  const { list: allUsers, status: usersStatus } = useSelector(
    (state) => state.users
  );

  // 4. Get the token and user from Redux
  const currentUser = useSelector((state) => state.user.value);
  const { getToken } = useAuth();

  const [input, setInput] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]); // This will hold the filtered results
  const [showSuggestions, setShowSuggestions] = useState(false);

  // 5. Fetch all users from the backend when the component loads
  useEffect(() => {
    const fetchUsers = async () => {
      if (usersStatus === "idle" && currentUser) {
        try {
          const token = await getToken();
          dispatch(fetchAllUsers(token));
        } catch (error) {
          console.error("Error fetching token:", error);
        }
      }
    };
    fetchUsers();
  }, [usersStatus, dispatch, currentUser, getToken]);

  // 6. When the master list (allUsers) changes, update the filtered list
  useEffect(() => {
    if (allUsers) {
      setFilteredUsers(allUsers);
    }
  }, [allUsers]);

  // 🔍 Live suggestions (filters the 'allUsers' list)
  const suggestions = React.useMemo(() => {
    if (input.trim() === "") {
      return [];
    }
    const term = input.toLowerCase();
    return allUsers
      .filter(
        (user) =>
          user.full_name.toLowerCase().includes(term) ||
          user.username.toLowerCase().includes(term)
      )
      .slice(0, 5);
  }, [input, allUsers]);

  // 🕐 Search on Enter or suggestion click
  const handleSearch = async (searchTerm) => {
    setShowSuggestions(false);
    try {
      const token = await getToken();
      const { data } = await api.post(
        "/api/user/discover",
        { input: searchTerm },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (data.success) {
        setFilteredUsers(data.users || []);
      }
    } catch (error) {
      console.error("Search error:", error);
      // Fallback to local filtering
      const term = searchTerm.toLowerCase();
      const filtered = allUsers.filter(
        (user) =>
          user.full_name.toLowerCase().includes(term) ||
          user.username.toLowerCase().includes(term) ||
          user.bio?.toLowerCase().includes(term)
      );
      setFilteredUsers(filtered);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-6xl mx-auto p-6">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            🔎 Discover People
          </h1>
          <p className="text-slate-600">
            Connect with amazing people and grow your network
          </p>
        </div>

        {/* Search Box */}
        <div className="mb-8 shadow-md rounded-md border border-slate-200/60 bg-white/80 relative">
          <div className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search people by name, username, bio, or location..."
                className="pl-10 sm:pl-12 py-2 w-full border border-gray-300 rounded-md max-sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                onChange={(e) => {
                  setInput(e.target.value);
                  setShowSuggestions(true);
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSearch(input)}
                value={input}
              />

              {/* Suggestion Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-10 left-0 right-0 mt-2 bg-white border border-gray-200 rounded-md shadow-lg">
                  {suggestions.map((user) => (
                    <div
                      key={user._id}
                      onClick={() => {
                        setInput(user.full_name);
                        handleSearch(user.full_name);
                      }}
                      className="px-4 py-2 hover:bg-slate-100 cursor-pointer flex items-center gap-2"
                    >
                      <img
                        src={user.profile_picture}
                        alt={user.full_name}
                        className="w-6 h-6 rounded-full"
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-700">
                          {user.full_name}
                        </p>
                        <p className="text-xs text-slate-500">
                          @{user.username}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="flex flex-wrap gap-6">
          {usersStatus === "loading" ? (
            <p className="text-slate-600 animate-pulse">Loading users...</p>
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map((user) => <UserCard key={user._id} user={user} />)
          ) : (
            <p className="text-slate-500 italic">No users found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Discover;
