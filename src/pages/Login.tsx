import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui';
import { FolderKanban } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-800 flex flex-col justify-center items-center p-4">
      <div className="mb-8 flex flex-col items-center">
        <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center mb-4 shadow-sm">
          <FolderKanban className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">ProjectFlow</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Manage your academic projects seamlessly</p>
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
                placeholder="shakib@gmail.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium leading-none">Password</label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            <Button type="submit" className="w-full mt-4" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 border-t border-slate-100 dark:border-slate-800 pt-6">
          <div className="text-sm text-slate-500 dark:text-slate-400 text-center">
            Don't have an account? <Link to="/signup" className="text-indigo-600 dark:text-indigo-400 hover:underline">Sign up</Link>
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400 text-center">
            <Link to="/forgot-password" className="hover:underline">Forgot password?</Link>
          </div>
        </CardFooter>
      </Card>

      {/* Demo helper */}
      <div className="mt-8 p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl max-w-md w-full text-sm text-indigo-800 dark:text-indigo-300">
        <p className="font-semibold mb-2">Demo Credentials (password: password123):</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Student: shakib@gmail.com</li>
          <li>Team Lead: shaif@gmail.com</li>
          <li>Teacher: tasmia@gmail.com</li>
        </ul>
      </div>
    </div>
  );
};
