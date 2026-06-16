import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', '..', 'data.sqlite');

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('student','team_lead','teacher')),
  avatar TEXT,
  team_id TEXT REFERENCES teams(id),
  bio TEXT
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'dormant' CHECK(status IN ('dormant','active','completed','on_hold','rejected')),
  team_id TEXT REFERENCES teams(id),
  course TEXT,
  deadline TEXT,
  progress INTEGER DEFAULT 0,
  created_by TEXT REFERENCES users(id),
  supervisor_id TEXT REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK(status IN ('todo','in_progress','done')),
  assignee_id TEXT REFERENCES users(id),
  deadline TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low','medium','high'))
);

CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  teacher_id TEXT NOT NULL REFERENCES users(id),
  rating INTEGER NOT NULL,
  comments TEXT,
  date TEXT NOT NULL,
  highlights TEXT
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  message TEXT,
  is_read INTEGER NOT NULL DEFAULT 0,
  date TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'system',
  related_project_id TEXT REFERENCES projects(id)
);

CREATE TABLE IF NOT EXISTS sections (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS project_members (
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, user_id)
);
`);

// --- Migrations for databases created before the supervisor-approval workflow ---
const projectCols = db.prepare("PRAGMA table_info(projects)").all().map(c => c.name);
if (!projectCols.includes('supervisor_id')) {
  db.exec(`
    CREATE TABLE projects_new (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'dormant' CHECK(status IN ('dormant','active','completed','on_hold','rejected')),
      team_id TEXT REFERENCES teams(id),
      course TEXT,
      deadline TEXT,
      progress INTEGER DEFAULT 0,
      created_by TEXT REFERENCES users(id),
      supervisor_id TEXT REFERENCES users(id)
    );
    INSERT INTO projects_new (id, title, description, status, team_id, course, deadline, progress, created_by, supervisor_id)
      SELECT id, title, description, status, team_id, course, deadline, progress, created_by, NULL FROM projects;
    DROP TABLE projects;
    ALTER TABLE projects_new RENAME TO projects;
  `);
}

const notificationCols = db.prepare("PRAGMA table_info(notifications)").all().map(c => c.name);
if (!notificationCols.includes('related_project_id')) {
  db.exec(`ALTER TABLE notifications ADD COLUMN related_project_id TEXT REFERENCES projects(id)`);
}

const projectCols2 = db.prepare("PRAGMA table_info(projects)").all().map(c => c.name);
if (!projectCols2.includes('section_id')) {
  db.exec(`ALTER TABLE projects ADD COLUMN section_id TEXT REFERENCES sections(id)`);
}

// Backfill project_members for projects that pre-date explicit member tracking
const memberCount = db.prepare('SELECT COUNT(*) AS c FROM project_members').get().c;
if (memberCount === 0) {
  db.exec(`
    INSERT OR IGNORE INTO project_members (project_id, user_id)
    SELECT p.id, u.id FROM projects p
    JOIN users u ON u.team_id = p.team_id
    WHERE p.team_id IS NOT NULL
  `);
}

function seed() {
  const userCount = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  if (userCount > 0) return;

  const passwordHash = bcrypt.hashSync('password123', 10);

  db.prepare('INSERT INTO teams (id, name) VALUES (?, ?)').run('t1', 'Team Alpha');
  db.prepare('INSERT INTO teams (id, name) VALUES (?, ?)').run('t2', 'Team Beta');

  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, password_hash, role, avatar, team_id, bio)
    VALUES (@id, @name, @email, @password_hash, @role, @avatar, @team_id, @bio)
  `);

  const users = [
    { id: 'u1', name: 'Sheikh Shakib Hossain', email: 'shakib@gmail.com', role: 'student', avatar: '/api/uploads/avatars/u1-shakib.jpg', team_id: 't1', bio: 'Computer Science major focusing on software engineering and UI/UX design.' },
    { id: 'u2', name: 'Shaif Al Shad', email: 'shaif@gmail.com', role: 'team_lead', avatar: '/api/uploads/avatars/u2-shaif.jpg', team_id: 't1', bio: 'Team lead for Team Alpha. Loves project planning.' },
    { id: 'u3', name: 'Tasmia Binte Sogir', email: 'tasmia@gmail.com', role: 'teacher', avatar: '/api/uploads/avatars/u3-tasmia.jpg', team_id: null, bio: 'Professor supervising software engineering capstone projects.' },
    { id: 'u4', name: 'Michael Chang', email: 'michael@example.com', role: 'student', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&h=150&fit=crop&q=80', team_id: 't1', bio: 'Backend enthusiast.' },
    { id: 'u5', name: 'Emma Wilson', email: 'emma@example.com', role: 'team_lead', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&q=80', team_id: 't2', bio: 'Team lead for Team Beta.' },
  ];

  for (const u of users) {
    insertUser.run({ ...u, password_hash: passwordHash });
  }

  const today = new Date();
  const fmt = (d) => d.toISOString().slice(0, 10);
  const addDays = (n) => { const d = new Date(today); d.setDate(d.getDate() + n); return fmt(d); };

  const insertProject = db.prepare(`
    INSERT INTO projects (id, title, description, status, team_id, course, deadline, progress, created_by, supervisor_id)
    VALUES (@id, @title, @description, @status, @team_id, @course, @deadline, @progress, @created_by, @supervisor_id)
  `);

  insertProject.run({ id: 'p1', title: 'Smart Campus App', description: 'A mobile app to help students navigate campus facilities.', status: 'active', team_id: 't1', course: 'CS401 - Software Engineering', deadline: addDays(14), progress: 45, created_by: 'u2', supervisor_id: 'u3' });
  insertProject.run({ id: 'p2', title: 'E-commerce Redesign', description: 'Redesigning the user journey for a local business.', status: 'active', team_id: 't2', course: 'UX302 - User Experience', deadline: addDays(7), progress: 70, created_by: 'u5', supervisor_id: 'u3' });
  insertProject.run({ id: 'p3', title: 'AI Chatbot Integration', description: 'Integrating NLP models into student support systems.', status: 'completed', team_id: 't1', course: 'CS505 - Artificial Intelligence', deadline: addDays(-10), progress: 100, created_by: 'u2', supervisor_id: 'u3' });
  insertProject.run({ id: 'p4', title: 'Campus Event Scheduler', description: 'A scheduling tool for student clubs to book rooms and timeslots.', status: 'dormant', team_id: 't1', course: 'CS410 - Mobile App Development', deadline: addDays(30), progress: 0, created_by: 'u2', supervisor_id: 'u3' });

  const insertTask = db.prepare(`
    INSERT INTO tasks (id, project_id, title, description, status, assignee_id, deadline, priority)
    VALUES (@id, @project_id, @title, @description, @status, @assignee_id, @deadline, @priority)
  `);

  insertTask.run({ id: 'tsk1', project_id: 'p1', title: 'Design Database Schema', description: 'Create ERD and SQL scripts for the main database.', status: 'done', assignee_id: 'u2', deadline: addDays(-2), priority: 'high' });
  insertTask.run({ id: 'tsk2', project_id: 'p1', title: 'Implement Auth API', description: 'Set up JWT authentication endpoints.', status: 'in_progress', assignee_id: 'u1', deadline: addDays(1), priority: 'high' });
  insertTask.run({ id: 'tsk3', project_id: 'p1', title: 'Create Frontend Layout', description: 'Build the responsive sidebar and top nav.', status: 'todo', assignee_id: 'u4', deadline: addDays(3), priority: 'medium' });
  insertTask.run({ id: 'tsk4', project_id: 'p1', title: 'Write Unit Tests', description: 'Ensure >80% coverage for the auth module.', status: 'todo', assignee_id: 'u1', deadline: addDays(5), priority: 'low' });
  insertTask.run({ id: 'tsk5', project_id: 'p2', title: 'Market Research', description: 'Analyze competitor apps.', status: 'in_progress', assignee_id: 'u5', deadline: addDays(2), priority: 'medium' });

  const insertFeedback = db.prepare(`
    INSERT INTO feedback (id, project_id, teacher_id, rating, comments, date, highlights)
    VALUES (@id, @project_id, @teacher_id, @rating, @comments, @date, @highlights)
  `);

  insertFeedback.run({ id: 'f1', project_id: 'p1', teacher_id: 'u3', rating: 4, comments: 'Good progress on the schema. Make sure to consider edge cases in the Auth API.', date: addDays(-1), highlights: JSON.stringify(['Clear database design', 'Need better error handling in API']) });
  insertFeedback.run({ id: 'f2', project_id: 'p3', teacher_id: 'u3', rating: 5, comments: 'Excellent execution. The integration is seamless and well-documented.', date: addDays(-12), highlights: JSON.stringify(['Great documentation', 'Solid architecture']) });

  const insertNotification = db.prepare(`
    INSERT INTO notifications (id, user_id, title, message, is_read, date, type, related_project_id)
    VALUES (@id, @user_id, @title, @message, @is_read, @date, @type, @related_project_id)
  `);

  const nowIso = new Date().toISOString();
  const yesterdayIso = new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const twoDaysAgoIso = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();

  insertNotification.run({ id: 'n1', user_id: 'u1', title: 'New Task Assigned', message: 'You have been assigned "Implement Auth API"', is_read: 0, date: nowIso, type: 'task', related_project_id: null });
  insertNotification.run({ id: 'n2', user_id: 'u1', title: 'New Feedback', message: 'Tasmia Binte Sogir left feedback on Smart Campus App', is_read: 0, date: yesterdayIso, type: 'feedback', related_project_id: null });
  insertNotification.run({ id: 'n3', user_id: 'u2', title: 'Task Completed', message: 'Shakib finished "Database Schema"', is_read: 1, date: twoDaysAgoIso, type: 'system', related_project_id: null });
  insertNotification.run({ id: 'n4', user_id: 'u1', title: 'Deadline Approaching', message: '"Implement Auth API" is due tomorrow!', is_read: 0, date: nowIso, type: 'deadline', related_project_id: null });
  insertNotification.run({ id: 'n5', user_id: 'u3', title: 'New Project Request', message: 'Shaif Al Shad requested your supervision for "Campus Event Scheduler"', is_read: 0, date: nowIso, type: 'project_request', related_project_id: 'p4' });
}

seed();
