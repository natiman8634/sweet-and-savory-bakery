/**
 * Email templates for the bakery
 */

export const getWelcomeTemplate = (fullName: string) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #8B4513; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #8B4513; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🍰 Welcome to Sweet & Savory Bakery!</h1>
  </div>
  <div class="content">
    <h2>Hello ${fullName}!</h2>
    <p>We're thrilled to have you join our bakery family. 🎉</p>
    <p>Here's what you can do with your account:</p>
    <ul>
      <li>🛒 Browse our delicious fresh-baked goods</li>
      <li>📦 Place orders for pickup or delivery</li>
      <li>⭐ Leave reviews and share your experience</li>
      <li>📊 Track your order history</li>
    </ul>
    <p>Ready to start your bakery adventure?</p>
    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/products" class="button">Start Shopping</a>
    <p style="margin-top: 20px; color: #666; font-size: 14px;">If you have any questions, feel free to reply to this email.</p>
  </div>
  <div class="footer">
    <p>&copy; 2024 Sweet & Savory Bakery. All rights reserved.</p>
    <p>Bole Road, Addis Ababa, Ethiopia</p>
  </div>
</body>
</html>
  `;
};

export const getOrderConfirmationTemplate = (
  userName: string,
  orderId: string,
  items: any[],
  total: number,
  orderType: string,
  scheduledFor: Date
) => {
  const itemsHtml = items.map(item => `
    <tr>
      <td>${item.product?.name || 'Product'}</td>
      <td style="text-align: center;">${item.quantity}</td>
      <td style="text-align: right;">$${Number(item.subtotal).toFixed(2)}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #8B4513; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #f0f0f0; padding: 10px; text-align: left; }
    td { padding: 10px; border-bottom: 1px solid #eee; }
    .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 20px; padding-top: 20px; border-top: 2px solid #8B4513; }
    .status { display: inline-block; background: #4CAF50; color: white; padding: 5px 15px; border-radius: 20px; font-size: 14px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>✅ Order Confirmed!</h1>
  </div>
  <div class="content">
    <h2>Hello ${userName}!</h2>
    <p>Thank you for your order! We're getting it ready for you. 🎉</p>
    
    <div style="background: #fff; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p><strong>Order #:</strong> ${orderId.slice(0, 8)}</p>
      <p><strong>Order Type:</strong> ${orderType}</p>
      <p><strong>Scheduled For:</strong> ${scheduledFor.toLocaleString()}</p>
      <p><strong>Status:</strong> <span class="status">Confirmed</span></p>
    </div>

    <h3>Order Summary</h3>
    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th style="text-align: center;">Qty</th>
          <th style="text-align: right;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>
    
    <div class="total">
      Total: $${Number(total).toFixed(2)}
    </div>

    <p style="margin-top: 30px;">We'll notify you when your order is ready!</p>
    <p style="color: #666; font-size: 14px;">Questions? Contact us at +251-911-000-000</p>
  </div>
  <div class="footer">
    <p>&copy; 2026 Sweet & Savory Bakery. All rights reserved.</p>
  </div>
</body>
</html>
  `;
};

export const getOrderStatusUpdateTemplate = (
  userName: string,
  orderId: string,
  status: string
) => {
  const statusEmojis: Record<string, string> = {
    'Pending': '⏳',
    'Preparing': '👨‍🍳',
    'Ready for Pickup': '✅',
    'Out for Delivery': '🚚',
    'Completed': '🎉',
    'Cancelled': '❌'
  };

  const statusMessages: Record<string, string> = {
    'Pending': 'Your order has been received and is being reviewed.',
    'Preparing': 'Our bakers are preparing your order with love! ❤️',
    'Ready for Pickup': 'Your order is ready for pickup! Come and get it!',
    'Out for Delivery': 'Your order is on its way to you! 🚗',
    'Completed': 'Your order has been completed. We hope you enjoyed it!',
    'Cancelled': 'Your order has been cancelled.'
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #8B4513; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .status-box { background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
    .status-emoji { font-size: 48px; display: block; margin-bottom: 10px; }
    .status-name { font-size: 24px; font-weight: bold; color: #8B4513; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🔄 Order Status Update</h1>
  </div>
  <div class="content">
    <h2>Hello ${userName}!</h2>
    <div class="status-box">
      <span class="status-emoji">${statusEmojis[status] || '📦'}</span>
      <div class="status-name">${status}</div>
      <p style="margin-top: 10px;">${statusMessages[status] || 'Your order status has been updated.'}</p>
    </div>
    
    <p><strong>Order #:</strong> ${orderId.slice(0, 8)}</p>
    
    <p style="margin-top: 20px; color: #666; font-size: 14px;">Questions? Contact us at +251-911-000-000</p>
  </div>
  <div class="footer">
    <p>&copy; 2026 Sweet & Savory Bakery. All rights reserved.</p>
  </div>
</body>
</html>
  `;
};