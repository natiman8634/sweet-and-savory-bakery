import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import {
  getOrderConfirmationTemplate,
  getOrderStatusUpdateTemplate,
  getWelcomeTemplate
} from './emailTemplates.js';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const SMTP_USER = process.env.SMTP_USER || '';
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'Sweet & Savory Bakery';
const EMAIL_FROM = process.env.EMAIL_FROM || SMTP_USER || 'noreply@bakery.com';
const EMAIL_REPLY_TO = process.env.EMAIL_REPLY_TO || SMTP_USER || EMAIL_FROM;
const RESEND_FROM = process.env.RESEND_FROM || process.env.EMAIL_FROM || 'onboarding@resend.dev';

const buildFromAddress = () => {
  if (!SMTP_USER) return EMAIL_FROM;
  return `${EMAIL_FROM_NAME} <${SMTP_USER}>`;
};

const sendWithResend = async (to: string, subject: string, html: string, text: string) => {
  if (!resend) return null;

  const result = await resend.emails.send({
    from: RESEND_FROM,
    to,
    subject,
    html,
    text,
    replyTo: EMAIL_REPLY_TO,
  });

  return result;
};

const sendWithSmtp = async (to: string, subject: string, html: string, text: string) => {
  const info = await transporter.sendMail({
    from: buildFromAddress(),
    replyTo: EMAIL_REPLY_TO,
    to,
    subject,
    html,
    text,
    headers: {
      'List-Unsubscribe': `<mailto:${EMAIL_REPLY_TO}?subject=Unsubscribe>`,
      'X-Auto-Response-Suppress': 'OOF, AutoReply',
      'X-Priority': '3',
      'Importance': 'Normal',
    },
  });

  return info;
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
    
    const subject = `Your Sweet & Savory Bakery order #${orderId.slice(0, 8)} is confirmed`;
    const text = `Hello ${userName},\n\nYour order #${orderId.slice(0, 8)} has been confirmed.\nTotal: $${total.toFixed(2)}\nScheduled for: ${scheduledFor.toLocaleString()}\n\nThanks for shopping with Sweet & Savory Bakery.`;

    const result = await sendWithResend(userEmail, subject, html, text);
    if (result) {
      console.log(`✅ Order confirmation email sent to ${userEmail}: ${result.data?.id || 'resend'}`);
      return result;
    }

    const info = await sendWithSmtp(userEmail, subject, html, text);
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
    
    const subject = `Update on your Sweet & Savory Bakery order #${orderId.slice(0, 8)}`;
    const text = `Hello ${userName},\n\nYour order #${orderId.slice(0, 8)} status is now: ${status}.\n\nThanks for shopping with Sweet & Savory Bakery.`;

    const result = await sendWithResend(userEmail, subject, html, text);
    if (result) {
      console.log(`✅ Status update email sent to ${userEmail}: ${result.data?.id || 'resend'}`);
      return result;
    }

    const info = await sendWithSmtp(userEmail, subject, html, text);
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
    
    const subject = 'Welcome to Sweet & Savory Bakery';
    const text = `Hello ${fullName},\n\nWelcome to Sweet & Savory Bakery.\n\nThanks for joining us.`;

    const result = await sendWithResend(userEmail, subject, html, text);
    if (result) {
      console.log(`✅ Welcome email sent to ${userEmail}: ${result.data?.id || 'resend'}`);
      return result;
    }

    const info = await sendWithSmtp(userEmail, subject, html, text);
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