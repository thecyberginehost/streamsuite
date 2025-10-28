# StreamSuite Credit Architecture v2.0

## Overview

StreamSuite uses a dual-credit system with **Regular Credits** (subscription-based, expire monthly) and **Bonus Credits** (purchased/earned, never expire).

## Credit Types

### 1. Regular Credits (Subscription Credits)
- **Source**: Monthly subscription allocation
- **Expiration**: End of billing period (with 50% rollover)
- **Rollover**: Up to 50% of monthly allocation
- **Usage**: Default credit type used first (configurable)

### 2. Bonus Credits
- **Source**:
  - Credit top-ups (one-time purchases)
  - Onboarding rewards (paid plans only)
  - Referral bonuses
  - Promotional campaigns
- **Expiration**: Never expire
- **Rollover**: N/A (permanent)
- **Usage**: Used after regular credits are depleted (or first if user toggles preference)

## Subscription Plans & Credits

### Free Tier
- **Regular Credits**: 5/month
- **Bonus Credits**: 0
- **Rollover**: None
- **Top-ups**: Not available
- **Onboarding**: No onboarding flow

### Pro Tier ($49/month)
- **Regular Credits**: 200/month
- **Max Rollover**: 100 credits (300 total possible)
- **Bonus Credits**: 10 (onboarding reward)
- **Top-ups**: Available
- **Onboarding**: Yes (earn 10 bonus credits)

### Agency Tier ($399/month)
- **Regular Credits**: 800/month
- **Max Rollover**: 400 credits (1,200 total possible)
- **Bonus Credits**: 50 (onboarding reward)
- **Top-ups**: Available
- **Onboarding**: Yes (earn 50 bonus credits)

## Credit Top-Up Tiers

One-time credit purchases available for paid plan users:

| Tier | Credits | Price | Cost/Credit | Discount | Best For |
|------|---------|-------|-------------|----------|----------|
| **Starter** | 10 | $5 | $0.50 | 0% | Quick top-up |
| **Standard** | 25 | $11 | $0.44 | 12% | Moderate usage |
| **Plus** | 50 | $20 | $0.40 | 20% | Heavy users |
| **Bulk** | 100 | $35 | $0.35 | 30% | Agencies/teams |

**Profit Margins:**
- Starter: 83% margin ($0.50 vs $0.03-0.20 cost)
- Standard: 78% margin ($0.44 vs $0.03-0.20 cost)
- Plus: 75% margin ($0.40 vs $0.03-0.20 cost)
- Bulk: 71% margin ($0.35 vs $0.03-0.20 cost)

All maintain >70% margins while incentivizing larger purchases.

## Credit Usage Logic

### Default Behavior: Regular Credits First
```typescript
if (regularCredits >= requiredCredits) {
  deduct from regularCredits;
} else if (regularCredits + bonusCredits >= requiredCredits) {
  deduct from regularCredits (partial);
  deduct from bonusCredits (remaining);
} else {
  insufficient credits error;
}
```

### User Preference: Bonus Credits First (Toggle in Settings)
```typescript
if (bonusCredits >= requiredCredits) {
  deduct from bonusCredits;
} else if (bonusCredits + regularCredits >= requiredCredits) {
  deduct from bonusCredits (partial);
  deduct from regularCredits (remaining);
} else {
  insufficient credits error;
}
```

## Low Credit Warning (Paid Plans Only)

When `regularCredits < 10` on paid plans:

### CTA Display
```
┌────────────────────────────────────────────────────┐
│ 🚨 Running low on credits!                        │
│                                                    │
│ You have 7 regular credits remaining.             │
│ Top up now to keep generating workflows!          │
│                                                    │
│ [10 credits - $5]  [25 credits - $11]             │
│ [50 credits - $20] [100 credits - $35] ← BEST     │
└────────────────────────────────────────────────────┘
```

### Trigger Conditions
- Show when: `regularCredits < 10 && subscriptionTier !== 'free'`
- Placement: Top of Generator page (dismissible)
- Frequency: Once per session until topped up

## Database Schema Updates

### profiles table (existing)
```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bonus_credits INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS use_bonus_first BOOLEAN DEFAULT false;
```

### credit_purchases table (new)
```sql
CREATE TABLE credit_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  tier VARCHAR(50) NOT NULL, -- 'starter', 'standard', 'plus', 'bulk'
  credits_purchased INTEGER NOT NULL,
  amount_paid DECIMAL(10,2) NOT NULL,
  stripe_payment_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_credit_purchases_user_id ON credit_purchases(user_id);
```

### onboarding_progress table (new)
```sql
CREATE TABLE onboarding_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  completed BOOLEAN DEFAULT false,
  steps_completed JSONB DEFAULT '{}',
  bonus_credits_awarded INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Onboarding Flow (Paid Plans Only)

### Steps to Earn Bonus Credits

**Pro Tier (10 bonus credits):**
1. ✅ Connect your first integration (2 credits)
2. ✅ Generate your first workflow (3 credits)
3. ✅ Save a workflow to history (2 credits)
4. ✅ Complete profile setup (3 credits)

**Agency Tier (50 bonus credits):**
1. ✅ Connect 3 integrations (10 credits)
2. ✅ Generate 5 workflows (15 credits)
3. ✅ Export a workflow (10 credits)
4. ✅ Invite team member (15 credits)

### Onboarding UI
- Progress bar at top of dashboard
- "🎉 You're earning bonus credits!" badge
- Real-time credit rewards with confetti animation
- Dismissible after completion

## Credit Display in UI

### Unified Display (TopBar)
```
┌──────────────────────────────┐
│  💰  207 credits             │
│      ├─ 200 regular          │
│      └─ 7 bonus (never expire)│
└──────────────────────────────┘
```

### Generator Page Display
```
┌────────────────────────────────────────────┐
│  Workflow Generator               💰 207   │
│  Generate workflows...            ├─ 200   │
│                                   └─ 7     │
└────────────────────────────────────────────┘
```

### Settings Page
```
Credit Usage Preference
━━━━━━━━━━━━━━━━━━━━━
○ Use regular credits first (recommended)
● Use bonus credits first (preserve monthly credits)

💡 Regular credits expire at the end of your billing period.
   Bonus credits never expire!
```

## Pricing Strategy

### Subscription Value
- **Pro**: $0.245/credit (200 for $49)
- **Agency**: $0.499/credit (800 for $399)

### Top-Up Value
- **Starter**: $0.50/credit (2x Pro rate) - Quick emergency top-up
- **Standard**: $0.44/credit (1.8x Pro rate) - Good value
- **Plus**: $0.40/credit (1.6x Pro rate) - Better value
- **Bulk**: $0.35/credit (1.4x Pro rate) - Best value

**Psychology**: Top-ups are intentionally more expensive than subscription credits to incentivize upgrading to higher plans, but still cheaper than "pay per use" would be.

## API Integration Points

### Credit Service Methods

```typescript
// Get combined balance
getCreditBalance(): Promise<{
  regular: number;
  bonus: number;
  total: number;
  useBonusFirst: boolean;
}>

// Deduct credits (smart logic)
deductCredits(amount: number): Promise<{
  regularUsed: number;
  bonusUsed: number;
  remaining: { regular: number; bonus: number; }
}>

// Top up bonus credits
purchaseCredits(tier: 'starter' | 'standard' | 'plus' | 'bulk'): Promise<void>

// Toggle preference
setUseBonusFirst(enabled: boolean): Promise<void>

// Check if low on credits
shouldShowTopUpCTA(): Promise<boolean>
```

## Analytics & Tracking

### Key Metrics
1. **Top-up conversion rate** - % of users who top up when shown CTA
2. **Average top-up tier** - Which tier is most popular?
3. **Bonus credit usage rate** - Are users preserving or spending?
4. **Onboarding completion rate** - % who complete all steps
5. **Credit utilization** - Average % of monthly credits used
6. **Rollover rate** - % of users hitting rollover cap

### Business Goals
- **Target top-up rate**: 20-30% of paid users per quarter
- **Target onboarding completion**: 70%+ for paid users
- **Target credit utilization**: 60-80% (not too low, not too high)

## Future Enhancements

1. **Team Credit Pools** (Agency tier)
   - Shared credit balance across team
   - Usage tracking per member
   - Admin controls

2. **Referral Program**
   - Give 10 bonus credits per referral
   - Referred user gets 5 bonus credits

3. **Seasonal Promotions**
   - Black Friday: 2x bonus credits on top-ups
   - New Year: 50% off bulk tier

4. **Enterprise Custom Credits**
   - Negotiated credit packages
   - Annual contracts with volume discounts

5. **Credit Gifting**
   - Send credits to other users
   - Team managers gift to team members

---

**Version**: 2.0
**Last Updated**: 2025-10-14
**Status**: 🚧 Implementation in Progress
