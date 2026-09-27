const express = require('express');
const { db } = require('../db/database');

const router = express.Router();

router.post('/momo', express.json({ type: 'application/json' }), async (req, res) => {
  // 1. Verify webhook signature (Skipped in mock/sandbox unless specific header is required)
  const payload = req.body;
  const eventId = req.headers['x-event-id'] || payload.eventId || `mock-evt-${Date.now()}`;
  
  if (!payload || !payload.provider_transaction_id) {
    return res.status(400).json({ error: 'Invalid webhook payload' });
  }

  const { provider_transaction_id, status } = payload; // e.g., status = 'SUCCESS' or 'FAILED'

  try {
    // 2. Idempotency Check
    const eventRes = await db.execute({
      sql: 'SELECT id FROM webhook_events WHERE event_id = ?',
      args: [eventId]
    });

    if (eventRes.rows.length > 0) {
      // Already processed this event
      return res.status(200).send('OK');
    }

    // Find the transaction and invoice details
    const txRes = await db.execute({
      sql: `SELECT t.id, t.invoice_id, i.invoice_code, i.amount, i.buyer_phone 
            FROM transactions t 
            JOIN invoices i ON t.invoice_id = i.id 
            WHERE t.provider_transaction_id = ?`,
      args: [provider_transaction_id]
    });

    if (txRes.rows.length === 0) {
      return res.status(404).send('Transaction not found');
    }

    const transaction = txRes.rows[0];

    // 3. Insert Webhook Event
    await db.execute({
      sql: 'INSERT INTO webhook_events (event_id, invoice_id, payload) VALUES (?, ?, ?)',
      args: [eventId, transaction.invoice_id, JSON.stringify(payload)]
    });

    // 4. Update Transaction and Invoice status
    const newTxStatus = status === 'SUCCESS' ? 'SUCCESS' : 'FAILED';
    const newInvoiceStatus = status === 'SUCCESS' ? 'PAID' : 'FAILED';
    const paidAt = status === 'SUCCESS' ? new Date().toISOString() : null;

    await db.execute({
      sql: 'UPDATE transactions SET status = ? WHERE id = ?',
      args: [newTxStatus, transaction.id]
    });

    await db.execute({
      sql: 'UPDATE invoices SET status = ?, paid_at = ? WHERE id = ?',
      args: [newInvoiceStatus, paidAt, transaction.invoice_id]
    });

    // Send fast 200 OK
    res.status(200).send('OK');

    // 5. Fire asynchronous post-payment jobs (PDF generation, SMS)
    if (newInvoiceStatus === 'PAID') {
      setTimeout(async () => {
        try {
          const { generateReceipt } = require('../services/receipt');
          console.log(`Generating PDF receipt for invoice ID ${transaction.invoice_id}...`);
          const receiptUrl = await generateReceipt(transaction.invoice_id);
          console.log(`Receipt generated at ${receiptUrl}`);

          // Send SMS to buyer (phone available from the JOIN query above)
          const { sendSMS } = require('../services/sms');
          const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
          const smsMessage = `Payment of ${transaction.amount} RWF received for Invoice ${transaction.invoice_code}. Receipt: ${baseUrl}${receiptUrl}`;
          await sendSMS(transaction.buyer_phone, smsMessage);
        } catch (err) {
          console.error('Post-payment jobs failed:', err);
        }
      }, 0);
    }

  } catch (error) {
    console.error('Webhook processing error:', error);
    // Don't return 500 if we want the provider to retry, or do if we want them to retry.
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
