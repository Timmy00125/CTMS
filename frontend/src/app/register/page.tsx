'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Registration failed');
      }

      router.push('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Brand */}
        <div className="flex items-center justify-center gap-3">
          <div className="w-9 h-9 bg-foreground text-background flex items-center justify-center text-sm font-bold font-tabular">
            CT
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-semibold tracking-tight leading-none">CTMS</span>
            <span className="text-[10px] text-muted-foreground leading-none mt-0.5">Course & Transcript Management</span>
          </div>
        </div>

        {/* Form */}
        <div className="bg-card border border-border rounded-sm p-6">
          <div className="mb-5">
            <h2 className="text-base font-semibold">Create account</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Register to access the system</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Full name
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-9 px-3 text-sm bg-background border border-border rounded-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-9 px-3 text-sm bg-background border border-border rounded-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
                placeholder="name@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-9 px-3 text-sm bg-background border border-border rounded-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
              />
            </div>
            {error && (
              <p className="text-sm text-destructive bg-destructive/5 px-2 py-1.5 rounded-sm">{error}</p>
            )}
            <Button type="submit" disabled={loading} className="w-full h-9">
              {loading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="text-foreground underline underline-offset-4 hover:no-underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
