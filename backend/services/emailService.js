// backend/services/emailService.js
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransporter({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendWelcomeEmail = async (user) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Welcome to Scribble Blog!',
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h1 style="color: #3b82f6;">Welcome to Scribble Blog!</h1>
          <p>Hi ${user.firstName || user.username},</p>
          <p>Thank you for joining Scribble Blog! We're excited to have you as part of our community.</p>
          <p>You can now:</p>
          <ul>
            <li>Create and publish blog posts</li>
            <li>Follow other writers</li>
            <li>Engage with the community through comments and likes</li>
            <li>Access analytics for your content</li>
          </ul>
          <p>Happy writing!</p>
          <p>The Scribble Blog Team</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }
};

export const sendPasswordResetEmail = async (user, resetToken) => {
  try {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Password Reset - Scribble Blog',
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h1 style="color: #3b82f6;">Password Reset Request</h1>
          <p>Hi ${user.firstName || user.username},</p>
          <p>You requested a password reset for your Scribble Blog account.</p>
          <p>Click the button below to reset your password:</p>
          <a href="${resetUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this reset, please ignore this email.</p>
          <p>The Scribble Blog Team</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending password reset email:', error);
  }
};

export const sendNotificationEmail = async (user, notification) => {
  try {
    if (!user.preferences?.emailNotifications) return;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: notification.title,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h2 style="color: #3b82f6;">${notification.title}</h2>
          <p>${notification.message}</p>
          <p>Visit Scribble Blog to see more details.</p>
          <p>The Scribble Blog Team</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending notification email:', error);
  }
};
