export type Role = 'student' | 'team_lead' | 'teacher';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  teamId?: string;
  bio?: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  assigneeId?: string;
  deadline: string;
  priority: TaskPriority;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  status: 'dormant' | 'active' | 'completed' | 'on_hold' | 'rejected' | 'deletion_requested' | 'under_review';
  teamId: string;
  course: string;
  deadline: string;
  progress: number;
  createdBy?: string;
  supervisorId?: string;
  sectionId?: string;
}

export interface Section {
  id: string;
  name: string;
  createdBy?: string;
  createdAt: string;
}

export interface Feedback {
  id: string;
  projectId: string;
  teacherId: string;
  rating: number;
  comments: string;
  date: string;
  highlights: string[];
  projectTitle?: string;
  teacherName?: string;
  teacherAvatar?: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string; avatar: string; role: string };
}

export interface SearchResult {
  projects: Project[];
  tasks: Array<{
    id: string;
    projectId: string;
    projectTitle: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    deadline: string;
  }>;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  date: string;
  type: 'task' | 'feedback' | 'system' | 'deadline' | 'project_request' | 'project_response';
  relatedProjectId?: string;
}
