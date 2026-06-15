import express from 'express';
import crypto from 'crypto';
import { db } from '../db/index.js';
import { serializeFeedback } from '../utils/serialize.js';
import { requireAuth } from '../middleware/auth.js';
import { notifyUser } from '../utils/notify.js';

const router = express.Router();

const FEEDBACK_QUERY = `
  SELECT f.*, p.title AS project_title, u.name AS teacher_name, u.avatar AS teacher_avatar
  FROM feedback f
  JOIN projects p ON p.id = f.project_id
  JOIN users u ON u.id = f.teacher_id
`;

router.get('/', requireAuth, (req, res) => {
  let feedback;
  if (req.user.role === 'teacher') {
    feedback = db.prepare(`${FEEDBACK_QUERY} WHERE f.teacher_id = ?`).all(req.user.id);
  } else {
    feedback = db.prepare(`${FEEDBACK_QUERY} WHERE p.team_id = ?`).all(req.user.team_id);
  }
  res.json({
    feedback: feedback.map(f => ({
      ...serializeFeedback(f),
      projectTitle: f.project_title,
      teacherName: f.teacher_name,
      teacherAvatar: f.teacher_avatar,
    })),
  });
});

router.post('/', requireAuth, (req, res) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Only teachers can submit feedback' });
  }

  const { projectId, rating, comments, highlights } = req.body || {};
  if (!projectId || !rating || !comments) {
    return res.status(400).json({ error: 'projectId, rating and comments are required' });
  }

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const highlightList = Array.isArray(highlights)
    ? highlights
    : (highlights || '').split(',').map(h => h.trim()).filter(Boolean);

  const id = 'f' + crypto.randomUUID();
  const date = new Date().toISOString().slice(0, 10);

  db.prepare(`
    INSERT INTO feedback (id, project_id, teacher_id, rating, comments, date, highlights)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, projectId, req.user.id, rating, comments, date, JSON.stringify(highlightList));

  if (project.team_id) {
    const members = db.prepare('SELECT id FROM users WHERE team_id = ?').all(project.team_id);
    for (const member of members) {
      notifyUser({
        userId: member.id,
        title: 'New Feedback',
        message: `${req.user.name} left feedback on ${project.title}`,
        type: 'feedback',
        relatedProjectId: project.id,
      });
    }
  }

  const feedback = db.prepare('SELECT * FROM feedback WHERE id = ?').get(id);
  res.status(201).json({ feedback: serializeFeedback(feedback) });
});

export default router;
