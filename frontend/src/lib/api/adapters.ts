import {
  Request,
  Quotation,
  Payment,
  FinalDocument,
  Message,
  User,
  UploadedFile,
} from "@/types";

export function adaptProfileToUser(profile: any): User {
  if (!profile) {
    return {
      id: "anonymous",
      name: "Anonymous User",
      email: "",
      role: "student",
    };
  }

  const roleNormalized =
    profile.role?.toUpperCase() === "ADMIN" ? "admin" : "student";

  return {
    id: profile.id,
    name: profile.fullName || profile.email?.split("@")[0] || "User",
    email: profile.email || "",
    role: roleNormalized,
    avatar: profile.avatarUrl || undefined,
    phone: profile.phone || undefined,
    isBlocked: profile.isBlocked || false,
    college:
      (typeof window !== "undefined" && localStorage.getItem("dsms_user_college")) ||
      profile.college ||
      "University Student",
    semester:
      (typeof window !== "undefined" && localStorage.getItem("dsms_user_semester")
        ? parseInt(localStorage.getItem("dsms_user_semester")!, 10)
        : profile.semester) || 1,
  };
}

export function parseAcademicDetails(description?: string) {
  if (!description) return {};

  const collegeMatch = description.match(/College:\s*([^|\n\r]+)/i);
  const semesterMatch = description.match(/Semester:\s*([^|\n\r]+)/i);
  const pagesMatch = description.match(/(?:Target Pages|Pages):\s*(\d+)/i);
  const formatMatch = description.match(/Format:\s*(typed|handwritten)/i);
  const subjectMatch = description.match(/Subject:\s*([^|\n\r]+)/i);

  return {
    college: collegeMatch ? collegeMatch[1].trim() : undefined,
    semester: semesterMatch ? semesterMatch[1].trim() : undefined,
    pages: pagesMatch ? parseInt(pagesMatch[1].trim(), 10) : undefined,
    format: formatMatch ? (formatMatch[1].trim().toLowerCase() as "typed" | "handwritten") : undefined,
    subject: subjectMatch ? subjectMatch[1].trim() : undefined,
  };
}

export function adaptRequestToFrontend(backendReq: any): Request {
  if (!backendReq) return {} as Request;

  const academic = parseAcademicDetails(backendReq.description);

  const quotations = backendReq.quotations || [];
  const latestQuotation = quotations[0] || null;

  const payments = backendReq.payments || [];
  const advancePayment = payments.find(
    (p: any) =>
      p.milestone === "ADVANCE_50" &&
      (p.status === "SUCCESS" || p.status === "completed")
  );
  const finalPayment = payments.find(
    (p: any) =>
      p.milestone === "FINAL_50" &&
      (p.status === "SUCCESS" || p.status === "completed")
  );

  const files: UploadedFile[] = (backendReq.referenceFiles || []).map((rf: any) => ({
    id: rf.id,
    name: rf.fileName || "reference-file",
    size: rf.fileSize ? `${(rf.fileSize / (1024 * 1024)).toFixed(1)} MB` : "1.0 MB",
    url: rf.fileUrl,
    mimeType: rf.mimeType,
  }));

  const finalDocs = backendReq.finalDocuments || [];
  const primaryFinalDoc = finalDocs[0];

  // Amount conversion: backend stores in cents/paise (e.g. 140000 = 1400)
  const totalAmount = latestQuotation ? Math.round(latestQuotation.totalAmount / 100) : 0;
  const advanceAmount = latestQuotation ? Math.round(latestQuotation.advanceAmount / 100) : 0;
  const balanceAmount = latestQuotation ? Math.round(latestQuotation.remainingAmount / 100) : 0;

  return {
    id: backendReq.id,
    title: backendReq.title,
    subject: backendReq.category || academic.subject || "General Document",
    college: backendReq.college || academic.college || (backendReq.user && backendReq.user.college) || "University Student",
    semester: backendReq.semester ? String(backendReq.semester) : (academic.semester || "1"),
    pages: backendReq.pages || academic.pages || 10,
    format: backendReq.format || academic.format || "typed",
    deadline: backendReq.createdAt
      ? new Date(new Date(backendReq.createdAt).getTime() + 48 * 3600 * 1000).toISOString()
      : new Date().toISOString(),
    status: backendReq.status?.toLowerCase() || "pending",
    files,
    studentId: backendReq.userId || (backendReq.user && backendReq.user.id) || "",
    studentName:
      (backendReq.user && (backendReq.user.fullName || backendReq.user.email)) ||
      "Student",
    createdAt: backendReq.createdAt || new Date().toISOString(),
    updatedAt: backendReq.updatedAt || new Date().toISOString(),
    description: backendReq.description,
    category: backendReq.category,
    priority: backendReq.priority,
    totalAmount: totalAmount || undefined,
    advanceAmount: advanceAmount || undefined,
    balanceAmount: balanceAmount || undefined,
    advancePaid: Boolean(advancePayment),
    balancePaid: Boolean(finalPayment),
    isDownloadUnlocked: Boolean(backendReq.isDownloadUnlocked),
    finalDocumentId: primaryFinalDoc?.id,
    urgent: backendReq.priority === "URGENT" || backendReq.priority === "HIGH",
    unreadCount: backendReq.conversation?._count?.messages ?? backendReq.unreadCount ?? 0,
    lastMessage: backendReq.conversation?.messages?.[0]
      ? {
          content: backendReq.conversation.messages[0].content,
          createdAt: backendReq.conversation.messages[0].createdAt,
          senderRole: backendReq.conversation.messages[0].senderRole,
        }
      : undefined,
  };
}

export function adaptQuotationToFrontend(backendQuot: any): Quotation {
  if (!backendQuot) return {} as Quotation;

  const total = Math.round((backendQuot.totalAmount || 0) / 100);
  const advance = Math.round((backendQuot.advanceAmount || 0) / 100);
  const balance = Math.round((backendQuot.remainingAmount || 0) / 100);

  let status: "pending" | "accepted" | "rejected" = "pending";
  if (backendQuot.status === "ACCEPTED") status = "accepted";
  if (backendQuot.status === "REJECTED" || backendQuot.status === "EXPIRED") status = "rejected";

  return {
    id: backendQuot.id,
    requestId: backendQuot.requestId,
    version: backendQuot.version,
    amount: total,
    advanceAmount: advance,
    remainingAmount: balance,
    currency: backendQuot.currency || "INR",
    estimatedDelivery: backendQuot.estimatedDays
      ? `Within ${backendQuot.estimatedDays} Days`
      : "Within 48 Hours",
    estimatedDays: backendQuot.estimatedDays,
    status,
    createdAt: backendQuot.createdAt || new Date().toISOString(),
    notes: backendQuot.terms || "Standard 50-50 milestone escrow.",
    terms: backendQuot.terms,
  };
}

export function adaptPaymentToFrontend(backendPayment: any): Payment {
  if (!backendPayment) return {} as Payment;

  const amount = Math.round((backendPayment.amount || 0) / 100);
  const milestone =
    backendPayment.milestone === "ADVANCE_50" ? "advance" : "remaining";
  const status =
    backendPayment.status === "SUCCESS"
      ? "completed"
      : backendPayment.status === "FAILED"
      ? "failed"
      : "pending";

  return {
    id: backendPayment.id,
    requestId: backendPayment.requestId,
    requestTitle: backendPayment.request?.title || "Document Request",
    studentId: backendPayment.userId,
    amount,
    currency: backendPayment.currency || "INR",
    milestone,
    status,
    razorpayOrderId: backendPayment.razorpayOrderId,
    razorpayPaymentId: backendPayment.razorpayPaymentId,
    transactionId: backendPayment.razorpayPaymentId || backendPayment.razorpayOrderId,
    receiptUrl: backendPayment.receiptUrl,
    paidAt: backendPayment.paidAt || backendPayment.updatedAt,
    createdAt: backendPayment.createdAt,
  };
}

export function adaptFinalDocumentToFrontend(backendDoc: any): FinalDocument {
  if (!backendDoc) return {} as FinalDocument;

  return {
    id: backendDoc.id,
    requestId: backendDoc.requestId,
    fileName: backendDoc.fileName || backendDoc.title || "Document.pdf",
    fileSize: backendDoc.fileSize
      ? `${(backendDoc.fileSize / 1024).toFixed(1)} KB`
      : "1.2 MB",
    fileUrl: backendDoc.secureUrl || "#",
    secureUrl: backendDoc.secureUrl,
    isLocked: !backendDoc.secureUrl && !backendDoc.request?.isDownloadUnlocked,
    version: backendDoc.version || 1,
    downloadCount: backendDoc.downloadCount || 0,
    uploadedAt: backendDoc.createdAt || new Date().toISOString(),
    createdAt: backendDoc.createdAt,
  };
}

export function adaptMessageToFrontend(backendMsg: any): Message {
  if (!backendMsg) return {} as Message;

  const role =
    backendMsg.senderRole?.toUpperCase() === "ADMIN" ? "admin" : "student";

  const isDeletedForEveryone = Boolean(
    backendMsg.isDeletedForEveryone || backendMsg.metadata?.isDeletedForEveryone
  );

  let type: "text" | "quotation" | "file" | "system" = "text";
  if (!isDeletedForEveryone) {
    if (backendMsg.messageType === "QUOTATION_CARD") type = "quotation";
    else if (backendMsg.messageType === "FILE") type = "file";
    else if (backendMsg.messageType === "SYSTEM") type = "system";
  }

  let status: "sent" | "delivered" | "read" = "sent";
  if (backendMsg.status === "READ") status = "read";
  else if (backendMsg.status === "DELIVERED") status = "delivered";

  let quotation: Quotation | undefined;
  if (!isDeletedForEveryone && backendMsg.metadata && backendMsg.metadata.quotation) {
    quotation = adaptQuotationToFrontend(backendMsg.metadata.quotation);
  }

  let attachment = undefined;
  if (!isDeletedForEveryone && backendMsg.metadata && backendMsg.metadata.attachment) {
    attachment = {
      name: backendMsg.metadata.attachment.fileName || "attachment",
      size: backendMsg.metadata.attachment.fileSize
        ? `${(backendMsg.metadata.attachment.fileSize / 1024).toFixed(1)} KB`
        : "File",
      url: backendMsg.metadata.attachment.fileUrl || "#",
      mimeType: backendMsg.metadata.attachment.mimeType,
    };
  }

  return {
    id: backendMsg.id,
    requestId: backendMsg.conversation?.requestId || backendMsg.requestId || "",
    senderId: backendMsg.senderId,
    senderRole: role,
    senderName: backendMsg.sender?.fullName || backendMsg.sender?.email || "User",
    senderAvatar: backendMsg.sender?.avatarUrl || undefined,
    content: isDeletedForEveryone ? "This message was deleted" : backendMsg.content,
    timestamp: backendMsg.createdAt || new Date().toISOString(),
    type,
    status,
    quotation,
    attachment,
    metadata: backendMsg.metadata,
    isDeletedForEveryone,
  };
}
