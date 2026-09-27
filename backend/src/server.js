require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb } = require('./db/database');
const { startPoller } = require('./services/poller');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/pay', require('./routes/pay'));
app.use('/api/webhooks', require('./routes/webhooks'));

// Buyer payment page (must come after static serving)
app.get('/pay/:code', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'pay.html'));
});

async function start() {
  await initDb();
  startPoller();

  app.listen(PORT, () => {
    console.log(`✅ PayLink server running on http://localhost:${PORT}`);
  });
}

start();
