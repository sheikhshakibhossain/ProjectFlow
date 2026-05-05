import React from 'react';
import { createBrowserRouter, redirect } from 'react-router';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { CreateProject } from './pages/CreateProject';
import { AddTask } from './pages/AddTask';
import { ProjectDetails } from './pages/ProjectDetails';
import { Feedback } from './pages/Feedback';
import { ProfileSettings } from './pages/Settings';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';

const ForgotPassword = () => (
  <div className="p-8 text-center text-slate-500">
    <h1 className="text-2xl font-bold text-slate-900 mb-4">Forgot Password</h1>
    Forgot Password flow is not implemented in this demo.
  </div>
);

export const router = createBrowserRouter([
  {
    path: '/login',
    Component: Login,
  },
  {
    path: '/signup',
    Component: Signup,
  },
  {
    path: '/forgot-password',
    Component: ForgotPassword,
  },
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, loader: () => redirect('/login') },
      { path: 'dashboard', Component: Dashboard },
      { path: 'projects', Component: Projects },
      { path: 'projects/create', Component: CreateProject },
      { path: 'projects/:id/add-task', Component: AddTask },
      { path: 'projects/:id', Component: ProjectDetails },
      { path: 'feedback', Component: Feedback },
      { path: 'profile', Component: ProfileSettings },
    ],
  },
]);
