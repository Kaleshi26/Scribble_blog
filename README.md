# Scribble Blog

A modern, full‑stack blogging platform with authentication, rich content, real‑time interactions, AI suggestions, analytics, and payments.

## Features
- Authentication: JWT, refresh tokens, Google OAuth (planned UI), role-based access
- Posts: drafts, publish, tags, categories, images, bookmarks, likes, slugs, SEO, reading time
- Comments: threaded replies, likes, edit/delete, live updates via Socket.IO
- AI: content suggestions via Hugging Face API with graceful fallback
- Analytics: views, engagement (likes/comments/bookmarks/shares), monthly/daily trends
- Notifications: in-app + (optional) email
- Search: full-text search, suggestions, popular tags/categories
- Payments: Stripe one-off payments and subscriptions (webhooks included)
- File uploads: Multer + static serving
- Security: Helmet, CORS, rate limiting, XSS/NoSQL sanitization, HPP
- Frontend: React + Vite, Tailwind CSS, Framer Motion, React Query, Toasts

## Tech Stack
- Backend: Node.js, Express, Mongoose/MongoDB, Socket.IO, Stripe, Nodemailer
- Frontend: React 19, Vite, Tailwind CSS, React Router, React Query, Framer Motion
- Tooling: ESLint, Nodemon, Vitest (+ RTL), Chart.js

## Monorepo Structure
```
Scribble_blog/
  backend/
    controllers/   middleware/   models/   routes/   services/   socket/
    server.js
  frontend/
    src/ (components, pages, context, hooks, utils)
    vite.config.js
```

## Environment Variables
Create a .env in backend/ using the template below. Do not commit secrets.

```
# Database
MONGO_URI=mongodb://localhost:27017/scribble_blog
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=replace_me
REFRESH_TOKEN_SECRET=replace_me
JWT_EXPIRE=7d
REFRESH_TOKEN_EXPIRE=30d

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASS=

# AI
HUGGINGFACE_API_KEY=
OPENAI_API_KEY=

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

Frontend (.env) at frontend/:
```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_STRIPE_PUBLISHABLE_KEY=
VITE_GOOGLE_CLIENT_ID=
VITE_APP_NAME=Scribble Blog
```

## Install & Run (Local)
1) Backend
```
cd backend
npm install
npm run dev
```
2) Frontend
```
cd frontend
npm install
npm run dev
```
- Vite dev server runs at http://localhost:5173
- API server runs at http://localhost:5000 (proxy configured)

## NPM Scripts
- Backend
  - dev: start with nodemon
  - start: node server.js
  - test | test:watch | test:coverage: Jest tests (when added)
- Frontend
  - dev | build | preview | lint
  - test | test:ui (Vitest)

## API Overview
Base URL: /api

- Auth/Users (/api/users)
  - POST /register, POST /login, POST /google-auth
  - GET /profile, PUT /profile
  - POST /forgot-password, POST /reset-password
  - GET /:username (public profile)
  - POST/DELETE /:userId/follow, GET /:userId/followers, GET /:userId/following

- Posts (/api/posts)
  - GET / (filter: tag, category, search, author, sort, page, limit)
  - GET /trending, GET /featured
  - GET /:id
  - POST / (auth, multipart images)
  - PUT /:id (auth, multipart images)
  - DELETE /:id (auth)
  - POST /:id/like (auth)
  - POST /:id/bookmark (auth)
  - GET /user/bookmarks (auth)

- Comments (/api/comments)
  - GET /:postId (paginated)
  - POST / (auth)
  - PUT /:id (auth)
  - DELETE /:id (auth/admin)
  - POST /:id/like (auth)

- AI (/api/ai)
  - POST /suggest (auth)

- Payments (/api/payments)
  - POST /create-payment-intent (auth)
  - POST /create-subscription (auth)
  - GET /subscription (auth)
  - POST /cancel-subscription (auth)
  - POST /webhook (Stripe webhook)

- Notifications (/api/notifications)
  - GET / (auth, paginated)
  - GET /unread-count (auth)
  - PUT /:id/read (auth)
  - PUT /mark-all-read (auth)
  - DELETE /:id (auth)

- Search (/api/search)
  - GET /posts, GET /users
  - GET /suggestions, GET /tags/popular, GET /categories/popular

## Frontend Highlights
- Global providers: AuthProvider, SocketProvider, QueryClientProvider
- Pages: Home, SignIn, SignUp, Profile, Create/Edit Post, Post Detail, Analytics, Search, Favorites, Following, Notifications, Settings, Pricing, Admin
- Components: modern header, buttons, inputs, loading spinner, error boundary
- Styling: Tailwind CSS + Framer Motion animations

## Real-time (Socket.IO)
- Connection initialized in backend/server.js and frontend SocketContext
- Rooms: user_«id» for notifications, post_«id» for comments/typing/likes

## Stripe Setup
- Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET
- Expose webhook in development (e.g., `stripe listen --forward-to localhost:5000/api/payments/webhook`)
- Frontend uses VITE_STRIPE_PUBLISHABLE_KEY

## AI Suggestions
- If HUGGINGFACE_API_KEY is absent, a simple rule-based fallback returns titles/outlines/keywords

## Security & Best Practices
- Helmet CSP, rate limiter, XSS/NoSQL sanitize, HPP
- Role-based route protection via middleware
- Input validation via express-validator
- Sensitive keys only via env vars

## Testing
- Backend: Jest + Supertest (scaffolded in package.json)
- Frontend: Vitest + React Testing Library

## Deployment Notes
- Build frontend: `cd frontend && npm run build`
- Serve backend: `cd backend && npm start`
- Ensure env vars set in the deployment environment
- Optionally run behind a reverse proxy (e.g., Nginx) with SSL

## Roadmap
- Rich text editor (UI), media management, admin moderation tools
- Email templates, in-app inbox, push notifications
- Advanced analytics dashboards & exports

## License
MIT (customize as needed)
