/**
 * Admin Service
 *
 * Functions for admin user and plan management
 */

import { supabase } from '@/integrations/supabase/client';
import { creditEvents } from '@/hooks/useCredits';

// Cache admin status to avoid excessive checks
let adminStatusCache: { userId: string; isAdmin: boolean; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  subscription_tier: string;
  credits_remaining: number;
  bonus_credits: number;
  batch_credits: number;
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
 * Check if current user is admin (with caching)
 */
export async function isAdmin(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return false;
  }

  // Check cache first
  if (adminStatusCache &&
      adminStatusCache.userId === user.id &&
      Date.now() - adminStatusCache.timestamp < CACHE_DURATION) {
    return adminStatusCache.isAdmin;
  }

  // Use RPC function to bypass RLS and check admin status
  const { data, error } = await supabase
    .rpc('is_user_admin', { user_id: user.id });

  let result = false;

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
      result = false;
    } else {
      result = profile?.is_admin || false;
    }
  } else {
    result = data || false;
  }

  // Cache the result
  adminStatusCache = {
    userId: user.id,
    isAdmin: result,
    timestamp: Date.now()
  };

  return result;
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

  // Get batch credits for all users
  const userIds = profiles.map(p => p.id);
  const batchCreditsMap = new Map<string, number>();

  for (const userId of userIds) {
    const { data: batchCredits, error: batchError } = await supabase
      .rpc('get_user_batch_credits', { p_user_id: userId });

    if (!batchError && batchCredits !== null) {
      batchCreditsMap.set(userId, batchCredits);
    }
  }

  // Merge profile, auth, and batch credits data
  const users: AdminUser[] = profiles.map(profile => {
    const authUser = authUsers?.find(u => u.id === profile.id);
    const batchCredits = batchCreditsMap.get(profile.id) || 0;

    return {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      subscription_tier: profile.subscription_tier || 'free',
      credits_remaining: profile.credits_remaining || 0,
      bonus_credits: profile.bonus_credits || 0,
      batch_credits: batchCredits,
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
  type: 'regular' | 'batch',
  reason: string
): Promise<void> {
  const adminCheck = await isAdmin();
  if (!adminCheck) {
    throw new Error('Unauthorized: Admin access required');
  }

  if (amount <= 0) {
    throw new Error('Credit amount must be positive');
  }

  const { data: { user: adminUser } } = await supabase.auth.getUser();
  if (!adminUser) {
    throw new Error('Admin user not found');
  }

  if (type === 'regular') {
    // Add regular credits using existing credit service
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('credits_remaining')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('Error fetching user profile:', fetchError);
      throw new Error('Failed to fetch user profile');
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        credits_remaining: (profile.credits_remaining || 0) + amount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error adding regular credits:', updateError);
      throw new Error('Failed to add regular credits');
    }

    // Log to credit_transactions
    const { error: logError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        operation_type: 'admin_grant',
        credits_used: -amount, // Negative means credits added
        credit_type: 'regular',
        balance_after: (profile.credits_remaining || 0) + amount,
        metadata: { reason, admin_user_id: adminUser.id },
      });

    if (logError) {
      console.error('Error logging regular credit transaction:', logError);
    }
  } else {
    // Add batch credits using RPC function
    const { error: batchError } = await supabase.rpc('add_batch_credits', {
      p_user_id: userId,
      p_amount: amount,
      p_operation_type: 'admin_adjustment',
      p_metadata: { reason, admin_user_id: adminUser.id },
    });

    if (batchError) {
      console.error('Error adding batch credits:', batchError);
      throw new Error('Failed to add batch credits');
    }
  }

  // Emit credit change event to refresh UI
  creditEvents.emit();

  // Log the admin action to console and audit logs
  console.log(`Admin ${adminUser.email} added ${amount} ${type} credits to user ${userId}: ${reason}`);

  // Log to audit_logs table
  await supabase
    .from('audit_logs')
    .insert({
      user_id: adminUser.id,
      event_type: 'admin_credit_grant',
      severity: 'info',
      metadata: {
        target_user_id: userId,
        amount,
        credit_type: type,
        reason,
      },
    });
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
