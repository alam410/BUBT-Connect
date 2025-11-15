import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import { Provider } from "react-redux";
import App from "./App.jsx";
import { store } from "./app/store.js";
import { AuthProvider } from "./context/AuthContext.jsx";
import "./index.css";

// Import your Publishable Key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Better error handling - show error UI instead of crashing
if (!PUBLISHABLE_KEY) {
  console.error("❌ Missing VITE_CLERK_PUBLISHABLE_KEY in environment variables");
  const root = document.getElementById("root");
  if (root) {
    root.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 100vh; background: #f3f4f6; font-family: system-ui;">
        <div style="background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 500px;">
          <h1 style="color: #dc2626; margin-bottom: 1rem;">⚠️ Configuration Error</h1>
          <p style="color: #374151; margin-bottom: 1rem;">
            Missing Clerk Publishable Key. Please check your <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">.env</code> file.
          </p>
          <p style="color: #6b7280; font-size: 0.875rem;">
            Make sure you have <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">VITE_CLERK_PUBLISHABLE_KEY</code> set in your <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">client/.env</code> file.
          </p>
        </div>
      </div>
    `;
  }
} else {
  try {
    const rootElement = document.getElementById("root");
    if (!rootElement) {
      throw new Error("Root element not found");
    }

    const root = createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
          <Provider store={store}>
            <AuthProvider>
              <BrowserRouter>
                <App />
              </BrowserRouter>
            </AuthProvider>
          </Provider>
        </ClerkProvider>
      </React.StrictMode>
    );
  } catch (error) {
    console.error("❌ Error rendering app:", error);
    const root = document.getElementById("root");
    if (root) {
      root.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 100vh; background: #f3f4f6; font-family: system-ui;">
          <div style="background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 500px;">
            <h1 style="color: #dc2626; margin-bottom: 1rem;">⚠️ Application Error</h1>
            <p style="color: #374151; margin-bottom: 1rem;">
              Failed to initialize the application.
            </p>
            <p style="color: #6b7280; font-size: 0.875rem; font-family: monospace;">
              ${error.message}
            </p>
            <button 
              onclick="window.location.reload()" 
              style="margin-top: 1rem; padding: 0.5rem 1rem; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;"
            >
              Reload Page
            </button>
          </div>
        </div>
      `;
    }
  }
}
