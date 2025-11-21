import React, { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios";
import toast from "react-hot-toast";
import Loading from "../components/Loading";
import { Megaphone, ExternalLink, Calendar, Tag } from "lucide-react";
import moment from "moment";

const Announcements = () => {
  const { getToken } = useAuth();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const { data } = await api.get("/api/announcement/bubt-notices", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setNotices(data.notices || []);
      } else {
        toast.error(data.message || "Failed to fetch notices");
      }
    } catch (error) {
      console.error("Error fetching notices:", error);
      toast.error("Failed to load announcements");
    } finally {
      setLoading(false);
    }
  };

  // Get unique categories
  const categories = ["All", ...new Set(notices.map((notice) => notice.category))];

  // Filter notices
  const filteredNotices = notices.filter((notice) => {
    const matchesCategory =
      selectedCategory === "All" || notice.category === selectedCategory;
    const matchesSearch =
      searchQuery === "" ||
      notice.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "Date not available";
    try {
      // Try to parse the date string (format: "19 Nov 2025")
      const date = moment(dateString, "DD MMM YYYY");
      if (date.isValid()) {
        return date.format("MMMM DD, YYYY");
      }
      return dateString;
    } catch {
      return dateString;
    }
  };

  // Get category color
  const getCategoryColor = (category) => {
    const colors = {
      "Exam Related": "bg-red-100 text-red-700",
      General: "bg-blue-100 text-blue-700",
      Tender: "bg-yellow-100 text-yellow-700",
      "Class Related": "bg-green-100 text-green-700",
    };
    return colors[category] || "bg-gray-100 text-gray-700";
  };

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Megaphone className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-slate-900">BUBT Notices</h1>
          </div>
          <p className="text-slate-600">
            Stay updated with the latest announcements from BUBT
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search notices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 flex-wrap">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notices List */}
        <div className="space-y-4">
          {filteredNotices.length > 0 ? (
            filteredNotices.map((notice, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                          notice.category
                        )}`}
                      >
                        <Tag className="w-3 h-3 inline mr-1" />
                        {notice.category}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">
                      {notice.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(notice.publishedDate)}</span>
                      </div>
                    </div>
                  </div>
                  <a
                    href={notice.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View
                  </a>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <Megaphone className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                {searchQuery || selectedCategory !== "All"
                  ? "No notices found matching your filters"
                  : "No notices available at the moment"}
              </p>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Notices are fetched from{" "}
            <a
              href="https://www.bubt.edu.bd/Home/all_notice"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:underline"
            >
              BUBT Official Website
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Announcements;