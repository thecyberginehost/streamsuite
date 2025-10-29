/**
 * Admin Service
 *
 * Functions for admin user and plan management
 */

import { supabase } from '@/integrations/supabase/client';
import { creditEvents } from '@/hooks/useCredits';

export interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  subscription_tier: string;
  credits_remaining: number;
  bonus_credits: number;
  total_credits: number;
  is_admin: boolean;
  created_at: string;
  last_sign_in_at: string | null;
}

export interface UserActivity {
  total_workflows: number;
  total_credits_used: number;
  last_activity: string | null;
  recent_transactions: Array<{
    id: string;
    operation_type: string;
    credits_used: number;
    credit_type: string;
    created_at: string;
  }>;
}

/**
 * Check if current user is admin
 */
export async function isAdmin(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.log('[isAdmin] No user logged in');
    return false;
  }

  console.log('[isAdmin] Checking admin status for user:', user.id);

  // Use RPC function to bypass RLS and check admin status
  const { data, error } = await supabase
    .rpc('is_user_admin', { user_id: user.id });

  if (error) {
    console.error('[isAdmin] RPC error:', error);
    // Fallback to direct query (works if RLS allows viewing own profile)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('[isAdmin] Profile query error:', profileError);
      return false;
    }

    console.log('[isAdmin] Fallback profile result:', profile);
    return profile?.is_admin || false;
  }

  console.log('[isAdmin] RPC result:', data);
  return data || false;
}

/**
 * Get all users (admin only)
 */
export async function getAllUsers(): Promise<AdminUser[]> {
  const adminCheck = await isAdmin();
  if (!adminCheck) {
    throw new Error('Unauthorized: Admin access required');
  }

  // Get profiles with user auth data
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, email, full_name, subscription_tier, credits_remaining, bonus_credits, is_admin, created_at')
    .order('created_at', { ascending: false });

  if (profilesError) {
    console.error('Error fetching users:', profilesError);
    throw new Error('Failed to fetch users');
  }

  // Get auth data for last sign in times
  const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();

  if (authError) {
    console.error('Error fetching auth users:', authError);
  }

  // Merge profile and auth data
  const users: AdminUser[] = profiles.map(profile => {
    const authUser = authUsers?.find(u => u.id === profile.id);
    return {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      subscription_tier: profile.subscription_tier || 'free',
      credits_remaining: profile.credits_remaining || 0,
      bonus_credits: profile.bonus_credits || 0,
      total_credits: (profile.credits_remaining || 0) + (profile.bonus_credits || 0),
      is_admin: profile.is_admin || false,
      created_at: profile.created_at,
      last_sign_in_at: authUser?.last_sign_in_at || null,
    };
  });

  return users;
}

/**
 * Update user's subscription tier (admin only)
 */
export async function updateUserPlan(
  userId: string,
  newTier: 'free' | 'starter' | 'pro' | 'growth' | 'agency'
): Promise<void> {
  const adminCheck = await isAdmin();
  if (!adminCheck) {
    throw new Error('Unauthorized: Admin access required');
  }

  // Calculate new credit allocation based on tier
  const creditAllocations = {
    free: 5,
    starter: 25,
    pro: 100,
    growth: 250,
    agency: 750,
  };

  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_tier: newTier,
      credits_remaining: creditAllocations[newTier],
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('Error updating user plan:', error);
    throw new Error('Failed to update user plan');
  }

  // Emit credit change event to refresh UI (especially if admin updates their own plan)
  creditEvents.emit();
}

/**
 * Manually add credits to a user (admin only)
 */
export async function addCreditsToUser(
  userId: string,
  amount: number,
  type: 'regular' | 'bonus',
  reason: string
): Promise<void> {
  const adminCheck = await isAdmin();
  if (!adminCheck) {
    throw new Error('Unauthorized: Admin access required');
  }

  if (amount <= 0) {
    throw new Error('Credit amount must be positive');
  }

  // Get current balance
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('credits_remaining, bonus_credits')
    .eq('id', userId)
    .single();

  if (fetchError) {
    console.error('Error fetching user profile:', fetchError);
    throw new Error('Failed to fetch user profile');
  }

  // Update appropriate credit type
  const updates: any = {
    updated_at: new Date().toISOString(),
  };

  if (type === 'regular') {
    updates.credits_remaining = (profile.credits_remaining || 0) + amount;
  } else {
    updates.bonus_credits = (profile.bonus_credits || 0) + amount;
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);

  if (updateError) {
    console.error('Error adding credits:', updateError);
    throw new Error('Failed to add credits');
  }

  // Emit credit change event to refresh UI
  creditEvents.emit();

  // Log the admin action
  console.log(`Admin added ${amount} ${type} credits to user ${userId}: ${reason}`);
}

/**
 * Get user activity and stats (admin only)
 */
export async function getUserActivity(userId: string): Promise<UserActivity> {
  const adminCheck = await isAdmin();
  if (!adminCheck) {
    throw new Error('Unauthorized: Admin access required');
  }

  // Get workflow count
  const { data: workflows, error: workflowError } = await supabase
    .from('workflows')
    .select('id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (workflowError) {
    console.error('Error fetching workflows:', workflowError);
  }

  // Get credit transactions
  const { data: transactions, error: transError } = await supabase
    .from('credit_transactions')
    .select('id, operation_type, credits_used, credit_type, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (transError) {
    console.error('Error fetching transactions:', transError);
  }

  const totalCreditsUsed = transactions?.reduce((sum, t) => sum + (t.credits_used || 0), 0) || 0;

  return {
    total_workflows: workflows?.length || 0,
    total_credits_used: totalCreditsUsed,
    last_activity: workflows?.[0]?.created_at || null,
    recent_transactions: transactions || [],
  };
}

/**
 * Toggle admin status for a user (super admin only)
 */
export async function toggleAdminStatus(userId: string, makeAdmin: boolean): Promise<void> {
  const adminCheck = await isAdmin();
  if (!adminCheck) {
    throw new Error('Unauthorized: Admin access required');
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      is_admin: makeAdmin,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('Error toggling admin status:', error);
    throw new Error('Failed to toggle admin status');
  }
}
