import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui';
import { FolderKanban } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('student');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email || 'alex@example.com', role);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="mb-8 flex flex-col items-center">
        <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center mb-4 shadow-sm">
          <FolderKanban className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">ProjectFlow</h1>
        <p className="text-slate-500 mt-2">Manage your academic projects seamlessly</p>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Sign in</CardTitle>
          <CardDescription className="text-center">
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium leading-none">Email</label>
              <Input 
                id="email" 
                type="email" 
                placeholder="alex@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="role" className="text-sm font-medium leading-none">Login As (Demo)</label>
              <select 
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <option value="student">Student</option>
                <option value="team_lead">Team Lead</option>
                <option value="teacher">Teacher</option>
              </select>
            </div>
            <Button type="submit" className="w-full mt-4">Sign In</Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 border-t border-slate-100 pt-6">
          <div className="text-sm text-slate-500 text-center">
            Don't have an account? <Link to="/signup" className="text-indigo-600 hover:underline">Sign up</Link>
          </div>
          <div className="text-sm text-slate-500 text-center">
            <Link to="/forgot-password" className="hover:underline">Forgot password?</Link>
          </div>
        </CardFooter>
      </Card>
      
      {/* Demo helper */}
      <div className="mt-8 p-4 bg-indigo-50 rounded-xl max-w-md w-full text-sm text-indigo-800">
        <p className="font-semibold mb-2">Demo Credentials:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Student: alex@example.com</li>
          <li>Team Lead: sarah@example.com</li>
          <li>Teacher: emily@example.com</li>
        </ul>
      </div>
    </div>
  );
};
