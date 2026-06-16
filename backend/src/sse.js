// In-memory registry of SSE connections, keyed by user id.
const clients = new Map();

export function addClient(userId, res) {
  if (!clients.has(userId)) clients.set(userId, new Set());
  clients.get(userId).add(res);
}

export function removeClient(userId, res) {
  const set = clients.get(userId);
  if (!set) return;
  set.delete(res);
  if (set.size === 0) clients.delete(userId);
}

export function pushToUser(userId, payload) {
  const set = clients.get(userId);
  if (!set) return;
  const data = `data: ${JSON.stringify(payload)}\n\n`;
  for (const res of set) {
    res.write(data);
  }
}

export function pushToProjectMembers(db, projectId, payload) {
  const members = db.prepare('SELECT user_id FROM project_members WHERE project_id = ?').all(projectId);
  const project = db.prepare('SELECT supervisor_id FROM projects WHERE id = ?').get(projectId);
  const userIds = new Set(members.map(m => m.user_id));
  if (project?.supervisor_id) userIds.add(project.supervisor_id);
  for (const userId of userIds) pushToUser(userId, payload);
}
