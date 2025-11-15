const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // CORRECTED: Use createTransport (not createTransporter)
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendPasswordReset(email, resetUrl, firstName) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { background: #f9fafb; padding: 30px; }
          .button { background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>EduAnalytics SA</h1>
          </div>
          <div class="content">
            <h2>Password Reset Request</h2>
            <p>Hello ${firstName},</p>
            <p>You requested to reset your password for your EduAnalytics SA account.</p>
            <p>Click the button below to reset your password:</p>
            <p style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this reset, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 EduAnalytics SA. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Reset Your Password - EduAnalytics SA',
      html,
    });
  }

  async sendPasswordResetConfirmation(email, firstName) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; }
          .content { background: #f9fafb; padding: 30px; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Updated</h1>
          </div>
          <div class="content">
            <h2>Password Changed Successfully</h2>
            <p>Hello ${firstName},</p>
            <p>Your EduAnalytics SA password has been successfully changed.</p>
            <p>If you did not make this change, please contact our support team immediately.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 EduAnalytics SA. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Password Updated - EduAnalytics SA',
      html,
    });
  }

  async sendEmail({ to, subject, html, text }) {
    try {
      await this.transporter.sendMail({
        from: `"EduAnalytics SA" <${process.env.SMTP_FROM || 'noreply@eduanalyticssa.co.za'}>`,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''),
      });
      console.log(`Email sent to ${to}`);
    } catch (error) {
      console.error('Email sending error:', error);
    }
  }
}

// Create a simple version that won't crash if email is not configured
const createEmailService = () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return new EmailService();
  } else {
    console.log('Email service not configured - using mock service');
    return {
      sendPasswordReset: async () => console.log('Mock: Password reset email would be sent'),
      sendPasswordResetConfirmation: async () => console.log('Mock: Password confirmation email would be sent'),
      sendEmail: async () => console.log('Mock: Email would be sent')
    };
  }
};

module.exports = createEmailService();