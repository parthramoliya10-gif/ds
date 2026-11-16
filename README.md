# Document Service Management System

A production-grade, secure Document Service Management platform with real-time consultation, milestone-based payments (50% advance / 50% completion), and controlled authenticated document delivery.

---

## 🏗 Architecture Overview

- **Frontend (`/frontend`)**: Next.js (App Router) + Tailwind CSS + Supabase Auth client + Socket.IO client.
- **Backend (`/backend`)**: Node.js + Express + TypeScript + Prisma ORM (Supabase PostgreSQL) + Socket.IO + Cloudinary (Private Assets) + Razorpay + Upstash Redis + Resend.

---

## 👥 Roles & Responsibilities

- **Frontend Development**: Handled by Prutha (see [`frontend/README.md`](./frontend/README.md) for details).
- **Backend Development**: Handled by Gautam & AI Agent (see [`backend/README.md`](./backend/README.md) for details).

---

## 🚀 Git & Branching Strategy

- `main`: Production-ready, stable releases only.
- `feature/backend-core`: Active development branch for the backend architecture, database modeling, authentication, payment, and real-time chat modules.
