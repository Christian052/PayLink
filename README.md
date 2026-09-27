# PayLink & Invoice Studio

> **A mobile-first invoicing and Mobile Money payment app for small sellers.**

---

## Project Structure

```
MOM-Test/
├── backend/          # Node.js + Express API
│   ├── src/
│   │   ├── db/             # SQLite schema & connection
│   │   ├── middlewares/    # JWT auth middleware
│   │   ├── routes/         # auth, invoices, pay, webhooks
│   │   └── services/       # PDF receipt, SMS, polling fallback
│   ├── public/             # Buyer payment page (pay.html) + PDF receipts
│   ├── .env                # Secrets (never commit this!)
│   ├── .env.example        # Template — copy to .env and fill in
│   └── package.json
└── mobile/           # Expo React Native — Seller App
    └── src/
        ├── app/            # Expo Router screens
        │   ├── index.tsx       # Login
        │   ├── register.tsx    # Registration
        │   ├── dashboard.tsx   # Invoice list
        │   ├── new-invoice.tsx # Create invoice + QR
        │   └── invoice/[code].tsx  # Invoice detail
        ├── context/        # AuthContext (JWT + AsyncStorage)
        └── services/       # api.js (backend calls only)
```

---

## Backend Setup

```bash
cd backend
cp .env.example .env     # Fill in your secrets
npm install
npm run dev              # nodemon hot-reload
```

The API will start at **http://localhost:3000**.

### API Routes

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| `POST` | `/api/auth/register` | — | Seller sign-up |
| `POST` | `/api/auth/login` | — | Seller login → JWT |
| `POST` | `/api/invoices` | ✅ JWT | Create invoice → PayLink + QR |
| `GET` | `/api/invoices` | ✅ JWT | List seller's invoices |
| `GET` | `/api/invoices/:code` | — | Public: fetch invoice for buyer |
| `GET` | `/api/invoices/:code/receipt` | ✅ JWT | Download PDF receipt |
| `POST` | `/api/pay/:code` | — | Buyer pays via MoMo |
| `POST` | `/api/webhooks/momo` | — | MoMo provider callback |
| `GET` | `/pay/:code` | — | Buyer payment web page |

---

## Mobile App Setup

```bash
cd mobile
npm install
npx expo start
```

Press **`w`** for browser, **`a`** for Android emulator, or scan the QR with Expo Go on your phone.

> **Important:** Update `BASE_URL` in `mobile/src/services/api.js` to your backend's IP/URL  
> when running on a real device (e.g. `http://192.168.x.x:3000`).

---

## Environment Variables (backend/.env)

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default 3000) |
| `BASE_URL` | Public URL of this backend (for PayLinks & receipts) |
| `JWT_SECRET` | Long random string — change before production |
| `MOMO_SUBSCRIPTION_KEY` | MTN MoMo API subscription key |
| `MOMO_API_USER` | MTN MoMo API user UUID |
| `MOMO_API_KEY` | MTN MoMo API key |
| `MOMO_BASE_URL` | MoMo sandbox or production URL |
| `MOMO_CALLBACK_URL` | Your public ngrok/server URL for webhooks |
| `AT_API_KEY` | Africa's Talking API key |
| `AT_USERNAME` | Africa's Talking username (`sandbox` for testing) |

---

## End-to-End Test Loop

1. Register a seller account in the mobile app (or via Postman).
2. Create an invoice — copy the **PayLink**.
3. Open the PayLink in a browser (buyer view).
4. Enter a MoMo test phone number and tap **Pay via MoMo**.
5. Use **ngrok** to expose `localhost:3000` so the MoMo sandbox can reach the webhook.
6. Confirm: webhook fires → invoice flips to `PAID` → PDF receipt generated → SMS logged.
7. Use the seller app or `GET /api/invoices/:code/receipt` to download the receipt PDF.

---

## Security Checklist

- [x] Passwords hashed with bcrypt
- [x] JWT on all seller routes; buyer routes public but rate-limited
- [x] Row-level isolation via `WHERE user_id = ?` on every authenticated query
- [x] Webhook idempotency via `webhook_events.event_id`
- [x] Secrets in `.env` only — never in source code or mobile bundle
- [ ] Webhook HMAC signature verification (wire in when MoMo sandbox secret is set)
- [ ] HTTPS (required before production — use a reverse proxy like nginx or a platform like Railway/Render)

---

## Next Steps (when MoMo sandbox credentials are ready)

1. Implement the real `POST /collection/v1_0/requesttopay` call in `backend/src/routes/pay.js`.
2. Implement HMAC signature verification in `backend/src/routes/webhooks.js`.
3. Implement the real status-check call in `backend/src/services/poller.js`.
4. Replace mock SMS in `backend/src/services/sms.js` with Africa's Talking or Twilio SDK.
