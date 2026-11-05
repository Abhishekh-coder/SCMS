require('dotenv').config({ path: '../.env' });
const nodemailer = require('nodemailer');

async function testSMTP() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = (process.env.SMTP_USER || '').trim();
  const rawPass = (process.env.SMTP_PASS || '').trim();
  const pass = rawPass.replace(/\s+/g, '');

  console.log('==============================================');
  console.log('📧 CCMS Standalone SMTP Diagnostic Tool');
  console.log('==============================================');
  console.log('User:', user);
  console.log('Pass Raw Length:', rawPass.length);
  console.log('Pass Processed Length:', pass.length);
  console.log('Pass Hex (Hidden Char Check):', Buffer.from(pass).toString('hex'));
  console.log('Host:', host);
  console.log('Port:', port);
  console.log('Secure:', secure);
  console.log('==============================================');

  if (!user || !pass) {
    console.error('❌ Error: SMTP_USER or SMTP_PASS missing in .env');
    process.exit(1);
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    tls: { rejectUnauthorized: false }
  });

  try {
    console.log('🔄 Attempting transporter.verify()...');
    await transporter.verify();
    console.log('✅ [SUCCESS] SMTP VERIFIED! Gmail accepted your credentials.');

    console.log('🔄 Sending test email to', user, '...');
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM || user}" <${user}>`,
      to: user,
      subject: '[CCMS Test] Standalone SMTP Verification Email',
      text: 'Congratulations! Your SMTP configuration and Google App Password are working 100% successfully.'
    });

    console.log('🎉 [EMAIL SENT SUCCESSFULLY]');
    console.log('MessageId:', info.messageId);
    console.log('Accepted:', info.accepted);
    console.log('Rejected:', info.rejected);
    console.log('Response:', info.response);
  } catch (err) {
    console.error('❌ [SMTP VERIFICATION FAILED]');
    console.error('Code:        ', err.code);
    console.error('Command:     ', err.command);
    console.error('Response:    ', err.response);
    console.error('ResponseCode:', err.responseCode);
    console.error('Full Message:', err.message);
  }
}

testSMTP();
