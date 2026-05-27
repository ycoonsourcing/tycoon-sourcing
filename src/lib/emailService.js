// src/lib/emailService.js
// Complete Email Service using Firebase Cloud Function
// Handles all notifications for Tycoon Sourcing

const FUNCTION_URL = 'https://sendemail-jnnmqvoxzq-uc.a.run.app';
const ADMIN_EMAIL = 'info@tycoonsourcing.com';

async function callEmailFunction(to, subject, html) {
  try {
    const response = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, html }),
    });

    const data = await response.json();
    console.log('✅ Email sent to:', to);
    return { success: data.success, error: data.error };
  } catch (error) {
    console.error('❌ Email failed:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================
// CLIENT EMAILS
// ============================================================

/**
 * Send payment approved email to client
 */
export async function sendPaymentApprovedEmail(clientEmail, clientName, invoiceNumber, amount) {
  const html = `
    <h2>Payment Approved! ✅</h2>
    <p>Hi <strong>${clientName}</strong>,</p>
    <p>Great news! Your payment for <strong>Invoice #${invoiceNumber}</strong> has been approved by Tycoon Sourcing.</p>
    <p style="font-size: 18px; font-weight: bold; color: #10b981;">Amount: LKR ${(+amount).toLocaleString('en-AU', { minimumFractionDigits: 2 })}</p>
    <p><strong>Next Steps:</strong></p>
    <ul>
      <li>Your funds will be transferred within 1-2 business days</li>
      <li>You'll receive another notification when your batch is ready for pickup</li>
      <li>Check your account dashboard for latest updates</li>
    </ul>
    <p>Thank you for your business!</p>
    <p><strong>Tycoon Sourcing Team</strong></p>
  `;
  return callEmailFunction(clientEmail, `✅ Payment Approved - Invoice #${invoiceNumber}`, html);
}

/**
 * Send payment rejected email to client
 */
export async function sendPaymentRejectedEmail(clientEmail, clientName, invoiceNumber, rejectionReason) {
  const html = `
    <h2>Payment Rejected ⚠️</h2>
    <p>Hi <strong>${clientName}</strong>,</p>
    <p>Your payment proof for <strong>Invoice #${invoiceNumber}</strong> has been reviewed and rejected.</p>
    <p><strong>Reason:</strong> ${rejectionReason}</p>
    <p><strong>What to do next:</strong></p>
    <ul>
      <li>Login to your account dashboard</li>
      <li>Go to "My Deals" → View the deal</li>
      <li>Find the invoice and click "Upload Proof"</li>
      <li>Upload a corrected payment proof (bank transfer receipt, payment confirmation, etc.)</li>
      <li>We'll review it again promptly</li>
    </ul>
    <p><strong>Need help?</strong> Contact us:</p>
    <ul>
      <li>Email: info@tycoonsourcing.com</li>
      <li>WhatsApp: +94 777 303 091</li>
    </ul>
    <p>Thank you,<br><strong>Tycoon Sourcing Team</strong></p>
  `;
  return callEmailFunction(clientEmail, `⚠️ Payment Rejected - Invoice #${invoiceNumber}`, html);
}

/**
 * Send invoice overdue reminder email to client
 */
export async function sendInvoiceOverdueEmail(clientEmail, clientName, invoiceNumber, amount, daysOverdue) {
  const html = `
    <h2>⚠️ Payment Reminder</h2>
    <p>Hi <strong>${clientName}</strong>,</p>
    <p>Your invoice <strong>#${invoiceNumber}</strong> is now <strong>${daysOverdue} days overdue</strong>.</p>
    <p style="font-size: 18px; font-weight: bold; color: #ef4444;">Amount Due: LKR ${(+amount).toLocaleString('en-AU', { minimumFractionDigits: 2 })}</p>
    <p>Please arrange payment at your earliest convenience to avoid any delays in batch processing.</p>
    <p><strong>Bank Transfer Details:</strong><br>
    Bank: Seylan Bank PLC<br>
    Account: 0710 13338448 001<br>
    Name: Tycoon Holdings (Pvt) Ltd<br>
    Reference: ${invoiceNumber}</p>
    <p>Questions? Contact us: info@tycoonsourcing.com | +94 777 303 091</p>
  `;
  return callEmailFunction(clientEmail, `⚠️ Invoice Overdue - Invoice #${invoiceNumber}`, html);
}

/**
 * Send batch ready for pickup email to client
 */
export async function sendBatchReadyEmail(clientEmail, clientName, batchNumber, units, warehouse) {
  const html = `
    <h2>📦 Batch Ready for Pickup!</h2>
    <p>Hi <strong>${clientName}</strong>,</p>
    <p>Excellent news! Your <strong>Batch #${batchNumber}</strong> is now ready for collection.</p>
    <p><strong>Batch Details:</strong><br>
    Batch #: ${batchNumber}<br>
    Units: ${units}<br>
    Warehouse: ${warehouse}</p>
    <p><strong>Next Steps:</strong></p>
    <ol>
      <li>Schedule your pickup time with us</li>
      <li>Arrange transportation for ${units} units</li>
      <li>Contact us to confirm pickup details</li>
    </ol>
    <p>📞 +94 777 303 091 | 📧 info@tycoonsourcing.com<br>
    ⏰ Available: Monday to Friday, 9 AM - 5 PM</p>
    <p>Please collect your batch within 30 days to avoid storage charges.</p>
  `;
  return callEmailFunction(clientEmail, `✅ Batch #${batchNumber} Ready for Pickup!`, html);
}

/**
 * Send withdrawal approval email to client
 */
export async function sendWithdrawalApprovedEmail(clientEmail, clientName, amount, reference) {
  const html = `
    <h2>Withdrawal Approved! ✅</h2>
    <p>Hi <strong>${clientName}</strong>,</p>
    <p>Your withdrawal request has been approved!</p>
    <p style="font-size: 20px; font-weight: bold; color: #10b981;">LKR ${(+amount).toLocaleString('en-AU', { minimumFractionDigits: 2 })}</p>
    <p><strong>Reference:</strong> ${reference}</p>
    <p><strong>What happens next:</strong></p>
    <ul>
      <li>Funds will be transferred within 1-2 business days</li>
      <li>Check your bank account for the deposit</li>
      <li>Contact us if you don't receive funds within 48 hours</li>
    </ul>
    <p>Thank you for your business!</p>
  `;
  return callEmailFunction(clientEmail, `✅ Withdrawal Approved - LKR ${(+amount).toLocaleString()}`, html);
}

/**
 * Send deal confirmation email to client
 */
export async function sendDealConfirmedEmail(clientEmail, clientName, dealCode, units, status) {
  const html = `
    <h2>Deal Confirmed! ✅</h2>
    <p>Hi <strong>${clientName}</strong>,</p>
    <p>Your deal has been confirmed and is now <strong>${status}</strong>.</p>
    <p><strong>Deal Details:</strong><br>
    Deal Code: ${dealCode}<br>
    Units: ${units}<br>
    Status: ${status}</p>
    <p>Your deal is now in our system. You'll receive updates as it progresses through our process.</p>
    <p>For questions, contact us:</p>
    <p>📞 +94 777 303 091 | 📧 info@tycoonsourcing.com</p>
  `;
  return callEmailFunction(clientEmail, `✅ Deal Confirmed - ${dealCode}`, html);
}

/**
 * Send invoice created email to client
 */
export async function sendInvoiceCreatedEmail(clientEmail, clientName, invoiceNumber, amount, dueDate) {
  const html = `
    <h2>New Invoice Created 📄</h2>
    <p>Hi <strong>${clientName}</strong>,</p>
    <p>A new invoice has been created for your deal.</p>
    <p><strong>Invoice Details:</strong><br>
    Invoice #: ${invoiceNumber}<br>
    Amount: LKR ${(+amount).toLocaleString('en-AU', { minimumFractionDigits: 2 })}<br>
    Due Date: ${dueDate}</p>
    <p>Please upload your payment proof in your account dashboard once you've transferred the funds.</p>
    <p><strong>Bank Details:</strong><br>
    Bank: Seylan Bank PLC<br>
    Account: 0710 13338448 001<br>
    Name: Tycoon Holdings (Pvt) Ltd<br>
    Reference: ${invoiceNumber}</p>
    <p>Questions? info@tycoonsourcing.com</p>
  `;
  return callEmailFunction(clientEmail, `📄 New Invoice Created - #${invoiceNumber}`, html);
}

/**
 * Send payment received confirmation to client
 */
export async function sendPaymentReceivedEmail(clientEmail, clientName, invoiceNumber, amount) {
  const html = `
    <h2>Payment Received! ✅</h2>
    <p>Hi <strong>${clientName}</strong>,</p>
    <p>Thank you! We've received and confirmed your payment for <strong>Invoice #${invoiceNumber}</strong>.</p>
    <p style="font-size: 18px; font-weight: bold; color: #10b981;">Amount Received: LKR ${(+amount).toLocaleString('en-AU', { minimumFractionDigits: 2 })}</p>
    <p>Your invoice is now <strong>PAID</strong>. Your batch will be processed and you'll receive a notification when it's ready for pickup.</p>
    <p>Thank you for your business!</p>
  `;
  return callEmailFunction(clientEmail, `✅ Payment Received - Invoice #${invoiceNumber}`, html);
}

/**
 * Send batch dispatched email to client
 */
export async function sendBatchDispatchedEmail(clientEmail, clientName, batchNumber, units, trackingNumber) {
  const html = `
    <h2>📦 Batch Dispatched!</h2>
    <p>Hi <strong>${clientName}</strong>,</p>
    <p>Great news! Your <strong>Batch #${batchNumber}</strong> has been dispatched from our warehouse.</p>
    <p><strong>Shipment Details:</strong><br>
    Batch #: ${batchNumber}<br>
    Units: ${units}<br>
    Tracking #: ${trackingNumber}</p>
    <p>Your batch is on its way! You can track your shipment using the tracking number above.</p>
    <p>For any questions, contact us:</p>
    <p>📞 +94 777 303 091 | 📧 info@tycoonsourcing.com</p>
  `;
  return callEmailFunction(clientEmail, `📦 Batch #${batchNumber} Dispatched!`, html);
}

/**
 * Send account status change notification to client
 */
export async function sendAccountStatusChangeEmail(clientEmail, clientName, newStatus, reason) {
  const html = `
    <h2>Account Status Update</h2>
    <p>Hi <strong>${clientName}</strong>,</p>
    <p>Your account status has been updated to: <strong>${newStatus}</strong></p>
    <p><strong>Reason:</strong> ${reason}</p>
    <p>If you have any questions about this change, please contact our support team:</p>
    <p>📞 +94 777 303 091 | 📧 info@tycoonsourcing.com</p>
  `;
  return callEmailFunction(clientEmail, `Account Status: ${newStatus}`, html);
}

// ============================================================
// ADMIN EMAILS
// ============================================================

/**
 * Send admin notification when payment proof is uploaded
 */
export async function sendAdminPaymentUploadedEmail(clientName, clientEmail, invoiceNumber, amount) {
  const html = `
    <h2>🔔 New Payment Proof Uploaded</h2>
    <p>A new payment proof has been uploaded and requires your review.</p>
    <p><strong>Client Details:</strong><br>
    Name: ${clientName}<br>
    Email: ${clientEmail}</p>
    <p><strong>Invoice Details:</strong><br>
    Invoice #: ${invoiceNumber}<br>
    Amount: LKR ${(+amount).toLocaleString('en-AU', { minimumFractionDigits: 2 })}</p>
    <p><strong>Action Required:</strong> Login to admin portal to approve or reject.</p>
  `;
  return callEmailFunction(ADMIN_EMAIL, `🔔 Payment Proof Uploaded - Review Required`, html);
}

/**
 * Send admin notification when new deal request is created
 */
export async function sendAdminNewDealRequestEmail(clientName, clientEmail, dealCode, units) {
  const html = `
    <h2>📋 New Deal Request</h2>
    <p>A new deal request has been submitted.</p>
    <p><strong>Client Details:</strong><br>
    Name: ${clientName}<br>
    Email: ${clientEmail}</p>
    <p><strong>Deal Details:</strong><br>
    Deal Code: ${dealCode}<br>
    Units: ${units}</p>
    <p><strong>Action Required:</strong> Login to admin portal to review and approve/reject.</p>
  `;
  return callEmailFunction(ADMIN_EMAIL, `📋 New Deal Request - ${dealCode}`, html);
}

/**
 * Send admin notification when withdrawal is requested
 */
export async function sendAdminWithdrawalRequestedEmail(clientName, amount, dealCode) {
  const html = `
    <h2>💰 New Withdrawal Request</h2>
    <p>A new withdrawal request has been submitted.</p>
    <p><strong>Client:</strong> ${clientName}<br>
    <strong>Amount:</strong> LKR ${(+amount).toLocaleString('en-AU', { minimumFractionDigits: 2 })}<br>
    <strong>Deal:</strong> ${dealCode}</p>
    <p><strong>Action Required:</strong> Login to admin portal to process this withdrawal.</p>
  `;
  return callEmailFunction(ADMIN_EMAIL, `💰 New Withdrawal Request - LKR ${(+amount).toLocaleString()}`, html);
}

/**
 * Send admin alert for overdue payment
 */
export async function sendAdminOverduePaymentAlert(clientName, invoiceNumber, amount, daysOverdue) {
  const html = `
    <h2>⚠️ Overdue Payment Alert</h2>
    <p>An invoice is now overdue!</p>
    <p><strong>Client:</strong> ${clientName}<br>
    <strong>Invoice #:</strong> ${invoiceNumber}<br>
    <strong>Amount:</strong> LKR ${(+amount).toLocaleString('en-AU', { minimumFractionDigits: 2 })}<br>
    <strong>Days Overdue:</strong> ${daysOverdue}</p>
    <p><strong>Action Required:</strong> Follow up with client or take collection action.</p>
  `;
  return callEmailFunction(ADMIN_EMAIL, `⚠️ Overdue Payment Alert - ${invoiceNumber}`, html);
}

/**
 * Send admin notification when batch is created
 */
export async function sendAdminNewBatchCreatedEmail(batchNumber, units, warehouse, dealCode) {
  const html = `
    <h2>📦 New Batch Created</h2>
    <p>A new batch has been created in the system.</p>
    <p><strong>Batch Details:</strong><br>
    Batch #: ${batchNumber}<br>
    Units: ${units}<br>
    Warehouse: ${warehouse}<br>
    Deal Code: ${dealCode}</p>
    <p><strong>Action Required:</strong> Monitor batch processing and notify client when ready for pickup.</p>
  `;
  return callEmailFunction(ADMIN_EMAIL, `📦 New Batch Created - #${batchNumber}`, html);
}

/**
 * Send admin low inventory alert
 */
export async function sendAdminLowInventoryAlert(warehouse, itemName, currentStock, minStock) {
  const html = `
    <h2>📉 Low Inventory Alert</h2>
    <p>Inventory is running low!</p>
    <p><strong>Warehouse:</strong> ${warehouse}<br>
    <strong>Item:</strong> ${itemName}<br>
    <strong>Current Stock:</strong> ${currentStock}<br>
    <strong>Minimum Level:</strong> ${minStock}</p>
    <p><strong>Action Required:</strong> Reorder inventory or inform clients of delays.</p>
  `;
  return callEmailFunction(ADMIN_EMAIL, `📉 Low Inventory Alert - ${warehouse}`, html);
}

/**
 * Send admin withdrawal processing confirmation
 */
export async function sendAdminWithdrawalProcessedEmail(clientName, amount, reference, status) {
  const html = `
    <h2>✅ Withdrawal Processed</h2>
    <p>A withdrawal has been processed.</p>
    <p><strong>Client:</strong> ${clientName}<br>
    <strong>Amount:</strong> LKR ${(+amount).toLocaleString('en-AU', { minimumFractionDigits: 2 })}<br>
    <strong>Reference:</strong> ${reference}<br>
    <strong>Status:</strong> ${status}</p>
    <p>Client has been notified of the approval.</p>
  `;
  return callEmailFunction(ADMIN_EMAIL, `✅ Withdrawal Processed - ${reference}`, html);
}

// ============================================================
// TEST EMAIL
// ============================================================

/**
 * Send test email to verify setup
 */
export async function sendTestEmail(testEmail) {
  const html = `
    <h2>Test Email Success! ✅</h2>
    <p>This is a test email from Tycoon Sourcing.</p>
    <p>If you received this, the email system is working correctly!</p>
    <p>Tycoon Sourcing Team</p>
  `;
  return callEmailFunction(testEmail, '✅ Test Email - Tycoon Sourcing', html);
}

// ============================================================
// PASSWORD RESET EMAIL
// ============================================================

/**
 * Send professional password reset email to client
 */
export async function sendPasswordResetEmail(clientEmail, resetLink) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 900; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #1d4ed8; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center; }
        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; font-size: 13px; }
        a { color: #1d4ed8; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Reset Your Password</h1>
        </div>
        <div class="content">
          <p>Hi,</p>
          <p>We received a request to reset the password for your Tycoon Sourcing account. Click the button below to create a new password:</p>
          
          <center>
            <a href="${resetLink}" class="button" style="text-decoration: none;">Reset Password</a>
          </center>
          
          <p style="text-align: center; font-size: 12px; color: #6b7280;">
            Or copy and paste this link in your browser:<br>
            <code style="background: #f3f4f6; padding: 8px 12px; border-radius: 4px; display: inline-block; margin-top: 8px; word-break: break-all; font-size: 11px;">
              ${resetLink}
            </code>
          </p>
          
          <div class="warning">
            <strong>⚠️ Security Note:</strong> This link will expire in 24 hours. If you didn't request a password reset, you can safely ignore this email. Your account is secure.
          </div>
          
          <p><strong>Next Steps:</strong></p>
          <ul>
            <li>Click the button above</li>
            <li>Enter your new password</li>
            <li>Sign in with your new password</li>
          </ul>
          
          <p><strong>Need Help?</strong><br>
          If you're having trouble resetting your password, contact us:<br>
          📧 Email: <a href="mailto:info@tycoonsourcing.com">info@tycoonsourcing.com</a><br>
          📱 WhatsApp: <a href="https://wa.me/94777303091">+94 777 303 091</a>
          </p>
          
          <div class="footer">
            <p>Tycoon Sourcing | Wholesale Trading Platform<br>
            <a href="https://tycoonsourcing.com">www.tycoonsourcing.com</a></p>
            <p style="margin-top: 10px; color: #9ca3af;">This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return callEmailFunction(clientEmail, '🔐 Reset Your Password - Tycoon Sourcing', html);
}
