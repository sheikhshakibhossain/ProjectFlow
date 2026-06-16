import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from '../db/index.js';
import { serializeUser } from '../utils/serialize.js';
import { requireAuth, JWT_SECRET } from '../middleware/auth.js';

const router = express.Router();

const AVATAR_COLORS = ['#6366f1','#8b5cf6','#ec4899','#f43f5e','#f97316','#eab308','#22c55e','#14b8a6','#3b82f6','#06b6d4'];

function generateAvatar(name) {
  const initials = name.trim().split(/\s+/).map(w => w[0] || '').join('').toUpperCase().slice(0, 2) || '?';
  const color = AVATAR_COLORS[name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150"><rect width="150" height="150" fill="${color}"/><text x="75" y="98" font-family="Arial,sans-serif" font-size="58" font-weight="bold" fill="white" text-anchor="middle">${initials}</text></svg>`;
  return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
}

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
  const avatar = generateAvatar(name);

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
