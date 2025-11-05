# StreamSuite - 3-Domain Deployment Architecture

This guide explains how to deploy StreamSuite across **3 domains** with optimal separation of concerns, performance, and scalability.

## 🌐 Domain Architecture

StreamSuite uses a **3-domain architecture** for the MVP launch:

| Domain | Purpose | Access Level | Key Features |
|--------|---------|--------------|--------------|
| **streamsuite.io** | Marketing site | Public | Landing page, pricing, login/signup |
| **app.streamsuite.io** | Main application | Authenticated users | Generator, converter, debugger, templates, history, settings, admin |
| **agency.streamsuite.io** | Agency portal | Agency tier users only | Client management, team features, API keys, analytics |

---

## 🎯 Deployment Strategy: Single Codebase, Multiple Domains

### Recommended Approach for MVP Launch

We're using **one codebase** with **domain-based routing** for all three domains. This is the best practice for your one-week launch timeline.

#### Why This Approach?

✅ **Shared code** - Components, services, and utilities across all domains
✅ **Single deployment** - One pipeline, one build, simpler CI/CD
✅ **Easier to maintain** - No code duplication, consistent authentication
✅ **Fast to implement** - Ready within one week
✅ **Scales well** - Can split later if needed

### How It Works

1. Deploy **one Vercel project** connected to GitHub
2. Add **all 3 domains** to the same Vercel project
3. App detects `window.location.hostname` and renders appropriate routes
4. All domains point to same deployment, different routes shown per domain

### Domain Routing Logic

```
streamsuite.io          → Landing, Pricing, Login/Signup
app.streamsuite.io      → Dashboard, Generator, Debugger, etc.
agency.streamsuite.io   → Agency Dashboard, Client Management
```

---

## 🚀 Step-by-Step Deployment Guide

### Step 1: Configure DNS Records

In your DNS provider (Namecheap, Cloudflare, etc.), add these records:

```
Type    Name      Value                   TTL
A       @         76.76.21.21            Auto (Vercel's IP)
CNAME   app       cname.vercel-dns.com   Auto
CNAME   agency    cname.vercel-dns.com   Auto
CNAME   www       streamsuite.io         Auto (optional redirect)
```

**Note**: After adding DNS records, propagation can take 24-48 hours

### Step 2: Create `vercel.json` Configuration

**Already configured!** The existing `vercel.json` handles SPA routing for all domains.

All routes serve `/index.html`, then React Router + domain detection handles the rest.

### Step 3: App Routing Structure

**Current implementation** in [src/App.tsx](src/App.tsx) already supports domain-based routing:

```
streamsuite.io routes:
  / → Landing page
  /pricing → Pricing page
  /login → Login
  /signup → Sign up

app.streamsuite.io routes:
  /app → Dashboard (protected)
    ├── / → Generator
    ├── /templates → Templates
    ├── /converter → Converter
    ├── /debugger → Debugger
    ├── /batch → Batch Generator
    ├── /monitoring → n8n Monitoring
    ├── /history → History
    ├── /settings → Settings
    └── /admin → Admin Panel

agency.streamsuite.io routes:
  /agency → Agency Dashboard (protected, agency-only)
  /agency/client/:id → Client Profile
  /agency/client/:id/workflows → Client Workflows
  /agency/generator → Agency Generator
  /agency/debugger → Agency Debugger
  /agency/batch → Agency Batch Generator
  /agency/api-docs → API Documentation
  /agency/docs → Agency Documentation
```

**The routing works like this:**
1. User visits any of the 3 domains
2. All domains serve the same `index.html` (from Vercel)
3. React app loads and checks `window.location.hostname`
4. Based on domain, shows appropriate routes
5. Users can navigate between domains via links

### Step 4: Deploy to Vercel

#### Via Vercel Dashboard (Recommended):

1. **Connect GitHub Repository**:
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel auto-detects Vite configuration

2. **Configure Build Settings** (auto-detected):
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Add Environment Variables**:
   - Go to Project Settings → Environment Variables
   - Add all variables from `.env.example`:
     ```
     VITE_SUPABASE_URL
     VITE_SUPABASE_ANON_KEY
     VITE_CLAUDE_API_KEY
     VITE_OPENAI_API_KEY
     VITE_STRIPE_PUBLIC_KEY
     VITE_APP_URL=https://app.streamsuite.io
     VITE_APP_NAME=StreamSuite
     ```

4. **Add All 3 Domains**:
   - Go to Project Settings → Domains
   - Add `streamsuite.io` (primary)
   - Add `app.streamsuite.io`
   - Add `agency.streamsuite.io`
   - Add `www.streamsuite.io` (optional, redirects to streamsuite.io)

5. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete (~2-3 minutes)
   - SSL certificates are automatically provisioned

#### Via Vercel CLI (Alternative):

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

---

## 🔒 Supabase Configuration

### Step 5: Configure Supabase Auth & CORS

In Supabase Dashboard → Authentication → URL Configuration:

**Site URL**: `https://streamsuite.io`

**Redirect URLs** (add all):
```
https://streamsuite.io/*
https://app.streamsuite.io/*
https://agency.streamsuite.io/*
http://localhost:5173/*
```

**Additional Redirect URLs** (for OAuth providers if using):
```
https://streamsuite.io/auth/callback
https://app.streamsuite.io/auth/callback
https://agency.streamsuite.io/auth/callback
```

### Step 6: Configure CORS Origins

In Supabase Dashboard → Settings → API:

**Allowed origins**:
```
https://streamsuite.io
https://app.streamsuite.io
https://agency.streamsuite.io
http://localhost:5173
```

---

## 🧪 Testing Locally

During development, all 3 domains run on `localhost:5173`:

```bash
npm run dev
```

### Test Domain-Specific Behavior:

**Option 1: Modify App.tsx Temporarily**
```typescript
// Force specific domain for testing
function getHostname() {
  return 'agency.streamsuite.io'; // Test agency routes
  // return 'app.streamsuite.io'; // Test app routes
  // return 'streamsuite.io'; // Test marketing routes
}
```

**Option 2: Local Hosts File** (Windows: `C:\Windows\System32\drivers\etc\hosts`):
```
127.0.0.1 local.streamsuite.io
127.0.0.1 app.local.streamsuite.io
127.0.0.1 agency.local.streamsuite.io
```

Then access:
- `http://local.streamsuite.io:5173` → Marketing
- `http://app.local.streamsuite.io:5173` → App
- `http://agency.local.streamsuite.io:5173` → Agency

---

## 🔐 Authentication Flow

### Login Flow Across Domains:

1. User visits **streamsuite.io** → clicks "Sign In"
2. User logs in at **streamsuite.io/login**
3. After successful login:
   - **Regular users** → redirect to `https://app.streamsuite.io/app`
   - **Agency users** → redirect to `https://agency.streamsuite.io/agency`
   - **Admin users** → can access `https://app.streamsuite.io/app/admin`

### Logout Flow:

1. User clicks logout from any domain
2. Supabase clears session (works across all domains via CORS)
3. User redirected to `https://streamsuite.io`

### Cross-Domain Session Management:

Supabase handles this automatically:
- Sessions stored in `localStorage` (shared across subdomains)
- CORS configured to allow authentication across all 3 domains
- Users stay logged in when navigating between app ↔ agency

---

## 🚀 Complete Deployment Checklist

### Pre-Deployment:
- [x] Landing page created
- [x] Logo replaced with S3 image
- [x] Subscription plans configured
- [ ] Update `.env` with production values
- [ ] Test login/logout flow locally
- [ ] Verify Stripe checkout redirects work
- [ ] Test all protected routes

### Vercel Setup:
- [ ] Create Vercel project
- [ ] Connect GitHub repository
- [ ] Add environment variables
- [ ] Add all 3 domains (streamsuite.io, app.streamsuite.io, agency.streamsuite.io)
- [ ] Verify SSL/HTTPS is enabled (automatic)
- [ ] Deploy to production

### Supabase Setup:
- [ ] Add all redirect URLs to auth config
- [ ] Configure CORS origins
- [ ] Deploy edge functions:
  - [ ] `stripe-checkout`
  - [ ] `stripe-webhook`
  - [ ] `stripe-portal`
  - [ ] `n8n-proxy` (if using n8n monitoring)
  - [ ] `make-proxy` (if using Make integration)
- [ ] Test edge function access from all domains

### DNS Configuration:
- [ ] Point `streamsuite.io` A record to Vercel
- [ ] Point `app.streamsuite.io` CNAME to Vercel
- [ ] Point `agency.streamsuite.io` CNAME to Vercel
- [ ] Configure `www.streamsuite.io` redirect (optional)
- [ ] Wait for DNS propagation (24-48 hours)

### Stripe Setup:
- [ ] Create Stripe account
- [ ] Create 4 products (Starter, Pro, Growth, Agency)
- [ ] Add monthly + yearly prices for each
- [ ] Copy price IDs to Vercel environment variables
- [ ] Configure webhook URL: `https://your-project.supabase.co/functions/v1/stripe-webhook`
- [ ] Add webhook events: `checkout.session.completed`, `invoice.payment_succeeded`, etc.
- [ ] Create promo code: `HUNT50` (50% off first month)
- [ ] Update success URLs to `https://app.streamsuite.io/app/settings?success=true`
- [ ] Update cancel URLs to `https://app.streamsuite.io/app/settings?canceled=true`

### Post-Deployment Testing:
- [ ] Visit streamsuite.io → verify landing page loads
- [ ] Sign up new user → verify redirect to app.streamsuite.io
- [ ] Test workflow generation (costs 1 credit)
- [ ] Test subscription purchase with test card
- [ ] Test agency dashboard access (for agency users)
- [ ] Test navigation between all 3 domains
- [ ] Verify logout → redirect to streamsuite.io
- [ ] Test on mobile devices
- [ ] Check page load times (<3 seconds)

---

## 🔧 Navigation Between Domains

### From Marketing to App:
After successful login, redirect user based on tier:

```typescript
// In Login.tsx after successful authentication
const { data: profile } = await supabase
  .from('profiles')
  .select('subscription_tier')
  .eq('id', user.id)
  .single();

if (profile?.subscription_tier === 'agency') {
  window.location.href = 'https://agency.streamsuite.io/agency';
} else {
  window.location.href = 'https://app.streamsuite.io/app';
}
```

### From App to Agency:
In Dashboard sidebar, conditionally show agency link:

```typescript
{profile?.subscription_tier === 'agency' && (
  <a href="https://agency.streamsuite.io/agency" className="nav-link">
    Agency Dashboard
  </a>
)}
```

### From Any Domain to Marketing:
On logout:

```typescript
await supabase.auth.signOut();
window.location.href = 'https://streamsuite.io';
```

---

## 🆘 Troubleshooting

### Issue: "Domain not found" error
**Solution**:
- Check DNS propagation at [dnschecker.org](https://dnschecker.org)
- Verify domains are added in Vercel dashboard
- Wait 24-48 hours for full propagation

### Issue: Session not persisting across domains
**Solution**:
- Verify CORS configuration in Supabase
- Check redirect URLs include all 3 domains
- Ensure `localStorage` is enabled in browser

### Issue: Login redirects to wrong domain
**Solution**:
- Check environment variables (`VITE_APP_URL`)
- Verify redirect logic in Login.tsx
- Test with different user tiers

### Issue: Stripe checkout redirecting to wrong URL
**Solution**:
- Update `success_url` in stripe-checkout edge function
- Use `https://app.streamsuite.io/app/settings?success=true`
- Not `http://localhost:5173/settings`

### Issue: Agency features showing for non-agency users
**Solution**:
- Verify `ProtectedRoute` has `agencyOnly` prop
- Check user's `subscription_tier` in database
- Ensure RLS policies are correct

---

## 🎯 Summary

Your 3-domain architecture is **production-ready**:

✅ **streamsuite.io** - Marketing site with landing page, pricing, auth
✅ **app.streamsuite.io** - Full application with all user features
✅ **agency.streamsuite.io** - Agency portal for team features

**Next Steps**:
1. Follow the deployment checklist above
2. Deploy to Vercel (5-10 minutes)
3. Configure DNS records (2-5 minutes, 24-48 hours to propagate)
4. Set up Stripe products and webhooks (15-20 minutes)
5. Test end-to-end flows
6. Launch! 🚀
