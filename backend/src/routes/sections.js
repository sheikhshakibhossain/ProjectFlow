import express from 'express';
import crypto from 'crypto';
import { db } from '../db/index.js';
import { serializeSection } from '../utils/serialize.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const sections = db.prepare('SELECT * FROM sections ORDER BY created_at ASC').all();
  res.json({ sections: sections.map(serializeSection) });
});

router.post('/', requireAuth, (req, res) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Only teachers can create sections' });
  }

  const { name } = req.body || {};
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'name is required' });
  }

  const id = 'sec' + crypto.randomUUID();
  db.prepare('INSERT INTO sections (id, name, created_by, created_at) VALUES (?, ?, ?, ?)')
    .run(id, name.trim(), req.user.id, new Date().toISOString());

  const section = db.prepare('SELECT * FROM sections WHERE id = ?').get(id);
  res.status(201).json({ section: serializeSection(section) });
});

router.patch('/:id', requireAuth, (req, res) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Only teachers can rename sections' });
  }

  const { name } = req.body || {};
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'name is required' });
  }

  const section = db.prepare('SELECT * FROM sections WHERE id = ?').get(req.params.id);
  if (!section) {
    return res.status(404).json({ error: 'Section not found' });
  }

  db.prepare('UPDATE sections SET name = ? WHERE id = ?').run(name.trim(), section.id);
  const updated = db.prepare('SELECT * FROM sections WHERE id = ?').get(section.id);
  res.json({ section: serializeSection(updated) });
});

router.delete('/:id', requireAuth, (req, res) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Only teachers can delete sections' });
  }

  const section = db.prepare('SELECT * FROM sections WHERE id = ?').get(req.params.id);
  if (!section) {
    return res.status(404).json({ error: 'Section not found' });
  }

  db.prepare('UPDATE projects SET section_id = NULL WHERE section_id = ?').run(section.id);
  db.prepare('DELETE FROM sections WHERE id = ?').run(section.id);
  res.json({ success: true });
});

export default router;
