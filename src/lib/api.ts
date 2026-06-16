import type { Feedback, Notification, Project, Role, Section, Task, TaskComment, User } from './types';

const TOKEN_KEY = 'auth_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

class ApiError extends Error {}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`/api${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(data.error || 'Something went wrong');
  }
  return data as T;
}

export const api = {
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  signup: (name: string, email: string, password: string, role: Role) =>
    request<{ token: string; user: User }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
    }),

  me: () => request<{ user: User }>('/auth/me'),

  updateProfile: (payload: { name?: string; email?: string; bio?: string }) =>
    request<{ user: User }>('/users/me', { method: 'PATCH', body: JSON.stringify(payload) }),

  uploadAvatar: (avatarDataUrl: string) =>
    request<{ user: User }>('/users/me/avatar', { method: 'POST', body: JSON.stringify({ avatar: avatarDataUrl }) }),

  getAllUsers: () =>
    request<{ users: User[] }>('/users'),

  getTeamMembers: (teamId: string) =>
    request<{ users: User[] }>(`/users?teamId=${encodeURIComponent(teamId)}`),

  getUsersByRole: (role: Role) =>
    request<{ users: User[] }>(`/users?role=${encodeURIComponent(role)}`),

  getProjects: () => request<{ projects: Project[] }>('/projects'),

  getProject: (id: string) =>
    request<{ project: Project; members: User[] }>(`/projects/${id}`),

  createProject: (payload: { title: string; description: string; course: string; deadline: string; supervisorId: string; memberIds?: string[] }) =>
    request<{ project: Project }>('/projects', { method: 'POST', body: JSON.stringify(payload) }),

  respondToProject: (id: string, action: 'accept' | 'reject') =>
    request<{ project: Project }>(`/projects/${id}/respond`, { method: 'PATCH', body: JSON.stringify({ action }) }),

  requestProjectDeletion: (id: string) =>
    request<{ project: Project }>(`/projects/${id}/request-delete`, { method: 'POST' }),

  respondProjectDeletion: (id: string, action: 'accept' | 'reject') =>
    request<{ project?: Project; deleted?: boolean }>(`/projects/${id}/respond-delete`, { method: 'PATCH', body: JSON.stringify({ action }) }),

  addProjectMember: (id: string, userId: string) =>
    request<{ members: User[] }>(`/projects/${id}/members`, { method: 'POST', body: JSON.stringify({ userId }) }),

  removeProjectMember: (id: string, userId: string) =>
    request<{ members: User[] }>(`/projects/${id}/members/${userId}`, { method: 'DELETE' }),

  deleteProject: (id: string) =>
    request<{ deleted: boolean }>(`/projects/${id}`, { method: 'DELETE' }),

  submitProject: (id: string) =>
    request<{ project: Project }>(`/projects/${id}/submit`, { method: 'POST' }),

  completeProject: (id: string, action: 'complete' | 'send_back') =>
    request<{ project: Project }>(`/projects/${id}/complete`, { method: 'PATCH', body: JSON.stringify({ action }) }),

  resubmitProject: (id: string, payload: { title?: string; description?: string; course?: string; deadline?: string; supervisorId?: string }) =>
    request<{ project: Project }>(`/projects/${id}/resubmit`, { method: 'PATCH', body: JSON.stringify(payload) }),

  getTaskComments: (taskId: string) =>
    request<{ comments: TaskComment[] }>(`/tasks/${taskId}/comments`),

  addTaskComment: (taskId: string, content: string) =>
    request<{ comment: TaskComment }>(`/tasks/${taskId}/comments`, { method: 'POST', body: JSON.stringify({ content }) }),

  search: (q: string) =>
    request<SearchResult>(`/search?q=${encodeURIComponent(q)}`),

  moveProjectToSection: (id: string, sectionId: string | null) =>
    request<{ project: Project }>(`/projects/${id}/section`, { method: 'PATCH', body: JSON.stringify({ sectionId }) }),

  getSections: () => request<{ sections: Section[] }>('/sections'),

  createSection: (name: string) =>
    request<{ section: Section }>('/sections', { method: 'POST', body: JSON.stringify({ name }) }),

  renameSection: (id: string, name: string) =>
    request<{ section: Section }>(`/sections/${id}`, { method: 'PATCH', body: JSON.stringify({ name }) }),

  deleteSection: (id: string) =>
    request<{ success: boolean }>(`/sections/${id}`, { method: 'DELETE' }),

  getTasks: (projectId: string) =>
    request<{ tasks: Task[] }>(`/projects/${projectId}/tasks`),

  createTask: (projectId: string, payload: { title: string; description: string; assigneeId?: string; deadline: string; priority: string }) =>
    request<{ task: Task }>(`/projects/${projectId}/tasks`, { method: 'POST', body: JSON.stringify(payload) }),

  updateTask: (taskId: string, payload: Partial<{ status: string; title: string; description: string; assigneeId: string; deadline: string; priority: string }>) =>
    request<{ task: Task }>(`/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify(payload) }),

  getFeedback: () => request<{ feedback: Feedback[] }>('/feedback'),

  createFeedback: (payload: { projectId: string; rating: number; comments: string; highlights: string }) =>
    request<{ feedback: Feedback }>('/feedback', { method: 'POST', body: JSON.stringify(payload) }),

  getNotifications: () => request<{ notifications: Notification[] }>('/notifications'),

  markNotificationRead: (id: string) =>
    request<{ notification: Notification }>(`/notifications/${id}/read`, { method: 'PATCH' }),

  markAllNotificationsRead: () =>
    request<{ notifications: Notification[] }>('/notifications/read-all', { method: 'PATCH' }),
};

// ── Shared SSE singleton ───────────────────────────────────────────────────
// A single EventSource is shared across all subscribers so we don't open
// multiple long-lived connections to the same stream endpoint.

export type ProjectUpdateEvent = {
  _event: 'project_update';
  action: 'task_created' | 'task_updated' | 'comment_added';
  projectId: string;
  taskId?: string;
  task?: Task;
  comment?: TaskComment;
  progress?: number;
};

type SsePayload = { _event?: string; [key: string]: unknown };

let sseSource: EventSource | null = null;
let sseConnectedToken: string | null = null;
const sseListeners = new Set<(payload: SsePayload) => void>();

function ensureSseConnected(): void {
  const token = getToken();
  if (!token) return;
  if (sseSource && sseConnectedToken === token) return;
  sseSource?.close();
  sseConnectedToken = token;
  sseSource = new EventSource(`/api/notifications/stream?token=${encodeURIComponent(token)}`);
  sseSource.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data) as SsePayload;
      for (const fn of sseListeners) fn(data);
    } catch { /* ignore malformed */ }
  };
}

// EventSource can't send an Authorization header, so the token is passed as a query param.
export function subscribeToNotifications(onNotification: (notification: Notification) => void): () => void {
  ensureSseConnected();
  const handler = (payload: SsePayload) => {
    if (!payload._event) onNotification(payload as Notification);
  };
  sseListeners.add(handler);
  return () => { sseListeners.delete(handler); };
}

export function subscribeToProjectUpdates(
  projectId: string,
  onEvent: (event: ProjectUpdateEvent) => void,
): () => void {
  ensureSseConnected();
  const handler = (payload: SsePayload) => {
    if (payload._event === 'project_update' && payload.projectId === projectId) onEvent(payload);
  };
  sseListeners.add(handler);
  return () => { sseListeners.delete(handler); };
}

export type { Feedback, Notification, Project, Role, Section, Task, TaskComment, TaskStatus, TaskPriority, User, SearchResult } from './types';
