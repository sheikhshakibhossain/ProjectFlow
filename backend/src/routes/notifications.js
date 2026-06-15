import express from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db/index.js';
import { serializeNotification } from '../utils/serialize.js';
import { requireAuth, JWT_SECRET } from '../middleware/auth.js';
import { addClient, removeClient } from '../sse.js';

const router = express.Router();

// EventSource cannot send custom headers, so the token is passed as a query param.
router.get('/stream', (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(401).end();

  let user;
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.sub);
    if (!user) throw new Error('User not found');
  } catch {
    return res.status(401).end();
  }

  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.flushHeaders();
  res.write(': connected\n\n');

  addClient(user.id, res);

  const heartbeat = setInterval(() => res.write(': ping\n\n'), 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    removeClient(user.id, res);
  });
});

router.get('/', requireAuth, (req, res) => {
  const notifications = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY date DESC').all(req.user.id);
  res.json({ notifications: notifications.map(serializeNotification) });
});

router.patch('/:id/read', requireAuth, (req, res) => {
  const notification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(req.params.id);
  if (!notification || notification.user_id !== req.user.id) {
    return res.status(404).json({ error: 'Notification not found' });
  }
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(notification.id);
  const updated = db.prepare('SELECT * FROM notifications WHERE id = ?').get(notification.id);
  res.json({ notification: serializeNotification(updated) });
});

router.patch('/read-all', requireAuth, (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
  const notifications = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY date DESC').all(req.user.id);
  res.json({ notifications: notifications.map(serializeNotification) });
});

export default router;
