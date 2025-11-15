import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext.jsx";
import UserInitializer from "./UserInitializer.jsx";

const ProtectedRoute = ({ children }) => {
  const { authUser, loading } = useAuthContext();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Give React a moment to finish state updates
    if (!loading) {
      const timer = setTimeout(() => {
        setIsReady(true);
        console.log("✅ ProtectedRoute ready - authUser:", !!authUser);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [loading, authUser]);

  // Show loading while AuthContext is loading OR we're waiting for state sync
  if (loading || !isReady) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100vh",
        fontSize: "18px"
      }}>
        Loading...
      </div>
    );
  }

  if (!authUser) {
    console.log("🚫 No authUser - redirecting to login");
    return <Navigate to="/login" replace />;
  }

  console.log("✅ Rendering protected content");
  // Wrap children with UserInitializer to fetch user data
  return <UserInitializer>{children}</UserInitializer>;
};

export default ProtectedRoute;