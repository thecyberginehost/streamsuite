# Supabase Deployment Checklist

## Overview
This checklist ensures all subscription tier features are properly enforced in the database.

---

## ✅ Migrations to Run

Run these migrations in order in Supabase SQL Editor:

### 1. Template Restrictions & Auto-Save (Migration 017)
**File:** `database/017_add_template_restrictions_and_auto_save.sql`

**What it does:**
- Creates `workflow_templates` table
- Adds `auto_saved` column to `workflows` table
- Implements template access restrictions (Starter gets 3, Pro+ gets all)
- Adds helper functions for auto-save checking

**Features enabled:**
- ✅ Template access control by tier
- ✅ Auto-save history for Pro/Growth/Agency
- ✅ Manual save for Free/Starter

---

### 2. n8n Connection Limits (Migration 018)
**File:** `database/018_enforce_n8n_connection_limits.sql`

**What it does:**
- Enforces n8n connection limits at database level
- Adds trigger to prevent exceeding limits
- Creates helpful error messages
- Provides `user_n8n_connection_info` view

**Features enabled:**
- ✅ Free/Starter: 0 connections (blocked)
- ✅ Pro: 1 connection max
- ✅ Growth: 3 connections max
- ✅ Agency: Unlimited connections

---

## 📋 Step-by-Step Deployment

### Step 1: Run Migration 017
1. Open Supabase Dashboard
2. Go to SQL Editor → New Query
3. Copy/paste contents of `database/017_add_template_restrictions_and_auto_save.sql`
4. Click **Run**
5. Verify success message appears

**Expected output:**
```
Migration 017 completed successfully!
Added:
  - workflow_templates table
  - auto_saved column to workflows
  - Helper functions for feature access
  - 3 starter templates seeded
  - accessible_templates view
```

---

### Step 2: Run Migration 018
1. In SQL Editor → New Query
2. Copy/paste contents of `database/018_enforce_n8n_connection_limits.sql`
3. Click **Run**
4. Verify success message appears

**Expected output:**
```
Migration 018 completed successfully!
n8n Connection Limits Enforced:
  Free: 0 connections
  Starter: 0 connections
  Pro: 1 connection(s)
  Growth: 3 connections
  Agency: Unlimited (-1 = unlimited)
```

---

## 🧪 Testing the Setup

### Test 1: Check Template Access
```sql
-- View accessible templates for current user
SELECT * FROM accessible_templates;

-- Should return:
-- Starter tier: 3 templates (where is_starter_accessible = true)
-- Pro tier: ALL templates
-- Free tier: 0 templates (no access)
```

### Test 2: Check n8n Connection Limits
```sql
-- View connection info for current user
SELECT * FROM user_n8n_connection_info;

-- Should return:
-- subscription_tier | max_connections | current_connections | can_add_connection
-- pro              | 1               | 0                   | true
-- pro              | 1               | 1                   | false
-- growth           | 3               | 2                   | true
-- agency           | -1              | 99                  | true (unlimited)
```

### Test 3: Try Adding Connection Beyond Limit
```sql
-- As a Pro user with 1 existing connection, try to insert another
-- This should FAIL with a helpful error message:

INSERT INTO n8n_connections (user_id, connection_name, instance_url, api_key)
VALUES (auth.uid(), 'Test', 'https://test.n8n.cloud', 'test_key');

-- Expected error:
-- "Connection limit reached. Your pro plan allows 1 connection(s). You currently have 1."
-- HINT: "Upgrade to Growth ($99/mo) for 3 connections, or Agency ($499/mo) for unlimited."
```

### Test 4: Check Auto-Save Function
```sql
-- Check if tier has auto-save enabled
SELECT has_auto_save_history('pro');  -- Should return true
SELECT has_auto_save_history('starter');  -- Should return false
```

---

## 📊 Feature Matrix (After Deployment)

| Feature | Free | Starter | Pro | Growth | Agency |
|---------|------|---------|-----|--------|--------|
| **Templates** | ❌ | ✅ 3 only | ✅ All | ✅ All | ✅ All |
| **Auto-Save** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **n8n Connections** | ❌ 0 | ❌ 0 | ✅ 1 | ✅ 3 | ✅ Unlimited |
| **History** | ❌ | ✅ Manual | ✅ Auto | ✅ Auto | ✅ Auto |
| **Batch Credits** | ❌ | ❌ | ❌ | ✅ 10 | ✅ 50 |

---

## 🔍 Database Objects Created

### Tables:
- `workflow_templates` - Stores n8n workflow templates
- Column added: `workflows.auto_saved` - Tracks auto vs manual saves

### Views:
- `accessible_templates` - Shows only templates user can access
- `user_n8n_connection_info` - Shows connection limits and status

### Functions:
- `has_auto_save_history(tier)` - Check if auto-save enabled
- `has_full_template_access(tier)` - Check if user gets all templates
- `can_access_template(tier, template_id)` - Check specific template access
- `get_max_n8n_connections(tier)` - Get max connections for tier
- `can_add_n8n_connection()` - Check if user can add connection
- `check_n8n_connection_limit()` - Trigger function for enforcement

### Triggers:
- `enforce_n8n_connection_limit` - Prevents exceeding connection limits

### Policies:
- Updated INSERT policy on `n8n_connections` to enforce limits
- RLS policies on `workflow_templates` for access control

---

## 🚨 Troubleshooting

### Issue: Migration 017 fails with "table already exists"
**Solution:** The migration uses `CREATE TABLE IF NOT EXISTS`, so it's safe to re-run. If specific parts fail, run individual sections.

### Issue: Migration 018 fails with "policy already exists"
**Solution:** Drop the old policy first:
```sql
DROP POLICY IF EXISTS "Users can insert their own connections" ON public.n8n_connections;
```
Then re-run the migration.

### Issue: Users can still add connections beyond limit
**Solution:** Verify the trigger is active:
```sql
SELECT * FROM information_schema.triggers
WHERE trigger_name = 'enforce_n8n_connection_limit';
```

### Issue: Template view returns nothing
**Solution:** Check if user has a profile:
```sql
SELECT * FROM profiles WHERE id = auth.uid();
```

---

## ✅ Post-Deployment Verification

After running both migrations, verify:

1. **Templates work:**
   ```sql
   SELECT COUNT(*) FROM workflow_templates;  -- Should be >= 3
   SELECT COUNT(*) FROM accessible_templates;  -- Depends on tier
   ```

2. **Connection limits enforced:**
   ```sql
   SELECT * FROM user_n8n_connection_info;
   -- Check max_connections matches tier
   ```

3. **Auto-save function works:**
   ```sql
   SELECT has_auto_save_history('pro');  -- true
   SELECT has_auto_save_history('free');  -- false
   ```

4. **Policies are active:**
   ```sql
   SELECT schemaname, tablename, policyname
   FROM pg_policies
   WHERE tablename IN ('workflow_templates', 'n8n_connections');
   ```

---

## 🎯 Next Steps

After Supabase deployment:

1. **Frontend Integration:**
   - Use `accessible_templates` view in Templates page
   - Use `user_n8n_connection_info` view in Settings page
   - Implement auto-save logic in Generator component

2. **Replace Placeholder Templates:**
   - Update the 3 seeded templates with real n8n workflows
   - Add more Pro+ templates

3. **Test End-to-End:**
   - Sign up as different tiers
   - Verify template access
   - Try adding n8n connections
   - Test auto-save behavior

---

## 📞 Support

If you encounter issues:
1. Check Supabase logs (Database → Logs)
2. Verify user's `subscription_tier` in profiles table
3. Test database functions directly via SQL Editor
4. Review RLS policies if access is denied

---

**Date:** 2025-01-13
**Migrations:** 017, 018
**Status:** Ready for deployment
