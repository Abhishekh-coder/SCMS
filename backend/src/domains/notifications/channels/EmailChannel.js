/**
 * CCMS — Production-Grade SMTP Email Notification Channel Strategy
 *
 * Implements Nodemailer SMTP transport with production observability & startup verification:
 * Logs connection attempt, authentication, messageId, accepted/rejected arrays, and 250 response.
 */

const nodemailer = require('nodemailer');
const { logger } = require('../../../config/logger');

class EmailChannel {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  async initTransporter() {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const user = process.env.SMTP_USER ? process.env.SMTP_USER.trim() : null;
    const rawPass = process.env.SMTP_PASS ? process.env.SMTP_PASS.trim() : null;
    // Strip spaces from Google App Password if user pasted with spaces
    const pass = rawPass ? rawPass.replace(/\s+/g, '') : null;

    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;

    if (host && user && pass) {
      logger.info(`📧 [SMTP Config] Host: ${host}:${port} | Secure: ${secure} | User: ${user} | PassLength: ${pass.length}`);
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
        tls: { rejectUnauthorized: false }
      });

      try {
        await this.transporter.verify();
        logger.info(`✅ [SMTP VERIFIED] Connection & Authentication successful for ${user}`);
      } catch (verifyErr) {
        logger.error(`❌ [SMTP VERIFICATION FAILED] User: ${user} | Code: ${verifyErr.code || 'N/A'} | Command: ${verifyErr.command || 'N/A'} | Response: ${verifyErr.response || verifyErr.message}`);
        logger.warn('⚠️ Please check: 1) 2-Step Verification enabled in Google Account, 2) Fresh App Password generated, 3) SMTP_USER & SMTP_PASS in .env');
      }
    } else {
      logger.warn('⚠️ [SMTP] SMTP_HOST, SMTP_USER, or SMTP_PASS not set in environment. Running in DEV simulation mode.');
    }
  }

  async send({ traceId, recipient, purpose, challengeData }) {
    const { rawCode, magicLinkUrl } = challengeData || {};
    const from = process.env.SMTP_FROM || process.env.SMTP_USER || '"CCMS Campus Portal" <noreply@campus.edu>';
    const subject = `[CCMS] Your Email Verification Code: ${rawCode || ''}`;
    const textBody = `Your verification code is: ${rawCode}\n\nThis code expires in 10 minutes. If you did not request this, please ignore.`;
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
        <h2 style="color: #2563eb; margin-top: 0;">CCMS Email Verification</h2>
        <p>Your 6-digit verification code is:</p>
        <div style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #1e293b; background: #f1f5f9; padding: 12px; text-align: center; border-radius: 8px; margin: 16px 0;">
          ${rawCode || ''}
        </div>
        <p style="font-size: 12px; color: #64748b;">This code is valid for 10 minutes. Do not share this code with anyone.</p>
        ${magicLinkUrl ? `<p style="margin-top: 16px;"><a href="${magicLinkUrl}" style="color: #2563eb;">Or click here to verify instantly</a></p>` : ''}
      </div>
    `;

    logger.info(`📍 [TRACE: ${traceId || 'N/A'}] 📧 [SMTP Dispatch] Initiating sendMail to '${recipient}' | Purpose: ${purpose || 'REGISTER'}`);

    if (this.transporter) {
      try {
        logger.info(`[SMTP Connecting...] Host: ${process.env.SMTP_HOST || 'smtp.gmail.com'}:${process.env.SMTP_PORT || 587}`);
        const info = await this.transporter.sendMail({
          from,
          to: recipient,
          subject,
          text: textBody,
          html: htmlBody
        });

        logger.info(`✅ [SMTP SUCCESS] Message Delivered cleanly`);
        logger.info(`   ├─ MessageId: ${info.messageId}`);
        logger.info(`   ├─ Accepted:  ${JSON.stringify(info.accepted)}`);
        logger.info(`   ├─ Rejected:  ${JSON.stringify(info.rejected)}`);
        logger.info(`   └─ Response:  ${info.response}`);

        if (info.rejected && info.rejected.length > 0) {
          logger.error(`❌ [SMTP REJECTED] Recipient rejected by mail server: ${JSON.stringify(info.rejected)}`);
        }

        return {
          channel: 'EMAIL',
          delivered: true,
          recipient,
          messageId: info.messageId,
          accepted: info.accepted,
          rejected: info.rejected,
          smtpResponse: info.response,
          sentAt: new Date().toISOString()
        };
      } catch (err) {
        logger.error(`❌ [SMTP FAILED] Failed to send email to ${recipient}:`, err.message);
        throw err;
      }
    }

    // DEV Mode Simulation Log
    const simulatedMsgId = `<sim_${Date.now()}@dev.ccms.local>`;
    logger.info(`✅ [SMTP DEV SIMULATION] Verification Email Sent (Simulated)`);
    logger.info(`   ├─ MessageId: ${simulatedMsgId}`);
    logger.info(`   ├─ Accepted:  ["${recipient}"]`);
    logger.info(`   ├─ Rejected:  []`);
    logger.info(`   └─ Response:  250 2.0.0 OK (Dev Mode Simulation)`);

    return {
      channel: 'EMAIL',
      delivered: true,
      simulated: true,
      recipient,
      messageId: simulatedMsgId,
      accepted: [recipient],
      rejected: [],
      smtpResponse: '250 2.0.0 OK (Dev Mode Simulation)',
      sentAt: new Date().toISOString()
    };
  }
}

module.exports = new EmailChannel();
