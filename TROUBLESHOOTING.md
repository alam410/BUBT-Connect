# Troubleshooting Guide - UI Not Visible

## Quick Checks

### 1. Check Browser Console (F12)
Open browser console and look for:
- ❌ Red error messages
- ⚠️ Yellow warnings
- ✅ "App component rendering..." message

### 2. Check Environment Variables
Make sure you have a `.env` file in the `client` folder with:
```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

### 3. Check if Server is Running
```bash
# Server should be running on port 4000
curl http://localhost:4000/
```

### 4. Check if Client is Running
```bash
# Client should be running on port 5173
# Open http://localhost:5173 in browser
```

## Common Issues

### Issue 1: Blank White Screen
**Solution:**
1. Open browser console (F12)
2. Check for errors
3. Look for "Missing Publishable Key" error
4. Create `.env` file in `client` folder with your Clerk key

### Issue 2: Infinite Loading
**Solution:**
1. Check server is running
2. Check MongoDB is connected
3. Check network tab in browser console
4. Look for failed API requests

### Issue 3: Error Message Visible
**Solution:**
- Follow the instructions in the error message
- Check server logs
- Verify environment variables

## Steps to Fix

1. **Stop both servers** (Ctrl+C)

2. **Check .env file exists:**
   ```bash
   ls client/.env
   ```

3. **If .env doesn't exist, create it:**
   ```bash
   cd client
   echo "VITE_CLERK_PUBLISHABLE_KEY=your_key_here" > .env
   ```

4. **Restart server:**
   ```bash
   cd server
   npm run dev
   ```

5. **Restart client (in new terminal):**
   ```bash
   cd client
   npm run dev
   ```

6. **Open browser:**
   - Go to http://localhost:5173
   - Open console (F12)
   - Check for errors

## Still Not Working?

1. Share the browser console errors
2. Share the server terminal output
3. Check if you're logged in to Clerk
4. Verify MongoDB connection

