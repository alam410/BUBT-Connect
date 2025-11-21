import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Search, Filter, X, Calendar, Briefcase, MapPin, GraduationCap } from "lucide-react";
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
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    graduation_year: "",
    current_work: "",
    location: "",
    department: [], // Changed to array for multiple selections
  });

  // BUBT Departments list
  const bubtDepartments = [
    "Management",
    "Accounting",
    "Marketing",
    "Finance",
    "English",
    "Law & Justice",
    "Mathematics & Statistics",
    "Computer Science and Engineering (CSE)",
    "Electrical and Electronic Engineering (EEE)",
    "Textile Engineering",
  ];

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

  // Apply filters to users
  const applyFilters = useCallback((users, searchTerm, filterValues) => {
    let filtered = [...users];

    // Apply text search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.full_name?.toLowerCase().includes(term) ||
          user.username?.toLowerCase().includes(term) ||
          user.bio?.toLowerCase().includes(term) ||
          user.location?.toLowerCase().includes(term) ||
          user.department?.toLowerCase().includes(term) ||
          user.current_work?.toLowerCase().includes(term)
      );
    }

    // Apply graduation year filter
    if (filterValues.graduation_year) {
      const year = parseInt(filterValues.graduation_year);
      if (!isNaN(year)) {
        filtered = filtered.filter((user) => user.graduation_year === year);
      }
    }

    // Apply work filter
    if (filterValues.current_work.trim()) {
      const workTerm = filterValues.current_work.toLowerCase();
      filtered = filtered.filter(
        (user) => user.current_work?.toLowerCase().includes(workTerm)
      );
    }

    // Apply location filter
    if (filterValues.location.trim()) {
      const locationTerm = filterValues.location.toLowerCase();
      filtered = filtered.filter(
        (user) => user.location?.toLowerCase().includes(locationTerm)
      );
    }

    // Apply department filter (multiple selections)
    if (filterValues.department.length > 0) {
      filtered = filtered.filter((user) =>
        filterValues.department.includes(user.department)
      );
    }

    setFilteredUsers(filtered);
  }, []);

  // 6. When the master list (allUsers) changes, update the filtered list
  useEffect(() => {
    if (allUsers) {
      applyFilters(allUsers, input, filters);
    }
  }, [allUsers, input, filters, applyFilters]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      filters.graduation_year !== "" ||
      filters.current_work.trim() !== "" ||
      filters.location.trim() !== "" ||
      filters.department.length > 0
    );
  }, [filters]);

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      graduation_year: "",
      current_work: "",
      location: "",
      department: [],
    });
  };

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
    // Apply filters locally instead of calling API
    if (allUsers) {
      applyFilters(allUsers, searchTerm, filters);
    }
  };

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Handle department checkbox change
  const handleDepartmentToggle = (department) => {
    setFilters((prev) => {
      const currentDepartments = prev.department || [];
      if (currentDepartments.includes(department)) {
        // Remove department if already selected
        return {
          ...prev,
          department: currentDepartments.filter((d) => d !== department),
        };
      } else {
        // Add department if not selected
        return {
          ...prev,
          department: [...currentDepartments, department],
        };
      }
    });
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

        {/* Search Box and Filter Button */}
        <div className="mb-8 shadow-md rounded-md border border-slate-200/60 bg-white/80 relative">
          <div className="p-6">
            <div className="flex gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search people by name, username, bio, or location..."
                  className="pl-10 sm:pl-12 py-2 w-full border border-gray-300 rounded-md max-sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  onChange={(e) => {
                    setInput(e.target.value);
                    setShowSuggestions(true);
                    handleSearch(e.target.value);
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
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-md border transition-all flex items-center gap-2 whitespace-nowrap ${
                  hasActiveFilters
                    ? "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                <Filter className="w-4 h-4" />
                Filters
                {hasActiveFilters && (
                  <span className="ml-1 px-1.5 py-0.5 bg-white text-indigo-600 rounded-full text-xs font-semibold">
                    {[
                      filters.graduation_year !== "" ? 1 : 0,
                      filters.current_work.trim() !== "" ? 1 : 0,
                      filters.location.trim() !== "" ? 1 : 0,
                      filters.department.length > 0 ? 1 : 0,
                    ].reduce((a, b) => a + b, 0)}
                  </span>
                )}
              </button>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Graduation Year */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4" />
                      Graduation Year
                    </label>
                    <input
                      type="number"
                      placeholder="e.g., 2023"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={filters.graduation_year}
                      onChange={(e) => handleFilterChange("graduation_year", e.target.value)}
                    />
                  </div>

                  {/* Current Work */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <Briefcase className="w-4 h-4" />
                      Current Work
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Software Engineer"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={filters.current_work}
                      onChange={(e) => handleFilterChange("current_work", e.target.value)}
                    />
                  </div>

                  {/* Location */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="w-4 h-4" />
                      Location
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Dhaka, Bangladesh"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={filters.location}
                      onChange={(e) => handleFilterChange("location", e.target.value)}
                    />
                  </div>
                </div>

                {/* Department Checkboxes */}
                <div className="mt-4">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                    <GraduationCap className="w-4 h-4" />
                    Department
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 max-h-64 overflow-y-auto">
                    {bubtDepartments.map((dept) => (
                      <label
                        key={dept}
                        className="flex items-center gap-2 cursor-pointer hover:bg-white p-2 rounded transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={filters.department.includes(dept)}
                          onChange={() => handleDepartmentToggle(dept)}
                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                        />
                        <span className="text-sm text-gray-700">{dept}</span>
                      </label>
                    ))}
                  </div>
                  {filters.department.length > 0 && (
                    <p className="mt-2 text-xs text-gray-500">
                      {filters.department.length} department{filters.department.length !== 1 ? "s" : ""} selected
                    </p>
                  )}
                </div>

                {/* Clear Filters Button */}
                {hasActiveFilters && (
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={clearFilters}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Clear Filters
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {usersStatus === "loading" ? (
            <p className="text-slate-600 animate-pulse col-span-full">Loading users...</p>
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map((user) => <UserCard key={user._id} user={user} />)
          ) : (
            <p className="text-slate-500 italic col-span-full text-center py-8">No users found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Discover;
