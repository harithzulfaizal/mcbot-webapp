import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Command } from 'lucide-react';
import { AuthUser, profileToAuthUser, UserProfile } from '@/lib/auth';
import { apiUrl } from '@/lib/api';

interface LoginPageProps {
  onLoginSuccess: (user: AuthUser) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchToken = async (
    inputUsername: string,
    inputPassword: string
  ): Promise<{ access_token: string; user: UserProfile }> => {
    const tokenResp = await fetch(apiUrl('/auth/token'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: inputUsername, password: inputPassword }),
    });

    const tokenData = await tokenResp.json().catch(() => ({}));
    if (!tokenResp.ok) {
      throw new Error(tokenData.detail || 'Failed to sign in.');
    }

    if (!tokenData.access_token) {
      throw new Error('Token response missing access_token.');
    }
    if (!tokenData.user) {
      throw new Error('Token response missing user profile.');
    }

    return tokenData as { access_token: string; user: UserProfile };
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const tokenData = await fetchToken(username, password);
      onLoginSuccess(profileToAuthUser(tokenData.user, tokenData.access_token));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Command className="mx-auto h-12 w-12 text-primary" />
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-white">
            Sign in to MC Bot
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
              <Label htmlFor="username" className="text-slate-300">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="mt-1 block w-full appearance-none rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
                placeholder="your-username"
                value={username}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-slate-300">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="mt-1 block w-full appearance-none rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
                placeholder="••••••••"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full justify-center rounded-md border border-transparent bg-primary py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              {isSubmitting ? 'Please wait...' : 'Sign in'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
