const { db } = require('../db/database');

const STALE_MINUTES = 10; // check invoices pending longer than this

async function pollPendingInvoices() {
  try {
    const cutoff = new Date(Date.now() - STALE_MINUTES * 60 * 1000).toISOString();

    const result = await db.execute({
      sql: `SELECT i.id AS invoice_id, i.invoice_code, t.provider_transaction_id
            FROM invoices i
            LEFT JOIN transactions t ON t.invoice_id = i.id AND t.status = 'INITIATED'
            WHERE i.status = 'PENDING' AND i.created_at < ?`,
      args: [cutoff]
    });

    if (result.rows.length === 0) return;

    console.log(`[Poller] Checking ${result.rows.length} stale PENDING invoice(s)...`);

    for (const row of result.rows) {
      if (!row.provider_transaction_id) {
        console.log(`[Poller] Invoice ${row.invoice_code} has no transaction yet, skipping.`);
        continue;
      }

      // In a real implementation, call the MoMo provider's status endpoint:
      // GET https://sandbox.momodeveloper.mtn.com/collection/v1_0/requesttopay/{referenceId}
      // const statusRes = await fetch(...)
      // const { status } = await statusRes.json();

      // MOCK: log for now — wire up real call when MoMo creds are available
      console.log(`[Poller] Would check MoMo status for txn ${row.provider_transaction_id} (Invoice: ${row.invoice_code})`);
    }
  } catch (err) {
    console.error('[Poller] Error during polling:', err);
  }
}

function startPoller(intervalMs = 5 * 60 * 1000) {
  console.log(`[Poller] Started — checking every ${intervalMs / 60000} minutes.`);
  setInterval(pollPendingInvoices, intervalMs);
}

module.exports = { startPoller };
