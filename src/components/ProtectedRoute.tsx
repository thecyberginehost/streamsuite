/**
 * Protected Route Component
 *
 * Wraps routes that require authentication
 * Redirects to /login if user is not authenticated
 * Redirects Agency tier users to /team dashboard
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

interface ProtectedRouteProps {
  children: React.ReactNode;
  teamOnly?: boolean; // If true, only allow team dashboard access
}

export function ProtectedRoute({ children, teamOnly = false }: ProtectedRouteProps) {
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
  const isTeamRoute = location.pathname.startsWith('/team');
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isAdmin = profile?.is_admin === true;

  // If trying to access admin panel but not an admin, redirect appropriately
  if (isAdminRoute && !isAdmin) {
    return <Navigate to={isAgencyTier ? "/team" : "/"} replace />;
  }

  // If agency user tries to access regular app, redirect to team dashboard
  // Exception: Allow admin users to access admin panel
  if (isAgencyTier && !isTeamRoute && !isAdminRoute && !teamOnly) {
    return <Navigate to="/team" replace />;
  }

  // If non-agency user tries to access team dashboard, redirect to app
  if (!isAgencyTier && isTeamRoute) {
    return <Navigate to="/" replace />;
  }

  // Render protected content
  return <>{children}</>;
}
