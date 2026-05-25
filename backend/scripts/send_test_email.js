#!/usr/bin/env node
require('dotenv').config();
const { sendMail } = require('../utils/mailer');

async function main() {
  const to = process.argv[2] || process.env.HR_EMAIL || process.env.SMTP_USER;

  if (!to) {
    console.error('No recipient found. Run: npm run test:email -- someone@example.com');
    process.exit(1);
  }

  const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const subject = 'AttendPro email test';
  const text = `This is a test email from AttendPro sent at ${now}.`;
  const html = `<p>This is a test email from AttendPro sent at <b>${now}</b>.</p>`;

  const info = await sendMail({ to, subject, text, html });

  console.log(`Test email accepted for ${to}. Message ID: ${info.messageId}`);
}

main().catch(err => {
  console.error('Test email failed:', err.message);
  process.exit(1);
});
