import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useAuth, useUser } from "@clerk/clerk-react";
import { toast } from "react-hot-toast";
import { X, Camera } from "lucide-react";
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
    profile_picture: null,
    cover_photo: null,
  });

  useEffect(() => {
    if (reduxUser || clerkUser) {
      setEditForm((prev) => ({
        ...prev,
        full_name: prev.full_name || reduxUser?.full_name || clerkUser?.fullName || "",
        username: prev.username || reduxUser?.username || clerkUser?.username || "",
        bio: prev.bio || reduxUser?.bio || "",
        location: prev.location || reduxUser?.location || "",
        graduation_year: prev.graduation_year || reduxUser?.graduation_year || "",
        current_work: prev.current_work || reduxUser?.current_work || "",
      }));
    }
  }, [reduxUser, clerkUser]);

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
        profile_picture,
        cover_photo,
      } = editForm;

      formData.append("full_name", full_name);
      formData.append("username", username);
      formData.append("bio", bio);
      formData.append("location", location);
      formData.append("graduation_year", graduation_year);
      formData.append("current_work", current_work);

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
            ["Location", "location", "text"],
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
