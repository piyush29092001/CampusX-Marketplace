# CampusX Backend

This is the Express backend for the CampusX Marketplace application.

## Local Development

Start the local server containing Socket.io integration:
```bash
npm install
npm run dev
```

Local development uses `PORT` (usually 5000), `MONGO_URI`, and other environment variables defined in `.env`.

## Vercel Deployment Configuration

The backend contains required configuration natively to deploy as a Vercel Serverless Function without any extra code changes.

### Root Directory
When deploying in Vercel, the Root Directory should be set to: `server` (or if your project is from the repo root, set the root directory in project settings accordingly).

### Build & Entry Configuration
- No specific build command is required.
- The `vercel.json` maps incoming requests at `/api/*` to the Serverless handler (`api/index.js`).
- `api/index.js` imports the Express application natively (`app.js`), maintaining standard Express route patterns without executing WebSocket endpoints.

### Required Environment Variables
Add ALL of these variables in the Vercel Dashboard BEFORE deployment:
- `MONGO_URI` *(Required: The backend now uses caching to keep DB alive in serverless environment)*
- `JWT_SECRET`
- `JWT_EXPIRE`
- `NODE_ENV`
- `GEMINI_API_KEY`
- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `FRONTEND_URL` *(Required: E.g., `https://your-frontend.vercel.app` - enables precise CORS rules for production)*

### Post-Deployment Testing
1. Visit the deployment URL: `https://your-deployment.vercel.app/api/products`
2. You should see JSON output or standard Express API responses indicating the database has successfully connected.
