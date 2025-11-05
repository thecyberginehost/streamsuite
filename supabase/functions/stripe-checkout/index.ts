// Supabase Edge Function: stripe-checkout
// Creates Stripe Checkout sessions for subscription purchases

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CheckoutRequest {
  planId: string
  billingInterval: 'monthly' | 'yearly'
  successUrl?: string
  cancelUrl?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify authentication
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      )
    }

    // Parse request body
    const { planId, billingInterval, successUrl, cancelUrl }: CheckoutRequest = await req.json()

    if (!planId || !billingInterval) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: planId, billingInterval' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Validate plan
    const validPlans = ['starter', 'pro', 'growth', 'agency']
    if (!validPlans.includes(planId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid plan ID' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Get Stripe secret key
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeSecretKey) {
      throw new Error('Stripe secret key not configured')
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    })

    // Get or create Stripe customer
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('stripe_customer_id, email, full_name')
      .eq('id', user.id)
      .single()

    let customerId = profile?.stripe_customer_id

    // Create customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || profile?.email,
        name: profile?.full_name,
        metadata: {
          supabase_user_id: user.id,
        },
      })

      customerId = customer.id

      // Save customer ID to profile
      await supabaseClient
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    // Map plan IDs to Stripe Price IDs
    const stripePriceIds: Record<string, { monthly: string; yearly: string }> = {
      starter: {
        monthly: Deno.env.get('STRIPE_PRICE_STARTER_MONTHLY') || '',
        yearly: Deno.env.get('STRIPE_PRICE_STARTER_YEARLY') || '',
      },
      pro: {
        monthly: Deno.env.get('STRIPE_PRICE_PRO_MONTHLY') || '',
        yearly: Deno.env.get('STRIPE_PRICE_PRO_YEARLY') || '',
      },
      growth: {
        monthly: Deno.env.get('STRIPE_PRICE_GROWTH_MONTHLY') || '',
        yearly: Deno.env.get('STRIPE_PRICE_GROWTH_YEARLY') || '',
      },
      agency: {
        monthly: Deno.env.get('STRIPE_PRICE_AGENCY_MONTHLY') || '',
        yearly: Deno.env.get('STRIPE_PRICE_AGENCY_YEARLY') || '',
      },
    }

    const priceId = stripePriceIds[planId][billingInterval]

    if (!priceId) {
      throw new Error(`Price ID not configured for ${planId} ${billingInterval}`)
    }

    // Create checkout session
    const appUrl = Deno.env.get('VITE_APP_URL') || 'http://localhost:5173'

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl || `${appUrl}/settings?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${appUrl}/settings?canceled=true`,
      metadata: {
        user_id: user.id,
        plan_id: planId,
        billing_interval: billingInterval,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan_id: planId,
        },
      },
      allow_promotion_codes: true, // Allow promo codes like HUNT50
    })

    // Log checkout attempt
    await supabaseClient.from('audit_logs').insert({
      user_id: user.id,
      event_id: crypto.randomUUID(),
      action_type: 'checkout_initiated',
      action_status: 'success',
      action_details: {
        plan_id: planId,
        billing_interval: billingInterval,
        session_id: session.id,
      },
      credits_used: 0,
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      user_agent: req.headers.get('user-agent') || 'unknown',
    })

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        url: session.url,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in stripe-checkout function:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        details: error.toString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
