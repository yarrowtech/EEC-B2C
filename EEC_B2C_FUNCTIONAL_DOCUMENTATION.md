# Functional Documentation for EEC B2C

## Project Overview
- Project Name: EEC B2C
- Architecture: MERN-style web platform (React frontend + Node/Express backend + MongoDB)
- Realtime: Socket.IO global chat/events
- Payment Integrations: Razorpay (materials and package purchases)
- Storage/Media: Cloudinary (image and PDF upload)
- Notifications: In-app notifications + browser push notifications (VAPID/Web Push)
- AI Capabilities: PDF-based AI question generation + self-study question generation
- Background Services: Auto student promotion scheduler

## Technology Stack
- Frontend: React, React Router, Vite, TailwindCSS, Axios, Framer Motion, Socket.IO client
- Backend: Node.js, Express, Mongoose, JWT, Bcrypt, Socket.IO, Multer, PDF Parse
- Database: MongoDB (25 models/collections currently defined)
- Email: Nodemailer/Resend based mail services
- Security: Helmet, CORS controls, rate limiting on auth routes
- PDF: PDFKit (invoice generation), PDF.js (frontend reader support)

## Current System Scale (From Codebase)
- Total tracked source/assets files in repository: 304
- Backend route modules: 30
- Backend data models: 25

## User Roles
- Public (not logged in)
- Student
- Teacher
- Admin

## Role-wise Module Access Matrix

| Module | Public | Student | Teacher | Admin |
|---|---|---|---|---|
| Authentication & Profile | Limited | Yes | Yes | Yes |
| Dashboard | No | Yes | Yes | Yes |
| Student Management | No | No | View/Search | Full |
| Teacher Management | No | No | No | Full |
| Board/Class Management | Read only | Read only | Read only | Full CRUD |
| Subject/Topic Management | No | No | Yes | Yes |
| Question Bank | No | Limited read (metadata) | Create/Update/List | Full |
| AI Question Generator (Admin PDF to Questions) | No | No | No | Full |
| Exams & Attempts | No | Attempt + My results | Review/Admin attempt views | Full |
| Syllabus/Stage Access | No | Yes (with stage locks) | No | N/A |
| Study Materials | No | Browse/Purchase/View | Upload/Edit | Full |
| Packages & Subscriptions | Browse packages | Purchase/Manage own | Can view packages | Full package + all subscriptions |
| Wallet/Coins/Gift Redemption | No | Yes | Yes (if points enabled) | Yes + monitoring |
| Gift Card Inventory | No | Availability only | No | Full inventory management |
| Notifications | No | Receive/Read | Receive/Read | Create/Delete/Target by role |
| Push Notifications | No | Subscribe/Unsubscribe | Subscribe/Unsubscribe | Subscribe/Unsubscribe |
| Chat (Global) | No | Yes | Yes | Yes + moderation/clear |
| Mind Training Game | No | Yes | Yes | Yes |
| Self Study (AI from PDF) | No | Yes | Yes | Yes |
| CMS Content (Hero/Features/About/Career/Office/Why EEC) | Read only | Read only | Read only | Manage via settings UI |
| Newsletter Subscription | Yes | Yes | Yes | Yes |
| Promotion Engine | No | No | No | Full |

## Detailed Module Documentation

### 1. Core Authentication & Account Module
- Registration, login, JWT-based session, `/me` endpoint.
- Password reset flow with token (`forgot-password`, `reset-password/:token`).
- Role-aware guards in backend middleware (`requireAuth`, `requireAdmin`, `requireAdminOrTeacher`).
- Profile data includes academic profile, parents info, notification preferences, avatar, language.

Role Notes:
- Student/Teacher/Admin: can manage own profile and password.
- Admin: additional guarded routes across platform.

### 2. User & Academic Identity Module
- Student listing and filtering (admin/teacher access in protected endpoint).
- Teacher CRUD exists in users routes.
- Board and class entities maintained via dedicated modules.
- User supports board/class mapping, initial class, promotion tracking fields.

Role Notes:
- Admin: manages teachers and academic masters (boards/classes).
- Teacher: can access student listings.
- Student: profile-centric access only.

### 3. Teacher Verification Module
- Legal terms acceptance endpoint.
- Biometric verification endpoint.
- Marks teacher as verified before sensitive actions (e.g., study material upload for teacher role).

Role Notes:
- Teacher: completes verification flow.
- Admin: indirect governance via teacher management.

### 4. Subject, Topic, Board, Class Management Module
- CRUD for board/class (admin controlled).
- Subject/topic create, fetch, update, delete.
- Supports filtering by board/class and dynamic ObjectId/name handling.

Role Notes:
- Admin: full master-data control.
- Teacher: subject/topic operational access.

### 5. Question Bank Management Module
- Supports question creation by type, list, update, delete.
- Metadata APIs for stages, subjects, topics, types.
- Class/stage discovery endpoints available.

Question types exposed in UI include:
- MCQ single
- MCQ multiple
- Choice matrix
- True/false
- Cloze variants
- Match list
- Essay (plain/rich)

Role Notes:
- Admin: full question bank management UI.
- Teacher: backend routes support access in many flows.

### 6. AI Question Generation Module (Admin)
- PDF upload -> text extraction -> AI question generation.
- Option to return for review or auto-save into question bank.
- Test endpoint to verify local AI service connection.

Role Notes:
- Admin only.

### 7. Examination & Attempt Module
- Student exam start and submit.
- Student can fetch own attempts.
- Admin/Teacher can fetch admin attempts and attempt details.
- User results endpoint allows admin/teacher for any user and student for self.
- Class rank and leaderboard endpoints available.

Role Notes:
- Student: exam taking and personal analytics.
- Teacher/Admin: monitoring and evaluation views.

### 8. Syllabus & Stage Unlock Module
- Student dashboard shows stage-wise syllabus navigation.
- Stage 1 always unlocked.
- Additional stages unlocked through packages/subscription features.
- Backend endpoint returns user unlocked stages.

Role Notes:
- Student-centric module.

### 9. Study Materials Module
- Upload study materials (PDF) with class/board/subject/category/price/free flag.
- Student sees filtered materials by class and board.
- Secure material access route checks purchase/free status.
- Admin material management + deletion.

Purchase flows:
- Razorpay order + signature verification
- Wallet purchase
- Purchase history/invoice generation for admin
- Email confirmation after purchase

Role Notes:
- Student: browse, buy, view purchased materials.
- Teacher: upload/edit (verification required).
- Admin: full lifecycle control and purchase reporting.

### 10. Package & Subscription Module
- Public package listing for active plans.
- Admin CRUD on packages.
- Subscription creation from free flow and paid Razorpay flow.
- Updates user subscription flags, end date, unlocked stages.
- Subscription history/current status/cancel endpoint for users.
- Admin all-subscriptions reporting endpoint.

Role Notes:
- Student: buy/cancel/view own subscriptions.
- Admin: package catalogue and subscription oversight.

### 11. Wallet, Coins, Redemption & Gift Card Module
- Tracks wallet and points per user.
- Coin redemption:
  - wallet cash conversion
  - gift card redemption using inventory
- Redemption history and pending gift-card tracking.
- Gift card inventory module supports add, bulk add, filters, inventory summary, update status.

Role Notes:
- Student/Teacher: redeem and view own status.
- Admin: inventory operations and pending cases.

### 12. Notification Module
- Admin creates notifications targeted by role (`student`, `teacher`, `admin`, `all`).
- Users fetch notifications relevant to their role.
- Read, clear-all, and detail APIs available.
- Delete operation for admin.

Role Notes:
- Admin: creation and deletion.
- All logged users: consumption/read state updates.

### 13. Push Notification Module
- VAPID public key retrieval.
- Subscribe/unsubscribe browser endpoints.
- Helper to send push payload including notification deep-link.
- Invalid push endpoints auto-cleaned.

Role Notes:
- All logged users can subscribe.
- Admin-triggered notifications can cascade into push dispatch.

### 14. Chat & Realtime Communication Module
- Global chat room model via Socket.IO and REST persistence.
- Send message, fetch message history, mark read.
- Admin moderation: delete one message or clear entire chat.

Role Notes:
- Student/Teacher/Admin: participate in global chat.
- Admin: moderation controls.

### 15. Self Study AI Module
- Upload PDF and generate questions for self-practice.
- Submit answers and compute/save score.
- Results list, result detail, and user statistics APIs.

Role Notes:
- Primarily student-facing; technically available to authenticated users.

### 16. Mind Training Game Module
- Saves mind-training game results through protected endpoint.

Role Notes:
- All authenticated roles can submit game performance data.

### 17. Content/CMS Module (B2C Marketing + Static Pages)
Content entities managed via backend APIs:
- Hero settings
- Why EEC section
- Features section
- About Us page
- Career page settings
- Office page settings

Role Notes:
- Public consumes these pages.
- Admin settings UI is available in dashboard for content management.

### 18. Newsletter Module
- Public email subscription.
- Prevents duplicate active subscriptions.
- Unsubscribe flow via emailed link.

Role Notes:
- Public + all roles can subscribe.

### 19. Promotion Engine Module
- Scheduled auto-promotion starts with server boot.
- Manual admin operations:
  - run promotion
  - promote a specific user
  - reset promotion data
  - promotion statistics

Role Notes:
- Admin only.

### 20. Upload/Media Utility Module
- Image upload endpoint to Cloudinary (used in content/CMS flows).

Role Notes:
- Used by dashboard/content operations.

## Frontend Route Groups (Functional View)
- Public Pages: home, about, analytics, AI info, product advantages, careers, office, boards, support, marketing, B2B landing.
- Protected Dashboard:
  - Common: profile, dashboard home
  - Student: packages, self-study, syllabus by stage, results/achievements/materials
  - Teacher: result views, question/subject operations (as allowed)
  - Admin: student/teacher management, question management, AI generator, settings/CMS, materials upload, notifications, gift cards, purchases, subscriptions, package management

## Data Models (Collection Coverage)
Key models include:
- User, Question, Attempt, SelfStudyResult
- Class, Board, Subject, Topic
- StudyMaterial, Purchase
- Package, Subscription
- GiftCard, Redemption
- Notification, PushSubscription, ChatMessage
- HeroSetting, Features, WhyEEC, AboutUsPage, careerPageModel, officePageModel

## Integrations & External Services
- Razorpay: order creation + payment verification
- Cloudinary: PDFs/images upload and retrieval
- Web Push: browser notifications with VAPID
- Email: newsletter, purchase invoice mails, subscription mails, gift card mails
- Local/AI service: question generation from extracted PDF content

## Operational Flow Highlights
- Auth token lifecycle handled in frontend (auto logout on expiry).
- Server has CORS allowlist and localhost pattern support.
- Auth endpoints are rate limited.
- Keep-alive ping supported via env variable.
- Auto-promotion scheduler starts on backend boot.

## Known Implementation Notes (Current Code State)
- Some CMS update routes are currently not auth-protected at route level.
- Teacher management routes in `users.js` are not consistently guarded by admin middleware.
- Frontend includes role guards and protected components for many admin screens.

## Suggested Versioning Block for This Document
- Documentation Name: EEC B2C Functional Documentation
- Based On Code Snapshot: current `eec` workspace state
- Document Type: Module-wise + role-wise functional reference
- Update Policy: revise after each new module or permission change

