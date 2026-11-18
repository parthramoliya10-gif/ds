export type Role = "student" | "admin" | "USER" | "ADMIN";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  college?: string;
  semester?: number;
  phone?: string;
  isBlocked?: boolean;
}

export type RequestStatus =
  | "pending"
  | "quoted"
  | "advance_paid"
  | "in_progress"
  | "ready"
  | "document_uploaded"
  | "delivered"
  | "completed"
  | "cancelled"
  | "PENDING"
  | "QUOTED"
  | "IN_PROGRESS"
  | "DOCUMENT_UPLOADED"
  | "COMPLETED"
  | "CANCELLED";

export interface UploadedFile {
  id: string;
  name: string;
  size: string;
  url?: string;
  mimeType?: string;
}

export interface Request {
  id: string;
  title: string;
  subject: string;
  college: string;
  semester: number | string;
  pages: number;
  format: "typed" | "handwritten";
  deadline: string;
  status: RequestStatus;
  files: UploadedFile[];
  studentId: string;
  studentName: string;
  createdAt: string;
  updatedAt: string;
  description?: string;
  category?: string;
  priority?: string;
  totalAmount?: number;
  advanceAmount?: number;
  balanceAmount?: number;
  advancePaid: boolean;
  balancePaid: boolean;
  isDownloadUnlocked?: boolean;
  finalDocumentId?: string;
  urgent?: boolean;
}

export interface Quotation {
  id: string;
  requestId: string;
  version?: number;
  amount: number;
  advanceAmount: number;
  remainingAmount: number;
  currency?: string;
  estimatedDelivery?: string;
  estimatedDays?: number;
  status: "pending" | "accepted" | "rejected" | "SENT" | "ACCEPTED" | "REJECTED" | "EXPIRED" | "DRAFT";
  createdAt: string;
  notes?: string;
  terms?: string;
}

export interface MessageAttachment {
  name: string;
  size: string;
  url: string;
  mimeType?: string;
}

export interface Message {
  id: string;
  requestId: string;
  senderId: string;
  senderRole: "student" | "admin" | "system" | "USER" | "ADMIN";
  senderName?: string;
  senderAvatar?: string;
  content: string;
  timestamp: string;
  type: "text" | "quotation" | "file" | "system" | "TEXT" | "QUOTATION_CARD" | "FILE" | "SYSTEM";
  status: "sent" | "delivered" | "read" | "SENT" | "DELIVERED" | "READ";
  quotation?: Quotation;
  attachment?: MessageAttachment;
  metadata?: any;
}

export interface Payment {
  id: string;
  requestId: string;
  requestTitle?: string;
  studentId: string;
  amount: number;
  currency?: string;
  milestone: "advance" | "remaining" | "full" | "ADVANCE_50" | "FINAL_50";
  status: "pending" | "completed" | "failed" | "PENDING" | "SUCCESS" | "FAILED";
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  transactionId?: string;
  receiptUrl?: string;
  paidAt?: string;
  createdAt?: string;
}

export interface FinalDocument {
  id: string;
  requestId: string;
  fileName: string;
  fileSize: string;
  pageCount?: number;
  fileUrl: string;
  secureUrl?: string;
  isLocked: boolean;
  version?: number;
  downloadCount?: number;
  uploadedAt: string;
  createdAt?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}
