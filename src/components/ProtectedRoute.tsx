/**
 * Protected Route Component
 *
 * Wraps routes that require authentication
 * Redirects to /login if user is not authenticated
 * Redirects Agency tier users to /agency dashboard
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

interface ProtectedRouteProps {
  children: React.ReactNode;
  agencyOnly?: boolean; // If true, only allow agency dashboard access
}

export function ProtectedRoute({ children, agencyOnly = false }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const location = useLocation();

  const loading = authLoading || profileLoading;

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Agency tier routing logic
  const isAgencyTier = profile?.subscription_tier === 'agency';
  const isAgencyRoute = location.pathname.startsWith('/agency');
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isAdmin = profile?.is_admin === true;

  // If trying to access admin panel but not an admin, redirect appropriately
  if (isAdminRoute && !isAdmin) {
    return <Navigate to={isAgencyTier ? "/agency" : "/"} replace />;
  }

  // If agency user tries to access regular app, redirect to agency dashboard
  // Exception: Allow admin users to access admin panel
  if (isAgencyTier && !isAgencyRoute && !isAdminRoute && !agencyOnly) {
    return <Navigate to="/agency" replace />;
  }

  // If non-agency user tries to access agency dashboard, redirect to app
  if (!isAgencyTier && isAgencyRoute) {
    return <Navigate to="/" replace />;
  }

  // Render protected content
  return <>{children}</>;
}
