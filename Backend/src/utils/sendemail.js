import transporter from "./mailer.js";

/**
 * Send an email using the configured transporter
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML body
 * @param {string} [options.text] - Plain text fallback (optional)
 * @returns {Promise<Object>} - Nodemailer send result
 */
const sendEmail = async ({ to, subject, html, text }) => {
  console.log(`📧 [SendEmail] Sending to: ${to}`);
  console.log(`📧 [SendEmail] Subject: ${subject}`);
  
  if (!to || !subject || !html) {
    throw new Error("Missing required email fields: to, subject, or html");
  }

  try {
    const result = await transporter.sendMail({
      from: process.env.EMAIL_FROM || "CitizenVoice <noreply@citizenvoice.com>",
      to,
      subject,
      html,
      text: text || subject, // Fallback to subject if no plain text provided
    });
    
    console.log(`✅ [SendEmail] Email sent successfully. MessageId: ${result.messageId}`);
    return result;
  } catch (error) {
    console.error(`❌ [SendEmail] Failed to send email to ${to}:`, error.message);
    throw error;
  }
};

export default sendEmail;
