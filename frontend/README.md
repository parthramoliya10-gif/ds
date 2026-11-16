# Frontend Architecture & Developer Guide (For Prutha)

Welcome to the **Document Service Management System** frontend repository!
This frontend is designed using **Next.js (App Router)** and **Tailwind CSS**.

---

## 📁 Directory Structure Breakdown

```text
frontend/
├── public/                      # Static icons, logos, illustrations
└── src/
    ├── app/                     # Next.js App Router (File-based routing)
    │   ├── (marketing)/         # Public SEO Landing Pages (Shared public header & footer)
    │   │   ├── page.tsx         # Home Landing Page
    │   │   ├── services/        # Service details
    │   │   ├── how-it-works/    # How the 50-50 milestone process works
    │   │   ├── about/           # About Us
    │   │   └── contact/         # Contact & inquiry form
    │   │
    │   ├── (auth)/              # Authentication Screens
    │   │   ├── login/           # Google OAuth & Email login
    │   │   ├── register/        # Registration with Email OTP
    │   │   ├── forgot-password/ # Password reset via email link
    │   │   └── auth/callback/   # Supabase OAuth redirect handler
    │   │
    │   └── (dashboard)/         # Protected Portals
    │       ├── user/            # USER PORTAL
    │       │   ├── dashboard/   # Request summary, quick actions, payment notices
    │       │   ├── requests/    # New request submission, status timeline
    │       │   ├── chat/        # WhatsApp-style chat with Admin per request
    │       │   ├── documents/   # Download final documents (locked until 100% payment)
    │       │   └── payments/    # Milestone payments (50% advance / 50% completion) & bills
    │       │
    │       └── admin/           # ADMIN PORTAL
    │           ├── dashboard/   # Metrics: Total requests, revenue, pending actions
    │           ├── requests/    # Review requests, reference files, create quotations
    │           ├── chat/        # Admin real-time chat with users per request
    │           ├── documents/   # Final completed document upload
    │           └── payments/    # Quotations, received payments, transaction logs
    │
    ├── components/
    │   ├── ui/                  # Buttons, Modals, Inputs, Badges, Tabs
    │   ├── marketing/           # Hero, Features, Testimonials, FAQ components
    │   ├── chat/                # WhatsApp-style UI: MessageBubble, QuotationCard, TypingIndicator
    │   ├── documents/           # UploadDropzone, StatusTimeline, LockedDownloadButton
    │   └── payments/            # MilestoneProgressBar, RazorpayCheckoutModal
    │
    ├── context/                 # SocketContext, AuthContext
    ├── hooks/                   # useSocket, useAuth, useRazorpay
    ├── lib/                     # Supabase client, API axios/fetch wrapper
    ├── types/                   # Shared TypeScript models (Request, Message, Quotation, Payment)
    └── styles/                  # Tailwind globals.css
```

---

## 🎨 UI Guidelines & Key Features

1. **WhatsApp-Style Chat UI**:
   - Message status indicator ticks: Sent (1 tick), Delivered (2 ticks), Read (2 blue ticks).
   - Typing indicator (`"Admin is typing..."`).
   - Online / Offline presence badge.
   - Interactive **Payment Quotation Card** directly inside the chat feed with an "Accept & Pay 50% Advance" button.

2. **Milestone Payment Flow**:
   - Total amount is divided into 2 milestones:
     - **Milestone 1**: 50% Advance (enables Admin to begin work).
     - **Milestone 2**: 50% Remaining (unlocks final document download button).
   - Integrate Razorpay standard checkout modal using the order ID supplied by the backend API.

3. **Secure Document Download**:
   - Documents are **never public**.
   - Download button remains disabled until the backend confirms both milestones are 100% paid.
   - Clicking download calls backend endpoint `/api/v1/documents/:id/download` which yields a time-limited signed download link.

---

For questions or backend endpoint contract details, reach out to Gautam or inspect backend route definitions.
