"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOtpEmail = sendOtpEmail;
const resend_1 = require("resend");
const env_js_1 = __importDefault(require("../config/env.js"));
const logger_js_1 = __importDefault(require("./logger.js"));
let resendClient = null;
if (env_js_1.default.RESEND_API_KEY) {
    resendClient = new resend_1.Resend(env_js_1.default.RESEND_API_KEY);
}
/**
 * Professional HTML Email Template for DSMS OTP Verification
 */
function generateOtpHtml(fullName, otp, typeTitle) {
    const name = fullName || 'Student';
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>DSMS Verification Code</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 40px 10px;">
  <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    
    <!-- Header -->
    <div style="background-color: #0f172a; padding: 30px 24px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px;">Document Service Management</h1>
      <p style="color: #94a3b8; margin: 6px 0 0 0; font-size: 13px;">Secure Academic Document & Milestone Portal</p>
    </div>

    <!-- Body Content -->
    <div style="padding: 36px 32px; color: #334155; line-height: 1.6;">
      <p style="font-size: 16px; margin-top: 0;">Hello <strong>${name}</strong>,</p>
      <p style="font-size: 15px; color: #475569; margin-bottom: 24px;">
        Use the 6-digit verification code below to complete your <strong>${typeTitle}</strong> on DSMS.
      </p>

      <!-- OTP Code Box -->
      <div style="background-color: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 8px; padding: 22px; text-align: center; margin: 28px 0;">
        <span style="font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #0f172a; font-family: monospace;">${otp}</span>
      </div>

      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 4px; margin-bottom: 24px;">
        <p style="margin: 0; font-size: 13px; color: #92400e; font-weight: 500;">
          ⏳ <strong>Time-sensitive:</strong> This code is valid for <strong>10 minutes</strong> only. Do not share it with anyone.
        </p>
      </div>

      <p style="font-size: 13px; color: #64748b; margin-bottom: 0;">
        If you did not initiate this request, you can safely ignore this email. No changes will be made to your account.
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 24px; text-align: center; font-size: 12px; color: #94a3b8;">
      <p style="margin: 0;">&copy; 2026 Document Service Management System (DSMS) &bull; We3Vision</p>
      <p style="margin: 4px 0 0 0;">Automated System Message &bull; Please do not reply directly to this email.</p>
    </div>

  </div>
</body>
</html>`;
}
async function sendOtpEmail(params) {
    const { to, otp, fullName = 'User', type = 'SIGNUP' } = params;
    let typeTitle = 'Account Registration';
    if (type === 'LOGIN')
        typeTitle = 'Email Login';
    if (type === 'PASSWORD_RESET')
        typeTitle = 'Password Reset';
    const html = generateOtpHtml(fullName, otp, typeTitle);
    const subject = `Your DSMS Verification Code: ${otp}`;
    const defaultSender = 'no-reply@ds.we3vision.com';
    const configuredEmail = env_js_1.default.RESEND_FROM_EMAIL?.trim();
    const isInvalidOrPublic = !configuredEmail ||
        configuredEmail === 'onboarding@resend.dev' ||
        configuredEmail.includes('@gmail.com') ||
        configuredEmail.includes('@yahoo.com') ||
        configuredEmail.includes('@outlook.com') ||
        configuredEmail.includes('@hotmail.com');
    const senderEmail = isInvalidOrPublic ? defaultSender : configuredEmail;
    const fromEmail = senderEmail.includes('<')
        ? senderEmail
        : `DSMS Portal <${senderEmail}>`;
    logger_js_1.default.info(`[OTP] Sending ${type} verification code to ${to} via Resend`);
    if (resendClient) {
        try {
            const response = await resendClient.emails.send({
                from: fromEmail,
                to: [to],
                subject,
                html,
            });
            if (response.error) {
                logger_js_1.default.warn(`[OTP] Resend delivery notice for ${to}: ${response.error.message}`);
                // If unverified domain warning in free tier, still log clearly
                return false;
            }
            logger_js_1.default.info(`[OTP] Email delivered successfully to ${to} (ID: ${response.data?.id})`);
            return true;
        }
        catch (err) {
            logger_js_1.default.error(`[OTP] Failed to send email via Resend to ${to}: ${err.message}`);
            return false;
        }
    }
    else {
        logger_js_1.default.warn(`[OTP] RESEND_API_KEY not configured. Cannot send verification email to ${to}`);
        return false;
    }
}
exports.default = {
    sendOtpEmail,
};
//# sourceMappingURL=email.js.map