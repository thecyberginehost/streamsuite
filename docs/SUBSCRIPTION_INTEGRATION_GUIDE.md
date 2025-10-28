# 🎯 Subscription Plans Integration Guide

**Status:** Credit system is ready. This guide shows how to add Stripe subscriptions.

---

## ✅ What's Already Done

The credit system is **fully built** and works with your existing database:

```sql
-- Your profiles table already has everything needed:
profiles (
  credits_remaining INTEGER,     -- ✅ Tracks current balance
  subscription_tier TEXT,        -- ✅ Tracks plan (free/pro/agency)
  ...
)
```

**No SQL changes required!** Everything is ready for subscriptions.

---

## 📋 Current State

### Free Tier (Default)
- ✅ Users start with **5 credits**
- ✅ Credit deduction works
- ✅ Out of credits blocking works
- ✅ Real-time balance updates work

### What Happens When You Add Stripe:
Nothing breaks! The credit system will seamlessly integrate with:
- Monthly credit allocations
- Credit purchases
- Plan upgrades/downgrades
- Credit rollover

---

## 🔄 How Subscriptions Will Work

### Step 1: User Signs Up (FREE tier)
```typescript
// Automatically created by your existing trigger
profiles: {
  credits_remaining: 5,
  subscription_tier: 'free'
}
```

### Step 2: User Upgrades to Pro ($49/month)
```typescript
// After Stripe checkout succeeds:
await supabase
  .from('profiles')
  .update({
    subscription_tier: 'pro',
    credits_remaining: 200  // Pro plan allocation
  })
  .eq('id', userId);

// User now has 200 credits + Pro features unlocked
```

### Step 3: Monthly Refresh (1st of each month)
```typescript
// Stripe webhook fires: subscription.renewed
// Your backend handler:

const plan = getPlanByTier('pro');
await supabase
  .from('profiles')
  .update({
    credits_remaining: plan.credits.monthly  // 200
  })
  .eq('subscription_tier', 'pro');
```

### Step 4: Credit Rollover (if user has unused credits)
```typescript
// Before refreshing, check current balance:
const current = 50; // User has 50 credits left
const monthly = 200; // Pro plan gives 200/month
const maxRollover = 100; // Pro allows 50% rollover

if (current <= maxRollover) {
  // Add new credits on top
  newBalance = current + monthly; // 50 + 200 = 250
} else {
  // Cap at monthly + max rollover
  newBalance = monthly + maxRollover; // 200 + 100 = 300
}
```

---

## 🛠️ Implementation Steps

### Phase 1: Setup (1 hour)

1. **Create Stripe account** at https://stripe.com
2. **Get API keys** (test mode first)
3. **Add to .env:**
   ```bash
   VITE_STRIPE_PUBLIC_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...  # Backend only
   ```

### Phase 2: Create Products in Stripe (30 mins)

In Stripe Dashboard → Products, create:

1. **Pro Plan - Monthly**
   - Name: "StreamSuite Pro (Monthly)"
   - Price: $49.00 USD / month
   - Copy Price ID: `price_xxxxx`

2. **Pro Plan - Yearly**
   - Name: "StreamSuite Pro (Yearly)"
   - Price: $499.00 USD / year
   - Copy Price ID: `price_yyyyy`

3. **Agency Plan - Monthly**
   - Name: "StreamSuite Agency (Monthly)"
   - Price: $149.00 USD / month
   - Copy Price ID: `price_zzzzz`

4. **Agency Plan - Yearly**
   - Name: "StreamSuite Agency (Yearly)"
   - Price: $1,499.00 USD / year
   - Copy Price ID: `price_aaaaa`

### Phase 3: Update Config (15 mins)

Edit [src/config/subscriptionPlans.ts](../src/config/subscriptionPlans.ts):

```typescript
stripePriceId: {
  monthly: 'price_xxxxx',  // Your actual Stripe price ID
  yearly: 'price_yyyyy'
}
```

### Phase 4: Add Checkout Flow (2-3 hours)

Create a Stripe checkout session:

```typescript
// src/services/stripeService.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function createCheckoutSession(
  userId: string,
  planId: string,
  billing: 'monthly' | 'yearly'
) {
  const plan = SUBSCRIPTION_PLANS[planId];
  const priceId = plan.stripePriceId?.[billing];

  const session = await stripe.checkout.sessions.create({
    customer_email: user.email,
    line_items: [{
      price: priceId,
      quantity: 1
    }],
    mode: 'subscription',
    success_url: `${process.env.VITE_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.VITE_APP_URL}/pricing`,
    metadata: {
      userId: userId,
      planId: planId
    }
  });

  return session.url; // Redirect user to this URL
}
```

### Phase 5: Handle Webhooks (2-3 hours)

Stripe will send events to your backend:

```typescript
// Webhook endpoint: /api/stripe/webhook
export async function handleStripeWebhook(event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed':
      // New subscription created
      await handleNewSubscription(event.data.object);
      break;

    case 'invoice.payment_succeeded':
      // Monthly renewal
      await handleSubscriptionRenewal(event.data.object);
      break;

    case 'customer.subscription.deleted':
      // Subscription cancelled
      await handleSubscriptionCancellation(event.data.object);
      break;
  }
}

async function handleNewSubscription(session: Stripe.Checkout.Session) {
  const userId = session.metadata.userId;
  const planId = session.metadata.planId;
  const plan = SUBSCRIPTION_PLANS[planId];

  // Update user's profile
  await supabase
    .from('profiles')
    .update({
      subscription_tier: planId,
      credits_remaining: plan.credits.monthly
    })
    .eq('id', userId);

  // Record transaction
  await addCredits(
    plan.credits.monthly,
    `${plan.displayName} plan activated`
  );
}
```

---

## 📊 Database Schema (No Changes Needed!)

Your existing schema already supports subscriptions:

```sql
-- ✅ Already exists - no changes needed!
profiles (
  id UUID,
  email TEXT,
  subscription_tier TEXT DEFAULT 'free',  -- Stores plan: free/pro/agency
  credits_remaining INTEGER DEFAULT 5,     -- Current balance
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Optional:** Add subscriptions table for Stripe sync:

```sql
-- OPTIONAL: Track Stripe subscription details
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  plan_id TEXT,
  status TEXT,  -- 'active', 'canceled', 'past_due'
  current_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🎨 User Flow Example

### Current (Free Tier):
1. User signs up → Gets 5 credits
2. Generates 5 workflows → Credits depleted
3. Sees: "💳 Insufficient Credits"

### After Stripe Integration:
1. User clicks "Upgrade to Pro"
2. Redirected to Stripe Checkout
3. Pays $49
4. Redirected back to app
5. Webhook fires → Credits updated to 200
6. User sees: "🎉 Welcome to Pro! You have 200 credits"
7. Can now generate 100-200 workflows/month

---

## 🔄 Monthly Credit Refresh

Set up a cron job (Supabase Edge Function or similar):

```typescript
// Run this on the 1st of each month
export async function refreshMonthlyCredits() {
  // Get all active subscribers
  const { data: users } = await supabase
    .from('profiles')
    .select('id, subscription_tier, credits_remaining')
    .neq('subscription_tier', 'free');

  for (const user of users) {
    const plan = getPlanByTier(user.subscription_tier);
    const currentCredits = user.credits_remaining;
    const monthlyAllocation = plan.credits.monthly;
    const maxRollover = plan.credits.rolloverMax;

    let newBalance;
    if (currentCredits <= maxRollover) {
      // Add new credits to unused balance
      newBalance = currentCredits + monthlyAllocation;
    } else {
      // Cap at monthly + max rollover
      newBalance = monthlyAllocation + maxRollover;
    }

    await supabase
      .from('profiles')
      .update({ credits_remaining: newBalance })
      .eq('id', user.id);

    console.log(`Refreshed ${user.subscription_tier}: ${newBalance} credits`);
  }
}
```

---

## 🧪 Testing the Integration

### Test Mode (Stripe)

Use test card numbers:
- **Success:** 4242 4242 4242 4242
- **Decline:** 4000 0000 0000 0002

### Test Flow:

1. **Start with Free (5 credits)**
   ```bash
   SELECT credits_remaining FROM profiles WHERE id = 'user_id';
   # Returns: 5
   ```

2. **Upgrade to Pro**
   - Click "Upgrade" button
   - Complete Stripe checkout
   - Webhook fires
   - Database updates

3. **Verify Credits Updated**
   ```bash
   SELECT credits_remaining, subscription_tier FROM profiles WHERE id = 'user_id';
   # Returns: 200, 'pro'
   ```

4. **Generate Workflows**
   - Generate 50 workflows
   - Credits drop to 150
   - Still have plenty left!

5. **Next Month Refresh**
   - Run cron job
   - Credits refresh to 200 (or 300 if had unused)

---

## 💰 Pricing Strategy

### Recommended Tiers:

| Plan | Price | Credits/Month | Cost per Credit | Target User |
|------|-------|---------------|----------------|-------------|
| Free | $0 | 5 | N/A | Trial users |
| Pro | $49 | 200 | $0.245 | Solo users, small teams |
| Agency | $149 | 800 | $0.186 | Agencies, large teams |

### Why This Works:

1. **Free tier is generous enough** to test the product (5 workflows)
2. **Pro is affordable** for individuals ($49/mo)
3. **Agency has volume discount** ($0.186 vs $0.245 per credit)
4. **Credit rollover** encourages annual plans
5. **Clear upgrade path** from free → pro → agency

---

## 🚀 Launch Checklist

Before enabling paid plans:

- [ ] Stripe account verified (business info, bank account)
- [ ] Test checkout flow end-to-end
- [ ] Test webhook handling (use Stripe CLI)
- [ ] Set up monthly credit refresh cron job
- [ ] Create pricing page
- [ ] Add "Upgrade" buttons in app
- [ ] Test subscription cancellation
- [ ] Set up email notifications (welcome, receipts)
- [ ] Add invoices/billing history page
- [ ] Legal: Privacy policy mentions Stripe
- [ ] Legal: Terms mention subscription terms

---

## 📞 Support

**Common Questions:**

Q: Do I need a new SQL table?
A: No! Your existing `profiles` table works perfectly.

Q: Will existing credit deductions still work?
A: Yes! Nothing changes. The credit system already works.

Q: What if a user cancels their subscription?
A: They keep remaining credits until they run out, then revert to free tier (5 credits/month).

Q: Can users buy one-time credit packs?
A: Yes! Use Stripe one-time payments instead of subscriptions.

---

## 🎉 Summary

**Your credit system is COMPLETE and READY for subscriptions!**

When you add Stripe:
- ✅ No database changes needed
- ✅ Credit deduction keeps working
- ✅ Just update `subscription_tier` and `credits_remaining`
- ✅ Everything else is already built

**Next Step:** Implement Stripe checkout + webhooks (~4-6 hours)

Then you'll be making money! 💰
