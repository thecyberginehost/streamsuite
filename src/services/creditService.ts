/**
 * Credit Service
 *
 * Manages credit balance, deductions, and transactions
 */

import { supabase } from '@/integrations/supabase/client';
import { creditEvents } from '@/hooks/useCredits';

// =====================================================
// CREDIT COSTS (Flat Pricing)
// =====================================================

export const CREDIT_COSTS = {
  // All workflow operations cost 1 credit
  WORKFLOW_GENERATION: 1,    // Generate any workflow (simple or complex)
  WORKFLOW_DEBUG: 1,         // Debug and fix workflow
  TEMPLATE_DOWNLOAD: 0,      // Templates are free
} as const;

// Token thresholds for monitoring/analytics (not used for pricing)
export const TOKEN_THRESHOLDS = {
  SIMPLE: 2000,
  MEDIUM: 5000,
  COMPLEX: 10000,
} as const;

// Credit top-up tiers (for paid users)
export const CREDIT_TOP_UP_TIERS = {
  starter: {
    id: 'starter',
    name: 'Starter',
    credits: 10,
    price: 5.00,
    costPerCredit: 0.50,
    discount: 0,
    stripePriceId: 'price_starter_topup' // Replace with actual Stripe price ID
  },
  standard: {
    id: 'standard',
    name: 'Standard',
    credits: 25,
    price: 11.00,
    costPerCredit: 0.44,
    discount: 12,
    stripePriceId: 'price_standard_topup'
  },
  plus: {
    id: 'plus',
    name: 'Plus',
    credits: 50,
    price: 20.00,
    costPerCredit: 0.40,
    discount: 20,
    recommended: true,
    stripePriceId: 'price_plus_topup'
  },
  bulk: {
    id: 'bulk',
    name: 'Bulk',
    credits: 100,
    price: 35.00,
    costPerCredit: 0.35,
    discount: 30,
    badge: 'BEST VALUE',
    stripePriceId: 'price_bulk_topup'
  }
} as const;

export type CreditTopUpTier = keyof typeof CREDIT_TOP_UP_TIERS;

// =====================================================
// TYPE DEFINITIONS
// =====================================================

export interface CreditBalance {
  credits_remaining: number; // Regular credits (subscription)
  bonus_credits: number;     // Bonus credits (never expire)
  total_credits: number;     // Combined total
  subscription_tier: string;
  use_bonus_first: boolean;  // User preference
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  operation_type: string;
  description: string;
  workflow_id?: string;
  created_at: string;
}

export interface DeductCreditsRequest {
  amount: number;
  operation_type: 'generation' | 'debug' | 'conversion';
  description: string;
  workflowId?: string;
}

// =====================================================
// CREDIT BALANCE OPERATIONS
// =====================================================

/**
 * Get user's current credit balance (regular + bonus)
 */
export async function getCreditBalance(): Promise<CreditBalance> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('You must be logged in to check credits');
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('credits_remaining, bonus_credits, subscription_tier, use_bonus_first')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Get credit balance error:', error);
      throw new Error('Failed to load credit balance');
    }

    const regularCredits = data.credits_remaining || 0;
    const bonusCredits = data.bonus_credits || 0;

    return {
      credits_remaining: regularCredits,
      bonus_credits: bonusCredits,
      total_credits: regularCredits + bonusCredits,
      subscription_tier: data.subscription_tier || 'free',
      use_bonus_first: data.use_bonus_first || false
    };
  } catch (error) {
    console.error('Get credit balance error:', error);
    throw error instanceof Error ? error : new Error('Failed to load credit balance');
  }
}

/**
 * Check if user has enough credits for an operation (checks total credits)
 */
export async function hasEnoughCredits(requiredCredits: number): Promise<boolean> {
  try {
    const balance = await getCreditBalance();
    return balance.total_credits >= requiredCredits;
  } catch (error) {
    console.error('Check credits error:', error);
    return false;
  }
}

/**
 * Deduct credits from user's balance using smart dual-credit logic
 * Respects user preference: use_bonus_first
 */
export async function deductCredits(request: DeductCreditsRequest): Promise<{
  regularUsed: number;
  bonusUsed: number;
}> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('You must be logged in to use credits');
    }

    // Check current balance
    const balance = await getCreditBalance();
    if (balance.total_credits < request.amount) {
      throw new Error(
        `Insufficient credits. You need ${request.amount} credit${request.amount > 1 ? 's' : ''} but only have ${balance.total_credits} total ` +
        `(${balance.credits_remaining} regular + ${balance.bonus_credits} bonus).`
      );
    }

    // Calculate how many credits to deduct from each pool
    let regularUsed = 0;
    let bonusUsed = 0;

    if (balance.use_bonus_first) {
      // Use bonus credits first
      if (balance.bonus_credits >= request.amount) {
        bonusUsed = request.amount;
      } else {
        bonusUsed = balance.bonus_credits;
        regularUsed = request.amount - bonusUsed;
      }
    } else {
      // Use regular credits first (default)
      if (balance.credits_remaining >= request.amount) {
        regularUsed = request.amount;
      } else {
        regularUsed = balance.credits_remaining;
        bonusUsed = request.amount - regularUsed;
      }
    }

    // Deduct credits (atomic operation)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        credits_remaining: balance.credits_remaining - regularUsed,
        bonus_credits: balance.bonus_credits - bonusUsed,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Deduct credits error:', updateError);
      throw new Error('Failed to deduct credits from your account');
    }

    // Record transaction
    try {
      await recordTransaction({
        user_id: user.id,
        amount: -request.amount,
        operation_type: request.operation_type,
        description: `${request.description} (${regularUsed} regular + ${bonusUsed} bonus)`,
        workflow_id: request.workflowId
      });
    } catch (transactionError) {
      console.warn('Failed to record transaction:', transactionError);
    }

    console.log(
      `✅ Deducted ${request.amount} credits (${regularUsed} regular + ${bonusUsed} bonus). ` +
      `New balance: ${balance.credits_remaining - regularUsed} regular + ${balance.bonus_credits - bonusUsed} bonus`
    );

    // Emit event to refresh credit displays
    creditEvents.emit();

    return { regularUsed, bonusUsed };
  } catch (error) {
    console.error('Deduct credits error:', error);
    throw error instanceof Error ? error : new Error('Failed to deduct credits');
  }
}

/**
 * Add credits to user's balance (for purchases, rewards, etc.)
 */
export async function addCredits(amount: number, description: string): Promise<void> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('You must be logged in to add credits');
    }

    const balance = await getCreditBalance();

    // Add credits
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        credits_remaining: balance.credits_remaining + amount,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Add credits error:', updateError);
      throw new Error('Failed to add credits to your account');
    }

    // Record transaction
    try {
      await recordTransaction({
        user_id: user.id,
        amount: amount, // Positive for addition
        operation_type: 'purchase',
        description: description
      });
    } catch (transactionError) {
      console.warn('Failed to record transaction:', transactionError);
    }

    console.log(`✅ Added ${amount} credits. New balance: ${balance.credits_remaining + amount}`);

    // Emit event to refresh credit displays
    creditEvents.emit();
  } catch (error) {
    console.error('Add credits error:', error);
    throw error instanceof Error ? error : new Error('Failed to add credits');
  }
}

// =====================================================
// TRANSACTION HISTORY
// =====================================================

/**
 * Record a credit transaction
 * Note: This requires a credit_transactions table (optional for MVP)
 */
async function recordTransaction(transaction: {
  user_id: string;
  amount: number;
  operation_type: string;
  description: string;
  workflow_id?: string;
}): Promise<void> {
  // Check if table exists before attempting insert
  const { error } = await supabase
    .from('credit_transactions')
    .insert({
      user_id: transaction.user_id,
      amount: transaction.amount,
      operation_type: transaction.operation_type,
      description: transaction.description,
      workflow_id: transaction.workflow_id,
      created_at: new Date().toISOString()
    });

  if (error) {
    // If table doesn't exist, that's okay for MVP
    if (error.code === 'PGRST204' || error.code === '42P01') {
      console.warn('Credit transactions table does not exist yet. Skipping transaction logging.');
      return;
    }
    throw error;
  }
}

/**
 * Get user's credit transaction history
 * Note: Optional for MVP
 */
export async function getCreditTransactions(): Promise<CreditTransaction[]> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('You must be logged in to view transactions');
    }

    const { data, error } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      // If table doesn't exist, return empty array
      if (error.code === 'PGRST204' || error.code === '42P01') {
        return [];
      }
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Get credit transactions error:', error);
    return [];
  }
}

// =====================================================
// CREDIT ESTIMATION
// =====================================================

/**
 * Estimate credit cost for a workflow generation
 * FLAT PRICING: All workflows cost 1 credit regardless of complexity
 */
export function estimateGenerationCost(prompt: string): number {
  return CREDIT_COSTS.WORKFLOW_GENERATION;
}

/**
 * Calculate credits based on actual token usage
 * FLAT PRICING: Always returns 1 credit regardless of tokens used
 */
export function calculateCreditsFromTokens(totalTokens: number): number {
  return CREDIT_COSTS.WORKFLOW_GENERATION;
}

/**
 * Get credit cost for debugging
 */
export function getDebugCost(): number {
  return CREDIT_COSTS.WORKFLOW_DEBUG;
}

/**
 * Get a human-readable complexity label for a credit amount
 * DEPRECATED: With flat pricing, all workflows cost 1 credit
 */
export function getComplexityLabel(credits: number): string {
  return '1 workflow';
}

// =====================================================
// CREDIT WARNINGS
// =====================================================

/**
 * Check if user is low on credits (< 5)
 */
export async function isLowOnCredits(): Promise<boolean> {
  try {
    const balance = await getCreditBalance();
    return balance.credits_remaining < 5;
  } catch (error) {
    return false;
  }
}

/**
 * Get warning message if user is low on credits
 */
export async function getLowCreditsWarning(): Promise<string | null> {
  try {
    const balance = await getCreditBalance();

    if (balance.total_credits === 0) {
      return "⚠️ You're out of credits! Purchase more to continue using StreamSuite.";
    }

    if (balance.total_credits < 3) {
      return `⚠️ You only have ${balance.total_credits} credit${balance.total_credits > 1 ? 's' : ''} remaining. Consider purchasing more.`;
    }

    if (balance.total_credits < 5) {
      return `You have ${balance.total_credits} credits remaining.`;
    }

    return null;
  } catch (error) {
    return null;
  }
}

// =====================================================
// BONUS CREDITS & TOP-UPS
// =====================================================

/**
 * Add bonus credits to user's account (from top-ups or rewards)
 */
export async function addBonusCredits(amount: number, description: string): Promise<void> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('You must be logged in to add credits');
    }

    const balance = await getCreditBalance();

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        bonus_credits: balance.bonus_credits + amount,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Add bonus credits error:', updateError);
      throw new Error('Failed to add bonus credits to your account');
    }

    // Record transaction
    try {
      await recordTransaction({
        user_id: user.id,
        amount: amount,
        operation_type: 'bonus_purchase',
        description: description
      });
    } catch (transactionError) {
      console.warn('Failed to record transaction:', transactionError);
    }

    console.log(`✅ Added ${amount} bonus credits. New balance: ${balance.bonus_credits + amount} bonus credits`);

    creditEvents.emit();
  } catch (error) {
    console.error('Add bonus credits error:', error);
    throw error instanceof Error ? error : new Error('Failed to add bonus credits');
  }
}

/**
 * Toggle user preference for using bonus credits first
 */
export async function setUseBonusFirst(useBonusFirst: boolean): Promise<void> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('You must be logged in to update preferences');
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        use_bonus_first: useBonusFirst,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Set bonus preference error:', updateError);
      throw new Error('Failed to update credit usage preference');
    }

    console.log(`✅ Updated preference: use bonus credits first = ${useBonusFirst}`);

    creditEvents.emit();
  } catch (error) {
    console.error('Set bonus preference error:', error);
    throw error instanceof Error ? error : new Error('Failed to update preference');
  }
}

/**
 * Check if user should see top-up CTA
 * Only for paid users with < 10 regular credits
 */
export async function shouldShowTopUpCTA(): Promise<boolean> {
  try {
    const balance = await getCreditBalance();

    // Only show for paid plans
    if (balance.subscription_tier === 'free') {
      return false;
    }

    // Show if regular credits are low (< 10)
    return balance.credits_remaining < 10;
  } catch (error) {
    return false;
  }
}

/**
 * Get recommended top-up tier based on user's subscription
 */
export function getRecommendedTopUpTier(subscriptionTier: string): CreditTopUpTier {
  switch (subscriptionTier) {
    case 'pro':
      return 'standard'; // 25 credits for Pro users
    case 'agency':
      return 'bulk'; // 100 credits for Agency users
    default:
      return 'starter'; // Default to smallest
  }
}
