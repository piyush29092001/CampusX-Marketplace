# CampusX Marketplace

A peer-to-peer college marketplace where students can easily buy and sell products securely within their campus community. Features a custom "Lumina" high-contrast semantic terminal aesthetic.

## Features

- **Product Marketplace**: Browse, filter by category, and search for products sold by peers.
- **Product Details & Inquiries**: View product specifics and contact sellers directly.
- **Real-Time Messaging**: Implemented with Socket.io for instant chat and inquiries ("Ping Seller").
- **Authentication**: Secure JWT-based sessions, Email/Password with OTP verification (via Resend), and Google Sign-In (via Firebase).
- **AI-Assisted Listing Creation**: AI model (Google Gemma via OpenRouter) helps auto-generate professional product descriptions.
- **Image Editing & Uploads**: In-browser image cropping and fast Cloudinary-based image uploads.
- **Seller Dashboard**: Manage, edit, and delete your own active listings.
- **Security Check**: Restricted signups matching authorized college-specific `.edu` or `.ac.in` emails.

## Tech Stack

**Frontend:**
- React (Vite)
- Tailwind CSS
- Zustand (State Management)
- Socket.io-client
- Firebase (for Google Auth Popup)
- React Easy Crop, Browser Image Compression

**Backend:**
- Node.js & Express.js
- MongoDB & Mongoose
- Socket.io (Real-time events)
- Firebase Admin SDK (Google Token Verification)
- Cloudinary & Multer (Image hosting)
- Resend API (OTP emails)

## Project Structure

```
collage_marketplace/
├── client/          # Vite + React frontend application
├── server/          # Node.js + Express backend application
├── README.md        # You're reading this!
└── .gitignore       # Root ignore file for node_modules and secrets
```

## Installation

1. Copy or clone this repository to your local machine:
   ```bash
   git clone <repository-url>
   cd collage_marketplace
   ```

2. Install backend dependencies:
   ```bash
   cd server
   npm install
   ```

3. Install frontend dependencies:
   ```bash
   cd ../client
   npm install
   ```

## Environment Setup

You must provide your own environment variables to securely run this application.

1. In the `server` directory, copy `.env.example` to `.env`:
   ```bash
   cp server/.env.example server/.env
   ```
2. In the `client` directory, copy `.env.example` to `.env`:
   ```bash
   cp client/.env.example client/.env
   ```
3. Fill in the required secrets (MongoDB URI, JWT Secret, Firebase Config, Resend API key, OpenRouter API Key) in these local `.env` files.
4. **Never commit `.env` files to Git.**

## Running Locally

To run the application, you will need two separate terminal windows.

**Terminal 1 (Backend):**
```bash
cd server
npm run dev      # Alternatively: npx nodemon server.js
```

**Terminal 2 (Frontend):**
```bash
cd client
npm run dev      # Starts Vite on port 5173
```
