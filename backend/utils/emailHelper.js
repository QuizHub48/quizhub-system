const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOtpEmail = async (to, otp) => {
  await transporter.sendMail({
    from: `"Quiz Hub" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Quiz Hub - OTP Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #1a1a4e; font-size: 24px; margin: 0;">Quiz Hub</h2>
          <p style="color: #6b7280; margin-top: 4px;">Password Reset</p>
        </div>
        <p style="color: #374151;">Don't worry! It happens. Here is your OTP to reset your password:</p>
        <div style="background: #f3f4f6; padding: 24px; border-radius: 10px; text-align: center; margin: 24px 0;">
          <h1 style="color: #1a1a4e; letter-spacing: 16px; font-size: 2.8rem; margin: 0;">${otp}</h1>
        </div>
        <p style="color: #6b7280; font-size: 14px;">This OTP will expire in <strong>10 minutes</strong>.</p>
        <p style="color: #6b7280; font-size: 14px;">If you didn't request this, please ignore this email.</p>
      </div>
    `,
  });
};

module.exports = { sendOtpEmail };
