import { jsPDF } from "jspdf";
import { Payment } from "@/types";
import { formatCurrencyINR, formatDateTime } from "./utils";

export interface InvoiceDetails {
  studentName?: string;
  studentEmail?: string;
  college?: string;
  taskTitle?: string;
  subject?: string;
}

/**
 * Generates and downloads an official, print-ready Tax Invoice PDF
 * directly to the user's computer.
 */
export function downloadTaxInvoice(
  payment: Payment,
  details: InvoiceDetails = {}
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const invoiceNumber = `INV-${(payment.transactionId || payment.id).slice(0, 8).toUpperCase()}`;
  const paidDateFormatted = payment.paidAt
    ? formatDateTime(payment.paidAt)
    : formatDateTime(payment.createdAt || new Date().toISOString());

  const milestoneLabel =
    payment.milestone === "advance" || payment.milestone === "ADVANCE_50"
      ? "50% Advance Milestone Deposit"
      : "50% Final Milestone Balance";

  const taskTitle = details.taskTitle || payment.requestTitle || "Academic Document Service";
  const studentName = details.studentName || "University Student";
  const college = details.college || "University Student";
  const amountFormatted = formatCurrencyINR(payment.amount);
  const txnId = payment.transactionId || payment.id;

  // ==========================================
  // 1. TOP HEADER (Brand & Invoice Metadata)
  // ==========================================
  // Brand Logo / Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text("DSMS", 20, 22);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text("Document Service Management System", 20, 28);
  doc.text("Secure University Academic Escrow Gateway", 20, 33);

  // Invoice Title & Meta (Right aligned)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text("TAX INVOICE", 190, 22, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Invoice No: ${invoiceNumber}`, 190, 28, { align: "right" });
  doc.text(`Date & Time: ${paidDateFormatted}`, 190, 33, { align: "right" });

  // Status Badge: "PAID & SETTLED"
  doc.setFillColor(236, 253, 245); // emerald-50
  doc.setDrawColor(16, 185, 129); // emerald-500
  doc.setLineWidth(0.3);
  doc.roundedRect(138, 37, 52, 7, 2, 2, "FD");

  doc.setTextColor(4, 120, 87); // emerald-700
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("PAYMENT COMPLETED (PAID)", 164, 41.8, { align: "center" });

  // Divider Line
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.5);
  doc.line(20, 48, 190, 48);

  // ==========================================
  // 2. BILLED TO & PAYMENT INFO (2 Columns)
  // ==========================================
  // Left Column: Billed To
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("BILLED TO (STUDENT)", 20, 56);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(studentName, 20, 62);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(college, 20, 67);
  doc.text(`Student ID: ${payment.studentId ? payment.studentId.slice(0, 18) : "Verified User"}`, 20, 72);

  // Right Column: Payment Details
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("TRANSACTION DETAILS", 115, 56);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text("Transaction ID:", 115, 62);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(txnId.slice(0, 22), 145, 62);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text("Gateway Ref:", 115, 67);
  doc.text(payment.razorpayPaymentId || "rzp_live_escrow", 145, 67);

  doc.text("Payment Method:", 115, 72);
  doc.text("Razorpay Escrow (UPI / Cards)", 145, 72);

  // Divider Line
  doc.setDrawColor(226, 232, 240);
  doc.line(20, 78, 190, 78);

  // ==========================================
  // 3. ITEMIZED BREAKDOWN TABLE
  // ==========================================
  // Table Header Background
  doc.setFillColor(248, 250, 252); // slate-50
  doc.rect(20, 83, 170, 8, "F");
  doc.setDrawColor(226, 232, 240);
  doc.line(20, 83, 190, 83);
  doc.line(20, 91, 190, 91);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text("TASK DESCRIPTION", 24, 88.5);
  doc.text("MILESTONE ALLOCATION", 95, 88.5);
  doc.text("QTY", 145, 88.5, { align: "center" });
  doc.text("AMOUNT", 186, 88.5, { align: "right" });

  // Table Row 1
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  // Truncate task title if too long
  const displayTitle = taskTitle.length > 35 ? taskTitle.slice(0, 32) + "..." : taskTitle;
  doc.text(displayTitle, 24, 99);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Task ID: ${payment.requestId.slice(0, 20)}...`, 24, 104);
  if (details.subject) {
    doc.text(`Subject: ${details.subject}`, 24, 108.5);
  }

  // Milestone column
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(milestoneLabel, 95, 99);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Escrow Protected", 95, 104);

  // Qty column
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text("1", 145, 99, { align: "center" });

  // Amount column
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(amountFormatted, 186, 99, { align: "right" });

  // Row bottom line
  doc.setDrawColor(241, 245, 249);
  doc.line(20, 114, 190, 114);

  // ==========================================
  // 4. TOTALS SUMMARY BOX (Right aligned)
  // ==========================================
  const totalsY = 122;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("Taxable Amount:", 140, totalsY);
  doc.setTextColor(15, 23, 42);
  doc.text(amountFormatted, 186, totalsY, { align: "right" });

  doc.setTextColor(100, 116, 139);
  doc.text("Platform & Gateway Fee (0%):", 140, totalsY + 6);
  doc.setTextColor(15, 23, 42);
  doc.text("$0.00", 186, totalsY + 6, { align: "right" });

  // Grand Total Line
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.6);
  doc.line(125, totalsY + 10, 190, totalsY + 10);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("Total Paid:", 125, totalsY + 16);
  doc.setFontSize(13);
  doc.text(amountFormatted, 186, totalsY + 16, { align: "right" });

  // ==========================================
  // 5. ESCROW PROTECTION POLICY NOTICE
  // ==========================================
  const noticeY = 152;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(20, noticeY, 170, 22, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("DSMS University Milestone Escrow Policy:", 25, noticeY + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  const noticeText =
    "This payment was processed via secure university milestone escrow. Advance milestone payments remain protected until deliverable inspection, and final milestone payments unlock full verified document downloads. All transactions are logged with cryptographic verification.";
  const splitNotice = doc.splitTextToSize(noticeText, 160);
  doc.text(splitNotice, 25, noticeY + 11);

  // ==========================================
  // 6. FOOTER
  // ==========================================
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(20, 275, 190, 275);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text("Generated by DSMS Billing Gateway • Official Computer-Verified Tax Invoice", 20, 280);
  doc.text("No physical signature required • Authenticated Digital Receipt", 190, 280, { align: "right" });

  // ==========================================
  // 7. TRIGGER DIRECT PDF FILE DOWNLOAD
  // ==========================================
  const filename = `DSMS_Invoice_${invoiceNumber}.pdf`;
  doc.save(filename);
}
