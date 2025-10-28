# Admin Panel Documentation

## Overview

The Admin Panel is a secure interface for managing users, plans, and credits within StreamSuite. It provides administrators with tools to:

- View all users and their account details
- Upgrade/downgrade user subscription plans
- Manually add regular or bonus credits
- View user activity and transaction history
- Monitor platform usage statistics

## Access Control

### Setting Admin Status

After running the database migrations, you need to manually set your admin user:

```sql
-- Connect to your Supabase SQL editor and run:
UPDATE profiles
SET is_admin = true
WHERE email = 'your-admin-email@example.com';
```

### Security

- Admin status is stored in the `profiles.is_admin` column (boolean)
- The admin panel automatically checks admin status on load
- Non-admin users are redirected to the home page if they attempt to access `/admin`
- All admin service functions verify admin status before executing operations

## Features

### 1. User Management Dashboard

**Location:** `/admin`

**Stats Overview:**
- Total Users count
- Paid Users count (Pro + Agency tiers)
- Total Credits across all users

**User Table Columns:**
- Email (with ADMIN badge if applicable)
- Full Name
- Subscription Plan (Free, Pro, Agency)
- Regular Credits
- Bonus Credits
- Total Credits
- Join Date
- Action buttons

### 2. Plan Management

**Update User Plan:**
- Select from Free (5 credits), Pro (200 credits), or Agency (800 credits)
- Immediately updates user's subscription tier
- Automatically sets regular credits to new plan's allocation
- Bonus credits are preserved

**Use Cases:**
- Testing different subscription tiers
- Upgrading beta users
- Compensating users for issues
- Manual tier changes without Stripe

### 3. Credit Management

**Add Credits:**
- Credit Type: Regular or Bonus
- Amount: Any positive integer
- Reason: Required text field for audit trail

**Credit Types:**
- **Regular Credits:** Monthly subscription credits (expire with 50% rollover)
- **Bonus Credits:** Purchased or earned credits (never expire)

**Use Cases:**
- Testing workflow generation with different credit amounts
- Compensating users for bugs or downtime
- Rewarding power users or beta testers
- Manual credit grants for promotions

### 4. User Activity Monitoring

**Activity Stats:**
- Total Workflows created
- Total Credits Used (lifetime)
- Last Activity date

**Recent Transactions:**
- Operation type (workflow_generation, conversion, debug, etc.)
- Credits used
- Credit type (regular or bonus)
- Transaction date

## Database Schema

### Migrations

Two migrations were created:

1. **`001_add_bonus_credits.sql`** - Dual credit system
   - Adds `bonus_credits` column to profiles
   - Adds `use_bonus_first` preference column
   - Creates `credit_purchases` table
   - Creates `onboarding_progress` table
   - Sets up Row Level Security policies

2. **`002_add_admin_role.sql`** - Admin role support
   - Adds `is_admin` column to profiles
   - Creates index for fast admin lookups
   - Includes rollback instructions

### Running Migrations

```bash
# Option 1: Using Supabase CLI
supabase db push

# Option 2: Manual via Supabase Dashboard
# 1. Go to SQL Editor in Supabase Dashboard
# 2. Copy contents of migration files
# 3. Run each migration in order
```

## API Functions

### Admin Service (`src/services/adminService.ts`)

#### `isAdmin(): Promise<boolean>`
Checks if current user has admin privileges.

#### `getAllUsers(): Promise<AdminUser[]>`
Fetches all users with profile and credit data. Admin only.

#### `updateUserPlan(userId: string, newTier: 'free' | 'pro' | 'agency'): Promise<void>`
Updates user's subscription tier and credit allocation. Admin only.

**Credit Allocations:**
- Free: 5 credits/month
- Pro: 200 credits/month
- Agency: 800 credits/month

#### `addCreditsToUser(userId: string, amount: number, type: 'regular' | 'bonus', reason: string): Promise<void>`
Manually adds credits to a user's account. Admin only.

**Parameters:**
- `userId` - Target user's UUID
- `amount` - Positive integer of credits to add
- `type` - 'regular' or 'bonus'
- `reason` - Audit trail description

#### `getUserActivity(userId: string): Promise<UserActivity>`
Fetches user's workflow history and credit transaction log. Admin only.

#### `toggleAdminStatus(userId: string, makeAdmin: boolean): Promise<void>`
Grants or revokes admin privileges. Super admin only.

## UI Components

### Admin Page (`src/pages/Admin.tsx`)

**Key Features:**
- Responsive user table with search
- Three action buttons per user: Change Plan, Add Credits, Activity
- Real-time stats dashboard
- Modal dialogs for all actions
- Loading states and error handling
- Dark mode support

**Dialogs:**

1. **Update Plan Dialog**
   - Dropdown selector for tier
   - Warning about immediate credit update
   - Confirms action before executing

2. **Add Credits Dialog**
   - Credit type selector (regular/bonus)
   - Number input for amount
   - Text input for reason (required)
   - Validation for positive amounts

3. **User Activity Dialog**
   - Stats grid showing workflows, credits used, last activity
   - Recent transactions table
   - Empty states for new users

### Sidebar Integration (`src/components/Sidebar.tsx`)

- Admin link only visible to users with `is_admin = true`
- Separated by divider from main navigation
- Purple color scheme to distinguish from regular links
- Shield icon for easy identification

## Testing Guide

### 1. Set Up Admin User

```sql
UPDATE profiles
SET is_admin = true
WHERE email = 'your-test-email@example.com';
```

### 2. Access Admin Panel

Navigate to `/admin` in your browser while logged in as admin user.

### 3. Test Plan Updates

1. Select a non-admin user
2. Click "Change Plan"
3. Select different tier
4. Confirm and verify:
   - User's `subscription_tier` updated
   - User's `credits_remaining` matches new tier allocation
   - Bonus credits unchanged

### 4. Test Credit Addition

1. Select a user
2. Click "Add Credits"
3. Enter:
   - Amount: 50
   - Type: Bonus
   - Reason: "Testing admin panel"
4. Confirm and verify:
   - User's bonus_credits increased by 50
   - Transaction appears in activity log

### 5. Test Activity Monitoring

1. Generate a workflow as a test user
2. View that user's activity as admin
3. Verify:
   - Total workflows count increased
   - Recent transaction appears
   - Credits used reflects deduction

## Security Considerations

### Row Level Security (RLS)

All admin operations bypass RLS by using service role, but the API functions enforce admin checks before executing.

### Best Practices

1. **Limited Admin Access:** Only grant admin privileges to trusted team members
2. **Audit Reasons:** Always require reasons for manual credit additions
3. **Log Actions:** All admin actions are logged to console (production should use proper logging service)
4. **Read-Only Operations:** Activity monitoring is read-only and safe
5. **Stripe Integration:** For production, plan changes should trigger Stripe webhook updates

## Future Enhancements

### Phase 1 (Current)
- ✅ Basic user management
- ✅ Plan upgrades/downgrades
- ✅ Manual credit additions
- ✅ Activity monitoring

### Phase 2 (Planned)
- [ ] Bulk operations (upgrade multiple users)
- [ ] CSV export of user data
- [ ] Advanced filtering (by tier, credit balance, last activity)
- [ ] Email users from admin panel
- [ ] Impersonate user for support debugging

### Phase 3 (Future)
- [ ] Analytics dashboard (revenue, churn, usage patterns)
- [ ] Credit usage graphs and trends
- [ ] Automated alerts (low credit warnings, heavy usage)
- [ ] Admin action audit log (who did what when)
- [ ] Role-based permissions (super admin vs support admin)

## Troubleshooting

### "Access Denied" when accessing /admin

**Solution:** Verify `is_admin = true` in profiles table:
```sql
SELECT id, email, is_admin FROM profiles WHERE email = 'your-email@example.com';
```

### Admin link not showing in sidebar

**Solution:**
1. Check console for errors in `isAdmin()` call
2. Verify RLS policies allow reading own profile
3. Hard refresh browser (Cmd+Shift+R or Ctrl+Shift+R)

### "Failed to load users" error

**Solution:**
1. Check Supabase connection in Network tab
2. Verify `auth.admin.listUsers()` permissions (may require service role key in production)
3. Check browser console for detailed error message

### Plan update not reflecting credits

**Solution:**
Verify credit allocations in `updateUserPlan()` function match your subscription tiers:
```typescript
const creditAllocations = {
  free: 5,
  pro: 200,
  agency: 800,
};
```

## Related Documentation

- [CREDIT_ARCHITECTURE.md](./CREDIT_ARCHITECTURE.md) - Dual credit system design
- [CLAUDE.md](./CLAUDE.md) - Project overview and architecture
- [supabase/migrations/](./supabase/migrations/) - Database schema changes
