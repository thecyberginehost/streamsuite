// Supabase Edge Function: stripe-webhook
// Handles Stripe webhook events for subscription management

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

// Credit allocation by plan
const PLAN_CREDITS: Record<string, number> = {
  free: 5,
  starter: 25,
  pro: 100,
  growth: 250,
  agency: 750,
}

const PLAN_BATCH_CREDITS: Record<string, number> = {
  free: 0,
  starter: 0,
  pro: 0,
  growth: 10,
  agency: 50,
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const signature = req.headers.get('stripe-signature')
    if (!signature) {
      return new Response('Missing stripe-signature header', { status: 400 })
    }

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

    if (!stripeSecretKey || !webhookSecret) {
      throw new Error('Stripe configuration missing')
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    })

    // Verify webhook signature
    const body = await req.text()
    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message)
      return new Response(`Webhook Error: ${err.message}`, { status: 400 })
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Processing webhook event:', event.type)

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.user_id
        const planId = session.metadata?.plan_id

        if (!userId || !planId) {
          console.error('Missing metadata in checkout session')
          break
        }

        // Update user's subscription tier
        await supabaseAdmin
          .from('profiles')
          .update({
            subscription_tier: planId,
            subscription_status: 'active',
            stripe_subscription_id: session.subscription as string,
          })
          .eq('id', userId)

        // Allocate credits for the plan
        const monthlyCredits = PLAN_CREDITS[planId] || 0
        const batchCredits = PLAN_BATCH_CREDITS[planId] || 0

        await supabaseAdmin
          .from('credits')
          .upsert({
            user_id: userId,
            regular_credits: monthlyCredits,
            batch_credits: batchCredits,
            last_reset_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id'
          })

        // Log subscription activation
        await supabaseAdmin.from('audit_logs').insert({
          user_id: userId,
          event_id: crypto.randomUUID(),
          action_type: 'subscription_activated',
          action_status: 'success',
          action_details: {
            plan_id: planId,
            subscription_id: session.subscription,
            credits_allocated: monthlyCredits,
            batch_credits_allocated: batchCredits,
          },
          credits_used: 0,
        })

        console.log(`Subscription activated for user ${userId}: ${planId}`)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.user_id

        if (!userId) {
          console.error('Missing user_id in subscription metadata')
          break
        }

        const status = subscription.status
        const planId = subscription.metadata?.plan_id

        // Update subscription status
        await supabaseAdmin
          .from('profiles')
          .update({
            subscription_status: status,
            ...(planId && { subscription_tier: planId }),
          })
          .eq('id', userId)

        console.log(`Subscription updated for user ${userId}: ${status}`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.user_id

        if (!userId) {
          console.error('Missing user_id in subscription metadata')
          break
        }

        // Downgrade to free tier
        await supabaseAdmin
          .from('profiles')
          .update({
            subscription_tier: 'free',
            subscription_status: 'canceled',
            stripe_subscription_id: null,
          })
          .eq('id', userId)

        // Reset to free credits
        await supabaseAdmin
          .from('credits')
          .update({
            regular_credits: PLAN_CREDITS.free,
            batch_credits: 0,
          })
          .eq('user_id', userId)

        // Log cancellation
        await supabaseAdmin.from('audit_logs').insert({
          user_id: userId,
          event_id: crypto.randomUUID(),
          action_type: 'subscription_canceled',
          action_status: 'success',
          action_details: {
            subscription_id: subscription.id,
            downgraded_to: 'free',
          },
          credits_used: 0,
        })

        console.log(`Subscription canceled for user ${userId}`)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const subscription = invoice.subscription

        if (!subscription || typeof subscription !== 'string') break

        // Get subscription details
        const sub = await stripe.subscriptions.retrieve(subscription)
        const userId = sub.metadata?.user_id
        const planId = sub.metadata?.plan_id

        if (!userId || !planId) break

        // This is a renewal - reset monthly credits
        const monthlyCredits = PLAN_CREDITS[planId] || 0
        const batchCredits = PLAN_BATCH_CREDITS[planId] || 0

        // Get current credits to check for rollover
        const { data: currentCredits } = await supabaseAdmin
          .from('credits')
          .select('regular_credits, batch_credits')
          .eq('user_id', userId)
          .single()

        // Calculate rollover (max 50% of plan credits)
        const maxRollover = Math.floor(monthlyCredits * 0.5)
        const regularRollover = currentCredits ? Math.min(currentCredits.regular_credits, maxRollover) : 0
        const newRegularCredits = monthlyCredits + regularRollover

        // Batch credits don't roll over
        await supabaseAdmin
          .from('credits')
          .update({
            regular_credits: newRegularCredits,
            batch_credits: batchCredits,
            last_reset_at: new Date().toISOString(),
          })
          .eq('user_id', userId)

        // Log credit renewal
        await supabaseAdmin.from('audit_logs').insert({
          user_id: userId,
          event_id: crypto.randomUUID(),
          action_type: 'credits_renewed',
          action_status: 'success',
          action_details: {
            plan_id: planId,
            base_credits: monthlyCredits,
            rollover_credits: regularRollover,
            total_credits: newRegularCredits,
            batch_credits: batchCredits,
          },
          credits_used: 0,
        })

        console.log(`Credits renewed for user ${userId}: ${newRegularCredits} regular, ${batchCredits} batch`)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subscription = invoice.subscription

        if (!subscription || typeof subscription !== 'string') break

        const sub = await stripe.subscriptions.retrieve(subscription)
        const userId = sub.metadata?.user_id

        if (!userId) break

        // Update subscription status
        await supabaseAdmin
          .from('profiles')
          .update({
            subscription_status: 'past_due',
          })
          .eq('id', userId)

        // Log payment failure
        await supabaseAdmin.from('audit_logs').insert({
          user_id: userId,
          event_id: crypto.randomUUID(),
          action_type: 'payment_failed',
          action_status: 'failed',
          action_details: {
            invoice_id: invoice.id,
            amount_due: invoice.amount_due,
          },
          credits_used: 0,
        })

        console.log(`Payment failed for user ${userId}`)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error in stripe-webhook function:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
