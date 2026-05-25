const nodemailer = require('nodemailer');

let transporterPromise;

function getDefaultFrom() {
  return process.env.FROM_EMAIL || process.env.SMTP_USER || 'no-reply@cosec.local';
}

function hasRealSmtpConfig() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getMissingSmtpConfig() {
  return ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'].filter(key => !process.env[key]);
}

async function getTransporter() {
  if (transporterPromise) return transporterPromise;

  transporterPromise = (async () => {
    if (!hasRealSmtpConfig()) {
      const missing = getMissingSmtpConfig().join(', ');
      throw new Error(`Real email SMTP is not configured. Missing: ${missing}`);
    }

    const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  })();

  return transporterPromise;
}

async function sendMail({ to, subject, text, html }) {
  const transporter = await getTransporter();
  const mailOptions = {
    from: getDefaultFrom(),
    to,
    subject,
    text,
    html
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (err) {
    console.error('Error sending email:', err);
    throw err;
  }
}

module.exports = { sendMail };
