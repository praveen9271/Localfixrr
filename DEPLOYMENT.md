# LocalFixr Deployment Checklist

## Frontend: Vercel

Use the root `vercel.json` when deploying from the repository root.

- Build command: `cd client && npm run build`
- Install command: `cd client && npm install`
- Output directory: `client/dist`

The Vercel config proxies `/api/*` to the Render backend, so the frontend can safely fall back to `/api` in production.

Optional Vercel environment variables:

```env
VITE_API_TIMEOUT_MS=15000
VITE_PRODUCTION_API_URL=https://localfixr.onrender.com/api
```

Do not push `client/.env`.

## Backend: Render

Deploy the `server` folder as a Node web service.

- Build command: `npm install`
- Start command: `npm start`
- Runtime: Node 20 or newer

Required Render environment variables:

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=your-mongodb-atlas-uri
JWT_SECRET=use-a-long-random-production-secret
CLIENT_URL=https://your-vercel-domain.vercel.app
```

Recommended Render environment variables:

```env
API_RATE_LIMIT_MAX=300
AUTH_RATE_LIMIT_MAX=30
OTP_RATE_LIMIT_MAX=10
CHAT_RATE_LIMIT_MAX=25
MONGODB_TIMEOUT_MS=30000
MONGODB_RETRY_MS=30000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@example.com
SMTP_PASS=your-email-app-password
EMAIL_FROM="LocalFixr <your-email@example.com>"
OTP_SECRET=use-a-different-long-random-secret
ADMIN_EMAIL=admin@example.com
GEMINI_API_KEY=your-gemini-key
GEMINI_MODEL=gemini-2.5-flash
ALLOW_LEGACY_REGISTER=false
```

Do not push `server/.env`.

## MongoDB Atlas

- Add the Render outbound IP address to Atlas Network Access.
- During testing only, you can temporarily allow `0.0.0.0/0`.
- Use a database user with a strong password and only the permissions this app needs.

## Local Development

Client `client/.env`:

```env
VITE_LOCAL_API_URL=http://localhost:5000/api
VITE_PRODUCTION_API_URL=https://localfixr.onrender.com/api
```

Server `server/.env` must contain local values for `MONGODB_URI`, `JWT_SECRET`, SMTP, and any API keys you use.

## Verification

Run these before deploying:

```bash
cd server
npm test

cd ../client
npm run lint
npm run build
```
