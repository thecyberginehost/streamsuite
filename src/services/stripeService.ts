/**
 * Stripe Service
 *
 * Handles Stripe payment integration for subscriptions
 */

import { SUBSCRIPTION_PLANS } from '@/config/subscriptionPlans';
import { supabase } from '@/integrations/supabase/client';

// Stripe publishable key from environment
const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

export interface StripeCheckoutSession {
  sessionId: string;
  url: string;
}

/**
 * Create a Stripe Checkout session for subscription
 */
export async function createCheckoutSession(
  planId: string,
  billingInterval: 'monthly' | 'yearly' = 'monthly'
): Promise<StripeCheckoutSession> {
  const plan = SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS];

  if (!plan) {
    throw new Error('Invalid plan selected');
  }

  if (plan.price.monthly === 0) {
    throw new Error('Free plan does not require payment');
  }

  // Get current session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('You must be logged in to subscribe');
  }

  // Call Supabase Edge Function to create Stripe checkout session
  const { data, error } = await supabase.functions.invoke('stripe-checkout', {
    body: {
      planId,
      billingInterval,
      successUrl: `${window.location.origin}/settings?success=true`,
      cancelUrl: `${window.location.origin}/settings?canceled=true`,
    },
  });

  if (error) {
    console.error('Stripe checkout error:', error);
    throw new Error(error.message || 'Failed to create checkout session');
  }

  return {
    sessionId: data.sessionId,
    url: data.url,
  };
}

/**
 * Redirect to Stripe Checkout (direct URL redirect)
 */
export async function redirectToCheckout(url: string): Promise<void> {
  window.location.href = url;
}

/**
 * Create a Stripe Customer Portal session (for managing subscriptions)
 */
export async function createPortalSession(): Promise<string> {
  // Get current session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('You must be logged in to manage your subscription');
  }

  // Call Supabase Edge Function to create portal session
  const { data, error } = await supabase.functions.invoke('stripe-portal', {
    body: {
      returnUrl: `${window.location.origin}/settings`,
    },
  });

  if (error) {
    console.error('Stripe portal error:', error);
    throw new Error(error.message || 'Failed to create portal session');
  }

  return data.url;
}

/**
 * Open Stripe Customer Portal
 */
export async function openCustomerPortal(): Promise<void> {
  const url = await createPortalSession();
  window.location.href = url;
}
