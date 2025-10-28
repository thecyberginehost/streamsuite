# Credit System - Tiered Pricing Model

## Overview

StreamSuite uses a **tiered credit system** based on actual token usage from the Claude API. This ensures fair pricing while maintaining healthy profit margins (70-90%).

## Credit Tiers

| Tier | Tokens | Credits | Actual Cost | Your Price | Margin |
|------|--------|---------|-------------|------------|--------|
| **Simple** | < 2,000 | 1 | ~$0.03 | $0.25-0.50 | 85-94% |
| **Medium** | 2,000-4,999 | 2 | ~$0.06 | $0.50-1.00 | 88-94% |
| **Complex** | 5,000-9,999 | 3 | ~$0.12 | $0.75-1.50 | 84-92% |
| **Very Complex** | 10,000+ | 5 | ~$0.20+ | $1.25-2.50 | 84-92% |

## Subscription Plans

### Free Tier
- **5 credits/month** ($0)
- ~5 simple workflows OR 2-3 medium workflows
- No rollover

### Pro Tier
- **200 credits/month** ($49 = $0.245/credit)
- ~200 simple OR 100 medium OR 66 complex workflows
- 50% rollover (up to 300 credits total)

### Agency Tier
- **800 credits/month** ($399 = $0.499/credit)
- ~800 simple OR 400 medium OR 266 complex workflows
- 50% rollover (up to 1,200 credits total)

## How It Works

### 1. **Estimation (Before Generation)**
When a user types a prompt, the system estimates complexity using heuristics:

**Complexity Score (0-100 points):**
- Word count: 5-30 points
- Multiple steps: +15 points
- Branching logic: +20 points
- Advanced features (AI, webhooks, etc.): +25 points
- Multiple apps (3+): +20 points
- Data transformations: +10 points

**Score → Credits Mapping:**
- 0-25 points → 1 credit (Simple)
- 26-50 points → 2 credits (Medium)
- 51-75 points → 3 credits (Complex)
- 76+ points → 5 credits (Very Complex)

The estimated cost is shown on the **Generate button** before the user clicks it.

### 2. **Actual Charging (After Generation)**
After the workflow is generated, the system calculates credits based on **actual token usage**:

```typescript
if (totalTokens < 2000) {
  creditsUsed = 1;
} else if (totalTokens < 5000) {
  creditsUsed = 2;
} else if (totalTokens < 10000) {
  creditsUsed = 3;
} else {
  creditsUsed = 5;
}
```

This ensures users are charged fairly based on what they actually used, not just the estimate.

## User Experience

### Before Generation
- User sees **estimated cost** on the Generate button (e.g., "2 credits")
- If insufficient credits, user gets error: "You need at least 2 credits (Medium complexity)"
- Estimation updates in real-time as user types

### After Generation
- User is charged based on **actual token usage**
- Success message shows: "Generated in 2.3s. 2 credits deducted."
- Low balance warning: "You only have 3 credits remaining."

## Implementation Files

### 1. `src/services/aiService.ts`
- Calculates actual credits from token usage after API call
- Lines 550-566: Token-based credit calculation

### 2. `src/services/creditService.ts`
- `estimateGenerationCost(prompt)` - Estimates credits before generation
- `calculateCreditsFromTokens(tokens)` - Converts tokens to credits
- `getComplexityLabel(credits)` - Returns "Simple", "Medium", etc.
- Token thresholds: 2000, 5000, 10000

### 3. `src/pages/Generator.tsx`
- Shows estimated cost on Generate button
- Uses estimation for pre-flight credit check
- Charges actual cost after generation
- Lines 44-57: Real-time estimation
- Lines 402-409: Credit badge on button

## Benefits

### For Users
✅ **Fair pricing** - Pay only for what you use
✅ **Transparent** - See cost before generating
✅ **Predictable** - Simple prompts cost less

### For Business
✅ **High margins** - 70-90% profit on all tiers
✅ **Scalable** - Costs increase linearly with usage
✅ **Flexible** - Easy to adjust thresholds if API costs change

## Future Enhancements

1. **Credit Packs**: One-time purchases for non-subscribers
2. **Enterprise Pricing**: Custom credit limits for large teams
3. **Discounts**: Bulk purchase discounts (e.g., 10% off 1000+ credits)
4. **Referral Credits**: Give 10 free credits for referrals
5. **Dynamic Pricing**: Adjust thresholds based on actual cost data

## Analytics to Track

- **Average tokens per workflow** - Optimize thresholds
- **Estimation accuracy** - How often does estimate match actual?
- **Credit usage by tier** - Are users hitting limits?
- **Conversion rate** - Do users upgrade when hitting limits?
- **Gross margin by tier** - Are we maintaining 80%+ margins?

---

**Last Updated:** 2025-10-14
**Version:** 1.0
**Status:** ✅ Implemented
