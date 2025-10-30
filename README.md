# 🎉 Scribble Blog

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20-green)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0-green)](https://www.mongodb.com/)

A modern, full‑stack blogging platform featuring authentication, rich content, real‑time interactions, AI suggestions, analytics, and payments.

---

## 📚 Table of Contents
- [Features](#-features)
- [Tech Stack](#%EF%B8%8F-tech-stack)
- [Monorepo Structure](#%EF%B8%8F-monorepo-structure)
- [Environment Variables](#%EF%B8%8F-environment-variables)
- [Install & Run Locally](#-install--run-locally)
- [API Overview](#-api-overview)
- [Frontend Highlights](#-frontend-highlights)
- [Real-time (SocketIO)](#-real-time-socketio)
- [Stripe Setup](#-stripe-setup)
- [AI Suggestions](#-ai-suggestions)
- [Security & Best Practices](#%EF%B8%8F-security--best-practices)
- [Testing](#-testing)
- [Deployment Notes](#-deployment-notes)
- [Roadmap](#-roadmap)
- [License](#-license)

---

## 🚀 Features

### 🔐 Authentication
- JWT + Refresh Tokens
- Google OAuth (planned UI)
- Role-based access control (Reader / Author / Admin)

### 📝 Posts
- Drafts & publishing
- Tags, categories, slugs, SEO, reading time
- Bookmarks, likes, and shares
- Images and rich media support

### 💬 Comments
- Threaded replies
- Likes, edit/delete
- Real-time updates via Socket.IO

### 🤖 AI Suggestions
- Hugging Face API for content generation
- Graceful fallback to rule-based suggestions

### 📊 Analytics
- Views, engagement (likes/comments/bookmarks/shares)
- Monthly & daily trends

### 🔔 Notifications
- In-app notifications
- Optional email notifications

### 🔍 Search
- Full-text search
- Suggestions, trending tags/categories

### 💳 Payments
- Stripe one-off payments & subscriptions
- Webhooks included

### 📁 File Uploads
- Multer + static file serving

### 🛡️ Security
- Helmet CSP, rate limiting
- XSS & NoSQL sanitization, HPP

### 🎨 Frontend
- React + Vite
- Tailwind CSS
- Framer Motion animations
- React Query for data fetching
- Toast notifications

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express, Mongoose, Socket.IO, Stripe, Nodemailer |
| Frontend | React 19, Vite, Tailwind CSS, React Router, Framer Motion, React Query |
| Tooling | ESLint, Nodemon, Vitest, Chart.js |

---

## 🗂️ Monorepo Structure

```text
Scribble_blog/
├─ backend/
│  ├─ controllers/
│  ├─ middleware/
│  ├─ models/
│  ├─ routes/
│  ├─ services/
│  ├─ socket/
│  └─ server.js
└─ frontend/
   ├─ src/ (components, pages, context, hooks, utils)
   └─ vite.config.js
```

---

## ⚙️ Environment Variables

### Backend `.env`
```bash
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

# Email
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

### Frontend `.env`
```bash
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_STRIPE_PUBLISHABLE_KEY=
VITE_GOOGLE_CLIENT_ID=
VITE_APP_NAME=Scribble Blog
```

---

## 🏁 Install & Run Locally

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

- Vite dev server: http://localhost:5173
- API server: http://localhost:5000

---

## 📜 API Overview

Base URL: `/api`

### Auth & Users (`/api/users`)
- `POST /register`, `POST /login`, `POST /google-auth`
- `GET /profile`, `PUT /profile`
- Follow/unfollow: `POST /:userId/follow`, `DELETE /:userId/follow`
- Public profile: `GET /:username`

### Posts (`/api/posts`)
- CRUD: `GET /`, `POST /`, `PUT /:id`, `DELETE /:id`
- Likes & bookmarks: `POST /:id/like`, `POST /:id/bookmark`
- Trending & featured: `GET /trending`, `GET /featured`

### Comments (`/api/comments`)
- `GET /:postId`, `POST /`, `PUT /:id`, `DELETE /:id`
- Like: `POST /:id/like`

### AI (`/api/ai`)
- `POST /suggest`

### Payments (`/api/payments`)
- `POST /create-payment-intent`, `POST /create-subscription`
- `GET /subscription`, `POST /cancel-subscription`
- `POST /webhook`

### Notifications (`/api/notifications`)
- `GET /`, `GET /unread-count`
- `PUT /:id/read`, `PUT /mark-all-read`
- `DELETE /:id`

### Search (`/api/search`)
- `GET /posts`, `GET /users`
- `GET /suggestions`, `GET /tags/popular`, `GET /categories/popular`

---

## 🌟 Frontend Highlights
- Global Providers: `AuthProvider`, `SocketProvider`, `QueryClientProvider`
- Pages: Home, SignIn, SignUp, Profile, Create/Edit Post, Post Detail, Analytics, Search, Favorites, Notifications, Settings, Pricing, Admin
- Components: Modern header, buttons, inputs, loading spinner, error boundary
- Styling: Tailwind CSS + Framer Motion animations

---

## 🔗 Real-time (SocketIO)
- Rooms: `user_{id}` for notifications, `post_{id}` for comments/typing/likes
- Connection setup: `backend/server.js` + `frontend/src/context/SocketContext.jsx`

---

## 💳 Stripe Setup
- Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`
- In development:

```bash
stripe listen --forward-to localhost:5000/api/payments/webhook
```

---

## 🤖 AI Suggestions
- Uses Hugging Face API
- If missing API key, falls back to simple rule-based suggestions

---

## 🛡️ Security & Best Practices
- Helmet CSP, rate limiter, XSS/NoSQL sanitize, HPP
- Role-based route protection via middleware
- Input validation via `express-validator`
- Sensitive keys managed via `.env`

---

## 🧪 Testing
- Backend: Jest + Supertest
- Frontend: Vitest + React Testing Library

---

## 🚀 Deployment Notes
- Build frontend: `cd frontend && npm run build`
- Serve backend: `cd backend && npm start`
- Use a reverse proxy (Nginx) with SSL for production

---

## 📈 Roadmap
- Rich text editor UI
- Media management
- Admin moderation tools
- Email templates & in-app inbox
- Push notifications
- Advanced analytics dashboards & exports

---

## 📝 License
MIT License

Made with ❤️ by the Scribble Blog Team
