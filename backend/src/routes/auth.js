import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from '../db/index.js';
import { serializeUser } from '../utils/serialize.js';
import { requireAuth, JWT_SECRET } from '../middleware/auth.js';

const router = express.Router();

const AVATARS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&q=80',
  'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&h=150&fit=crop&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&q=80',
];

function signToken(user) {
  return jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: '7d' });
}

router.post('/signup', (req, res) => {
  const { name, email, password, role } = req.body || {};

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'name, email, password and role are required' });
  }
  if (!['student', 'team_lead', 'teacher'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const id = 'u' + crypto.randomUUID();
  const passwordHash = bcrypt.hashSync(password, 10);
  const avatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];

  let teamId = null;
  if (role === 'team_lead') {
    teamId = 't' + crypto.randomUUID();
    db.prepare('INSERT INTO teams (id, name) VALUES (?, ?)').run(teamId, `${name}'s Team`);
  }

  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, role, avatar, team_id, bio)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, email.toLowerCase(), passwordHash, role, avatar, teamId, '');

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  const token = signToken(user);
  res.status(201).json({ token, user: serializeUser(user) });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = signToken(user);
  res.json({ token, user: serializeUser(user) });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: serializeUser(req.user) });
});

export default router;
