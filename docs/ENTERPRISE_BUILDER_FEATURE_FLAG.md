# Enterprise Builder Feature Flag

## Overview

Enterprise Builder is now controlled by a feature flag in the admin panel. When disabled, it's hidden from regular users but remains accessible to admins for development purposes.

---

## Setup Instructions

### 1. Run the Database Migration

Execute the SQL in Supabase SQL Editor:

```sql
-- File: database/007_add_enterprise_builder_flag.sql

INSERT INTO public.feature_flags (flag_key, flag_name, description, is_enabled)
VALUES (
  'enterprise_builder',
  'Enterprise Builder',
  'Enable the Enterprise Workflow Builder for complex workflows (20-100+ nodes). When disabled, only admins can access it for development.',
  false
)
ON CONFLICT (flag_key) DO UPDATE
SET
  flag_name = EXCLUDED.flag_name,
  description = EXCLUDED.description,
  updated_at = NOW();
```

**Default State**: Disabled (`is_enabled = false`)

---

## How It Works

### Feature Flag Behavior

**When Enabled (Admin Panel → Feature Flags → Toggle ON):**
- ✅ Enterprise Builder appears in sidebar for all users with Growth+ plan
- ✅ Route `/enterprise-builder` is accessible
- ✅ Enterprise tab shows in Prompt Guide (Docs page)

**When Disabled (Default):**
- ❌ Hidden from sidebar for regular users
- ✅ Visible to admins only (for development/testing)
- ❌ Enterprise tab hidden in Prompt Guide for regular users
- ✅ Enterprise tab visible in Prompt Guide for admins

---

## Admin Control

### To Enable Enterprise Builder:

1. Go to **Admin Panel** (`/admin`)
2. Scroll to **Feature Flags** section
3. Find `Enterprise Builder` flag
4. **Toggle it ON**
5. Changes take effect immediately (page refresh may be needed)

### To Disable Enterprise Builder:

1. Go to **Admin Panel** (`/admin`)
2. Scroll to **Feature Flags** section
3. Find `Enterprise Builder` flag
4. **Toggle it OFF**
5. Feature hidden from regular users (admins still have access)

---

## Technical Implementation

### Files Modified

#### 1. **featureFlagService.ts** ([src/services/featureFlagService.ts](../src/services/featureFlagService.ts))
- Added `'enterprise_builder'` to `FeatureFlagKey` type
- Allows checking flag status with `isFeatureEnabled('enterprise_builder')`

#### 2. **Sidebar.tsx** ([src/components/Sidebar.tsx](../src/components/Sidebar.tsx))
- Added `showEnterpriseBuilder` state
- Checks flag status + admin status on mount
- Conditionally renders Enterprise Builder nav item
- Shows to admins even when disabled

**Logic:**
```typescript
const checkEnterpriseBuilderFlag = async () => {
  const isEnabled = await isFeatureEnabled('enterprise_builder');
  const adminStatus = await isAdmin();
  // Show if flag is enabled OR if user is admin (for development)
  setShowEnterpriseBuilder(isEnabled || adminStatus);
};
```

#### 3. **Docs.tsx** ([src/pages/Docs.tsx](../src/pages/Docs.tsx))
- Added `showEnterpriseTab` state
- Checks flag status + admin status on mount
- Conditionally renders Enterprise tab
- Adjusts tab grid layout (2 cols vs 3 cols)

**UI Changes:**
- When disabled: 2 tabs (Regular | Batch)
- When enabled: 3 tabs (Regular | Batch | Enterprise)

#### 4. **App.tsx** ([src/App.tsx](../src/App.tsx))
- Re-added Enterprise Builder route: `/enterprise-builder`
- Route always exists (protected by feature flag in UI)

#### 5. **Database Migration** ([database/007_add_enterprise_builder_flag.sql](../database/007_add_enterprise_builder_flag.sql))
- Creates `enterprise_builder` flag in database
- Sets default to `false` (disabled)
- Includes conflict handling (safe to re-run)

---

## Use Cases

### Development Mode (Flag Disabled)
- **Admins** can access and test Enterprise Builder
- **Regular users** don't see it (no confusion, no incomplete features)
- Perfect for iterative development

### Production Mode (Flag Enabled)
- **All Growth+ users** can access Enterprise Builder
- Appears in navigation and docs
- Full production release

### Gradual Rollout
- Enable flag for beta testing
- Monitor usage and feedback
- Disable if issues arise
- Re-enable after fixes

---

## Testing Checklist

### As Admin (Flag Disabled):
- [ ] Enterprise Builder appears in sidebar
- [ ] Can access `/enterprise-builder` route
- [ ] Enterprise tab shows in Prompt Guide
- [ ] Can toggle flag in Admin Panel

### As Regular User (Flag Disabled):
- [ ] Enterprise Builder NOT in sidebar
- [ ] Can still manually visit `/enterprise-builder` (but shouldn't be discoverable)
- [ ] Enterprise tab NOT in Prompt Guide

### As Regular User (Flag Enabled):
- [ ] Enterprise Builder appears in sidebar (if Growth+ plan)
- [ ] Can access `/enterprise-builder` route
- [ ] Enterprise tab shows in Prompt Guide

### Feature Flag Toggle:
- [ ] Enabling flag makes feature visible
- [ ] Disabling flag hides feature from non-admins
- [ ] No page reload needed (state updates on navigation)

---

## Why This Approach?

### Benefits:
1. **Safe Development** - Test features without exposing to users
2. **Admin Override** - Admins always have access for debugging
3. **Instant Control** - Toggle from admin panel, no code deploy needed
4. **Clean UX** - Users don't see incomplete/broken features
5. **Gradual Rollout** - Enable for beta, disable if issues

### Alternative Approaches (Not Used):
- ❌ **Tier-based** - Can't disable without changing plan structure
- ❌ **Environment variable** - Requires redeploy to change
- ❌ **Hardcoded** - No runtime control

---

## Future Enhancements

### Potential Additions:
- **User-specific flags** - Enable for specific users (beta testers)
- **Percentage rollout** - Show to X% of users gradually
- **A/B testing** - Test different versions
- **Analytics** - Track feature usage when enabled

---

## Related Files

- Feature Flag Service: [src/services/featureFlagService.ts](../src/services/featureFlagService.ts)
- Sidebar Component: [src/components/Sidebar.tsx](../src/components/Sidebar.tsx)
- Docs Page: [src/pages/Docs.tsx](../src/pages/Docs.tsx)
- App Routing: [src/App.tsx](../src/App.tsx)
- Database Migration: [database/007_add_enterprise_builder_flag.sql](../database/007_add_enterprise_builder_flag.sql)
- Admin Panel: [src/pages/Admin.tsx](../src/pages/Admin.tsx)

---

## Summary

Enterprise Builder is now a **fully controllable feature** via admin panel. This gives you complete control over when and how to release it to users, while maintaining admin access for development and testing.

**Current State**: Disabled by default, visible only to admins.

**To Enable**: Admin Panel → Feature Flags → Toggle Enterprise Builder ON
