# Authentication Security Configuration

The following security warnings require configuration in the Supabase Dashboard and cannot be fixed via SQL migrations.

## 1. Leaked Password Protection (WARN)

**Issue**: Leaked password protection is currently disabled.

**Fix**: Enable in Supabase Dashboard
1. Go to: **Authentication** → **Policies** → **Password Security**
2. Enable: **"Check passwords against HaveIBeenPwned.org"**
3. This prevents users from using compromised passwords

**Documentation**: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

---

## 2. Multi-Factor Authentication (WARN)

**Issue**: Project has insufficient MFA options enabled.

**Fix**: Enable MFA methods in Supabase Dashboard
1. Go to: **Authentication** → **Providers** → **Phone**
2. Enable: **"Phone (SMS) authentication"** for TOTP-based MFA
3. Alternatively, enable **Authenticator App (TOTP)** for app-based MFA

**Available MFA Options**:
- TOTP (Time-based One-Time Password) via authenticator apps
- SMS-based verification
- WebAuthn (hardware security keys)

**Recommendation**: Enable at least 2 MFA methods for better security

**Documentation**: https://supabase.com/docs/guides/auth/auth-mfa

---

## Summary of Database-Level Security & Performance Fixes

### ✅ Fixed: Security Definer View (Migration 011)
- **Issue**: `user_stats` view was using SECURITY DEFINER
- **Fix**: Changed to SECURITY INVOKER (with `security_invoker = true`)
- **Impact**: View now enforces RLS policies of querying user (more secure)

### ✅ Fixed: Function Search Path Mutable (Migration 011)
All functions now have `SET search_path = public` to prevent search_path hijacking:
1. `update_updated_at_column()`
2. `handle_new_user()`
3. `handle_updated_at()`
4. `deduct_credits()`
5. `add_credits()`
6. `get_user_credits()`
7. `deduct_batch_credits()`
8. `add_batch_credits()`
9. `get_user_batch_credits()`

### ✅ Fixed: RLS Performance Optimization (Migration 012)
- **Issue**: 50+ RLS policies were re-evaluating `auth.uid()` for every row
- **Fix**: Wrapped all `auth.uid()` calls with `(select auth.uid())`
- **Impact**: 2-10x faster queries on large tables, significant cost savings at scale
- **Tables optimized**: profiles, workflows, credit_transactions, credit_purchases, onboarding_progress, template_folders, feature_flags, batch_credit_transactions, n8n_connections, pushed_workflows

**Performance Impact:**
- **Before**: `auth.uid()` called once per row (expensive at scale)
- **After**: `auth.uid()` called once per query (cached result)
- **Benefit**: Queries run significantly faster as database grows

### ✅ Fixed: Duplicate RLS Policies (Migration 013)
- **Issue**: 10 duplicate RLS policies causing unnecessary policy evaluations
- **Fix**: Removed duplicate policies, keeping only one per role+action combination
- **Impact**: Postgres now evaluates 1 policy instead of 2-3 per query
- **Policies removed**:
  - batch_credit_transactions: 1 duplicate
  - credit_transactions: 1 duplicate
  - template_folders: 4 duplicates
  - workflows: 4 duplicates

**Note**: Admin policies (e.g., "Admins can view all profiles") are NOT duplicates - they're intentional to allow admin access to all records while users only see their own.

---

## How to Apply These Fixes

1. **Security fixes** (Migration 011):
   ```bash
   # Run in Supabase SQL Editor
   database/011_fix_security_issues.sql
   ```

2. **Performance fixes** (Migration 012):
   ```bash
   # Run in Supabase SQL Editor
   database/012_optimize_rls_performance.sql
   ```

3. **Remove duplicate policies** (Migration 013):
   ```bash
   # Run in Supabase SQL Editor
   database/013_remove_duplicate_policies.sql
   ```

4. **Auth configuration**: Enable in Supabase Dashboard as described above

5. **Verify**: Run Supabase database linter again to confirm all issues are resolved
