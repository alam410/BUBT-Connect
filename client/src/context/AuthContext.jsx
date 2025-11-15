import React, { createContext, useState, useEffect, useContext } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { getToken, isSignedIn, isLoaded: authLoaded } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();

  const [authToken, setAuthToken] = useState(null);

  useEffect(() => {
    const fetchToken = async () => {
      if (authLoaded && userLoaded && isSignedIn && user) {
        try {
          const token = await getToken();
          setAuthToken(token);
          console.log("✅ Token fetched for:", user.primaryEmailAddress?.emailAddress);
        } catch (err) {
          console.error("❌ Token fetch error:", err);
          setAuthToken(null);
        }
      } else if (authLoaded && userLoaded) {
        // Clerk loaded but user not signed in
        setAuthToken(null);
      }
    };

    fetchToken();
  }, [authLoaded, userLoaded, isSignedIn, user, getToken]);

  // Let Clerk handle loading state - we just provide the token
  const value = {
    authUser: user,
    authToken,
    loading: !authLoaded || !userLoaded, // Use Clerk's loading state directly
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return context;
};