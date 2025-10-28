# StreamSuite Implementation Roadmap

**Target Launch**: October 28, 2025
**MVP Focus**: n8n workflow generation with credit-based subscriptions

---

## Section 1: Landing Page (streamsuite.io)

### Objective
Create conversion-optimized landing page with exact copy from production spec

### Files to Modify/Create
- `src/pages/Landing.tsx` - Update with production copy
- `src/components/LandingNav.tsx` - NEW: Clean navigation bar
- `src/components/LandingFooter.tsx` - NEW: Reusable footer component

### Tasks
1. **Hero Section**
   - Headline: "Build Workflow Automations in 30 Seconds"
   - Subheadline: "Generate production-ready n8n workflows with AI..."
   - Dual CTAs: "Start Free (5 Credits)" + "See Pricing"
   - Social proof: "Join 500+ teams automating smarter"

2. **Trust Section**
   - Testimonial/rating: 4.9/5 stars
   - Trust badge: "Powered by Claude Sonnet 4.5"
   - Quick stats: "10,000+ workflows generated"

3. **Value Props (3 Cards)**
   - Generate: "Describe your automation in plain English..."
   - Convert: "Switch platforms without starting over..." (COMING SOON badge)
   - Debug: "Upload broken workflows + error logs..." (COMING SOON badge)

4. **How It Works (3 Steps)**
   - Step 1: Describe your workflow
   - Step 2: AI generates production-ready JSON
   - Step 3: Download and deploy

5. **Why Claude Sonnet 4.5**
   - Feature comparison: StreamSuite vs Templates vs Other AI Tools
   - Key differentiator: Advanced reasoning, context understanding

6. **Platform Support Timeline**
   - n8n: ✅ Available Now
   - Make.com: Coming December 2025
   - Zapier: Coming January 2026

7. **Pricing Teaser**
   - "Start Free, Upgrade When Ready"
   - CTA: "View Full Pricing"

8. **Footer**
   - Company: About, Blog (future), Careers (future)
   - Product: Features, Pricing, Changelog (future)
   - Resources: Docs, API Reference (future), Community (future)
   - Legal: Privacy Policy, Terms of Service, Refund Policy
   - Social: Twitter, LinkedIn, GitHub (future)

### Acceptance Criteria
- [ ] Landing page renders at `/landing` route
- [ ] All sections match production spec copy exactly
- [ ] Responsive design (mobile + desktop)
- [ ] CTAs navigate correctly (Sign up → /login, Pricing → /pricing)
- [ ] "Coming Soon" badges visible on unreleased features
- [ ] Platform timeline clearly shows n8n only for now

### Dependencies
- None (can start immediately)

### Estimated Complexity
🟡 Medium (3-4 hours)

---

## Section 2: Pricing Page Updates (streamsuite.io/pricing)

### Objective
Update pricing page with Individual + Team plan structure, accurate features

### Files to Modify
- `src/pages/Pricing.tsx` - Major restructure

### Tasks
1. **Page Structure**
   - Split into two sections: "For Individuals" + "For Teams"
   - Add toggle: Monthly / Yearly billing (20% off yearly)

2. **Individual Plans Section**
   - Free: $0/month, 5 credits, workflow generation only
   - Starter: $19/month, 25 credits, + code generator + history + 3 templates
   - Pro: $49/month, 100 credits, + debugging + all templates + API access

3. **Team Plans Section** (horizontal layout below individual)
   - Growth: $99/month, 250 credits, 10 batch credits, 1 seat
   - Agency: $499/month, 750 credits, 50 batch credits, 2 seats (COMING SOON badge)
   - Enterprise: Custom pricing, unlimited credits, unlimited seats, custom branding

4. **Feature Lists**
   - Show CURRENT features at top (normal text)
   - Show COMING SOON features at bottom (greyed out with badge)
   - Examples:
     - Pro: "Workflow conversion (n8n ↔ Make ↔ Zapier)" (COMING SOON)
     - Growth: "Workflow Set Marketplace" (COMING SOON)
     - Agency: "Agency Dashboard" (COMING SOON)

5. **FAQ Section**
   - What are credits?
   - What are batch credits?
   - What happens when I run out of credits?
   - Can I get a refund? (7-day, only if zero credits used)
   - Which platforms do you support? (n8n now, Make Dec 2025, Zapier Jan 2026)
   - Do credits roll over? (No, reset monthly)

6. **Trust Badges**
   - Keep existing "Why StreamSuite Generates Better Workflows" section
   - Badges: Claude Sonnet 4.5, 95%+ Accuracy, Production-Ready

### Acceptance Criteria
- [ ] Individual vs Team sections clearly separated
- [ ] All 6 tiers visible (Free, Starter, Pro, Growth, Agency, Enterprise)
- [ ] Agency plan shows "Coming Soon" badge
- [ ] Coming soon features greyed out in feature lists
- [ ] FAQ accurately explains credits and refund policy
- [ ] Yearly billing shows 20% discount
- [ ] No mention of credit rollover (removed)

### Dependencies
- `src/config/subscriptionPlans.ts` (already updated)

### Estimated Complexity
🟡 Medium (2-3 hours)

---

## Section 3: Sign-Up Flow & Immediate Payment

### Objective
Build sign-up flow with immediate payment (no trials, no "activate later")

### Files to Create/Modify
- `src/pages/SignUp.tsx` - NEW: Multi-step sign-up
- `src/components/SignUpSteps.tsx` - NEW: Step indicator
- `src/components/PaymentForm.tsx` - NEW: Stripe payment form
- `src/services/stripeService.ts` - NEW: Stripe integration
- `src/hooks/useSignUp.ts` - NEW: Sign-up state management

### Tasks
1. **Sign-Up Flow Steps**
   - Step 1: Email + Password (Supabase auth)
   - Step 2: Choose Plan (Free skips to dashboard, Paid goes to Step 3)
   - Step 3: Payment (Stripe checkout for paid plans)
   - Step 4: Redirect to appropriate dashboard based on tier

2. **Free Plan Flow**
   - Email/password → Create account → Go to app.streamsuite.io
   - Start with 5 credits immediately
   - No payment required

3. **Paid Plan Flow (Starter, Pro, Growth)**
   - Email/password → Choose plan → Enter payment → Create account → Go to app.streamsuite.io
   - Credits added immediately after successful payment
   - No grace period, no delayed activation

4. **Agency Plan**
   - Show "Coming Soon - Contact Sales" button
   - Email sent to sales team when clicked

5. **Stripe Integration**
   - Create customer in Stripe
   - Create subscription with immediate payment
   - Handle payment success/failure
   - Store subscription ID in Supabase `subscriptions` table

6. **Database Updates on Sign-Up**
   - Create user in Supabase Auth
   - Create profile in `profiles` table
   - Create subscription in `subscriptions` table
   - Add credits to `credits` table
   - Log initial credit grant in `credit_transactions`

7. **Error Handling**
   - Email already exists
   - Payment declined
   - Network errors
   - Show user-friendly error messages

### Acceptance Criteria
- [ ] Free users can sign up and go straight to app
- [ ] Paid users must complete payment before accessing app
- [ ] Credits appear immediately after payment
- [ ] Stripe subscription created successfully
- [ ] Agency plan shows "Contact Sales" (no direct sign-up)
- [ ] Failed payments show clear error messages
- [ ] Users can't access app without completing payment

### Dependencies
- Stripe account setup (public key in env)
- `src/config/subscriptionPlans.ts`
- Supabase tables: `profiles`, `subscriptions`, `credits`, `credit_transactions`

### Estimated Complexity
🔴 High (6-8 hours)

---

## Section 4: Individual Dashboard Core (app.streamsuite.io)

### Objective
Build/update main app dashboard with credit tracking, platform selection, tier-based access

### Files to Modify/Create
- `src/pages/Generator.tsx` - Major updates
- `src/components/CreditDisplay.tsx` - NEW: Credit counter in header
- `src/components/PlatformSelector.tsx` - NEW: n8n/Make/Zapier selector
- `src/components/WorkflowOutput.tsx` - Update with better UX
- `src/hooks/useCredits.ts` - Credit management hook

### Tasks
1. **Credit Display (Top Bar)**
   - Show: "25 credits remaining" (or current count)
   - Visual indicator: Green (>20), Yellow (5-20), Red (<5)
   - Click to see details: "Resets on [date]" + "Upgrade for more"
   - Low credit warning: At 5 credits, show persistent banner

2. **Platform Selector**
   - Dropdown: n8n (available), Make.com (Coming Dec 2025), Zapier (Coming Jan 2026)
   - Disabled state for unreleased platforms with tooltip
   - Icon + name for each platform

3. **Workflow Generation Interface**
   - Input: Large text area "Describe your workflow..."
   - Complexity estimator: Shows estimated credit cost (1-2 credits)
   - Generate button: "Generate Workflow (1 credit)" or "Generate Workflow (2 credits)"
   - Loading state: "Generating your workflow..." with progress indicator

4. **Output Display**
   - JSON viewer with syntax highlighting
   - Copy button: "Copy JSON"
   - Download button: "Download workflow.json"
   - Save to History button (Starter+ only, shows upgrade dialog for Free)
   - Edit & Regenerate button (uses 1 more credit)

5. **Tier-Based Access Control**
   - Free: Can only generate workflows (no save to history)
   - Starter+: Can save to history
   - Pro+: Can access debugging, all templates, API docs
   - Growth+: Can access batch generation

6. **Upgrade Prompts**
   - When Free user clicks "Save to History" → UpgradeDialog (Starter required)
   - When Starter user clicks "Debug Workflow" → UpgradeDialog (Pro required)
   - When Pro user clicks "Batch Generate" → UpgradeDialog (Growth required)

7. **Empty States**
   - First-time users: "Welcome! Describe your first workflow to get started"
   - After generation: Success message with next steps

### Acceptance Criteria
- [ ] Credit counter visible in top bar
- [ ] Platform selector shows n8n only (others disabled)
- [ ] Credit cost shown before generation
- [ ] Free users see upgrade dialog when trying to save
- [ ] Credits deducted immediately after successful generation
- [ ] JSON output downloadable and copyable
- [ ] Low credit warning shows at 5 credits

### Dependencies
- `src/config/subscriptionPlans.ts`
- `src/components/UpgradeDialog.tsx` (already exists)
- `src/services/aiService.ts` (workflow generation)
- Supabase tables: `credits`, `credit_transactions`, `workflows`

### Estimated Complexity
🟡 Medium (4-5 hours)

---

## Section 5: Credit System & History

### Objective
Implement credit deduction logic, usage tracking, and workflow history

### Files to Modify/Create
- `src/services/creditService.ts` - Update with new logic
- `src/pages/History.tsx` - Update with better UX
- `src/hooks/useWorkflowHistory.ts` - NEW: History management
- Database migrations for history table updates

### Tasks
1. **Credit Deduction Logic**
   - Deduct BEFORE generation (prevent race conditions)
   - If generation fails, refund credit automatically
   - Log every transaction in `credit_transactions` table
   - Track: `user_id`, `amount`, `type` (generation/refund/purchase), `timestamp`, `metadata`

2. **Credit Purchase Flow**
   - When credits hit 0: Show upgrade dialog
   - Button: "Upgrade Plan" → /pricing
   - No one-time credit purchases (subscription only)

3. **Monthly Credit Reset**
   - Cron job (Supabase Edge Function): Runs on 1st of month
   - Reset credits to plan amount (no rollover)
   - Send email: "Your credits have been refreshed"

4. **Workflow History (Starter+ only)**
   - Table columns: Date, Description, Platform, Credits Used, Actions
   - Actions: View JSON, Download, Re-generate, Delete
   - Pagination: 20 per page
   - Search/filter: By platform, date range
   - Sort: Most recent first

5. **History Access Control**
   - Free users: See upgrade prompt when visiting /history
   - Starter+: Full access to history
   - Show workflows from last 90 days (purge older)

6. **Workflow Metadata Saved**
   - User prompt/description
   - Generated JSON
   - Platform (n8n/Make/Zapier)
   - Credits used
   - Timestamp
   - Success/failure status

### Acceptance Criteria
- [ ] Credits deducted before generation starts
- [ ] Failed generations trigger automatic refund
- [ ] All transactions logged in database
- [ ] Free users can't access history page (upgrade prompt)
- [ ] Starter+ users see full workflow history
- [ ] History searchable and filterable
- [ ] Old workflows (90+ days) automatically purged

### Dependencies
- `src/services/aiService.ts` (generation success/failure)
- Supabase tables: `credits`, `credit_transactions`, `workflows`
- Supabase Edge Function for monthly reset (separate task)

### Estimated Complexity
🟡 Medium (4-5 hours)

---

## Section 6: Batch Generation (Growth+ only)

### Objective
Implement intelligent batch workflow generation system using Claude Sonnet 4.5

### Files to Create/Modify
- `src/pages/BatchGenerator.tsx` - NEW: Batch generation interface
- `src/services/batchService.ts` - NEW: Batch generation logic
- `src/components/BatchSetBuilder.tsx` - NEW: Multi-workflow input
- `src/components/BatchOutput.tsx` - NEW: Display all generated workflows
- `src/hooks/useBatchGeneration.ts` - NEW: Batch state management

### Tasks
1. **Batch Generation Interface**
   - Input: "Describe your workflow set (up to 10 related workflows)"
   - Example prompts:
     - "Complete e-commerce order processing system"
     - "Social media content pipeline with approval workflow"
   - Batch credit counter: "10 batch credits remaining"
   - Generate button: "Generate Workflow Set (1 batch credit)"

2. **Intelligent Batch System (Claude Sonnet 4.5)**
   - Phase 1: Research & Planning
     - Analyze user request
     - Recommend tools/integrations needed
     - Plan workflow structure and dependencies
     - Estimate number of workflows needed (1-10)

   - Phase 2: Tool Validation
     - Check if tools exist in n8n
     - Suggest alternatives if tools missing
     - Validate compatibility

   - Phase 3: Adaptive Generation
     - Generate workflows with shared context
     - Optimize for tool reuse
     - Ensure workflows can work together
     - Add connection points between workflows

3. **Prompt Caching for Batch Operations**
   - Cache system prompt (90% cost savings on repeat)
   - Cache tool/integration database
   - Expected cost: $0.50 per batch set (95% margin)

4. **Batch Output Display**
   - Show all workflows in expandable cards
   - Each workflow: Name, Description, Node Count, JSON preview
   - Actions per workflow: Download, Copy, View Full JSON
   - Bulk actions: Download All as ZIP, Copy All
   - Export as "Workflow Set Package" (JSON manifest + all workflows)

5. **Batch Credit System**
   - Growth: 10 batch credits/month (10 workflows per set)
   - Agency: 50 batch credits/month (10 workflows per set)
   - Separate from regular credits
   - No rollover (reset monthly)

6. **Access Control**
   - Growth/Agency only
   - Pro users see upgrade dialog: "Upgrade to Growth for batch generation"

### Acceptance Criteria
- [ ] Batch generation page accessible by Growth+ users only
- [ ] Lower tier users see upgrade dialog
- [ ] Batch credit counter shows in UI
- [ ] Can generate up to 10 workflows per batch set
- [ ] All workflows downloadable individually or as ZIP
- [ ] Batch credits deducted correctly (1 per set, not per workflow)
- [ ] Workflows in set are contextually related and compatible

### Dependencies
- `src/services/aiService.ts` (Claude Sonnet 4.5 integration)
- `src/config/subscriptionPlans.ts` (batch credit config)
- Supabase tables: `batch_credits`, `batch_transactions`, `workflow_sets`

### Estimated Complexity
🔴 High (8-10 hours)

---

## Section 7: Email Sequences (Transactional)

### Objective
Set up automated transactional emails for key user events

### Files to Create
- `src/services/emailService.ts` - NEW: Email sending logic
- `src/emails/templates/` - NEW: Email templates directory
- Supabase Edge Functions for email triggers

### Tasks
1. **Welcome Email** (triggered on sign-up)
   - Subject: "Welcome to StreamSuite - Your 5 Free Credits Are Ready"
   - Content:
     - Welcome message
     - Quick start guide (3 steps)
     - Link to first workflow generation
     - Link to docs (when available)

2. **Credits Low Email** (5 credits remaining)
   - Subject: "You Have 5 Credits Left - Upgrade to Keep Building"
   - Content:
     - Credits remaining count
     - When credits reset (or upgrade for more)
     - CTA: "Upgrade Now"

3. **Credits Depleted Email** (0 credits)
   - Subject: "You're Out of Credits - Upgrade to Continue"
   - Content:
     - Credits reset date (for paid users)
     - CTA: "Upgrade Your Plan" (for free users)
     - Show pricing tiers

4. **Monthly Credit Refresh Email** (1st of month)
   - Subject: "Your Credits Have Been Refreshed - 25 Credits Ready to Use"
   - Content:
     - New credit balance
     - Last month's usage stats
     - Encourage workflow generation

5. **Payment Failed Email**
   - Subject: "Payment Failed - Update Your Payment Method"
   - Content:
     - Payment failure notice
     - Link to update payment in settings
     - Grace period: 3 days before access suspended
     - CTA: "Update Payment Method"

6. **Payment Success Email**
   - Subject: "Payment Successful - Your Credits Are Ready"
   - Content:
     - Payment amount
     - Credits added
     - Next billing date
     - Receipt/invoice link

7. **Subscription Cancelled Email**
   - Subject: "Subscription Cancelled - You'll Be Missed"
   - Content:
     - Confirmation of cancellation
     - Access until end of billing period
     - Credits remaining (valid until end date)
     - Feedback survey link
     - CTA: "Reactivate Subscription"

### Email Service Integration
- Use: **Resend** (free tier: 3,000 emails/month, $20/mo for 50k)
- Alternative: **SendGrid** (free tier: 100/day)
- Set up DKIM/SPF for deliverability

### Acceptance Criteria
- [ ] Welcome email sent on sign-up
- [ ] Low credit email sent at 5 credits
- [ ] Depleted email sent at 0 credits
- [ ] Monthly refresh email sent on 1st of month
- [ ] Payment emails sent on success/failure
- [ ] All emails mobile-responsive
- [ ] Unsubscribe link in all marketing emails (not transactional)

### Dependencies
- Email service account (Resend or SendGrid)
- Supabase Edge Functions for triggers
- Email templates (HTML + plain text)

### Estimated Complexity
🟡 Medium (5-6 hours)

---

## Section 8: Stripe Payment Integration

### Objective
Implement Stripe subscriptions with proper billing, webhooks, and refund logic

### Files to Create/Modify
- `src/services/stripeService.ts` - Stripe client integration
- `src/pages/Settings.tsx` - Update with billing section
- Supabase Edge Function: `handle-stripe-webhook`
- Database: Stripe price IDs in `subscriptionPlans.ts`

### Tasks
1. **Stripe Setup**
   - Create Stripe account
   - Create products for each tier:
     - Starter: $19/month, $180/year
     - Pro: $49/month, $470/year
     - Growth: $99/month, $950/year
     - Agency: $499/month, $4,790/year
   - Get price IDs and add to `subscriptionPlans.ts`

2. **Checkout Flow**
   - Create Stripe Checkout session
   - Redirect to Stripe hosted checkout
   - Return URL: `/settings?payment=success`
   - Cancel URL: `/pricing`

3. **Webhook Handling** (Supabase Edge Function)
   - Events to handle:
     - `checkout.session.completed` → Activate subscription, add credits
     - `invoice.payment_succeeded` → Monthly renewal, refresh credits
     - `invoice.payment_failed` → Send email, mark subscription as past_due
     - `customer.subscription.deleted` → Cancel subscription, remove access

4. **Subscription Management (Settings Page)**
   - Current plan display
   - Next billing date
   - Payment method (last 4 digits)
   - Actions:
     - Update payment method
     - Upgrade/downgrade plan
     - Cancel subscription

5. **Upgrade/Downgrade Logic**
   - Upgrade: Immediate access, prorated charge
   - Downgrade: Takes effect at next billing cycle
   - Credits adjust immediately on upgrade

6. **Cancellation Flow**
   - Cancel subscription
   - Access until end of billing period
   - Credits remain valid until end date
   - No refund (unless within 7-day window)

7. **7-Day Refund Policy**
   - Check: Has user used ANY credits?
   - If NO: Full refund, cancel subscription
   - If YES: No refund, standard cancellation
   - Track in database: `credit_transactions` table

8. **Failed Payment Handling**
   - Stripe retries automatically (3 times over 2 weeks)
   - After 3 failures: Subscription cancelled
   - Email sent on each failure
   - Grace period: User keeps access for 3 days after first failure

### Acceptance Criteria
- [ ] Stripe checkout working for all tiers
- [ ] Webhooks processing correctly (test in Stripe CLI)
- [ ] Subscriptions created in Supabase database
- [ ] Credits added on payment success
- [ ] Credits refreshed on monthly renewal
- [ ] Refunds processed if criteria met (7 days + 0 credits used)
- [ ] Users can upgrade/downgrade in settings
- [ ] Failed payments trigger email and grace period

### Dependencies
- Stripe account (public + secret keys)
- Supabase Edge Functions
- `src/config/subscriptionPlans.ts`
- Email service (Section 7)

### Estimated Complexity
🔴 High (8-10 hours)

---

## Section 9: Team Dashboard (Phase 2 - Post-Launch)

### Objective
Build team.streamsuite.io dashboard for Agency tier (when first customer signs up)

### Files to Create
- `src/pages/TeamDashboard.tsx` - NEW: Agency dashboard
- `src/components/TeamCreditPool.tsx` - NEW: Shared credit display
- `src/components/TeamMembers.tsx` - NEW: Team member management
- `src/components/UsageAnalytics.tsx` - NEW: Per-user usage stats

### Tasks
1. **Team Dashboard Layout**
   - Separate subdomain: team.streamsuite.io
   - Different navigation: Overview, Team, Workflows, Billing, Settings
   - Admin vs Member permissions

2. **Credit Pool Management**
   - Shared credit pool: 750 credits (Agency)
   - Display: "750 credits shared across 2 seats"
   - Usage breakdown by team member

3. **Team Member Management**
   - 2 seats included (Agency)
   - Invite members via email
   - Assign roles: Admin (full access), Member (limited)
   - Remove members

4. **Usage Analytics**
   - Total workflows generated (team-wide)
   - Credits used per member
   - Most active member
   - Workflow types breakdown (generation, debugging, batch)

5. **Coming Soon Features** (greyed out)
   - Client workspaces
   - Credit delegation (admin assigns credits to members)
   - Custom branding on exports
   - Dedicated account manager contact

### Acceptance Criteria
- [ ] Team dashboard accessible at team.streamsuite.io
- [ ] Only Agency tier users can access
- [ ] Shared credit pool visible and tracked
- [ ] Team members can be invited/removed
- [ ] Usage analytics show per-user breakdown
- [ ] Coming soon features clearly marked

### Dependencies
- Section 3, 4, 5, 8 (core features must be done first)
- Subdomain routing (DEPLOYMENT.md)
- Supabase tables: `team_members`, `team_invites`

### Estimated Complexity
🔴 High (10-12 hours)

**NOTE**: This section can wait until first Agency customer signs up. Do NOT implement before launch unless user requests it.

---

## Phase Priority for Oct 28 Launch

### MUST HAVE (Launch Blockers)
1. ✅ **Section 1**: Landing Page
2. ✅ **Section 2**: Pricing Page
3. ✅ **Section 3**: Sign-Up Flow & Payment
4. ✅ **Section 4**: Individual Dashboard Core
5. ✅ **Section 5**: Credit System & History
6. ✅ **Section 8**: Stripe Payment Integration

### SHOULD HAVE (Launch Week)
7. ⚠️ **Section 7**: Email Sequences (at least welcome + payment emails)

### NICE TO HAVE (Post-Launch)
8. 🔵 **Section 6**: Batch Generation (Growth feature, can wait for first Growth customer)
9. 🔵 **Section 9**: Team Dashboard (Agency feature, can wait for first Agency customer)

---

## How to Use This Roadmap

When ready to implement a section, say:

> "Now reference the to-do file and do section [NUMBER]"

Example:
> "Now reference the to-do file and do section 1"

I will then implement that entire section, including:
- Creating/modifying all files
- Writing all code
- Testing the implementation
- Confirming acceptance criteria are met

After each section is complete, I'll prompt you to move to the next section or make changes.

---

**Last Updated**: October 21, 2025
**Created By**: Claude (Sonnet 4.5)
