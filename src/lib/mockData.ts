import { format, addDays, subDays } from 'date-fns';

export type Role = 'student' | 'team_lead' | 'teacher';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  teamId?: string;
}

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Alex Johnson', email: 'alex@example.com', role: 'student', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&q=80', teamId: 't1' },
  { id: 'u2', name: 'Sarah Miller', email: 'sarah@example.com', role: 'team_lead', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&q=80', teamId: 't1' },
  { id: 'u3', name: 'Dr. Emily Chen', email: 'emily@example.com', role: 'teacher', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&q=80' },
  { id: 'u4', name: 'Michael Chang', email: 'michael@example.com', role: 'student', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&h=150&fit=crop&q=80', teamId: 't1' },
  { id: 'u5', name: 'Emma Wilson', email: 'emma@example.com', role: 'team_lead', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&q=80', teamId: 't2' },
];

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

export const MOCK_TASKS: Task[] = [
  { id: 'tsk1', projectId: 'p1', title: 'Design Database Schema', description: 'Create ERD and SQL scripts for the main database.', status: 'done', assigneeId: 'u2', deadline: format(subDays(new Date(), 2), 'yyyy-MM-dd'), priority: 'high' },
  { id: 'tsk2', projectId: 'p1', title: 'Implement Auth API', description: 'Set up JWT authentication endpoints.', status: 'in_progress', assigneeId: 'u1', deadline: format(addDays(new Date(), 1), 'yyyy-MM-dd'), priority: 'high' },
  { id: 'tsk3', projectId: 'p1', title: 'Create Frontend Layout', description: 'Build the responsive sidebar and top nav.', status: 'todo', assigneeId: 'u4', deadline: format(addDays(new Date(), 3), 'yyyy-MM-dd'), priority: 'medium' },
  { id: 'tsk4', projectId: 'p1', title: 'Write Unit Tests', description: 'Ensure >80% coverage for the auth module.', status: 'todo', assigneeId: 'u1', deadline: format(addDays(new Date(), 5), 'yyyy-MM-dd'), priority: 'low' },
  { id: 'tsk5', projectId: 'p2', title: 'Market Research', description: 'Analyze competitor apps.', status: 'in_progress', assigneeId: 'u5', deadline: format(addDays(new Date(), 2), 'yyyy-MM-dd'), priority: 'medium' },
];

export interface Project {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'on_hold';
  teamId: string;
  course: string;
  deadline: string;
  progress: number;
}

export const MOCK_PROJECTS: Project[] = [
  { id: 'p1', title: 'Smart Campus App', description: 'A mobile app to help students navigate campus facilities.', status: 'active', teamId: 't1', course: 'CS401 - Software Engineering', deadline: format(addDays(new Date(), 14), 'yyyy-MM-dd'), progress: 45 },
  { id: 'p2', title: 'E-commerce Redesign', description: 'Redesigning the user journey for a local business.', status: 'active', teamId: 't2', course: 'UX302 - User Experience', deadline: format(addDays(new Date(), 7), 'yyyy-MM-dd'), progress: 70 },
  { id: 'p3', title: 'AI Chatbot Integration', description: 'Integrating NLP models into student support systems.', status: 'completed', teamId: 't1', course: 'CS505 - Artificial Intelligence', deadline: format(subDays(new Date(), 10), 'yyyy-MM-dd'), progress: 100 },
];

export interface Feedback {
  id: string;
  projectId: string;
  teacherId: string;
  rating: number; // 1-5
  comments: string;
  date: string;
  highlights: string[];
}

export const MOCK_FEEDBACK: Feedback[] = [
  { id: 'f1', projectId: 'p1', teacherId: 'u3', rating: 4, comments: 'Good progress on the schema. Make sure to consider edge cases in the Auth API.', date: format(subDays(new Date(), 1), 'yyyy-MM-dd'), highlights: ['Clear database design', 'Need better error handling in API'] },
  { id: 'f2', projectId: 'p3', teacherId: 'u3', rating: 5, comments: 'Excellent execution. The integration is seamless and well-documented.', date: format(subDays(new Date(), 12), 'yyyy-MM-dd'), highlights: ['Great documentation', 'Solid architecture'] },
];

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  date: string;
  type: 'task' | 'feedback' | 'system' | 'deadline';
}

export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 'n1', userId: 'u1', title: 'New Task Assigned', message: 'You have been assigned "Implement Auth API"', isRead: false, date: new Date().toISOString(), type: 'task' },
  { id: 'n2', userId: 'u1', title: 'New Feedback', message: 'Dr. Emily Chen left feedback on Smart Campus App', isRead: false, date: subDays(new Date(), 1).toISOString(), type: 'feedback' },
  { id: 'n3', userId: 'u2', title: 'Task Completed', message: 'Alex finished "Database Schema"', isRead: true, date: subDays(new Date(), 2).toISOString(), type: 'system' },
  { id: 'n4', userId: 'u1', title: 'Deadline Approaching', message: '"Implement Auth API" is due tomorrow!', isRead: false, date: new Date().toISOString(), type: 'deadline' },
];
