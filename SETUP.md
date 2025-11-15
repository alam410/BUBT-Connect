# BUBT Connect - Setup Guide

This guide will help you set up both the client and server for the BUBT Connect project.

## Prerequisites

- Node.js 22.x (as specified in server/package.json)
- MongoDB (local or MongoDB Atlas)
- Clerk account (for authentication)
- ImageKit account (for image storage)

## Environment Variables Setup

### Client Setup

1. Navigate to the `client` directory:
   ```bash
   cd client
   ```

2. Create a `.env` file with the following variables:
   ```env
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
   ```

   **Note:** Get your Clerk Publishable Key from your Clerk dashboard.

### Server Setup

1. Navigate to the `server` directory:
   ```bash
   cd server
   ```

2. Create a `.env` file with the following variables:
   ```env
   # Server Port
   PORT=4000

   # MongoDB Connection
   MONGODB_URL=mongodb://localhost:27017
   # Or for MongoDB Atlas:
   # MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net

   # Clerk Authentication
   CLERK_SECRET_KEY=sk_test_your_secret_key_here

   # ImageKit Configuration
   IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
   IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
   IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id

   # Email Configuration (NodeMailer - using Brevo/Sendinblue)
   SMTP_USER=your_smtp_username
   SMTP_PASS=your_smtp_password
   SENDER_EMAIL=your_sender_email@example.com

   # Frontend URL (for email links)
   FRONTEND_URL=http://localhost:5173

   # Inngest (optional - for background jobs)
   INNGEST_EVENT_KEY=your_inngest_event_key
   INNGEST_SIGNING_KEY=your_inngest_signing_key
   ```

## Installation

### Install Client Dependencies

```bash
cd client
npm install
```

### Install Server Dependencies

```bash
cd server
npm install
```

## Running the Application

### Development Mode

1. **Start the Server:**
   ```bash
   cd server
   npm run dev
   ```
   The server will run on `http://localhost:4000`

2. **Start the Client:**
   ```bash
   cd client
   npm run dev
   ```
   The client will run on `http://localhost:5173`

### Production Mode

1. **Build the Client:**
   ```bash
   cd client
   npm run build
   ```

2. **Start the Server:**
   ```bash
   cd server
   npm start
   ```

## Project Structure

```
BUBT-Connect-main 6/
├── client/                 # React frontend (Vite)
│   ├── src/
│   │   ├── api/           # API configuration (axios)
│   │   ├── components/    # React components
│   │   ├── context/       # React context (AuthContext)
│   │   ├── features/      # Redux slices
│   │   ├── pages/         # Page components
│   │   └── ...
│   └── vite.config.js     # Vite configuration with proxy
│
└── server/                 # Express backend
    ├── api/               # Inngest configuration
    ├── configs/           # Database, ImageKit, Multer configs
    ├── controllers/       # Route controllers
    ├── middlewares/       # Express middlewares
    ├── models/            # Mongoose models
    ├── routes/            # Express routes
    └── server.js          # Server entry point
```

## Key Configuration Details

### API Proxy Setup

The client uses Vite's proxy configuration to forward `/api` requests to the backend server running on port 4000. This is configured in `client/vite.config.js`.

### Authentication

The project uses Clerk for authentication:
- Frontend: Uses `@clerk/clerk-react` with publishable key
- Backend: Uses `@clerk/express` with secret key
- The `AuthContext` provides authentication state to the app

### Database

MongoDB is used for data storage. The connection is configured in `server/configs/db.js` and connects to a database named `BUBT-CONNECT`.

## Troubleshooting

### Common Issues

1. **Port Already in Use:**
   - Change the PORT in server `.env` file
   - Update the proxy target in `client/vite.config.js` if needed

2. **MongoDB Connection Failed:**
   - Ensure MongoDB is running locally, or
   - Verify your MongoDB Atlas connection string

3. **Clerk Authentication Issues:**
   - Verify your Clerk keys are correct
   - Ensure the keys match between frontend and backend

4. **CORS Errors:**
   - The server is configured to allow `http://localhost:5173`
   - If using a different port, update `server/server.js` CORS configuration

## Testing the Setup

1. **Test Server Connection:**
   Visit `http://localhost:4000/api/test` to verify MongoDB connection

2. **Test Client:**
   Visit `http://localhost:5173` and check the browser console for any errors

## Additional Notes

- The client uses Redux Toolkit for state management
- Tailwind CSS is used for styling
- ImageKit is used for image uploads and storage
- Inngest is used for background job processing (optional)

