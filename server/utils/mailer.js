import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';

// Ensure env vars are loaded in this module
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '../.env');
dotenv.config({ path: envPath });

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || (SMTP_USER ? SMTP_USER : 'no-reply@example.com');

let transporter = null;

// Debug: log what we're reading
console.log('[MAILER] SMTP_HOST:', SMTP_HOST);
console.log('[MAILER] SMTP_PORT:', SMTP_PORT);
console.log('[MAILER] SMTP_USER:', SMTP_USER);
console.log('[MAILER] SMTP_PASS:', SMTP_PASS ? '***' : 'undefined');

if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
  console.log('[MAILER] ✅ Creating transporter with SMTP...');
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465, // true for 465, false for other ports
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false, // Allow self-signed certificates (required for some networks/proxies)
    },
  });
  console.log('[MAILER] ✅ Transporter created successfully');
} else {
  // Fallback: console transport
  console.warn('⚠️ SMTP not configured. Emails will be logged to console. Set SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS to enable real emails.');
  console.warn('[MAILER] Missing:', !SMTP_HOST ? 'SMTP_HOST ' : '', !SMTP_PORT ? 'SMTP_PORT ' : '', !SMTP_USER ? 'SMTP_USER ' : '', !SMTP_PASS ? 'SMTP_PASS ' : '');
}

export async function sendMail({ to, subject, text, html }) {
  if (!to) throw new Error('Missing `to` in sendMail');

  if (!transporter) {
    // Log to console as a safe fallback
    console.log('--- EMAIL (mock) ---');
    console.log('From:', EMAIL_FROM);
    console.log('To:', to);
    console.log('Subject:', subject);
    if (text) console.log('Text:', text);
    if (html) console.log('HTML:', html);
    console.log('--- END EMAIL ---');
    return { mocked: true };
  }

  const info = await transporter.sendMail({
    from: EMAIL_FROM,
    to,
    subject,
    text,
    html,
  });

  return info;
}
