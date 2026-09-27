const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { db } = require('../db/database');
const { v4: uuidv4 } = require('uuid');

async function generateReceipt(invoiceId) {
  // Fetch invoice and user details
  const result = await db.execute({
    sql: `SELECT i.*, u.business_name, u.email 
          FROM invoices i 
          JOIN users u ON i.user_id = u.id 
          WHERE i.id = ?`,
    args: [invoiceId]
  });

  if (result.rows.length === 0) {
    throw new Error('Invoice not found');
  }

  const invoice = result.rows[0];
  const pdfName = `receipt_${invoice.invoice_code}_${uuidv4().split('-')[0]}.pdf`;
  const receiptsDir = path.join(__dirname, '..', '..', 'public', 'receipts');

  if (!fs.existsSync(receiptsDir)) {
    fs.mkdirSync(receiptsDir, { recursive: true });
  }

  const pdfPath = path.join(receiptsDir, pdfName);
  const doc = new PDFDocument({ margin: 50 });

  doc.pipe(fs.createWriteStream(pdfPath));

  // Header
  doc.fontSize(20).text(invoice.business_name, { align: 'center' });
  doc.moveDown();
  doc.fontSize(14).text('PAYMENT RECEIPT', { align: 'center' });
  doc.moveDown(2);

  // Invoice Details
  doc.fontSize(12).text(`Receipt No: ${invoice.invoice_code}`);
  doc.text(`Date Paid: ${new Date(invoice.paid_at || Date.now()).toLocaleString()}`);
  doc.moveDown();

  // Buyer Details
  doc.text(`Billed To: ${invoice.buyer_name}`);
  doc.text(`Phone: ${invoice.buyer_phone}`);
  doc.moveDown();

  // Item Details
  doc.text('---------------------------------------------------------');
  doc.text(`Description: ${invoice.description || 'Goods/Services'}`);
  doc.text(`Status: ${invoice.status}`, { align: 'right' });
  doc.text('---------------------------------------------------------');
  doc.moveDown();

  // Total
  doc.fontSize(16).text(`Total Paid: ${invoice.amount} ${invoice.currency}`, { align: 'right' });
  
  doc.moveDown(4);
  doc.fontSize(10).text('Thank you for your business!', { align: 'center' });

  doc.end();

  // Save to DB
  await db.execute({
    sql: 'INSERT INTO receipts (invoice_id, pdf_path) VALUES (?, ?)',
    args: [invoiceId, `/receipts/${pdfName}`]
  });

  return `/receipts/${pdfName}`;
}

module.exports = { generateReceipt };
