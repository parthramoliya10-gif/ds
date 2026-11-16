# Document Service Backend

Production-grade, modular Node.js + Express + TypeScript backend for the Document Service Management System.

---

## 🛠 Tech Stack

- **Runtime & Framework**: Node.js & Express with TypeScript.
- **Database & ORM**: PostgreSQL via Supabase + Prisma ORM.
- **Authentication**: Supabase Auth (JWT + HttpOnly Cookie / Authorization Bearer validation).
- **Real-Time Communication**: Socket.IO (Request-wise chat rooms, typing indicators, read receipts).
- **Payment Gateway**: Razorpay (50% Advance + 50% Completion Milestones, HMAC-SHA256 Webhooks).
- **Private Storage**: Cloudinary (Authenticated & Signed private downloads).
- **Cache & Rate Limiting**: Upstash Redis + `@upstash/ratelimit`.
- **Email Service**: Resend.
- **Validation & Security**: Zod, Helmet, CORS, Audit Logging.

---

## 🚀 Setup & Local Development

1. **Install dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and fill in credentials:
   ```bash
   cp .env.example .env
   ```

3. **Prisma Setup**:
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

4. **Run Server**:
   ```bash
   npm run dev
   ```
