# Stripe Integration Setup Guide

This guide will walk you through setting up Stripe payments for StreamSuite.

## Prerequisites

1. Stripe account (sign up at stripe.com if you don't have one)
2. Supabase project with edge functions enabled
3. StreamSuite codebase deployed

---

## Step 1: Create Stripe Products & Prices

### 1.1 Go to Stripe Dashboard
- Navigate to https://dashboard.stripe.com/products
- Click "Add product"

### 1.2 Create Products

Create 4 products with these exact configurations:

#### Product 1: Starter
- **Name**: StreamSuite Starter
- **Description**: 25 credits per month, code generation, templates
- **Pricing**:
  - Monthly: $19/month (recurring)
  - Yearly: $180/year (recurring)
- **Save the Price IDs** (you'll need these later)

#### Product 2: Pro
- **Name**: StreamSuite Pro
- **Description**: 100 credits per month, debugging, API access, full templates
- **Pricing**:
  - Monthly: $49/month (recurring)
  - Yearly: $470/year (recurring)
- **Save the Price IDs**

#### Product 3: Growth
- **Name**: StreamSuite Growth
- **Description**: 250 credits + 10 batch credits, monitoring, workflow sets
- **Pricing**:
  - Monthly: $99/month (recurring)
  - Yearly: $950/year (recurring)
- **Save the Price IDs**

#### Product 4: Agency
- **Name**: StreamSuite Agency
- **Description**: 750 credits + 50 batch credits, 2 team seats, client management
- **Pricing**:
  - Monthly: $499/month (recurring)
  - Yearly: $4790/year (recurring)
- **Save the Price IDs**

---

## Step 2: Configure Environment Variables

### 2.1 Update `.env` file

Add these variables to your `.env` file:

```bash
# Stripe Configuration
VITE_STRIPE_PUBLIC_KEY=pk_test_xxxxx  # Your Stripe publishable key
STRIPE_SECRET_KEY=sk_test_xxxxx       # Your Stripe secret key (NEVER commit this!)
STRIPE_WEBHOOK_SECRET=whsec_xxxxx     # Will get this in Step 3

# Stripe Price IDs (from Step 1.2)
STRIPE_PRICE_STARTER_MONTHLY=price_xxxxx
STRIPE_PRICE_STARTER_YEARLY=price_xxxxx
STRIPE_PRICE_PRO_MONTHLY=price_xxxxx
STRIPE_PRICE_PRO_YEARLY=price_xxxxx
STRIPE_PRICE_GROWTH_MONTHLY=price_xxxxx
STRIPE_PRICE_GROWTH_YEARLY=price_xxxxx
STRIPE_PRICE_AGENCY_MONTHLY=price_xxxxx
STRIPE_PRICE_AGENCY_YEARLY=price_xxxxx

# Application URL (for redirects)
VITE_APP_URL=http://localhost:5173  # Change to production URL when deploying
```

### 2.2 Update Supabase Edge Function Secrets

Run these commands to set secrets for your Supabase edge functions:

```bash
# Set Stripe secret key
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxxxx

# Set all price IDs
supabase secrets set STRIPE_PRICE_STARTER_MONTHLY=price_xxxxx
supabase secrets set STRIPE_PRICE_STARTER_YEARLY=price_xxxxx
supabase secrets set STRIPE_PRICE_PRO_MONTHLY=price_xxxxx
supabase secrets set STRIPE_PRICE_PRO_YEARLY=price_xxxxx
supabase secrets set STRIPE_PRICE_GROWTH_MONTHLY=price_xxxxx
supabase secrets set STRIPE_PRICE_GROWTH_YEARLY=price_xxxxx
supabase secrets set STRIPE_PRICE_AGENCY_MONTHLY=price_xxxxx
supabase secrets set STRIPE_PRICE_AGENCY_YEARLY=price_xxxxx

# Set app URL
supabase secrets set VITE_APP_URL=https://yourdomain.com
```

---

## Step 3: Configure Stripe Webhooks

### 3.1 Deploy Edge Functions

First, deploy your Supabase edge functions:

```bash
supabase functions deploy stripe-checkout
supabase functions deploy stripe-webhook
supabase functions deploy stripe-portal
```

### 3.2 Get Webhook URL

After deployment, your webhook URL will be:
```
https://<your-project-ref>.supabase.co/functions/v1/stripe-webhook
```

### 3.3 Create Webhook in Stripe

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter your webhook URL (from 3.2)
4. Select these events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click "Add endpoint"
6. **Copy the Signing Secret** (starts with `whsec_`)

### 3.4 Update Webhook Secret

```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

Also update your `.env` file:
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

---

## Step 4: Update Database Schema

Add Stripe-related fields to the `profiles` table:

```sql
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer
ON profiles(stripe_customer_id);
```

---

## Step 5: Create Promotion Codes (Optional)

For your Product Hunt launch, create a promotion code:

1. Go to https://dashboard.stripe.com/coupons
2. Click "Create coupon"
3. Configure:
   - **Name**: Product Hunt Launch
   - **ID**: `HUNT50`
   - **Discount**: 50% off
   - **Duration**: Repeating (3 months)
   - **Applies to**: All products
4. Click "Create promotion code"
5. Use code `HUNT50` in your marketing

---

## Step 6: Test the Integration

### 6.1 Use Stripe Test Mode

Make sure you're using test keys (starting with `pk_test_` and `sk_test_`).

### 6.2 Test Card Numbers

Use these test cards:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

Expiry: Any future date (e.g., 12/34)
CVC: Any 3 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 12345)

### 6.3 Test Flow

1. Start your dev server: `npm run dev`
2. Log in to StreamSuite
3. Go to Settings page
4. Click "Upgrade to Pro" (or any paid plan)
5. Choose "Monthly" or "Yearly"
6. Click "Subscribe"
7. Should redirect to Stripe Checkout
8. Use test card `4242 4242 4242 4242`
9. Complete checkout
10. Should redirect back to Settings with success message
11. Verify your credits were allocated
12. Check Supabase `profiles` table to confirm:
    - `subscription_tier` = "pro" (or whatever you chose)
    - `subscription_status` = "active"
    - `stripe_customer_id` is populated
    - `stripe_subscription_id` is populated

---

## Step 7: Go Live

### 7.1 Switch to Live Mode

1. In Stripe Dashboard, toggle from "Test mode" to "Live mode"
2. Get your **live** API keys
3. Create **live** products and prices (same config as test)
4. Create **live** webhook endpoint

### 7.2 Update Production Environment Variables

```bash
# Production Stripe keys
VITE_STRIPE_PUBLIC_KEY=pk_live_xxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Production price IDs
STRIPE_PRICE_STARTER_MONTHLY=price_xxxxx  # Live price ID
STRIPE_PRICE_STARTER_YEARLY=price_xxxxx
# ... (all other live price IDs)

# Production URL
VITE_APP_URL=https://streamsuite.io
```

### 7.3 Update Supabase Production Secrets

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_live_xxxxx --project-ref <prod-ref>
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxx --project-ref <prod-ref>
# ... (all other secrets with --project-ref)
```

---

## Troubleshooting

### Webhook Not Receiving Events
- Check webhook URL is correct and accessible
- Verify signing secret matches
- Check Supabase logs: `supabase functions logs stripe-webhook`
- Test webhook in Stripe Dashboard (Send test webhook)

### Checkout Failing
- Verify price IDs are correct
- Check Supabase function logs: `supabase functions logs stripe-checkout`
- Ensure STRIPE_SECRET_KEY is set correctly
- Verify user is authenticated

### Credits Not Allocated
- Check webhook received `checkout.session.completed` event
- Verify user_id is in session metadata
- Check Supabase `audit_logs` for subscription_activated event
- Manually check `credits` table

### Customer Portal Not Working
- Verify stripe_customer_id exists in profile
- Check Supabase function logs: `supabase functions logs stripe-portal`
- Ensure user has an active subscription

---

## Next Steps

Once Stripe is fully integrated and tested:

1. ✅ Add subscription management UI to Settings page
2. ✅ Implement tier-based feature gates
3. ✅ Add upgrade CTAs throughout the app
4. ✅ Test refund flow (7-day policy)
5. ✅ Set up monitoring/alerts for failed payments
6. ✅ Create customer success emails (welcome, renewal, etc.)

---

## Support

If you encounter issues:
1. Check Supabase function logs
2. Check Stripe Dashboard > Developers > Events
3. Review this guide again
4. Contact Stripe support or Supabase support

---

**You're ready to accept payments! 🎉**
