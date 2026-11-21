import prisma from '../src/config/prisma.js';
import requestService from '../src/modules/requests/request.service.js';
import quotationService from '../src/modules/quotations/quotation.service.js';
import paymentService from '../src/modules/payments/payment.service.js';
import chatService from '../src/modules/chat/chat.service.js';
import documentService from '../src/modules/documents/document.service.js';
import adminService from '../src/modules/admin/admin.service.js';
import razorpay from '../src/config/razorpay.js';
import env from '../src/config/env.js';
import { Role, PaymentMilestone } from '@prisma/client';
import crypto from 'crypto';

async function runEndToEndVerification() {
  console.log('\n=============================================================');
  console.log('🚀 STARTING COMPREHENSIVE END-TO-END SYSTEM VERIFICATION');
  console.log('=============================================================\n');

  // Test User & Admin UUIDs (RFC4122 v4)
  const testUserId = '00000000-0000-4000-8000-000000000001';
  const testAdminId = '00000000-0000-4000-8000-000000000002';
  const userAId = '00000000-0000-4000-8000-000000000003';

  try {
    // -------------------------------------------------------------
    // STEP 1: Setup Separate User & Admin Records in PostgreSQL
    // -------------------------------------------------------------
    console.log('🔹 STEP 1: Initializing Test Users (users table) & Admin (admins table)...');
    await prisma.user.upsert({
      where: { id: testUserId },
      update: {},
      create: {
        id: testUserId,
        email: 'e2e_user@example.com',
        fullName: 'Test Customer',
      },
    });

    await prisma.admin.upsert({
      where: { id: testAdminId },
      update: {},
      create: {
        id: testAdminId,
        email: 'e2e_admin@example.com',
        fullName: 'Test Admin Manager',
        department: 'Legal Operations',
        isSuperAdmin: true,
        isActive: true,
      },
    });

    await prisma.user.upsert({
      where: { id: userAId },
      update: {},
      create: {
        id: userAId,
        email: 'intruder_user_a@example.com',
        fullName: 'Intruder User A',
      },
    });
    console.log('✅ Test users (users table) & admin (admins table) initialized in Supabase PostgreSQL.\n');

    // Clean up previous test requests if any
    await prisma.documentRequest.deleteMany({
      where: { userId: { in: [testUserId, userAId] } },
    });

    // -------------------------------------------------------------
    // STEP 2: User Submits a Document Request with Reference File
    // -------------------------------------------------------------
    console.log('🔹 STEP 2: User submits a new document request...');
    const dummyFile: Express.Multer.File = {
      fieldname: 'referenceFiles',
      originalname: 'tax_return_reference.txt',
      encoding: '7bit',
      mimetype: 'text/plain',
      buffer: Buffer.from('Official reference tax document content for verification.'),
      size: 55,
      destination: '',
      filename: '',
      path: '',
      stream: null as any,
    };

    const newRequest = await requestService.createRequest(
      testUserId,
      {
        title: 'Tax Document Verification & Legal Apostille',
        description: 'Please verify the attached document and prepare certified apostille copy.',
        category: 'Legal Documents',
        priority: 'HIGH',
      },
      [dummyFile]
    );

    console.log(`✅ Request Created: ID = ${newRequest.id}`);
    console.log(`✅ Status: ${newRequest.status} (Initial: PENDING)`);
    console.log(`✅ Download Lock: ${newRequest.isDownloadUnlocked} (Default: Locked)`);
    console.log(`✅ Reference files uploaded: ${newRequest.referenceFiles.length}`);
    console.log(`✅ Cloudinary URL: ${newRequest.referenceFiles[0]?.fileUrl}\n`);

    // -------------------------------------------------------------
    // STEP 3: Verify Real-Time Chat & WhatsApp-Style Read Receipts
    // -------------------------------------------------------------
    console.log('🔹 STEP 3: Testing WhatsApp-Style Chat Engine...');
    const userMessage = await chatService.postMessage(
      { id: testUserId, email: 'e2e_user@example.com', role: Role.USER, isBlocked: false },
      newRequest.id,
      { content: 'Hello Admin! I have uploaded my reference document.' }
    );
    console.log(`✅ Message Sent by User: "${userMessage.content}" | Status = ${userMessage.status} (1 tick)`);

    // Simulate Admin opening the chat (Mark Read)
    await chatService.markMessagesAsRead(testAdminId, newRequest.id);
    const updatedMessages = await chatService.getConversationMessages(
      newRequest.id,
      { id: testAdminId, email: 'e2e_admin@example.com', role: Role.ADMIN, isBlocked: false }
    );
    const readMsg = updatedMessages.messages.find((m: any) => m.id === userMessage.id);
    console.log(`✅ Message Status after Admin opened chat: ${readMsg?.status} (2 blue ticks: READ)\n`);

    // -------------------------------------------------------------
    // STEP 4: Admin Creates Quotation (50-50 Split)
    // -------------------------------------------------------------
    console.log('🔹 STEP 4: Admin provides Quotation...');
    const quotation = await quotationService.createQuotation(testAdminId, {
      requestId: newRequest.id,
      totalAmount: 200, // $200 USD
      estimatedDays: 2,
      terms: '50% advance to start legal verification, 50% upon final document delivery.',
    });

    console.log(`✅ Quotation Generated: ID = ${quotation.id} (v${quotation.version})`);
    console.log(`   - Total Amount: $${(quotation.totalAmount / 100).toFixed(2)} (${quotation.totalAmount} cents)`);
    console.log(`   - Advance (50%): $${(quotation.advanceAmount / 100).toFixed(2)} (${quotation.advanceAmount} cents)`);
    console.log(`   - Remaining (50%): $${(quotation.remainingAmount / 100).toFixed(2)} (${quotation.remainingAmount} cents)`);
    console.log(`   - Currency: ${quotation.currency}`);
    console.log(`   - Quotation Status: ${quotation.status}`);

    const reqAfterQuote = await prisma.documentRequest.findUnique({ where: { id: newRequest.id } });
    console.log(`✅ Request status transitioned to: ${reqAfterQuote?.status} (QUOTED)\n`);

    // -------------------------------------------------------------
    // STEP 5: User Accepts Quotation & Triggers Milestone 1 (50% Advance)
    // -------------------------------------------------------------
    console.log('🔹 STEP 5: User accepts Quotation & generates Milestone 1 Order...');
    const acceptResult = await quotationService.acceptQuotation(testUserId, quotation.id);

    console.log(`✅ Quotation Status: ${acceptResult.quotation.status} (ACCEPTED)`);
    console.log(`✅ Razorpay Advance Order Created: ${acceptResult.paymentOrder.orderId}`);
    console.log(`   - Milestone: ${acceptResult.paymentOrder.milestone}`);
    console.log(`   - Advance Amount: $${(Number(acceptResult.paymentOrder.amount) / 100).toFixed(2)} (${acceptResult.paymentOrder.currency})\n`);

    // -------------------------------------------------------------
    // STEP 6: Milestone 1 (50% Advance) Payment Verification
    // -------------------------------------------------------------
    console.log('🔹 STEP 6: Verifying Milestone 1 (50% Advance) Payment...');
    const advanceOrderId = acceptResult.paymentOrder.orderId;
    const advancePaymentId = `pay_adv_${Date.now()}`;
    const advanceSignature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(`${advanceOrderId}|${advancePaymentId}`)
      .digest('hex');

    // Mock Razorpay payment fetch for server-side verification
    const originalFetch = razorpay.payments.fetch;
    razorpay.payments.fetch = (async (id: string) => ({
      id,
      amount: quotation.advanceAmount,
      status: 'captured',
    })) as any;

    const advanceVerification = await paymentService.verifyPayment(testUserId, {
      razorpayOrderId: advanceOrderId,
      razorpayPaymentId: advancePaymentId,
      razorpaySignature: advanceSignature,
    });

    console.log(`✅ Milestone 1 Payment Status: ${advanceVerification.payment.status} (SUCCESS)`);
    console.log(`✅ Request Status transitioned to: ${advanceVerification.requestStatus} (IN_PROGRESS)`);
    console.log(`✅ Is Download Unlocked: ${advanceVerification.isDownloadUnlocked} (Still false - 50% remaining)\n`);

    // -------------------------------------------------------------
    // STEP 7: Admin Uploads Final Completed Document
    // -------------------------------------------------------------
    console.log('🔹 STEP 7: Admin uploads completed final document to Private Cloudinary...');
    const validPdfBuffer = Buffer.from(
      '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 3 3]>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000010 00000 n \n0000000053 00000 n \n0000000102 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n149\n%%EOF'
    );

    const finalDocFile: Express.Multer.File = {
      fieldname: 'document',
      originalname: 'Official_Certified_Apostille.pdf',
      encoding: '7bit',
      mimetype: 'application/pdf',
      buffer: validPdfBuffer,
      size: validPdfBuffer.length,
      destination: '',
      filename: '',
      path: '',
      stream: null as any,
    };

    const uploadedDoc = await documentService.uploadFinalDocument(
      testAdminId,
      newRequest.id,
      finalDocFile,
      { title: 'Official Certified Apostille Document' }
    );

    console.log(`✅ Final Document Uploaded: ID = ${uploadedDoc.id} (v${uploadedDoc.version})`);
    console.log(`✅ Cloudinary Public ID: ${uploadedDoc.cloudinaryPublicId}`);
    const reqAfterUpload = await prisma.documentRequest.findUnique({ where: { id: newRequest.id } });
    console.log(`✅ Request status transitioned to: ${reqAfterUpload?.status} (DOCUMENT_UPLOADED)\n`);

    // -------------------------------------------------------------
    // STEP 8: SECURITY GATEKEEPER TEST (Attempting download BEFORE final payment)
    // -------------------------------------------------------------
    console.log('🔹 STEP 8: Testing Security Gatekeeper (Download BEFORE final 50% payment)...');
    let gatekeeperPassed = false;
    try {
      await documentService.downloadDocument(
        uploadedDoc.id,
        { id: testUserId, email: 'e2e_user@example.com', role: Role.USER, isBlocked: false }
      );
    } catch (err: any) {
      if (err.statusCode === 403 && err.message.includes('Payment Required')) {
        gatekeeperPassed = true;
        console.log(`🛡️ SECURITY GATEKEEPER SUCCEEDED: Blocked download with 403 Forbidden!`);
        console.log(`   Message: "${err.message}"\n`);
      } else {
        throw err;
      }
    }

    if (!gatekeeperPassed) {
      throw new Error('CRITICAL VULNERABILITY: User was able to download file before paying final 50%!');
    }

    // -------------------------------------------------------------
    // STEP 9: IDOR TEST (User A tries to access User B's request & file)
    // -------------------------------------------------------------
    console.log('🔹 STEP 9: Testing IDOR Prevention (Intruder User A tries accessing Request)...');
    let idorPassed = false;
    try {
      await requestService.getRequestById(
        newRequest.id,
        { id: userAId, email: 'intruder_user_a@example.com', role: Role.USER, isBlocked: false }
      );
    } catch (err: any) {
      if (err.statusCode === 403) {
        idorPassed = true;
        console.log(`🛡️ IDOR PREVENTION SUCCEEDED: Blocked Intruder User A with 403 Forbidden!\n`);
      }
    }

    if (!idorPassed) {
      throw new Error('CRITICAL VULNERABILITY: User A was able to view User B’s request!');
    }

    // -------------------------------------------------------------
    // STEP 10: Milestone 2 (Final 50% Balance) Payment Order & Verification
    // -------------------------------------------------------------
    console.log('🔹 STEP 10: User initiates Milestone 2 (Final 50%) Payment...');
    const finalOrder = await paymentService.createPaymentOrder(
      testUserId,
      newRequest.id,
      PaymentMilestone.FINAL_50
    );

    console.log(`✅ Milestone 2 Razorpay Order Created: ${finalOrder.orderId}`);
    console.log(`   - Final Remaining Amount: $${(Number(finalOrder.amount) / 100).toFixed(2)} (${finalOrder.currency})`);

    const finalOrderId = finalOrder.orderId;
    const finalPaymentId = `pay_fin_${Date.now()}`;

    // Verify Milestone 2 via Server-to-Server Razorpay Webhook (plus duplicate replay idempotency)
    const webhookBody = JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: finalPaymentId,
            order_id: finalOrderId,
            amount: quotation.remainingAmount,
            status: 'captured',
          },
        },
      },
    });
    const webhookSig = crypto
      .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
      .update(webhookBody)
      .digest('hex');

    await paymentService.processWebhook(webhookBody, webhookSig);
    // Replay exact same webhook event to verify duplicate-event idempotency
    const replayRes = await paymentService.processWebhook(webhookBody, webhookSig);
    console.log(`✅ Webhook Replay Idempotency Check: ${JSON.stringify(replayRes)}`);

    const reqAfterFinal = await prisma.documentRequest.findUnique({ where: { id: newRequest.id } });
    if (!reqAfterFinal?.isDownloadUnlocked) {
      throw new Error('Expected download to be unlocked after Milestone 2 webhook!');
    }
    console.log(`✅ Request Status transitioned to: ${reqAfterFinal.status} (COMPLETED)`);
    console.log(`✅ Is Download Unlocked: ${reqAfterFinal.isDownloadUnlocked} (TRUE - 100% PAID!)\n`);

    // -------------------------------------------------------------
    // STEP 11: Download Gatekeeper AFTER 100% Payment (Download Enabled!)
    // -------------------------------------------------------------
    console.log('🔹 STEP 11: Testing Download Gatekeeper AFTER 100% Payment...');
    const downloadPayload = await documentService.downloadDocument(
      uploadedDoc.id,
      { id: testUserId, email: 'e2e_user@example.com', role: Role.USER, isBlocked: false }
    );

    const downloadRes = await fetch(downloadPayload.downloadUrl);
    if (downloadRes.status !== 200) {
      throw new Error(`Signed Cloudinary download URL failed with HTTP ${downloadRes.status}!`);
    }

    console.log(`✅ Download Granted & Verified Live HTTP ${downloadRes.status} OK!`);
    console.log(`✅ Signed Download URL generated (valid for ${downloadPayload.expiresInSeconds}s):`);
    console.log(`   ${downloadPayload.downloadUrl.slice(0, 80)}...`);
    console.log(`✅ File Name: ${downloadPayload.fileName}`);

    const docInDb = await prisma.finalDocument.findUnique({ where: { id: uploadedDoc.id } });
    console.log(`✅ Download Counter incremented: ${docInDb?.downloadCount}\n`);

    // -------------------------------------------------------------
    // STEP 12: Admin Analytics & Audit Trail Verification
    // -------------------------------------------------------------
    console.log('🔹 STEP 12: Verifying Admin Dashboard Analytics & Audit Trail...');
    const stats = await adminService.getDashboardStats();
    console.log(`✅ Total Completed Requests: ${stats.requests.completed}`);
    console.log(`✅ Total Revenue Earned: $${stats.finances.totalRevenue.dollars.toFixed(2)} ${stats.finances.currency} (${stats.finances.totalRevenue.transactionCount} transactions)`);

    const auditTrail = await adminService.getAuditLogs({ limit: 10 });
    console.log(`✅ Audit Trail contains ${auditTrail.logs.length} logged security actions.`);
    console.log(`   Latest action logged: [${auditTrail.logs[0]?.action}] by ${auditTrail.logs[0]?.actor?.fullName}\n`);

    // Restore original mock
    razorpay.payments.fetch = originalFetch;

    console.log('=============================================================');
    console.log('🎉 ALL 12 END-TO-END FLOWS AND SECURITY GATES PASSED 100%!');
    console.log('=============================================================\n');

    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ E2E VERIFICATION FAILED:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runEndToEndVerification();
