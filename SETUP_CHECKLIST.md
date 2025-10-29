# StreamSuite n8n Integration Setup Checklist

## Current Status: ⚠️ Setup Required

You're getting 404 errors because the database tables don't exist yet and you haven't added an n8n connection.

## Step-by-Step Setup

### Step 1: Run Database Migration ✅ **DO THIS FIRST**

1. Go to https://supabase.com/dashboard/project/tlxpfjjckmvotkdiabll/sql/new
2. Copy **ALL** contents from `supabase/migrations/007_add_n8n_integration.sql`
3. Paste into the SQL Editor
4. Click **RUN** (or press Ctrl+Enter)
5. You should see: "Success. No rows returned"

**Verify migration worked:**
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('n8n_connections', 'pushed_workflows');
```
Should return 2 rows.

### Step 2: Add Your First n8n Connection

1. Go to http://localhost:5173/settings (or your app URL)
2. Scroll to "n8n Instance Connections" section
3. Click **"Add Connection"**
4. Fill in:
   - **Connection Name**: "My n8n Instance" (or whatever you want)
   - **Instance URL**: Your n8n instance URL (e.g., `https://n8n.example.com`)
   - **API Key**: Your n8n API key
     - Get this from your n8n instance: Settings → API
5. Click **"Save & Test Connection"**
6. You should see "Connection successful"

### Step 3: Test Monitoring Features

#### Option A: Via Monitoring Page (Recommended)
1. Go to http://localhost:5173/monitoring
2. You should see your n8n connection card
3. Click **"View Workflows"**
4. You should see two tabs:
   - **"All Workflows"** - Shows ALL workflows in your n8n instance
   - **"Pushed from StreamSuite"** - Shows workflows you've pushed via StreamSuite

#### Option B: Via Settings Page
1. Go to http://localhost:5173/settings
2. Find your n8n connection
3. Click **"View Workflows"** button
4. Same tabs as above

### Step 4: Push a Workflow (Optional)

1. Go to http://localhost:5173/ (Generator)
2. Generate a workflow with AI
3. Click **"Push to n8n"** button
4. Select your n8n connection
5. The workflow will be pushed to your n8n instance
6. Go back to Monitoring → "Pushed from StreamSuite" tab
7. You should see your pushed workflow listed

### Step 5: Monitor Executions (Growth Plan Only)

If you're on the Growth plan:
1. In the "All Workflows" or "Pushed from StreamSuite" tab
2. Click **"View Executions"** on any workflow
3. You'll see the last 20 executions with:
   - Status (Success/Failed/Running)
   - Timestamp
   - Error messages (if failed)
   - **"Retry"** button for failed executions

## Troubleshooting

### Error: "Connection not found" (404)
- **Cause**: Migration not run yet or connection not added
- **Fix**: Complete Steps 1 and 2 above

### Error: "Missing connectionId parameter" (400)
- **Cause**: Edge Function needs redeployment
- **Fix**: Already done (deployment_id: _3)

### Error: "Failed to fetch workflows from n8n"
- **Cause**: n8n instance URL or API key is incorrect
- **Fix**:
  1. Go to Settings
  2. Delete the connection
  3. Add it again with correct credentials
  4. Test the connection before saving

### Workflows Tab Shows "No workflows found"
- **Possible causes**:
  1. Your n8n instance actually has no workflows yet
  2. API key doesn't have permission to view workflows
  3. n8n instance URL is wrong
- **Fix**:
  - Check your n8n instance directly to verify workflows exist
  - Make sure your API key has read permissions

## What You'll See After Setup

### Monitoring Page
```
┌─────────────────────────────────────┐
│  Workflow Monitoring                │
│  Monitor and manage your n8n...     │
├─────────────────────────────────────┤
│                                     │
│  Your n8n Connections               │
│                                     │
│  ┌───────────────┐ ┌──────────────┐│
│  │ My n8n        │ │ Production   ││
│  │ Instance      │ │ n8n          ││
│  │               │ │              ││
│  │ ✓ Connected   │ │ ✓ Connected  ││
│  │               │ │              ││
│  │ [View Workflows]│[View Workflows]│
│  └───────────────┘ └──────────────┘│
└─────────────────────────────────────┘
```

### Workflows Dialog (After clicking "View Workflows")
```
┌─────────────────────────────────────┐
│  Workflows - My n8n Instance        │
├─────────────────────────────────────┤
│  [All Workflows (5)] [Pushed (2)]   │
├─────────────────────────────────────┤
│                                     │
│  All Workflows Tab:                 │
│  - Email Automation ✓ Active        │
│    [View Executions]                │
│                                     │
│  - Slack Integration ✗ Inactive     │
│    [View Executions]                │
│                                     │
│  - Customer Onboarding ✓ Active     │
│    [View Executions]                │
│                                     │
└─────────────────────────────────────┘
```

## Need Help?

If you're still having issues after completing all steps:
1. Check browser console (F12 → Console) for error messages
2. Check Supabase Edge Function logs: https://supabase.com/dashboard/project/tlxpfjjckmvotkdiabll/functions/n8n-proxy/logs
3. Share the error messages for debugging assistance

## Quick Commands

**Check if tables exist:**
```sql
SELECT COUNT(*) FROM n8n_connections;
SELECT COUNT(*) FROM pushed_workflows;
```

**Check your connections:**
```sql
SELECT connection_name, instance_url, is_active, last_test_success
FROM n8n_connections
WHERE user_id = auth.uid();
```

**Check pushed workflows:**
```sql
SELECT workflow_name, push_status, pushed_at
FROM pushed_workflows
WHERE user_id = auth.uid()
ORDER BY pushed_at DESC;
```
