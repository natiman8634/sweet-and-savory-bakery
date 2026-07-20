import nodemailer from 'nodemailer';
import {
  getOrderConfirmationTemplate,
  getOrderStatusUpdateTemplate,
  getWelcomeTemplate
} from './emailTemplates.js';

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const SMTP_USER = process.env.SMTP_USER || '';
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'Sweet & Savory Bakery';
const EMAIL_FROM = process.env.EMAIL_FROM || SMTP_USER || 'noreply@bakery.com';
const EMAIL_REPLY_TO = process.env.EMAIL_REPLY_TO || SMTP_USER || EMAIL_FROM;

const buildFromAddress = () => {
  if (!SMTP_USER) return EMAIL_FROM;
  return `${EMAIL_FROM_NAME} <${SMTP_USER}>`;
};

/**
 * Send order confirmation email
 */
export const sendOrderConfirmation = async (
  userEmail: string,
  userName: string,
  orderId: string,
  items: any[],
  total: number,
  orderType: string,
  scheduledFor: Date
) => {
  try {
    const html = getOrderConfirmationTemplate(userName, orderId, items, total, orderType, scheduledFor);
    
    const mailOptions = {
      from: buildFromAddress(),
      replyTo: EMAIL_REPLY_TO,
      to: userEmail,
      subject: `Order #${orderId.slice(0, 8)} Confirmed - Sweet & Savory Bakery`,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Order confirmation email sent to ${userEmail}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    return null;
  }
};

/**
 * Send order status update email
 */
export const sendOrderStatusUpdate = async (
  userEmail: string,
  userName: string,
  orderId: string,
  status: string
) => {
  try {
    const html = getOrderStatusUpdateTemplate(userName, orderId, status);
    
    const mailOptions = {
      from: buildFromAddress(),
      replyTo: EMAIL_REPLY_TO,
      to: userEmail,
      subject: `Order #${orderId.slice(0, 8)} Status Update - Sweet & Savory Bakery`,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Status update email sent to ${userEmail}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Error sending status update email:', error);
    return null;
  }
};

/**
 * Send welcome email to new users
 */
export const sendWelcomeEmail = async (userEmail: string, fullName: string) => {
  try {
    const html = getWelcomeTemplate(fullName);
    
    const mailOptions = {
      from: buildFromAddress(),
      replyTo: EMAIL_REPLY_TO,
      to: userEmail,
      subject: 'Welcome to Sweet & Savory Bakery! 🎉',
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${userEmail}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return null;
  }
};

/**
 * Send verification email (for resend)
 */
export const sendVerificationEmail = async (userEmail: string, fullName: string) => {
  return sendWelcomeEmail(userEmail, fullName);
};