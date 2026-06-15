import express from 'express';
import crypto from 'crypto';
import { db } from '../db/index.js';
import { serializeProject, serializeUser } from '../utils/serialize.js';
import { requireAuth } from '../middleware/auth.js';
import { notifyUser } from '../utils/notify.js';

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  let projects;
  if (req.user.role === 'teacher') {
    projects = db.prepare('SELECT * FROM projects').all();
  } else {
    projects = db.prepare('SELECT * FROM projects WHERE team_id = ?').all(req.user.team_id);
  }
  res.json({ projects: projects.map(serializeProject) });
});

router.post('/', requireAuth, (req, res) => {
  if (req.user.role !== 'team_lead') {
    return res.status(403).json({ error: 'Only team leads can create projects' });
  }

  const { title, description, course, deadline, supervisorId } = req.body || {};
  if (!title || !course || !deadline || !supervisorId) {
    return res.status(400).json({ error: 'title, course, deadline and supervisorId are required' });
  }

  const supervisor = db.prepare("SELECT * FROM users WHERE id = ? AND role = 'teacher'").get(supervisorId);
  if (!supervisor) {
    return res.status(400).json({ error: 'Selected supervisor is not a valid teacher' });
  }

  const id = 'p' + crypto.randomUUID();
  db.prepare(`
    INSERT INTO projects (id, title, description, status, team_id, course, deadline, progress, created_by, supervisor_id)
    VALUES (?, ?, ?, 'dormant', ?, ?, ?, 0, ?, ?)
  `).run(id, title, description || '', req.user.team_id, course, deadline, req.user.id, supervisorId);

  notifyUser({
    userId: supervisorId,
    title: 'New Project Request',
    message: `${req.user.name} requested your supervision for "${title}"`,
    type: 'project_request',
    relatedProjectId: id,
  });

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  res.status(201).json({ project: serializeProject(project) });
});

router.patch('/:id/respond', requireAuth, (req, res) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Only teachers can respond to project requests' });
  }

  const { action } = req.body || {};
  if (action !== 'accept' && action !== 'reject') {
    return res.status(400).json({ error: "action must be 'accept' or 'reject'" });
  }

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  if (project.supervisor_id !== req.user.id) {
    return res.status(403).json({ error: 'You are not the supervisor for this project' });
  }
  if (project.status !== 'dormant') {
    return res.status(400).json({ error: 'This project request has already been resolved' });
  }

  const newStatus = action === 'accept' ? 'active' : 'rejected';
  db.prepare('UPDATE projects SET status = ? WHERE id = ?').run(newStatus, project.id);

  // Mark the originating request notification(s) as read
  db.prepare(`
    UPDATE notifications SET is_read = 1
    WHERE user_id = ? AND related_project_id = ? AND type = 'project_request'
  `).run(req.user.id, project.id);

  // Notify the team lead who created the project
  const verb = action === 'accept' ? 'accepted' : 'declined';
  notifyUser({
    userId: project.created_by,
    title: action === 'accept' ? 'Project Approved' : 'Project Request Declined',
    message: `${req.user.name} ${verb} your supervision request for "${project.title}"`,
    type: 'project_response',
    relatedProjectId: project.id,
  });

  const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(project.id);
  res.json({ project: serializeProject(updated) });
});

router.patch('/:id/section', requireAuth, (req, res) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Only teachers can organize projects into sections' });
  }

  const { sectionId } = req.body || {};
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  if (sectionId) {
    const section = db.prepare('SELECT * FROM sections WHERE id = ?').get(sectionId);
    if (!section) {
      return res.status(400).json({ error: 'Section not found' });
    }
  }

  db.prepare('UPDATE projects SET section_id = ? WHERE id = ?').run(sectionId || null, project.id);
  const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(project.id);
  res.json({ project: serializeProject(updated) });
});

router.get('/:id', requireAuth, (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  if (req.user.role !== 'teacher' && project.team_id !== req.user.team_id) {
    return res.status(403).json({ error: 'You do not have access to this project' });
  }

  const members = db.prepare('SELECT * FROM users WHERE team_id = ?').all(project.team_id);
  res.json({ project: serializeProject(project), members: members.map(serializeUser) });
});

export default router;
