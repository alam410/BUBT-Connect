import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useUser, useAuth } from "@clerk/clerk-react";
import { fetchUser } from "../features/user/userSlice";
import Loading from "./Loading";

/**
 * Component that initializes user data in Redux when Clerk authentication is ready
 * This should be used inside ProtectedRoute to ensure user data is loaded
 */
const UserInitializer = ({ children }) => {
  const dispatch = useDispatch();
  const { user: clerkUser, isLoaded: userLoaded } = useUser();
  const { getToken, isLoaded: authLoaded } = useAuth();
  const user = useSelector((state) => state.user.value);
  const userStatus = useSelector((state) => state.user.status);

  useEffect(() => {
    const initializeUser = async () => {
      // Wait for Clerk to be fully loaded
      if (!authLoaded || !userLoaded || !clerkUser) {
        return;
      }

      // If user is already loaded, don't fetch again
      if (user && user._id === clerkUser.id) {
        return;
      }

      // If already fetching, don't fetch again
      if (userStatus === "loading") {
        return;
      }

      try {
        const token = await getToken();
        if (token && clerkUser) {
          console.log("🔄 Initializing user data...", {
            id: clerkUser.id,
            firstName: clerkUser.firstName,
            lastName: clerkUser.lastName,
          });
          dispatch(
            fetchUser({
              clerkUser: {
                id: clerkUser.id,
                firstName: clerkUser.firstName || "",
                lastName: clerkUser.lastName || "",
                imageUrl: clerkUser.imageUrl || "",
                username: clerkUser.username || clerkUser.primaryEmailAddress?.emailAddress?.split("@")[0] || "",
                emailAddresses: clerkUser.emailAddresses || [],
                primaryEmailAddressId: clerkUser.primaryEmailAddressId || "",
              },
              token,
            })
          );
        }
      } catch (error) {
        console.error("❌ Error initializing user:", error);
      }
    };

    initializeUser();
  }, [
    authLoaded,
    userLoaded,
    clerkUser,
    getToken,
    dispatch,
    user,
    userStatus,
  ]);

  // Debug logging
  useEffect(() => {
    console.log("UserInitializer - Status:", {
      authLoaded,
      userLoaded,
      clerkUser: !!clerkUser,
      userStatus,
      hasUser: !!user,
    });
  }, [authLoaded, userLoaded, clerkUser, userStatus, user]);

  // Show loading while Clerk is loading or user data is being fetched
  if (!authLoaded || !userLoaded) {
    console.log("UserInitializer - Waiting for Clerk to load...");
    return <Loading />;
  }

  // Show loading while user data is being fetched
  if (userStatus === "loading" || (!user && userStatus === "idle")) {
    console.log("UserInitializer - Waiting for user data...", { userStatus, hasUser: !!user });
    return <Loading />;
  }

  // If user fetch failed, show error message
  if (userStatus === "failed" && !user) {
    console.error("❌ User fetch failed:", userStatus);
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-xl font-bold text-red-800 mb-2">Connection Error</h2>
          <p className="text-red-600 mb-4">
            Unable to connect to the server. Please make sure:
          </p>
          <ul className="list-disc list-inside text-red-600 space-y-1 mb-4">
            <li>The server is running on port 4000</li>
            <li>MongoDB is connected</li>
            <li>Environment variables are set correctly</li>
          </ul>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default UserInitializer;

