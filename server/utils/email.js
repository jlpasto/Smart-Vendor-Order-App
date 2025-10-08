import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create email transporter
const createTransporter = () => {
  // If email is not configured, return null (will skip sending)
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER) {
    console.warn('⚠️ Email not configured. Emails will not be sent.');
    return null;
  }

  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Send order confirmation email
export const sendOrderConfirmation = async (userEmail, batchNumber, orders) => {
  const transporter = createTransporter();
  if (!transporter) return;

  try {
    const totalAmount = orders.reduce((sum, order) => sum + parseFloat(order.amount), 0);
    const itemCount = orders.length;

    const ordersList = orders.map(order =>
      `- ${order.product_name} x ${order.quantity} - $${parseFloat(order.amount).toFixed(2)}`
    ).join('\n');

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: `Order Confirmation - ${batchNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e40af;">Order Confirmation</h2>
          <p>Thank you for your order! Your order has been received and is being processed.</p>

          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Order Details</h3>
            <p><strong>Batch Number:</strong> ${batchNumber}</p>
            <p><strong>Number of Items:</strong> ${itemCount}</p>
            <p><strong>Total Amount:</strong> $${totalAmount.toFixed(2)}</p>
            <p><strong>Status:</strong> Pending</p>
          </div>

          <h3>Items Ordered:</h3>
          <pre style="background: #f9fafb; padding: 15px; border-radius: 8px;">${ordersList}</pre>

          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            You will receive an email notification when your order status changes.
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">
            This is an automated message from Wholesale Order Hub.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Order confirmation sent to ${userEmail}`);
  } catch (error) {
    console.error('❌ Error sending order confirmation:', error);
    throw error;
  }
};

// Send status update email
export const sendStatusUpdateEmail = async (userEmail, order, newStatus, notes) => {
  const transporter = createTransporter();
  if (!transporter) return;

  try {
    const statusColors = {
      pending: '#eab308',
      completed: '#22c55e',
      cancelled: '#ef4444'
    };

    const statusColor = statusColors[newStatus] || '#6b7280';

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: `Order Status Update - ${order.batch_order_number}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e40af;">Order Status Update</h2>
          <p>Your order status has been updated.</p>

          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Order Details</h3>
            <p><strong>Batch Number:</strong> ${order.batch_order_number}</p>
            <p><strong>Product:</strong> ${order.product_name}</p>
            <p><strong>Quantity:</strong> ${order.quantity}</p>
            <p><strong>Amount:</strong> $${parseFloat(order.amount).toFixed(2)}</p>
            <p>
              <strong>Status:</strong>
              <span style="color: ${statusColor}; font-weight: bold; text-transform: uppercase;">
                ${newStatus}
              </span>
            </p>
          </div>

          ${notes ? `
            <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
              <h4 style="margin-top: 0; color: #92400e;">Admin Note:</h4>
              <p style="margin: 0; color: #78350f;">${notes}</p>
            </div>
          ` : ''}

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">
            This is an automated message from Wholesale Order Hub.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Status update email sent to ${userEmail}`);
  } catch (error) {
    console.error('❌ Error sending status update email:', error);
    throw error;
  }
};
