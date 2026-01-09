// // // import nodemailer from "nodemailer";

// // // const transporter = nodemailer.createTransport({
// // //   host: process.env.BREVO_SMTP_HOST,
// // //   port: 587,
// // //   secure: false,
// // //   auth: {
// // //     user: process.env.BREVO_SMTP_USER,
// // //     pass: process.env.BREVO_SMTP_PASS,
// // //   },
// // // });

// // // export default transporter;


// // import nodemailer from "nodemailer";

// // console.log("📧 MAILER INIT CHECK");
// // console.log("HOST:", process.env.BREVO_SMTP_HOST);
// // console.log("USER:", process.env.BREVO_SMTP_USER);
// // console.log("FROM:", process.env.EMAIL_FROM);

// // const transporter = nodemailer.createTransport({
// //   host: process.env.BREVO_SMTP_HOST,
// //   port: 587,
// //   secure: false,
// //   auth: {
// //     user: process.env.BREVO_SMTP_USER,
// //     pass: process.env.BREVO_SMTP_PASS,
// //   },
// // });

// // // Verify SMTP connection at startup
// // transporter.verify((error, success) => {
// //   if (error) {
// //     console.error("❌ SMTP VERIFY FAILED:", error);
// //   } else {
// //     console.log("✅ SMTP SERVER READY");
// //   }
// // });

// // export default transporter;



// import nodemailer from "nodemailer";

// console.log("📧 MAILER INIT CHECK");
// console.log("HOST:", process.env.BREVO_SMTP_HOST);
// console.log("USER:", process.env.BREVO_SMTP_USER);
// console.log("FROM:", process.env.EMAIL_FROM);

// if (!process.env.BREVO_SMTP_HOST) {
//   throw new Error("BREVO_SMTP_HOST is missing. Check .env path.");
// }

// const transporter = nodemailer.createTransport({
//   host: process.env.BREVO_SMTP_HOST,
//   port: Number(process.env.BREVO_SMTP_PORT),
//   secure: false,
//   auth: {
//     user: process.env.BREVO_SMTP_USER,
//     pass: process.env.BREVO_SMTP_PASS,
//   },
// });

// transporter.verify((error) => {
//   if (error) {
//     console.error("❌ SMTP VERIFY FAILED:", error);
//   } else {
//     console.log("✅ SMTP SERVER READY");
//   }
// });

// export default transporter;




import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";

/* 🔥 FORCE LOAD .env HERE */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Go UP from src/utils → Backend
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

console.log("📧 MAILER INIT CHECK");
console.log("HOST:", process.env.BREVO_SMTP_HOST);
console.log("USER:", process.env.BREVO_SMTP_USER);
console.log("FROM:", process.env.EMAIL_FROM);

if (!process.env.BREVO_SMTP_HOST) {
  throw new Error("BREVO_SMTP_HOST is missing. Check .env path.");
}

const transporter = nodemailer.createTransport({
  host: process.env.BREVO_SMTP_HOST,
  port: Number(process.env.BREVO_SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_PASS,
  },
});

transporter.verify((err) => {
  if (err) {
    console.error("❌ SMTP VERIFY FAILED:", err);
  } else {
    console.log("✅ SMTP SERVER READY");
  }
});

export default transporter;
