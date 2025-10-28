# StreamSuite Multi-Subdomain Deployment Guide

This guide explains how to deploy StreamSuite across multiple subdomains with the correct routing architecture.

## 🌐 Subdomain Architecture

StreamSuite uses a multi-subdomain architecture to separate concerns:

| Subdomain | Purpose | Access Level | Routes |
|-----------|---------|--------------|--------|
| **streamsuite.io** | Marketing site & pricing | Public | Landing page, `/pricing`, `/about` |
| **app.streamsuite.io** | Main application | Authenticated users | `/`, `/converter`, `/debugger`, `/history`, `/settings`, `/templates` |
| **employee.streamsuite.io** | Admin panel | Admin users only | `/admin` |
| **agency.streamsuite.io** | Agency portal (future) | Agency tier users | Agency dashboard, client management |

---

## 📁 Project Structure for Multi-Subdomain Setup

### Option 1: Single Monorepo (Recommended for MVP)

```
construct03-main/
├── src/
│   ├── pages/
│   │   ├── marketing/      # streamsuite.io pages
│   │   │   ├── Landing.tsx
│   │   │   ├── Pricing.tsx
│   │   │   └── About.tsx
│   │   ├── app/            # app.streamsuite.io pages
│   │   │   ├── Generator.tsx
│   │   │   ├── Converter.tsx
│   │   │   ├── Debugger.tsx
│   │   │   ├── History.tsx
│   │   │   ├── Settings.tsx
│   │   │   └── Templates.tsx
│   │   └── admin/          # employee.streamsuite.io pages
│   │       └── Admin.tsx
│   ├── App.tsx            # Main router with subdomain detection
│   └── main.tsx
├── vercel.json            # Vercel routing configuration
└── package.json
```

### Option 2: Separate Repos (For Scale)

```
streamsuite-marketing/     # streamsuite.io
streamsuite-app/          # app.streamsuite.io
streamsuite-admin/        # employee.streamsuite.io
streamsuite-agency/       # agency.streamsuite.io (future)
```

---

## 🚀 Deployment: Vercel (Recommended)

### Step 1: Configure DNS (Namecheap/Cloudflare)

Add the following DNS records:

```
Type    Name        Value                   TTL
A       @           76.76.21.21            Automatic
CNAME   app         cname.vercel-dns.com   Automatic
CNAME   employee    cname.vercel-dns.com   Automatic
CNAME   www         streamsuite.io         Automatic
```

### Step 2: Create `vercel.json` for Routing

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html",
      "has": [
        {
          "type": "host",
          "value": "app.streamsuite.io"
        }
      ]
    },
    {
      "source": "/(.*)",
      "destination": "/index.html",
      "has": [
        {
          "type": "host",
          "value": "employee.streamsuite.io"
        }
      ]
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### Step 3: Update `App.tsx` with Subdomain Routing

```typescript
// src/App.tsx

import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Marketing pages (streamsuite.io)
import Landing from '@/pages/marketing/Landing';
import Pricing from '@/pages/Pricing';

// App pages (app.streamsuite.io)
import Dashboard from '@/pages/Dashboard';
import Generator from '@/pages/Generator';
import Converter from '@/pages/Converter';
import Debugger from '@/pages/Debugger';
import History from '@/pages/History';
import Settings from '@/pages/Settings';
import Templates from '@/pages/Templates';
import Login from '@/pages/Login';

// Admin pages (employee.streamsuite.io)
import Admin from '@/pages/Admin';

// Auth
import { AuthProvider } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/ProtectedRoute';

type SubdomainType = 'marketing' | 'app' | 'employee' | 'agency';

function getSubdomain(): SubdomainType {
  const hostname = window.location.hostname;

  // Development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Check URL params for subdomain testing
    const params = new URLSearchParams(window.location.search);
    const subdomain = params.get('subdomain');
    if (subdomain === 'employee') return 'employee';
    if (subdomain === 'agency') return 'agency';
    return 'app'; // Default to app in dev
  }

  // Production
  if (hostname === 'streamsuite.io' || hostname === 'www.streamsuite.io') {
    return 'marketing';
  }
  if (hostname === 'app.streamsuite.io') {
    return 'app';
  }
  if (hostname === 'employee.streamsuite.io') {
    return 'employee';
  }
  if (hostname === 'agency.streamsuite.io') {
    return 'agency';
  }

  // Default
  return 'marketing';
}

function App() {
  const [subdomain, setSubdomain] = useState<SubdomainType>(getSubdomain());

  useEffect(() => {
    setSubdomain(getSubdomain());
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        {subdomain === 'marketing' && (
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}

        {subdomain === 'app' && (
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>}>
              <Route index element={<Generator />} />
              <Route path="converter" element={<Converter />} />
              <Route path="debugger" element={<Debugger />} />
              <Route path="history" element={<History />} />
              <Route path="settings" element={<Settings />} />
              <Route path="templates" element={<Templates />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}

        {subdomain === 'employee' && (
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}

        {subdomain === 'agency' && (
          <Routes>
            <Route path="/" element={<div>Agency Portal (Coming Soon)</div>} />
          </Routes>
        )}
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
```

### Step 4: Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Add domains in Vercel dashboard:
# 1. Go to Project Settings > Domains
# 2. Add streamsuite.io (primary)
# 3. Add app.streamsuite.io
# 4. Add employee.streamsuite.io
# 5. Add www.streamsuite.io (redirects to streamsuite.io)
```

---

## 🔒 Security Considerations

### 1. Admin Panel Protection (`employee.streamsuite.io`)

```typescript
// src/components/AdminRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user is admin (add is_admin column to profiles table)
  if (!profile?.is_admin) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
```

### 2. Update Supabase Row Level Security

```sql
-- Add is_admin column to profiles
ALTER TABLE profiles
ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;

-- Only admins can access admin panel
CREATE POLICY "Only admins can view all profiles"
ON profiles FOR SELECT
USING (
  auth.uid() = id OR
  (SELECT is_admin FROM profiles WHERE id = auth.uid())
);
```

### 3. Environment Variables

```env
# .env.production
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_CLAUDE_API_KEY=your-claude-key
VITE_STRIPE_PUBLIC_KEY=your-stripe-key

# Subdomain configuration
VITE_MARKETING_DOMAIN=streamsuite.io
VITE_APP_DOMAIN=app.streamsuite.io
VITE_ADMIN_DOMAIN=employee.streamsuite.io
VITE_AGENCY_DOMAIN=agency.streamsuite.io
```

---

## 🧪 Testing Subdomains Locally

### Option 1: URL Parameters (Easiest)

```
http://localhost:5173/?subdomain=app       # App subdomain
http://localhost:5173/?subdomain=employee  # Admin subdomain
http://localhost:5173/                     # Marketing (default)
```

### Option 2: Local Host Aliases

```bash
# Add to /etc/hosts (macOS/Linux)
127.0.0.1   local.streamsuite.io
127.0.0.1   app.local.streamsuite.io
127.0.0.1   employee.local.streamsuite.io

# Access via:
http://local.streamsuite.io:5173          # Marketing
http://app.local.streamsuite.io:5173      # App
http://employee.local.streamsuite.io:5173 # Admin
```

### Option 3: Vite Proxy (Advanced)

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    host: true,
    port: 5173,
    proxy: {
      // Proxy subdomain requests
    }
  }
});
```

---

## 📊 Subdomain Redirects & SEO

### WWW Redirect

In Vercel dashboard:
- Add `www.streamsuite.io` as a domain
- Set it to redirect to `streamsuite.io` (301 permanent)

### Cross-Subdomain Navigation

```typescript
// Helper function for cross-subdomain links
export function getSubdomainUrl(subdomain: 'marketing' | 'app' | 'employee' | 'agency', path: string = '/') {
  const isDev = window.location.hostname === 'localhost';

  if (isDev) {
    return `${window.location.origin}${path}?subdomain=${subdomain}`;
  }

  const domains = {
    marketing: 'streamsuite.io',
    app: 'app.streamsuite.io',
    employee: 'employee.streamsuite.io',
    agency: 'agency.streamsuite.io'
  };

  return `https://${domains[subdomain]}${path}`;
}

// Usage:
<a href={getSubdomainUrl('app', '/')}>Go to App</a>
<a href={getSubdomainUrl('marketing', '/pricing')}>View Pricing</a>
```

---

## 🚀 Deployment Checklist

- [ ] DNS records configured (A + CNAME)
- [ ] Domains added in Vercel dashboard
- [ ] SSL certificates provisioned (automatic via Vercel)
- [ ] Environment variables set in Vercel
- [ ] `vercel.json` configured for routing
- [ ] Subdomain detection working in `App.tsx`
- [ ] Admin protection enabled (`is_admin` RLS)
- [ ] WWW redirect configured
- [ ] Test all subdomains in production
- [ ] Analytics configured per subdomain (optional)

---

## 📈 Future: Agency Subdomain

When launching the Agency plan:

1. Add DNS record: `CNAME agency cname.vercel-dns.com`
2. Add domain in Vercel: `agency.streamsuite.io`
3. Create agency-specific pages in `src/pages/agency/`
4. Update `App.tsx` to handle `agency` subdomain
5. Implement team workspace features

---

## 🆘 Troubleshooting

### "Domain not found" error
- Check DNS propagation: https://dnschecker.org
- Verify Vercel domain configuration
- Wait 24-48 hours for full DNS propagation

### Subdomain not routing correctly
- Check `getSubdomain()` function in `App.tsx`
- Verify `vercel.json` rewrite rules
- Test with `?subdomain=` parameter locally

### Admin panel accessible to non-admins
- Verify Supabase RLS policies
- Check `is_admin` column in profiles table
- Ensure `AdminRoute` component is used

---

## 💡 Recommended Setup (MVP)

For your MVP launch, I recommend:

1. **Start with single Vercel deployment** (all subdomains in one project)
2. **Use subdomain routing in `App.tsx`** (as shown above)
3. **Only worry about 3 subdomains initially:**
   - `streamsuite.io` - Marketing + Pricing
   - `app.streamsuite.io` - Main application
   - `employee.streamsuite.io` - Admin panel
4. **Add `agency.streamsuite.io` later** when launching Agency tier

This keeps deployment simple while maintaining the subdomain architecture you want.
