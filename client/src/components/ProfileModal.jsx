import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useAuth, useUser } from "@clerk/clerk-react";
import { toast } from "react-hot-toast";
import { X, Camera, MapPin } from "lucide-react";
import { updateUser } from "../features/user/userSlice.js";

const ProfileModal = ({ setShowEdit, onProfileUpdate }) => {
  const dispatch = useDispatch();
  const { getToken } = useAuth();
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
  const reduxUser = useSelector((state) => state.user.value);

  const [editForm, setEditForm] = useState({
    full_name: "",
    username: "",
    bio: "",
    location: "",
    graduation_year: "",
    current_work: "",
    department: "",
    profile_picture: null,
    cover_photo: null,
  });

  // Location autocomplete state
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [locationInput, setLocationInput] = useState("");
  const locationInputRef = useRef(null);
  const suggestionsRef = useRef(null);

  useEffect(() => {
    if (reduxUser || clerkUser) {
      const location = reduxUser?.location || "";
      setEditForm((prev) => ({
        ...prev,
        full_name: prev.full_name || reduxUser?.full_name || clerkUser?.fullName || "",
        username: prev.username || reduxUser?.username || clerkUser?.username || "",
        bio: prev.bio || reduxUser?.bio || "",
        location: prev.location || location,
        graduation_year: prev.graduation_year || reduxUser?.graduation_year || "",
        current_work: prev.current_work || reduxUser?.current_work || "",
        department: prev.department || reduxUser?.department || "",
      }));
      setLocationInput(location);
    }
  }, [reduxUser, clerkUser]);

  // Fetch location suggestions from Nominatim API
  const fetchLocationSuggestions = async (query) => {
    if (!query || query.length < 2) {
      setLocationSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      // Using Nominatim API (OpenStreetMap) - free, no API key needed
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'BUBT-Connect/1.0' // Required by Nominatim
          }
        }
      );
      const data = await response.json();
      
      const suggestions = data.map((item) => ({
        display_name: item.display_name,
        place_id: item.place_id,
      }));
      
      setLocationSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } catch (error) {
      console.error("Error fetching location suggestions:", error);
      setLocationSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Debounce location search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (locationInput !== editForm.location) {
        fetchLocationSuggestions(locationInput);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [locationInput]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        locationInputRef.current &&
        !locationInputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLocationSelect = (suggestion) => {
    setLocationInput(suggestion.display_name);
    setEditForm({ ...editForm, location: suggestion.display_name });
    setShowSuggestions(false);
    setLocationSuggestions([]);
  };

  const handleLocationChange = (e) => {
    const value = e.target.value;
    setLocationInput(value);
    setEditForm({ ...editForm, location: value });
  };

  const handleSaveProfile = async () => {
    try {
      const token = await getToken();
      const formData = new FormData();

      const {
        full_name,
        username,
        bio,
        location,
        graduation_year,
        current_work,
        department,
        profile_picture,
        cover_photo,
      } = editForm;

      formData.append("full_name", full_name);
      formData.append("username", username);
      formData.append("bio", bio);
      formData.append("location", location);
      formData.append("graduation_year", graduation_year);
      formData.append("current_work", current_work);
      formData.append("department", department);

      if (profile_picture) formData.append("profile", profile_picture);
      if (cover_photo) formData.append("cover", cover_photo);

      await dispatch(updateUser({ userData: formData, token })).unwrap();

      toast.success("Profile updated successfully!");
      if (onProfileUpdate) onProfileUpdate();
      setShowEdit(false);
    } catch (err) {
      toast.error("Failed to update profile");
      console.error("Failed to update profile:", err);
    }
  };

  if (!isClerkLoaded) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={() => setShowEdit(false)}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 sm:mx-auto flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b px-6 py-4 sticky top-0 bg-white z-10">
          <h1 className="text-xl font-semibold text-gray-800">Edit Profile</h1>
          <button
            onClick={() => setShowEdit(false)}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <X size={20} />
          </button>
        </div>

        <form className="flex-1 overflow-y-auto p-6 space-y-5" onSubmit={(e) => e.preventDefault()}>
          {/* Cover Photo */}
          <div className="relative group w-full h-40 sm:h-48 rounded-lg overflow-hidden bg-gray-100">
            <img
              src={
                editForm.cover_photo
                  ? URL.createObjectURL(editForm.cover_photo)
                  : reduxUser?.cover_photo ||
                    "https://placehold.co/600x200/E2E8F0/A0AEC0?text=Cover"
              }
              alt="Cover"
              className="object-cover w-full h-full"
            />
            <label
              htmlFor="cover_photo"
              className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 cursor-pointer transition"
            >
              <Camera className="text-white" size={24} />
              <input
                type="file"
                id="cover_photo"
                accept="image/*"
                hidden
                onChange={(e) =>
                  setEditForm({ ...editForm, cover_photo: e.target.files[0] })
                }
              />
            </label>
          </div>

          {/* Profile Picture */}
          <div className="flex flex-col items-center -mt-14">
            <div className="relative group">
              <img
                src={
                  editForm.profile_picture
                    ? URL.createObjectURL(editForm.profile_picture)
                    : reduxUser?.profile_picture ||
                      clerkUser?.imageUrl ||
                      "https://placehold.co/112x112/E2E8F0/A0AEC0?text=Avatar"
                }
                alt="Profile"
                className="w-28 h-28 rounded-full object-cover border-4 border-white shadow"
              />
              <label
                htmlFor="profile_picture"
                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition"
              >
                <Camera className="text-white" size={22} />
                <input
                  type="file"
                  id="profile_picture"
                  accept="image/*"
                  hidden
                  onChange={(e) =>
                    setEditForm({ ...editForm, profile_picture: e.target.files[0] })
                  }
                />
              </label>
            </div>
          </div>

          {/* Text Fields */}
          {[
            ["Full Name", "full_name", "text"],
            ["Username", "username", "text"],
            ["Bio", "bio", "textarea"],
            ["Graduation Year", "graduation_year", "number"],
            ["Current Work", "current_work", "text"],
          ].map(([label, key, type]) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {label}
              </label>
              {type === "textarea" ? (
                <textarea
                  value={editForm[key]}
                  onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                  rows="3"
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                />
              ) : (
                <input
                  type={type}
                  value={editForm[key]}
                  onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              )}
            </div>
          ))}

          {/* Department Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department
            </label>
            <select
              value={editForm.department}
              onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
            >
              <option value="">Select Department</option>
              <option value="Management">Management</option>
              <option value="Accounting">Accounting</option>
              <option value="Marketing">Marketing</option>
              <option value="Finance">Finance</option>
              <option value="English">English</option>
              <option value="Law & Justice">Law & Justice</option>
              <option value="Mathematics & Statistics">Mathematics & Statistics</option>
              <option value="Computer Science and Engineering (CSE)">Computer Science and Engineering (CSE)</option>
              <option value="Electrical and Electronic Engineering (EEE)">Electrical and Electronic Engineering (EEE)</option>
              <option value="Textile Engineering">Textile Engineering</option>
            </select>
          </div>

          {/* Location Field with Autocomplete */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                ref={locationInputRef}
                type="text"
                value={locationInput}
                onChange={handleLocationChange}
                onFocus={() => {
                  if (locationSuggestions.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
                placeholder="Search for a location..."
                className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              {showSuggestions && locationSuggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                >
                  {locationSuggestions.map((suggestion) => (
                    <button
                      key={suggestion.place_id}
                      type="button"
                      onClick={() => handleLocationSelect(suggestion)}
                      className="w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors border-b border-gray-100 last:border-b-0 flex items-start gap-2"
                    >
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{suggestion.display_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="border-t flex justify-end gap-3 p-4 bg-white sticky bottom-0">
          <button
            type="button"
            onClick={() => setShowEdit(false)}
            className="px-5 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() =>
              toast.promise(handleSaveProfile(), {
                loading: "Saving profile...",
              })
            }
            className="px-5 py-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 shadow active:scale-95 transition"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
