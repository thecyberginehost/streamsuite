# Environment Setup Checklist

## 🔑 Required API Keys and Services

Before starting development, you need to set up these services and get API keys.

---

## 1. Supabase Setup

### Create Supabase Project
1. Go to https://supabase.com
2. Click "New Project"
3. Project details:
   - **Name**: construct-mvp (or your preferred name)
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is fine for MVP

### Get Supabase Credentials
1. Go to **Project Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://tlxpfjjckmvotkdiabll.supabase.co`
   - **Anon/Public Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRseHBmampja212b3RrZGlhYmxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyNDUyNzksImV4cCI6MjA3NTgyMTI3OX0.2JEmuZDL3m-NXe3LtzhnelUiula_Xy4EnelHlufT1-0`

### Run Database Setup
1. Go to **SQL Editor** in Supabase dashboard
2. Click **New Query**
3. Copy contents of `SUPABASE_SETUP.sql` file
4. Click **Run** to execute the script
5. Verify tables created:
   - profiles
   - workflows
   - credit_transactions

### Test Authentication
1. Go to **Authentication** → **Settings**
2. Ensure **Enable Email Confirmations** is OFF (for faster MVP testing)
3. Go to **URL Configuration**
4. Set **Site URL** to `http://localhost:5173` (for development)
5. Add **Redirect URLs**:
   - `http://localhost:5173/**`
   - `https://your-vercel-app.vercel.app/**` (add when deployed)

---

## 2. Claude API Setup

### Get Claude API Key
1. Go to https://console.anthropic.com
2. Sign up or log in
3. Go to **API Keys**
4. Click **Create Key**
5. Name it: "StreamSuite MVP"
6. Copy the key: `sk-ant-api03-xxxxx...`
7. **IMPORTANT**: Save it immediately - you won't see it again!

### Set Usage Limits (Optional but Recommended)
1. Go to **Settings** → **Plans & Billing**
2. Set a monthly budget limit (e.g., $100 for MVP testing)
3. Enable email alerts at 50% and 90% usage

### Verify API Access
```bash
# Test your API key works
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: YOUR_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{
    "model": "claude-sonnet-4-5-20250929",
    "max_tokens": 100,
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

Expected response: JSON with Claude's response

---

## 3. Create .env File

### Copy Template
```bash
cp .env.example .env
```

### Fill in Values
Open `.env` and add your credentials:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Claude AI Configuration
VITE_CLAUDE_API_KEY=sk-ant-api03-xxxxx...

# Application Configuration
VITE_APP_URL=http://localhost:5173
VITE_APP_NAME=StreamSuite

# Feature Flags (for MVP - keep these as is)
VITE_ENABLE_PAYMENTS=false
VITE_ENABLE_HISTORY=false
VITE_ENABLE_CONVERTER=false
```

### Verify .env is in .gitignore
```bash
# Check .gitignore contains .env
grep "^\.env$" .gitignore
```

If not, add it:
```bash
echo ".env" >> .gitignore
```

---

## 4. Install Dependencies

```bash
# Install all npm packages
npm install

# If you get peer dependency warnings, that's OK for MVP
```

### Install Anthropic SDK (if not already installed)
```bash
npm install @anthropic-ai/sdk
```

---

## 5. Verify Setup

### Test 1: Start Development Server
```bash
npm run dev
```

Expected output:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Test 2: Check Environment Variables
Open browser console at http://localhost:5173 and run:
```javascript
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Claude API Key (first 10 chars):', import.meta.env.VITE_CLAUDE_API_KEY?.slice(0, 10));
```

Should show your values (not undefined).

### Test 3: Verify Supabase Connection
```typescript
// Create test file: src/test-supabase.ts
import { supabase } from '@/integrations/supabase/client';

async function testSupabase() {
  const { data, error } = await supabase.auth.getSession();
  console.log('Supabase connected:', !error);
  console.log('Session:', data);
}

testSupabase();
```

### Test 4: Create Test User
1. Go to http://localhost:5173/login
2. Sign up with test email: test@construct.com
3. Password: TestPassword123!
4. Check Supabase dashboard → Authentication → Users
5. Verify user was created
6. Check Database → profiles table
7. Verify profile was auto-created with 100 credits

---

## 6. Deployment Setup (for when ready)

### Vercel Setup
1. Go to https://vercel.com
2. Import your GitHub repo (or deploy directly)
3. Add environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_CLAUDE_API_KEY`
   - `VITE_APP_URL` (set to your Vercel URL)

### Update Supabase for Production
1. Go to Supabase → Authentication → URL Configuration
2. Add production URLs:
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: `https://your-app.vercel.app/**`

---

## 7. Optional: Set Up Error Tracking

### Sentry (for production error monitoring)
1. Go to https://sentry.io
2. Create new project → React
3. Get DSN key
4. Add to .env: `VITE_SENTRY_DSN=https://...`
5. Install SDK: `npm install @sentry/react`

---

## ✅ Final Checklist

Before you start coding, verify:

- [ ] Supabase project created
- [ ] Supabase URL and anon key in .env
- [ ] Database tables created (run SUPABASE_SETUP.sql)
- [ ] Email confirmations disabled in Supabase
- [ ] Claude API key obtained
- [ ] Claude API key in .env
- [ ] .env file created and not in git
- [ ] npm install completed successfully
- [ ] npm run dev works
- [ ] Can access http://localhost:5173
- [ ] Test user signup works
- [ ] Profile auto-created in database
- [ ] User has 100 credits on signup

---

## 🆘 Troubleshooting

### Issue: "Supabase client error"
- Check URL format: must start with `https://`
- Check anon key: must be the long JWT token
- Verify .env variable names start with `VITE_`

### Issue: "Claude API authentication failed"
- Verify API key starts with `sk-ant-api03-`
- Check for trailing spaces in .env
- Test key with curl command above

### Issue: "Tables not found"
- Run SUPABASE_SETUP.sql in SQL Editor
- Check table names in Supabase → Database → Tables
- Verify RLS is enabled

### Issue: "Profile not created on signup"
- Check Supabase → Database → Functions
- Verify `handle_new_user()` function exists
- Check Triggers tab for `on_auth_user_created`

### Issue: "Environment variables undefined"
- Restart dev server after changing .env
- Verify variable names start with `VITE_`
- Check .env is in project root (not src/)

---

## 📞 Quick Reference

### Supabase Dashboard URLs
- Project: https://supabase.com/dashboard/project/YOUR_PROJECT_ID
- SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql
- Auth: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/auth/users
- Database: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/database/tables

### Claude Console
- Dashboard: https://console.anthropic.com
- API Keys: https://console.anthropic.com/settings/keys
- Docs: https://docs.anthropic.com

### Useful Commands
```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Check TypeScript errors
npx tsc --noEmit

# Format code
npx prettier --write src/
```

---

## 🎉 You're Ready!

Once all checkboxes above are checked, you have everything needed to build the MVP.

**Next step**: Open `MVP_BUILD_GUIDE.md` and start building!

---

**Estimated Setup Time**: 30-45 minutes

**Cost**: $0 (using free tiers)

**Support**: If stuck, check Supabase docs or Claude API docs
