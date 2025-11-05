/**
 * Login Page
 *
 * Authentication page with sign in / sign up toggle
 * Uses Supabase for authentication
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Zap, Mail, Lock } from 'lucide-react';

/**
 * Get the appropriate domain URL based on environment
 */
function getDomainUrl(domain: 'marketing' | 'app' | 'agency'): string {
  const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  if (isDev) {
    return window.location.origin; // Use localhost for development
  }

  // Production domains from env vars
  const domains = {
    marketing: import.meta.env.VITE_MARKETING_DOMAIN || 'https://streamsuite.io',
    app: import.meta.env.VITE_APP_DOMAIN || 'https://app.streamsuite.io',
    agency: import.meta.env.VITE_AGENCY_DOMAIN || 'https://agency.streamsuite.io'
  };

  return domains[domain];
}

/**
 * Redirect user to appropriate domain based on subscription tier
 */
async function redirectAfterLogin(userId: string) {
  try {
    // Fetch user's profile to determine subscription tier
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      // Default to app domain if profile fetch fails
      window.location.href = `${getDomainUrl('app')}/app`;
      return;
    }

    // Redirect based on tier
    if (profile?.subscription_tier === 'agency') {
      window.location.href = `${getDomainUrl('agency')}/agency`;
    } else {
      window.location.href = `${getDomainUrl('app')}/app`;
    }
  } catch (err) {
    console.error('Error in redirectAfterLogin:', err);
    // Fallback to app domain
    window.location.href = `${getDomainUrl('app')}/app`;
  }
}

export default function Login() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      redirectAfterLogin(user.id);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password);
        if (!error && user) {
          await redirectAfterLogin(user.id);
        }
      } else {
        const { error } = await signUp(email, password);
        // Sign up sends confirmation email, don't auto-navigate
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-3 text-center pb-6">
          {/* Logo */}
          <div className="flex justify-center">
            <img
              src="https://ai-stream-solutions.s3.us-east-1.amazonaws.com/StreamSuite.png"
              alt="StreamSuite"
              className="h-16 w-auto"
            />
          </div>

          {/* Title */}
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            StreamSuite
          </CardTitle>
          <CardDescription className="text-base">
            {mode === 'signin'
              ? 'Welcome back! Sign in to continue building workflows.'
              : 'Get started with 5 free credits to try it out.'}
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={6}
                  className="pl-10"
                />
              </div>
              {mode === 'signup' && (
                <p className="text-xs text-gray-500">
                  Must be at least 6 characters long
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
              size="lg"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>{mode === 'signin' ? 'Signing in...' : 'Creating account...'}</span>
                </div>
              ) : (
                <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
              )}
            </Button>
          </CardContent>
        </form>

        <CardFooter className="flex flex-col space-y-4">
          {/* Divider */}
          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">or</span>
            </div>
          </div>

          {/* Toggle Mode Button */}
          <Button
            type="button"
            variant="ghost"
            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            disabled={loading}
            className="w-full"
          >
            {mode === 'signin' ? (
              <span>Don't have an account? <strong>Sign up</strong></span>
            ) : (
              <span>Already have an account? <strong>Sign in</strong></span>
            )}
          </Button>

          {/* Beta Notice */}
          {mode === 'signup' && (
            <div className="text-center pt-4 border-t">
              <p className="text-sm text-green-600 font-medium">
                Get 5 free credits to try it out!
              </p>
            </div>
          )}
        </CardFooter>
      </Card>

      {/* Footer */}
      <div className="absolute bottom-4 text-center text-sm text-gray-500">
        <p>Build workflow automations in 30 seconds</p>
      </div>
    </div>
  );
}
