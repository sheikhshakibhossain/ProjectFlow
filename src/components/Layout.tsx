import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  FolderKanban, 
  MessageSquare, 
  Settings, 
  LogOut, 
  Bell, 
  Menu,
  X,
  Check
} from 'lucide-react';
import { cn } from './ui';
import { MOCK_NOTIFICATIONS } from '../lib/mockData';

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isNotificationsOpen, setNotificationsOpen] = useState(false);

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Projects', icon: FolderKanban, path: '/projects' },
    // Show feedback tab only if not just standard student
    { label: 'Feedback', icon: MessageSquare, path: '/feedback' },
  ];

  const unreadCount = MOCK_NOTIFICATIONS.filter(n => !n.isRead && n.userId === user.id).length;
  const userNotifications = MOCK_NOTIFICATIONS.filter(n => n.userId === user.id);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900 font-sans">
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 flex flex-col",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <FolderKanban className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">ProjectFlow</span>
          </div>
          <button className="md:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2 rounded-xl transition-colors text-sm font-medium",
                isActive 
                  ? "bg-indigo-50 text-indigo-600" 
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <NavLink
            to="/profile"
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2 rounded-xl transition-colors text-sm font-medium mb-1",
              isActive 
                ? "bg-indigo-50 text-indigo-600" 
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            )}
            onClick={() => setSidebarOpen(false)}
          >
            <Settings className="w-5 h-5" />
            Settings
          </NavLink>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-xl transition-colors text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shrink-0 relative">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold capitalize hidden sm:block text-slate-800">
              {window.location.pathname.split('/')[1] || 'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications Dropdown */}
            <div className="relative">
              <button 
                className="p-2 text-slate-500 hover:bg-slate-100 rounded-full relative"
                onClick={() => setNotificationsOpen(!isNotificationsOpen)}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                )}
              </button>

              {isNotificationsOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setNotificationsOpen(false)} />
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-lg border border-slate-200 z-20 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                      <span className="font-semibold text-sm">Notifications</span>
                      <button className="text-xs text-indigo-600 font-medium hover:underline">Mark all read</button>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {userNotifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-slate-500">No notifications</div>
                      ) : (
                        userNotifications.map(notification => (
                          <div key={notification.id} className={cn("p-4 border-b border-slate-100 flex gap-3 hover:bg-slate-50 transition-colors", !notification.isRead && "bg-indigo-50/50")}>
                            <div className={cn("w-2 h-2 mt-2 rounded-full shrink-0", !notification.isRead ? "bg-indigo-600" : "bg-transparent")} />
                            <div>
                              <p className="text-sm font-medium text-slate-900">{notification.title}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{notification.message}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile Dropdown (simplified) */}
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="flex flex-col items-end hidden md:flex">
                <span className="text-sm font-medium text-slate-900 leading-none">{user.name}</span>
                <span className="text-xs text-slate-500 capitalize mt-1">{user.role.replace('_', ' ')}</span>
              </div>
              <img src={user.avatar} alt="Profile" className="w-9 h-9 rounded-full border border-slate-200 object-cover" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
