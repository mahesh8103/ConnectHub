import nodemailer from "nodemailer";

export const sendOtpEmail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"ConnectHub" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your ConnectHub Verification Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 32px; background: #0f0f1a; border-radius: 16px; border: 1px solid #2a2a4a;">
        <h2 style="color: #a78bfa; margin-bottom: 8px;">💬 ConnectHub</h2>
        <p style="color: #9ca3af; margin-bottom: 24px;">Your email verification code:</p>
        <div style="background: #1a1a2e; border: 1px solid #3b3b6b; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 12px; color: #a78bfa;">${otp}</span>
        </div>
        <p style="color: #6b7280; font-size: 13px;">This code expires in <strong style="color: #9ca3af;">10 minutes</strong>.</p>
        <p style="color: #6b7280; font-size: 13px;">If you did not request this, ignore this email.</p>
      </div>
    `,
  });
};