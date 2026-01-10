

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";

/* 🔥 FORCE LOAD .env HERE */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Go UP from src/utils → Backend
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const isDev = process.env.NODE_ENV !== "production";

console.log("📧 MAILER INIT CHECK");
console.log("   ENV:", process.env.NODE_ENV || "development");
console.log("   HOST:", process.env.BREVO_SMTP_HOST || "(not set)");
console.log("   USER:", process.env.BREVO_SMTP_USER ? "✅ Set" : "❌ Missing");
console.log("   FROM:", process.env.EMAIL_FROM || "(not set)");

if (!process.env.BREVO_SMTP_HOST) {
  console.warn("⚠️ BREVO_SMTP_HOST is missing. Email will not work.");
}

// Build TLS options - allow self-signed certs in development only
const tlsOptions = isDev
  ? { rejectUnauthorized: false }
  : { rejectUnauthorized: true };

const transporter = nodemailer.createTransport({
  host: process.env.BREVO_SMTP_HOST,
  port: Number(process.env.BREVO_SMTP_PORT) || 587,
  secure: false, // Use STARTTLS
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_PASS,
  },
  tls: tlsOptions,
});

// Verify SMTP connection (non-blocking)
transporter.verify((err) => {
  if (err) {
    console.error("❌ SMTP VERIFY FAILED:", err.message);
    if (isDev) {
      console.log("⚠️ [DEV] Email sending may still work despite verification failure.");
    }
  } else {
    console.log("✅ SMTP SERVER READY");
  }
});

export default transporter;
