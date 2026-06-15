import crypto from 'crypto';
import { db } from '../db/index.js';
import { serializeNotification } from './serialize.js';
import { pushToUser } from '../sse.js';

export function notifyUser({ userId, title, message, type, relatedProjectId = null }) {
  const id = 'n' + crypto.randomUUID();
  const date = new Date().toISOString();

  db.prepare(`
    INSERT INTO notifications (id, user_id, title, message, is_read, date, type, related_project_id)
    VALUES (?, ?, ?, ?, 0, ?, ?, ?)
  `).run(id, userId, title, message, date, type, relatedProjectId);

  const notification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(id);
  pushToUser(userId, serializeNotification(notification));
  return notification;
}
