import express from 'express';
import crypto from 'crypto';
import { db } from '../db/index.js';
import { serializeTask } from '../utils/serialize.js';
import { requireAuth } from '../middleware/auth.js';
import { notifyUser } from '../utils/notify.js';

const router = express.Router();

function recalcProjectProgress(projectId) {
  const tasks = db.prepare('SELECT status FROM tasks WHERE project_id = ?').all(projectId);
  if (tasks.length === 0) return;
  const done = tasks.filter(t => t.status === 'done').length;
  const progress = Math.round((done / tasks.length) * 100);
  db.prepare('UPDATE projects SET progress = ? WHERE id = ?').run(progress, projectId);
}

function canAccessProject(user, project) {
  if (user.role === 'teacher') return true;
  const member = db.prepare('SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?').get(project.id, user.id);
  return !!member;
}

router.get('/projects/:projectId/tasks', requireAuth, (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.projectId);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  if (!canAccessProject(req.user, project)) {
    return res.status(403).json({ error: 'You do not have access to this project' });
  }

  const tasks = db.prepare('SELECT * FROM tasks WHERE project_id = ?').all(req.params.projectId);
  res.json({ tasks: tasks.map(serializeTask) });
});

router.post('/projects/:projectId/tasks', requireAuth, (req, res) => {
  if (req.user.role === 'student') {
    return res.status(403).json({ error: 'Students cannot create tasks' });
  }

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.projectId);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  if (!canAccessProject(req.user, project)) {
    return res.status(403).json({ error: 'You do not have access to this project' });
  }

  const { title, description, assigneeId, deadline, priority } = req.body || {};
  if (!title || !deadline) {
    return res.status(400).json({ error: 'title and deadline are required' });
  }

  const id = 'tsk' + crypto.randomUUID();
  db.prepare(`
    INSERT INTO tasks (id, project_id, title, description, status, assignee_id, deadline, priority)
    VALUES (?, ?, ?, ?, 'todo', ?, ?, ?)
  `).run(id, project.id, title, description || '', assigneeId || null, deadline, priority || 'medium');

  recalcProjectProgress(project.id);

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);

  if (task.assignee_id) {
    notifyUser({
      userId: task.assignee_id,
      title: 'New Task Assigned',
      message: `You have been assigned "${task.title}"`,
      type: 'task',
      relatedProjectId: project.id,
    });
  }

  res.status(201).json({ task: serializeTask(task) });
});

router.patch('/tasks/:taskId', requireAuth, (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(task.project_id);
  if (!canAccessProject(req.user, project)) {
    return res.status(403).json({ error: 'You do not have access to this task' });
  }

  const { status, title, description, assigneeId, deadline, priority } = req.body || {};
  if (status && !['todo', 'in_progress', 'done'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  if (status && status !== task.status && req.user.id !== task.assignee_id) {
    return res.status(403).json({ error: "Only the assignee can change this task's status" });
  }

  db.prepare(`
    UPDATE tasks SET
      status = COALESCE(?, status),
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      assignee_id = COALESCE(?, assignee_id),
      deadline = COALESCE(?, deadline),
      priority = COALESCE(?, priority)
    WHERE id = ?
  `).run(status, title, description, assigneeId, deadline, priority, task.id);

  recalcProjectProgress(project.id);

  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(task.id);
  res.json({ task: serializeTask(updated) });
});

router.get('/tasks/:taskId/comments', requireAuth, (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(task.project_id);
  if (!canAccessProject(req.user, project)) {
    return res.status(403).json({ error: 'You do not have access to this task' });
  }
  const comments = db.prepare(`
    SELECT c.*, u.name AS user_name, u.avatar AS user_avatar, u.role AS user_role
    FROM task_comments c JOIN users u ON u.id = c.user_id
    WHERE c.task_id = ? ORDER BY c.created_at ASC
  `).all(req.params.taskId);
  res.json({ comments: comments.map(c => ({
    id: c.id, taskId: c.task_id, content: c.content, createdAt: c.created_at,
    user: { id: c.user_id, name: c.user_name, avatar: c.user_avatar, role: c.user_role },
  })) });
});

router.post('/tasks/:taskId/comments', requireAuth, (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(task.project_id);
  if (!canAccessProject(req.user, project)) {
    return res.status(403).json({ error: 'You do not have access to this task' });
  }
  const { content } = req.body || {};
  if (!content?.trim()) return res.status(400).json({ error: 'content is required' });

  const id = 'tc' + crypto.randomUUID();
  const createdAt = new Date().toISOString();
  db.prepare('INSERT INTO task_comments (id, task_id, user_id, content, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(id, task.id, req.user.id, content.trim(), createdAt);

  if (task.assignee_id && task.assignee_id !== req.user.id) {
    notifyUser({
      userId: task.assignee_id,
      title: 'New Comment on Task',
      message: `${req.user.name} commented on "${task.title}"`,
      type: 'task',
      relatedProjectId: project.id,
    });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  res.status(201).json({ comment: {
    id, taskId: task.id, content: content.trim(), createdAt,
    user: { id: req.user.id, name: user.name, avatar: user.avatar, role: user.role },
  }});
});

export default router;
