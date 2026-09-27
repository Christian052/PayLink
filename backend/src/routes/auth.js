const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { db } = require('../db/database');
const rateLimit = require('express-rate-limit');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-prod';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many login attempts, please try again later.' }
});

router.post('/register', loginLimiter, async (req, res) => {
  const { business_name, phone, email, password } = req.body;
  if (!business_name || !phone || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Check if user exists
    const existing = await db.execute({
      sql: 'SELECT id FROM users WHERE phone = ?',
      args: [phone]
    });
    
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'User with this phone already exists' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const result = await db.execute({
      sql: 'INSERT INTO users (business_name, phone, email, password_hash) VALUES (?, ?, ?, ?)',
      args: [business_name, phone, email, password_hash]
    });
    
    // Using libSql client, result.lastInsertRowid gives the ID
    const newUserId = result.lastInsertRowid.toString();
    
    const token = jwt.sign({ id: newUserId, phone }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: newUserId, business_name, phone } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', loginLimiter, async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = await db.execute({
      sql: 'SELECT id, business_name, phone, password_hash FROM users WHERE phone = ?',
      args: [phone]
    });

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, phone: user.phone }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, business_name: user.business_name, phone: user.phone } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
