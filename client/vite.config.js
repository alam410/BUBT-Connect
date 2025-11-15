import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

  // --- THIS IS THE FIX ---
  // This "server.proxy" object is the "bridge" that connects
  // your frontend (running on port 5173) to your
  // backend (running on port 4000).
  server: {
    proxy: {
      // This says: if a request starts with "/api",
      // forward it to the backend server.
      '/api': {
        target: 'http://localhost:4000', // Your backend's address
        changeOrigin: true, // Recommended for this to work
        secure: false, // Recommended if your backend is not https
      },
    },
  },
});

