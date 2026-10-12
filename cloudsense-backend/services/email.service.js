const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

/**
 * Creates and caches nodemailer transporter based on environment variables.
 */
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;

  if (SMTP_HOST && SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: SMTP_SECURE === 'true' || Number(SMTP_PORT) === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  }

  return transporter;
}

/**
 * Generate responsive HTML email for password reset
 */
function generatePasswordResetHtml({ name, resetUrl, userEmail }) {
  const recipientName = name || 'there';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your CloudSense password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.5;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="padding: 32px 36px; background-color: #0f172a; text-align: left;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align: middle;">
                    <div style="width: 36px; height: 36px; background-color: #2563eb; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; text-align: center; line-height: 36px; color: #ffffff; font-weight: 700; font-size: 18px;">
                      CS
                    </div>
                  </td>
                  <td style="vertical-align: middle; padding-left: 12px;">
                    <span style="font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: -0.02em;">
                      CloudSense
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 36px 36px 28px 36px;">
              <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; color: #0f172a; letter-spacing: -0.02em;">
                Reset your password
              </h1>
              
              <p style="margin: 0 0 16px 0; font-size: 14px; color: #475569; line-height: 1.6;">
                Hi <strong style="color: #0f172a;">${recipientName}</strong>,
              </p>

              <p style="margin: 0 0 24px 0; font-size: 14px; color: #475569; line-height: 1.6;">
                We received a request to reset the password for your CloudSense account associated with <strong style="color: #0f172a;">${userEmail}</strong>.
              </p>

              <p style="margin: 0 0 28px 0; font-size: 14px; color: #475569; line-height: 1.6;">
                Click the button below to choose a new, secure password:
              </p>

              <!-- CTA Button -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 0 28px 0;">
                <tr>
                  <td align="left">
                    <a href="${resetUrl}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 8px; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);">
                      Reset My Password
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Notice Box -->
              <div style="background-color: #f1f5f9; border-left: 4px solid #2563eb; border-radius: 6px; padding: 14px 16px; margin: 0 0 24px 0;">
                <p style="margin: 0; font-size: 12px; color: #334155; line-height: 1.5;">
                  <strong>Note:</strong> This link will expire in <strong>60 minutes</strong>. If you did not request this password reset, you can safely ignore this email — your account is still secure.
                </p>
              </div>

              <!-- Fallback Link -->
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #64748b;">
                If the button above does not work, copy and paste this URL into your browser:
              </p>
              <p style="margin: 0; font-size: 11px; word-break: break-all; color: #2563eb; background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 6px;">
                <a href="${resetUrl}" style="color: #2563eb; text-decoration: underline;">${resetUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 36px 32px 36px; border-top: 1px solid #f1f5f9; background-color: #fafafa; text-align: left;">
              <p style="margin: 0 0 8px 0; font-size: 11px; color: #94a3b8;">
                CloudSense — AI Cost Monitor, Anomaly Detector & Budget Alert System
              </p>
              <p style="margin: 0; font-size: 11px; color: #cbd5e1;">
                &copy; ${new Date().getFullYear()} CloudSense. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Generate responsive HTML email for password reset OTP
 */
function generatePasswordResetOtpHtml({ name, otp, userEmail }) {
  const recipientName = name || 'there';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your CloudSense Password Reset Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.5;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="padding: 32px 36px; background-color: #0f172a; text-align: left;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align: middle;">
                    <div style="width: 36px; height: 36px; background-color: #2563eb; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; text-align: center; line-height: 36px; color: #ffffff; font-weight: 700; font-size: 18px;">
                      CS
                    </div>
                  </td>
                  <td style="vertical-align: middle; padding-left: 12px;">
                    <span style="font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: -0.02em;">
                      CloudSense
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 36px 36px 28px 36px;">
              <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; color: #0f172a; letter-spacing: -0.02em;">
                Your Verification Code
              </h1>
              
              <p style="margin: 0 0 16px 0; font-size: 14px; color: #475569; line-height: 1.6;">
                Hi <strong style="color: #0f172a;">${recipientName}</strong>,
              </p>

              <p style="margin: 0 0 20px 0; font-size: 14px; color: #475569; line-height: 1.6;">
                We received a request to reset the password for your account (<strong style="color: #0f172a;">${userEmail}</strong>). Enter this 6-digit one-time code to verify your identity and set a new password:
              </p>

              <!-- OTP Code Box -->
              <div style="background-color: #f8fafc; border: 2px dashed #93c5fd; border-radius: 12px; padding: 24px; text-align: center; margin: 0 0 24px 0;">
                <span style="font-size: 38px; font-weight: 800; letter-spacing: 12px; color: #1d4ed8; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; display: inline-block; padding-left: 12px;">
                  ${otp}
                </span>
                <p style="margin: 10px 0 0 0; font-size: 12px; color: #64748b; font-weight: 500;">
                  Valid for 10 minutes &bull; Single use only
                </p>
              </div>

              <!-- Notice Box -->
              <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 6px; padding: 14px 16px; margin: 0 0 24px 0;">
                <p style="margin: 0; font-size: 12px; color: #991b1b; line-height: 1.5;">
                  <strong>Security Reminder:</strong> Never share this code with anyone. CloudSense team members will never ask for your verification code. If you did not make this request, you can safely ignore this email.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 36px 32px 36px; border-top: 1px solid #f1f5f9; background-color: #fafafa; text-align: left;">
              <p style="margin: 0 0 8px 0; font-size: 11px; color: #94a3b8;">
                CloudSense — AI Cost Monitor, Anomaly Detector & Budget Alert System
              </p>
              <p style="margin: 0; font-size: 11px; color: #cbd5e1;">
                &copy; ${new Date().getFullYear()} CloudSense. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Send password reset email to user
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.name - User's display name
 * @param {string} options.resetUrl - Full reset URL with token
 */
async function sendPasswordResetEmail({ to, name, resetUrl }) {
  const mailTransporter = getTransporter();
  const fromAddress = process.env.SMTP_FROM || 'CloudSense Security <no-reply@cloudsense.io>';
  const subject = 'Reset your CloudSense password';
  const html = generatePasswordResetHtml({ name, resetUrl, userEmail: to });
  const text = `Hi ${name || 'there'},\n\nWe received a request to reset your CloudSense password.\n\nPlease visit the following link to reset your password (valid for 60 minutes):\n${resetUrl}\n\nIf you did not request a password reset, you can safely ignore this email.\n\n- The CloudSense Team`;

  if (mailTransporter) {
    try {
      const info = await mailTransporter.sendMail({
        from: fromAddress,
        to,
        subject,
        text,
        html,
      });
      logger.info(`Password reset email sent to ${to}: ${info.messageId}`);
      return { sent: true, messageId: info.messageId };
    } catch (err) {
      logger.error(`Failed to send password reset email via SMTP: ${err.message}`);
      logger.info(`[RESCUE] Password reset link for ${to}: ${resetUrl}`);
      return { sent: false, error: err.message, resetUrl };
    }
  } else {
    logger.info('================================================================');
    logger.info(`[EMAIL SERVICE] Password reset requested for: ${to}`);
    logger.info(`[EMAIL SERVICE] Reset link: ${resetUrl}`);
    logger.info('================================================================');
    return { sent: false, simulated: true, resetUrl };
  }
}

/**
 * Send password reset OTP email to user
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.name - User's display name
 * @param {string} options.otp - 6-digit OTP code
 */
async function sendPasswordResetOtpEmail({ to, name, otp }) {
  const mailTransporter = getTransporter();
  const fromAddress = process.env.SMTP_FROM || 'CloudSense Security <no-reply@cloudsense.io>';
  const subject = `Your CloudSense verification code: ${otp}`;
  const html = generatePasswordResetOtpHtml({ name, otp, userEmail: to });
  const text = `Hi ${name || 'there'},\n\nYour CloudSense password reset verification code is: ${otp}\n\nThis code expires in 10 minutes. If you did not request this, please ignore this email.\n\n- The CloudSense Team`;

  if (mailTransporter) {
    try {
      const info = await mailTransporter.sendMail({
        from: fromAddress,
        to,
        subject,
        text,
        html,
      });
      logger.info(`Password reset OTP email sent to ${to}: ${info.messageId}`);
      return { sent: true, messageId: info.messageId };
    } catch (err) {
      logger.error(`Failed to send password reset OTP via SMTP: ${err.message}`);
      logger.info(`[RESCUE] Password reset OTP for ${to}: ${otp}`);
      return { sent: false, error: err.message, otp };
    }
  } else {
    logger.info('================================================================');
    logger.info(`[OTP SERVICE] Password reset OTP for: ${to}`);
    logger.info(`[OTP SERVICE] Code: ${otp} (Valid for 10 minutes)`);
    logger.info('================================================================');
    return { sent: false, simulated: true, otp };
  }
}

module.exports = {
  sendPasswordResetEmail,
  sendPasswordResetOtpEmail,
};

