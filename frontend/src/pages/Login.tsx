import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:3000/api/auth/login', { email, password }, {
        withCredentials: true
      });
      login(response.data.accessToken, response.data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4 relative overflow-hidden">
      {/* Subtle ambient glow in the background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-zinc-800/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">ClientDash</h1>
          <p className="text-zinc-400">Manage your projects with elegance.</p>
        </div>
        <Card className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-800/80 shadow-2xl overflow-hidden rounded-xl">
          <div className="h-1 w-full bg-gradient-to-r from-zinc-800 via-zinc-400 to-zinc-800"></div>
          <CardHeader className="space-y-1 text-center pt-8 pb-6">
            <CardTitle className="text-2xl font-semibold text-white tracking-tight">Welcome back</CardTitle>
            <CardDescription className="text-zinc-400">
              Enter your email and password to sign in
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-5 px-8">
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-950/30 border border-red-900/50 p-3 text-sm text-red-200">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <p>{error}</p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-300 font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all rounded-lg h-11 px-4"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-zinc-300 font-medium">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all rounded-lg h-11 px-4"
                />
              </div>
            </CardContent>
            <CardFooter className="pt-4 pb-8 px-8">
              <Button
                type="submit"
                className="w-full bg-white text-black hover:bg-zinc-200 font-semibold transition-colors h-11 rounded-lg shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* <div className="mt-10 text-center text-sm text-zinc-500 space-y-2">
          <p className="text-zinc-400 font-medium uppercase tracking-wider text-xs">Demo Accounts</p>
          <div className="flex flex-col gap-1 items-center justify-center font-mono text-xs">
            <span className="bg-zinc-900/50 border border-zinc-800 px-3 py-1 rounded-full">admin@demo.com</span>
            <span className="bg-zinc-900/50 border border-zinc-800 px-3 py-1 rounded-full">pm@demo.com</span>
            <span className="bg-zinc-900/50 border border-zinc-800 px-3 py-1 rounded-full">dev@demo.com</span>
          </div>
          <p className="pt-2">Password: <span className="font-mono text-zinc-400">password123</span></p>
        </div> */}
      </div>
    </div>
  );
};
