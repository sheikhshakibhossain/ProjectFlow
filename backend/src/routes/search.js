import express from 'express';
import { db } from '../db/index.js';
import { serializeProject } from '../utils/serialize.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const raw = (req.query.q || '').trim();
  if (!raw) return res.json({ projects: [], tasks: [] });
  const q = `%${raw}%`;

  let projects;
  let accessibleIds;

  if (req.user.role === 'teacher') {
    projects = db.prepare(`
      SELECT * FROM projects
      WHERE supervisor_id = ? AND (title LIKE ? OR description LIKE ? OR course LIKE ?)
    `).all(req.user.id, q, q, q);
    accessibleIds = db.prepare(`SELECT id FROM projects WHERE supervisor_id = ?`).all(req.user.id).map(r => r.id);
  } else {
    projects = db.prepare(`
      SELECT p.* FROM projects p
      JOIN project_members pm ON pm.project_id = p.id
      WHERE pm.user_id = ? AND (p.title LIKE ? OR p.description LIKE ? OR p.course LIKE ?)
    `).all(req.user.id, q, q, q);
    accessibleIds = db.prepare(`SELECT project_id FROM project_members WHERE user_id = ?`).all(req.user.id).map(r => r.project_id);
  }

  let tasks = [];
  if (accessibleIds.length > 0) {
    const placeholders = accessibleIds.map(() => '?').join(',');
    tasks = db.prepare(`
      SELECT t.*, p.title AS project_title FROM tasks t
      JOIN projects p ON p.id = t.project_id
      WHERE t.project_id IN (${placeholders}) AND (t.title LIKE ? OR t.description LIKE ?)
    `).all(...accessibleIds, q, q);
  }

  res.json({
    projects: projects.map(serializeProject),
    tasks: tasks.map(t => ({
      id: t.id,
      projectId: t.project_id,
      projectTitle: t.project_title,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      deadline: t.deadline,
    })),
  });
});

export default router;
