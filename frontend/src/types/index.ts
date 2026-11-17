export type Role = "student" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  college?: string;
  semester?: number;
}

export type RequestStatus =
  | "pending"
  | "quoted"
  | "advance_paid"
  | "in_progress"
  | "ready"
  | "delivered"
  | "completed";

export interface UploadedFile {
  id: string;
  name: string;
  size: string;
  url?: string;
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
  totalAmount?: number;
  advanceAmount?: number;
  balanceAmount?: number;
  advancePaid: boolean;
  balancePaid: boolean;
  finalDocumentId?: string;
  urgent?: boolean;
}

export interface Quotation {
  id: string;
  requestId: string;
  amount: number;
  advanceAmount: number;
  remainingAmount: number;
  estimatedDelivery: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  notes?: string;
}

export interface MessageAttachment {
  name: string;
  size: string;
  url: string;
}

export interface Message {
  id: string;
  requestId: string;
  senderId: string;
  senderRole: "student" | "admin" | "system";
  content: string;
  timestamp: string;
  type: "text" | "quotation" | "file" | "system";
  status: "sent" | "delivered" | "read";
  quotation?: Quotation;
  attachment?: MessageAttachment;
}

export interface Payment {
  id: string;
  requestId: string;
  requestTitle?: string;
  studentId: string;
  amount: number;
  milestone: "advance" | "remaining" | "full";
  status: "pending" | "completed" | "failed";
  transactionId?: string;
  paidAt?: string;
}

export interface FinalDocument {
  id: string;
  requestId: string;
  fileName: string;
  fileSize: string;
  pageCount: number;
  fileUrl: string;
  isLocked: boolean;
  uploadedAt: string;
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
