// PHASE 5: Generate detailed professional invoice HTML
// Matches the invoice format you uploaded

export const generateDetailedInvoiceHTML = (invoice, batch, deal, client) => {
  // Calculate all the details from batch data
  const unitPrice = deal && batch ? (deal.order_value_lkr / deal.total_units) : 0;
  const units = batch?.units || 0;
  const baseAmount = unitPrice * units;
  const handling = batch?.handling_fee || 0;
  const storage = batch?.storage_fee || 0;
  const service = batch?.service_fee || 0;
  const total = invoice?.amount || (baseAmount + handling + storage + service);

  // Calculate CBM
  const cbmPerUnit = deal?.cbm_per_unit || 0;
  const totalCBM = (units * cbmPerUnit).toFixed(3);
  const daysHeld = batch?.days_held || 1;

  // Status color
  const statusColor = invoice?.status === 'paid' ? '#10b981' : '#f59e0b'; // Green or Amber
  const statusText = invoice?.status === 'paid' ? 'PAID' : 'UNPAID';

  return `<!DOCTYPE html>
<html>
<head>
  <title>Invoice ${invoice?.invoice_num || 'N/A'}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      color: #0a2342;
      background: white;
      padding: 40px 20px;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      padding: 40px;
    }
    
    /* Header */
    .header {
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e2e8f0;
    }
    .company-name {
      font-size: 24px;
      font-weight: 700;
      color: #0a2342;
      margin-bottom: 5px;
    }
    .tagline {
      font-size: 12px;
      color: #94a3b8;
      margin-bottom: 10px;
    }
    .company-details {
      font-size: 11px;
      color: #64748b;
      line-height: 1.6;
    }
    
    /* Invoice Title and Info */
    .invoice-header {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-bottom: 40px;
      align-items: start;
    }
    .invoice-title {
      font-size: 28px;
      font-weight: 700;
      color: #0a2342;
    }
    .invoice-info {
      text-align: right;
    }
    .invoice-info-row {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 15px;
      margin-bottom: 8px;
      font-size: 12px;
    }
    .invoice-info-label {
      color: #94a3b8;
      font-weight: 600;
      text-transform: uppercase;
    }
    .invoice-info-value {
      color: #0a2342;
      font-weight: 600;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 4px;
      font-weight: 700;
      font-size: 12px;
    }
    .status-paid {
      background: #d1fae5;
      color: #065f46;
    }
    .status-unpaid {
      background: #fef3c7;
      color: #92400e;
    }
    
    /* Bill To Section */
    .bill-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-bottom: 40px;
    }
    .bill-box h4 {
      font-size: 11px;
      text-transform: uppercase;
      color: #94a3b8;
      font-weight: 700;
      margin-bottom: 10px;
    }
    .bill-box p {
      font-size: 12px;
      color: #0a2342;
      margin-bottom: 4px;
      line-height: 1.6;
    }
    
    /* Deal Reference */
    .deal-reference {
      background: #f1f5f9;
      padding: 15px;
      border-radius: 6px;
      margin-bottom: 30px;
    }
    .deal-reference h4 {
      font-size: 11px;
      text-transform: uppercase;
      color: #94a3b8;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .deal-reference p {
      font-size: 12px;
      color: #0a2342;
      margin-bottom: 4px;
    }
    
    /* Invoice Items Table */
    .items-section h4 {
      font-size: 12px;
      text-transform: uppercase;
      color: #94a3b8;
      font-weight: 700;
      margin-bottom: 15px;
      margin-top: 30px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    thead {
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
    }
    th {
      padding: 12px;
      text-align: left;
      font-size: 11px;
      font-weight: 700;
      color: #0a2342;
      text-transform: uppercase;
      border: 1px solid #e2e8f0;
    }
    th:last-child {
      text-align: right;
    }
    td {
      padding: 12px;
      font-size: 12px;
      color: #0a2342;
      border: 1px solid #e2e8f0;
    }
    td:last-child {
      text-align: right;
      font-weight: 600;
    }
    tbody tr:nth-child(even) {
      background: #f8fafc;
    }
    .total-row {
      background: #f1f5f9 !important;
      font-weight: 700;
      border-top: 2px solid #0a2342;
    }
    
    /* Pickup Details */
    .pickup-section {
      background: #f1f5f9;
      padding: 15px;
      border-radius: 6px;
      margin-bottom: 30px;
    }
    .pickup-section h4 {
      font-size: 11px;
      text-transform: uppercase;
      color: #94a3b8;
      font-weight: 700;
      margin-bottom: 10px;
    }
    .pickup-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr 1fr;
      gap: 15px;
    }
    .pickup-item {
      font-size: 12px;
    }
    .pickup-label {
      color: #94a3b8;
      font-size: 10px;
      text-transform: uppercase;
      font-weight: 700;
      margin-bottom: 4px;
    }
    .pickup-value {
      color: #0a2342;
      font-weight: 600;
    }
    
    /* Bank Details Box */
    .bank-section {
      background: #f0f9ff;
      border-left: 4px solid #0a2342;
      padding: 20px;
      border-radius: 4px;
      margin-bottom: 30px;
    }
    .bank-section h4 {
      font-size: 12px;
      font-weight: 700;
      color: #0a2342;
      margin-bottom: 12px;
    }
    .bank-section p {
      font-size: 12px;
      color: #0a2342;
      margin-bottom: 6px;
      line-height: 1.6;
    }
    
    /* Instructions */
    .instructions {
      background: #f8fafc;
      padding: 15px;
      border-radius: 6px;
      margin-bottom: 30px;
      font-size: 11px;
      color: #64748b;
      line-height: 1.6;
    }
    
    /* Footer */
    .footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 20px;
      margin-top: 30px;
      font-size: 11px;
      color: #94a3b8;
    }
    .footer p {
      margin-bottom: 6px;
    }
    
    /* Print Button */
    .print-button {
      display: inline-block;
      margin-top: 20px;
      padding: 10px 20px;
      background: #0a2342;
      color: white;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      font-size: 13px;
    }
    .print-button:hover {
      background: #1a3a52;
    }
    
    /* Print styles */
    @media print {
      body {
        padding: 0;
      }
      .container {
        padding: 0;
      }
      .print-button {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="company-name">Tycoon Sourcing</div>
      <div class="tagline">Procurement · Trade · Warehousing</div>
      <div class="company-details">
        <div>Tycoon Holdings (Pvt) Ltd · Colombo, Sri Lanka</div>
        <div>info@tycoonsourcing.com · +94 777 30 30 91</div>
      </div>
    </div>

    <!-- Invoice Title and Info -->
    <div class="invoice-header">
      <div class="invoice-title">INVOICE #</div>
      <div class="invoice-info">
        <div class="invoice-info-row">
          <span class="invoice-info-label">Invoice #</span>
          <span class="invoice-info-value">${invoice?.invoice_num || 'N/A'}</span>
        </div>
        <div class="invoice-info-row">
          <span class="invoice-info-label">Issued</span>
          <span class="invoice-info-value">${invoice?.created_at ? new Date(invoice.created_at).toLocaleDateString('en-AU') : 'N/A'}</span>
        </div>
        <div class="invoice-info-row">
          <span class="invoice-info-label">Type</span>
          <span class="invoice-info-value">${invoice?.type || 'batch'}</span>
        </div>
        <div class="invoice-info-row">
          <span class="invoice-info-label">Status</span>
          <span class="invoice-info-value">
            <span class="status-badge ${invoice?.status === 'paid' ? 'status-paid' : 'status-unpaid'}">
              ${statusText}
            </span>
          </span>
        </div>
      </div>
    </div>

    <!-- Bill To and Deal Reference -->
    <div class="bill-section">
      <div class="bill-box">
        <h4>Bill To</h4>
        <p>${client?.company || 'Client'}</p>
        <p>${client?.full_name || 'N/A'}</p>
        <p>${client?.email || ''}</p>
        <p>${client?.phone || ''}</p>
      </div>
      <div class="bill-box">
        <h4>Deal Reference</h4>
        <p>${deal?.deal_code || 'N/A'} — ${deal?.description || 'Product'}</p>
        <p>Total order: LKR ${(deal?.order_value_lkr || 0).toLocaleString()}</p>
        <p>Warehouse: Colombo Main</p>
      </div>
    </div>

    <!-- Invoice Items -->
    <div class="items-section">
      <h4>Invoice Items</h4>
      <table>
        <thead>
          <tr>
            <th>DESCRIPTION</th>
            <th style="text-align: right;">AMOUNT (LKR)</th>
          </tr>
        </thead>
        <tbody>
          ${baseAmount > 0 ? `<tr>
            <td>Base goods cost — ${units} units × LKR ${unitPrice.toFixed(2)}</td>
            <td>${baseAmount.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>` : ''}
          
          ${handling > 0 ? `<tr>
            <td>Handling fee — 3% of base</td>
            <td>${handling.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>` : ''}
          
          ${storage > 0 ? `<tr>
            <td>Storage fee — ${totalCBM} CBM × LKR 140/day × ${daysHeld} days</td>
            <td>${storage.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>` : ''}
          
          ${service > 0 ? `<tr>
            <td>Service fee — 4%/mo on LKR ${(baseAmount * 4).toLocaleString()} capital × ${daysHeld} days</td>
            <td>${service.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>` : ''}
          
          <tr class="total-row">
            <td>TOTAL</td>
            <td>${total.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pickup Details -->
    <div class="pickup-section">
      <h4>Pickup Details</h4>
      <div class="pickup-grid">
        <div class="pickup-item">
          <div class="pickup-label">Batch #</div>
          <div class="pickup-value">${batch?.batch_num || 'N/A'}</div>
        </div>
        <div class="pickup-item">
          <div class="pickup-label">Units Collected</div>
          <div class="pickup-value">${units}</div>
        </div>
        <div class="pickup-item">
          <div class="pickup-label">CBM Removed</div>
          <div class="pickup-value">${totalCBM}</div>
        </div>
        <div class="pickup-item">
          <div class="pickup-label">Pickup Date</div>
          <div class="pickup-value">${batch?.pickup_date ? new Date(batch.pickup_date).toLocaleDateString('en-AU') : 'N/A'}</div>
        </div>
      </div>
    </div>

    <!-- Bank Details -->
    <div class="bank-section">
      <h4>Bank Transfer Details</h4>
      <p><strong>Bank:</strong> Seylan Bank PLC</p>
      <p><strong>Account Number:</strong> 0710 13338448 001</p>
      <p><strong>Account Name:</strong> Tycoon Holdings (Pvt) Ltd</p>
      <p><strong>Reference:</strong> ${invoice?.invoice_num || 'N/A'}</p>
    </div>

    <!-- Instructions -->
    <div class="instructions">
      Payment instructions: Please transfer via bank to the account details above and send confirmation to info@tycoonsourcing.com
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>Thank you for your business with Tycoon Sourcing.</p>
      <p>For queries: info@tycoonsourcing.com · +94 777 30 30 91</p>
      <button class="print-button" onclick="window.print()">🖨 Print / Save as PDF</button>
    </div>
  </div>
</body>
</html>`;
};
