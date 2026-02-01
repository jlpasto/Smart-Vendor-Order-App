import { createTransport } from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

console.log('📧 Testing Email Configuration...\n');
console.log('Environment Variables:');
console.log('  SMTP_HOST:', process.env.SMTP_HOST);
console.log('  SMTP_PORT:', process.env.SMTP_PORT);
console.log('  SMTP_USER:', process.env.SMTP_USER);
console.log('  SMTP_PASS:', process.env.SMTP_PASS ? '***' + process.env.SMTP_PASS.slice(-4) : 'NOT SET');
console.log('  EMAIL_FROM:', process.env.EMAIL_FROM);
console.log('  EMAIL_FROM_NAME:', process.env.EMAIL_FROM_NAME);
console.log('  EMAIL_TO:', process.env.EMAIL_TO);
console.log('');

if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
  console.error('❌ Error: Required email environment variables are missing!');
  process.exit(1);
}

const transporter = createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const mailOptions = {
  from: `"${process.env.EMAIL_FROM_NAME || 'Order System'}" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
  to: process.env.EMAIL_TO || 'test@example.com',
  subject: 'Test Email - Cureate Order App',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e40af;">Email Test Successful!</h2>
      <p>This is a test email from your Cureate Order App.</p>

      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>Configuration Details:</h3>
        <p><strong>SMTP Host:</strong> ${process.env.SMTP_HOST}</p>
        <p><strong>SMTP Port:</strong> ${process.env.SMTP_PORT || 587}</p>
        <p><strong>From Email:</strong> ${process.env.EMAIL_FROM || process.env.SMTP_USER}</p>
        <p><strong>From Name:</strong> ${process.env.EMAIL_FROM_NAME || 'Order System'}</p>
      </div>

      <p style="color: #22c55e; font-weight: bold;">✓ Email configuration is working correctly!</p>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      <p style="color: #999; font-size: 12px;">
        This is a test message from ${process.env.EMAIL_FROM_NAME || 'Cureate Order App'}.
      </p>
    </div>
  `
};

console.log('📤 Sending test email to:', process.env.EMAIL_TO);
console.log('');

transporter.sendMail(mailOptions)
  .then(info => {
    console.log('✅ Test email sent successfully!');
    console.log('   Message ID:', info.messageId);
    console.log('   Response:', info.response);
    console.log('');
    console.log('🎉 Email configuration is working! Check your inbox at:', process.env.EMAIL_TO);
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error sending test email:');
    console.error('   Error:', error.message);
    console.error('');
    if (error.code === 'EAUTH') {
      console.error('💡 Authentication failed. Please check:');
      console.error('   - SMTP_USER is correct');
      console.error('   - SMTP_PASS is correct (use App Password for Gmail)');
      console.error('   - 2-Step Verification is enabled (for Gmail)');
    } else if (error.code === 'ECONNECTION') {
      console.error('💡 Connection failed. Please check:');
      console.error('   - SMTP_HOST is correct');
      console.error('   - SMTP_PORT is correct');
      console.error('   - Your internet connection');
    } else {
      console.error('💡 Full error details:', error);
    }
    process.exit(1);
  });
