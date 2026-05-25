#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const root = path.resolve(__dirname, '..');
const envPath = path.join(root, '.env');

function ensureEnv() {
  const defaults = {
    MONGO_URI: 'mongodb://localhost:27017/cosec-web',
    JWT_SECRET: 'change_this_secret',
    JWT_EXPIRE: '30d'
  };

  let needWrite = false;
  const env = {};

  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split(/\r?\n/).forEach(line => {
      const m = line.match(/^\s*([A-Z0-9_]+)=([\s\S]*)$/);
      if (m) env[m[1]] = m[2];
    });
  }

  Object.keys(defaults).forEach(k => {
    if (!env[k]) {
      env[k] = defaults[k];
      needWrite = true;
      console.log(`Setting default ${k}=${defaults[k]}`);
    }
  });

  if (needWrite) {
    const lines = Object.keys(env).map(k => `${k}=${env[k]}`);
    fs.writeFileSync(envPath, lines.join('\n'), 'utf8');
    console.log('.env created/updated with defaults at', envPath);
  } else {
    console.log('.env already present — no changes made.');
  }

  // Warn about SMTP
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS || !env.FROM_EMAIL) {
    console.log('SMTP not fully configured. Real emails will not be sent until SMTP is configured.');
    console.log('For real delivery, use free Gmail SMTP: SMTP_HOST=smtp.gmail.com, SMTP_PORT=587, SMTP_SECURE=false, SMTP_USER=your Gmail, SMTP_PASS=Google App Password, FROM_EMAIL=your Gmail.');
  }
}

function startDev() {
  console.log('Starting backend dev server (npm run dev) ...');
  const child = spawn('npm', ['run', 'dev'], {
    cwd: root,
    stdio: 'inherit',
    shell: true
  });

  child.on('exit', code => process.exit(code));
}

try {
  ensureEnv();
  startDev();
} catch (err) {
  console.error('Startup script failed:', err);
  process.exit(1);
}
