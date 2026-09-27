const express = require('express');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db/database');

const router = express.Router();

const payLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { error: 'Too many payment attempts, please try again later.' }
});

router.post('/:code', payLimiter, async (req, res) => {
  const { code } = req.params;
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  try {
    // 1. Find the invoice
    const invoiceRes = await db.execute({
      sql: 'SELECT id, amount, status FROM invoices WHERE invoice_code = ?',
      args: [code]
    });

    if (invoiceRes.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const invoice = invoiceRes.rows[0];

    if (invoice.status === 'PAID') {
      return res.status(400).json({ error: 'Invoice is already paid' });
    }

    // 2. Call MoMo Provider API (Mocked for now)
    // In real implementation:
    // const momoRes = await fetch('https://sandbox.momodeveloper.mtn.com/collection/v1_0/requesttopay', ...)
    
    // Simulating MoMo provider transaction ID
    const providerTransactionId = `momo_${uuidv4()}`;
    const momoStatus = 'INITIATED';

    // 3. Record the transaction attempt
    await db.execute({
      sql: `INSERT INTO transactions (invoice_id, provider_transaction_id, status) VALUES (?, ?, ?)`,
      args: [invoice.id, providerTransactionId, momoStatus]
    });

    // 4. Return success to the buyer page
    res.json({ message: 'Payment initiated successfully. Please check your phone.', transactionId: providerTransactionId });

  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
