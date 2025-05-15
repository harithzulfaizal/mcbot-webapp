// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // Assuming this is your custom auto-resizing textarea, but we'll use it as a standard input for login
import { Label } from '@/components/ui/label'; // You might need to create this or use a simple <label>
import { Command } from 'lucide-react'; // Or any other icon you prefer

// If you don't have a Label component, you can create a simple one or use raw HTML:
// const Label = ({ htmlFor, children, className }: { htmlFor: string, children: React.ReactNode, className?: string }) => (
//   <label htmlFor={htmlFor} className={`block text-sm font-medium text-gray-700 dark:text-gray-300 ${className}`}>
//     {children}
//   </label>
// );

interface LoginPageProps {
  onLoginSuccess: (user: { name: string; email: string }) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    // Basic validation
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    // Dummy authentication
    if (email === 'user@example.com' && password === 'password') {
      // Simulate successful login
      onLoginSuccess({ name: 'Kijang User', email: email });
    } else {
      setError('Invalid email or password.');
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Command className="mx-auto h-12 w-12 text-primary" /> {/* Using Command as a placeholder logo */}
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-white">
            Sign in to KijangBot
          </h2>
        </div>
        <form
          className="mt-8 space-y-6 rounded-xl bg-slate-800 p-8 shadow-2xl"
          onSubmit={handleSubmit}
        >
          {error && (
            <div className="rounded-md border border-red-700 bg-red-900 p-3 text-sm text-red-200">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-slate-300">Email address</Label>
              <Input
                id="email"
                name="email"
                type="email" // Changed from textarea to standard input behavior
                autoComplete="email"
                required
                className="mt-1 block w-full appearance-none rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
                placeholder="user@example.com"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                initialHeight="auto" // Not strictly needed for standard input type
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-slate-300">Password</Label>
              <Input
                id="password"
                name="password"
                type="password" // Changed from textarea to standard input behavior
                autoComplete="current-password"
                required
                className="mt-1 block w-full appearance-none rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
                placeholder="password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                initialHeight="auto" // Not strictly needed for standard input type
              />
            </div>
          </div>

          <div>
            <Button
              type="submit"
              className="flex w-full justify-center rounded-md border border-transparent bg-primary py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              Sign in
            </Button>
          </div>
        </form>
        <p className="mt-6 text-center text-sm text-slate-400">
          Use <code className="rounded bg-slate-700 px-1 py-0.5 font-mono text-xs text-slate-300">user@example.com</code> and <code className="rounded bg-slate-700 px-1 py-0.5 font-mono text-xs text-slate-300">password</code> to login.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
