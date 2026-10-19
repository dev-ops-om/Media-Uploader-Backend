import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

console.log(
  process.env.SMTP_HOST,
  process.env.SMTP_PORT
);
// 1. Create SMTP transporter connected to Mailtrap
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 2525,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});
transporter.verify()
  .then(() => console.log("SMTP Connected"))
  .catch(err => console.error(err));
// 2. Generic helper to send any HTML email
const sendEmail = async (to, subject, html) => {
  await transporter.sendMail({
    from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
    to,
    subject,
    html,
  });
};

// 3. Verification email template
const sendVerificationEmail = async (email, token) => {
    
  // Points to our API endpoint (or frontend route)
  const url = `${process.env.CLIENT_URL}/api/auth/verify-email/${token}`;

  await sendEmail(
    email,
    "Verify your email address",
    `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Welcome to the Cohort!</h2>
        <p>Thank you for signing up. Please click the button below to verify your email address:</p>
        <p>
          <a href="${url}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email
          </a>
        </p>
        <p>Or copy and paste this link in your browser: <br><a href="${url}">${url}</a></p>
      </div>
    `
  );
};

export { sendEmail, sendVerificationEmail };