import express from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../db/index.js';
import { serializeUser } from '../utils/serialize.js';
import { requireAuth } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AVATARS_DIR = path.join(__dirname, '..', '..', 'uploads', 'avatars');
fs.mkdirSync(AVATARS_DIR, { recursive: true });

const MIME_EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const { teamId, role } = req.query;
  let users;
  if (teamId) {
    users = db.prepare('SELECT * FROM users WHERE team_id = ?').all(teamId);
  } else if (role) {
    users = db.prepare('SELECT * FROM users WHERE role = ?').all(role);
  } else {
    users = db.prepare('SELECT * FROM users').all();
  }
  res.json({ users: users.map(serializeUser) });
});

router.patch('/me', requireAuth, (req, res) => {
  const { name, email, bio } = req.body || {};
  const current = req.user;

  const updated = {
    name: name !== undefined ? name : current.name,
    email: email !== undefined ? email.toLowerCase() : current.email,
    bio: bio !== undefined ? bio : current.bio,
  };

  if (updated.email !== current.email) {
    const existing = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(updated.email, current.id);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }
  }

  db.prepare('UPDATE users SET name = ?, email = ?, bio = ? WHERE id = ?')
    .run(updated.name, updated.email, updated.bio, current.id);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(current.id);
  res.json({ user: serializeUser(user) });
});

router.post('/me/avatar', requireAuth, (req, res) => {
  const { avatar } = req.body || {};
  const match = typeof avatar === 'string' && avatar.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/);
  if (!match) {
    return res.status(400).json({ error: 'avatar must be a base64 data URL (jpeg, png, webp or gif)' });
  }

  const [, mimeType, base64Data] = match;
  const buffer = Buffer.from(base64Data, 'base64');
  if (buffer.length > 3 * 1024 * 1024) {
    return res.status(400).json({ error: 'Image is too large (max 3MB)' });
  }

  const current = req.user;
  const ext = MIME_EXTENSIONS[mimeType];
  const filename = `${current.id}-${crypto.randomUUID()}.${ext}`;
  fs.writeFileSync(path.join(AVATARS_DIR, filename), buffer);

  // Clean up the previous avatar file, but only if it was a prior upload by this
  // user (not a seed asset, which other parts of the seed data may still reference).
  const uploadPattern = new RegExp(`^${current.id}-[0-9a-f-]+\\.[a-z]+$`);
  const oldFilename = current.avatar ? path.basename(current.avatar) : '';
  if (current.avatar?.startsWith('/api/uploads/avatars/') && uploadPattern.test(oldFilename)) {
    fs.rm(path.join(AVATARS_DIR, oldFilename), { force: true }, () => {});
  }

  const avatarUrl = `/api/uploads/avatars/${filename}`;
  db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(avatarUrl, current.id);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(current.id);
  res.json({ user: serializeUser(user) });
});

export default router;
