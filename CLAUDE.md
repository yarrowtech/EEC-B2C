# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

EEC-B2C is a full-stack educational platform built with **React + Vite** (frontend) and **Express.js + MongoDB** (backend). It's a Learning Management System (LMS) for students with features including exams, questions, self-study, AI-powered question generation, gift cards, and gamification elements.

## Quick Start Commands

### Frontend
- **Install dependencies**: `cd frontend && npm install`
- **Development**: `npm run dev` (runs on http://localhost:5173)
- **Build**: `npm run build`
- **Lint**: `npm run lint`

### Backend
- **Install dependencies**: `cd backend && npm install`
- **Development**: `npm run dev` (runs on http://localhost:5000, uses nodemon for auto-reload)
- **Production**: `npm start`
- **Create admin user**: `npm run seed:admin`

### Database
- MongoDB database name: `eecb2c`
- Mongoose connection configured in `backend/src/config/db.js`

## Architecture Overview

### Frontend Architecture (React + Vite)

**Tech Stack:**
- React 19 with React Router v7 for SPA routing
- Vite for build/dev tooling
- Tailwind CSS (v4) for styling via `@tailwindcss/vite`
- Socket.io-client for real-time chat
- Axios with JWT token interceptor for API calls

**Key Patterns:**
- **API Client**: `frontend/src/api/client.js` - Axios instance with automatic JWT token attachment from `localStorage` key `"jwt"`
- **Context Providers**: `QuestionScopeContext` for question filtering/scoping state
- **Layout System**: `DashboardLayout` wraps authenticated routes; `Topbar`, `Navbar`, `EECFooter` are global components
- **Page Structure**: Pages in `src/pages/` organized by feature (exams, questions, admin, etc.)
- **Component Organization**: Reusable components in `src/components/` (modals, settings, auth guards, etc.)

**Notable Features:**
- PDF viewing with custom worker (`src/utils/pdfWorker.js`)
- Responsive design with Tailwind CSS
- Toast notifications via `react-toastify`
- Framer Motion for animations
- Jodit WYSIWYG editor for rich text content
- Icons via lucide-react

### Backend Architecture (Express.js + MongoDB)

**Tech Stack:**
- Express.js v5.1 for REST API
- Mongoose v8 for MongoDB ODM
- Socket.io for real-time features (chat, message broadcasts)
- JWT (jsonwebtoken) for authentication
- Bcrypt for password hashing (10 salt rounds)
- Helmet for security headers
- CORS with allowlist for localhost and production domain
- Rate limiting on auth endpoints (60 requests/minute)

**Entry Point**: `backend/src/server.js`
- Initializes Express, Socket.io, MongoDB connection
- Configures CORS, helmet, rate limiting, JSON payload limit (1MB)
- Registers 30+ route groups under `/api/*` prefix
- Socket.io broadcasts messages to global room; handles message read receipts

**API Patterns:**
- Controllers in `src/controllers/` handle business logic
- Routes in `src/routes/` define API endpoints
- Models in `src/models/` define Mongoose schemas
- Middleware in `src/middleware/` (auth, file upload handlers)
- Utils in `src/utils/` (validators, PDF generation, Razorpay integration, email sending)
- Services in `src/services/` (AI services via Gemini, local AI, mailer, auto-promotion scheduler)

**Key Models:**
- `User` - Student/teacher with roles, personal info, wallet, purchased materials
- `Question` - Supports multiple types (MCQ single/multi, cloze, essay, true-false, match, choice matrix)
- `Attempt` - Tracks question attempts with answers
- `Exam` - Collections of questions with timing
- `Subject`, `Topic` - Hierarchical content organization
- `Purchase`, `Payment` - E-commerce with Razorpay integration
- `GiftCard`, `Redemption` - Loyalty/incentive system
- `Subscription`, `Package` - Subscription management
- `ChatMessage` - Real-time chat history
- `DailyChallengeAttempt`, `SelfStudyResult` - Student progress tracking

**Authentication:**
- JWT stored in `localStorage` under key `"jwt"`
- Token generated in `backend/src/controllers/auth.js` with payload: `{sub, email, name, role, board, state, ...}`
- Google OAuth support via `google-auth-library`
- Password reset flow with email verification

**External Integrations:**
- **Cloudinary** - Image/PDF uploads (multer-storage-cloudinary)
- **Razorpay** - Payment processing
- **Gemini AI** - Question generation
- **Nodemailer/Resend** - Email sending
- **Web Push** - Push notifications

**Background Jobs:**
- Auto-promotion scheduler (`autoPromotionService.js`) - runs on server startup
- Keep-alive pings for hosted instances (configurable via `KEEP_ALIVE_*` env vars)

## Important Implementation Details

### Authentication Flow
1. User logs in with email/phone and password
2. Backend validates and returns JWT
3. Frontend stores JWT in `localStorage` under `"jwt"` key
4. API client (axios) automatically adds `Authorization: Bearer <token>` header to all requests
5. Backend auth middleware verifies JWT on protected routes

### Question Types
The system supports multiple question formats through a type field:
- `mcq-single` - Single choice MCQ
- `mcq-multi` - Multiple choice MCQ
- `true-false` - Boolean questions
- `cloze-drag`, `cloze-select`, `cloze-text` - Fill-in-the-blank variants
- `match-list` - Matching pairs
- `essay-rich`, `essay-plain` - Written responses
- `choice-matrix` - Matrix/table selection
- `upload` - File upload responses

Each question type has a corresponding React component in `frontend/src/pages/questions/`.

### Real-time Features
Socket.io is used for:
- Chat messaging (broadcasts to `global-room`)
- Message read receipts
- All users join a single `global-room` on connection

### File Uploads
- Images/PDFs: Cloudinary via `multer-storage-cloudinary`
- Career CVs: Custom multer upload middleware
- Raw webhook payloads: Express raw middleware for Razorpay

### Payment Workflow
- Products: `Package` model with pricing
- Purchases tracked in `Purchase` model
- Razorpay webhook handler at `backend/src/routes/razorpayWebhook.js`
- Invoices generated as PDF via `pdfkit`

## Environment Variables

**Frontend** (`.env.local` or via `VITE_*` prefix):
- `VITE_API_URL` - Backend API base URL (defaults to `http://localhost:5000`)

**Backend** (`.env`):
- `MONGO_URI` - MongoDB connection string
- `PORT` - Server port (default: 5000)
- `JWT_SECRET` - JWT signing secret
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `CLOUDINARY_*` - Cloudinary API credentials
- `RAZORPAY_*` - Razorpay API credentials
- `GEMINI_API_KEY` - Google Gemini AI key
- `SMTP_*` - Email service credentials
- `KEEP_ALIVE_URL`, `KEEP_ALIVE_ENABLED`, `KEEP_ALIVE_INTERVAL_MS` - Keep-alive pinging
- `NODE_ENV` - Environment (production triggers keep-alive)

## Code Organization

```
frontend/
├── src/
│   ├── pages/          # Page components (exams, questions, admin, etc.)
│   ├── components/     # Reusable UI components
│   ├── api/            # API client setup
│   ├── lib/            # Utility functions (stage.js, points.js)
│   ├── context/        # React context (QuestionScopeContext)
│   ├── hooks/          # Custom hooks
│   ├── assets/         # Static assets
│   └── App.jsx         # Main app with routing

backend/
├── src/
│   ├── controllers/    # Business logic & request handlers
│   ├── routes/         # Route definitions (30+ route groups)
│   ├── models/         # Mongoose schemas
│   ├── middleware/     # Custom middleware (auth, uploads)
│   ├── services/       # External services (AI, email, auto-promotion)
│   ├── utils/          # Utility functions (validators, PDF gen, Razorpay)
│   ├── config/         # Configuration (DB, Cloudinary, promotion rules)
│   └── server.js       # Express & Socket.io setup
├── scripts/
│   └── createAdmin.js  # Admin user seeding script
└── migrations/         # Database migrations
```

## Common Tasks

### Adding a New Question Type
1. Create controller in `backend/src/controllers/questionsController.js` if needed
2. Extend the `Question` model schema
3. Create a React component in `frontend/src/pages/questions/Questions[Type].jsx`
4. Import and register route in `frontend/src/App.jsx`

### Adding a New Route/Feature
1. Create model in `backend/src/models/[Feature].js`
2. Create controller in `backend/src/controllers/[feature]Controller.js`
3. Create route file in `backend/src/routes/[feature]Routes.js`
4. Register route in `backend/src/server.js` under `/api/[feature]`
5. Create frontend pages/components and routing

### Running Migrations
- Place migration files in `backend/src/migrations/`
- Run manually or integrate into deployment pipeline
- Example: `backend/src/migrations/fixSubjectIndexes.js`

### Adding Email Notifications
- Use functions from `backend/src/utils/sendMail.js`
- Supports welcome, password reset, and custom email templates
- Configured with Nodemailer/Resend based on env setup

## Deployment Notes

- Frontend deploys to Vercel (configured in `frontend/vercel.json`)
- CORS allows: production domain `https://eec-b2-c.vercel.app` and all `localhost:*`
- Backend supports keep-alive pings on hosted services (Render.com detection built-in)
- Rate limiting enabled on auth endpoints to prevent abuse
- 1MB JSON payload limit set on Express
