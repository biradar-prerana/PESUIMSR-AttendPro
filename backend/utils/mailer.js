const nodemailer = require('nodemailer');

let transporterPromise;

const defaultFrom = process.env.FROM_EMAIL || 'no-reply@cosec.local';

async function getTransporter() {
  if (transporterPromise) return transporterPromise;

  transporterPromise = (async () => {
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    }

    console.warn('SMTP not configured: falling back to Ethereal test account. Emails will not be delivered to real inboxes.');
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  })();

  return transporterPromise;
}

async function sendMail({ to, subject, text, html }) {
  const transporter = await getTransporter();
  const mailOptions = {
    from: defaultFrom,
    to,
    subject,
    text,
    html
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    const preview = nodemailer.getTestMessageUrl(info);
    if (preview) {
      console.log('Preview URL:', preview);
      info.previewUrl = preview;
    }
    return info;
  } catch (err) {
    console.error('Error sending email:', err);
    throw err;
  }
}

module.exports = { sendMail };
