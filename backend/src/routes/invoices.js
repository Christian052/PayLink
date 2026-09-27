const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db/database');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// GET /api/invoices/:code (Public - For Buyer Payment Page)
router.get('/:code', async (req, res) => {
  const { code } = req.params;
  try {
    const result = await db.execute({
      sql: `SELECT i.invoice_code, i.buyer_name, i.description, i.amount, i.currency, i.status, u.business_name 
            FROM invoices i 
            JOIN users u ON i.user_id = u.id 
            WHERE i.invoice_code = ?`,
      args: [code]
    });

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// All following routes require authentication
router.use(authMiddleware);

// GET /api/invoices
router.get('/', async (req, res) => {
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM invoices WHERE user_id = ? ORDER BY created_at DESC',
      args: [req.user.id]
    });
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/invoices
router.post('/', async (req, res) => {
  const { buyer_name, buyer_phone, description, amount } = req.body;
  if (!buyer_name || !buyer_phone || amount == null) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const invoice_code = `inv_${uuidv4().split('-')[0]}`; // simple short code
  
  try {
    const result = await db.execute({
      sql: `INSERT INTO invoices (invoice_code, user_id, buyer_name, buyer_phone, description, amount) 
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [invoice_code, req.user.id, buyer_name, buyer_phone, description, amount]
    });
    
    // Generate PayLink (using localhost or domain from env)
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const payLink = `${baseUrl}/pay/${invoice_code}`;
    
    // Generate QR Code (Base64)
    const QRCode = require('qrcode');
    const qrCodeDataUrl = await QRCode.toDataURL(payLink);

    res.status(201).json({
      id: result.lastInsertRowid.toString(),
      invoice_code,
      payLink,
      qrCodeDataUrl
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/invoices/:code/receipt  (seller only — row-level secured by user_id)
router.get('/:code/receipt', async (req, res) => {
  const { code } = req.params;
  try {
    const result = await db.execute({
      sql: `SELECT r.pdf_path FROM receipts r
            JOIN invoices i ON r.invoice_id = i.id
            WHERE i.invoice_code = ? AND i.user_id = ?`,
      args: [code, req.user.id]
    });

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    const pdfPath = result.rows[0].pdf_path; // e.g. /receipts/receipt_inv_abc_xyz.pdf
    const absolutePath = require('path').join(__dirname, '..', '..', 'public', pdfPath);
    res.download(absolutePath);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
