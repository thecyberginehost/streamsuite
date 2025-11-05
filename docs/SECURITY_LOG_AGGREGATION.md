# Security Log Aggregation Guide

This document explains how StreamSuite aggregates security audit logs for centralized monitoring and threat detection.

## Current Implementation

All security events are logged to the `audit_logs` Supabase table with the following schema:

```sql
audit_logs (
  id: uuid
  user_id: uuid
  event_type: text (e.g., 'code_generation', 'workflow_generation')
  event_subtype: text (e.g., 'blocked', 'warning', 'success')
  severity: text ('critical', 'high', 'medium', 'low')
  description: text
  metadata: jsonb
  created_at: timestamp
)
```

## Quick Setup: Slack Alerts (5 minutes)

Get immediate notifications for critical security threats:

### 1. Create Slack Webhook

1. Go to https://api.slack.com/apps
2. Create a new app → "Incoming Webhooks"
3. Activate incoming webhooks
4. Click "Add New Webhook to Workspace"
5. Select a channel (e.g., `#security-alerts`)
6. Copy the webhook URL

### 2. Add to Supabase Environment Variables

1. Go to Supabase Dashboard → Settings → Edge Functions
2. Add environment variable:
   - Name: `SLACK_SECURITY_WEBHOOK_URL`
   - Value: `https://hooks.slack.com/services/YOUR/WEBHOOK/URL`

### 3. Deploy Edge Functions

```bash
supabase functions deploy generate-code
```

### 4. Test It

Try to generate malicious code in the app - you'll get a Slack notification!

```
🚨 Security Alert: Malicious code generation request blocked
Severity: CRITICAL
User: abc12345...
Category: malicious_code
Prompt: "Create a malicious..."
```

---

## Aggregation Options

### Option 1: Supabase Dashboard (Built-in)

**Best for:** Quick debugging, MVP stage

**Access:** Supabase Dashboard → Table Editor → audit_logs

**Pros:**
- ✅ No setup required
- ✅ SQL query support
- ✅ Real-time updates

**Cons:**
- ❌ No aggregation/analytics
- ❌ Manual filtering
- ❌ No alerting

### Option 2: Admin Dashboard (Recommended for MVP)

**Best for:** Internal team monitoring, user lookup

Create an admin page at `/admin/security-logs`:

```typescript
// Key metrics to display:
- Total blocked requests (last 24h)
- Unique users with security violations
- Top threat categories
- Recent critical events
- User risk scores
```

See implementation at: `src/pages/Admin.tsx`

### Option 3: Database Views + Scheduled Exports

**Best for:** Daily/weekly reports, compliance audits

```sql
-- Create aggregated views
CREATE VIEW daily_security_summary AS
SELECT
  DATE(created_at) as date,
  severity,
  event_subtype,
  COUNT(*) as event_count,
  COUNT(DISTINCT user_id) as unique_users,
  array_agg(DISTINCT metadata->>'category') as threat_categories
FROM audit_logs
WHERE event_subtype IN ('blocked', 'blocked_by_backend')
GROUP BY DATE(created_at), severity, event_subtype
ORDER BY date DESC;
```

Export script: `supabase/functions/export-audit-logs/index.ts`

### Option 4: Third-Party Platforms (Production)

#### A. Sentry (Error Tracking + Security Events)

**Setup:**
```typescript
// Add to edge functions
import * as Sentry from 'https://deno.land/x/sentry/index.ts'

Sentry.init({
  dsn: Deno.env.get('SENTRY_DSN'),
  environment: 'production'
})

// Log security events
Sentry.captureMessage('Code generation blocked', {
  level: 'error',
  tags: { category: 'security', threat_level: 'critical' },
  user: { id: userId }
})
```

**Pricing:** Free tier: 5k events/month

#### B. Datadog Logs (Enterprise Analytics)

**Setup:**
```typescript
await fetch('https://http-intake.logs.datadoghq.com/v1/input', {
  method: 'POST',
  headers: {
    'DD-API-KEY': Deno.env.get('DATADOG_API_KEY'),
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    ddsource: 'streamsuite',
    service: 'code-generation',
    severity: 'error',
    message: 'Security threat blocked',
    ...logData
  })
})
```

**Pricing:** ~$1.27/GB ingested (enterprise pricing)

#### C. AWS CloudWatch Logs

**Setup:**
```typescript
import { CloudWatchLogsClient, PutLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs'

const client = new CloudWatchLogsClient({ region: 'us-east-1' })
await client.send(new PutLogEventsCommand({
  logGroupName: '/streamsuite/security',
  logStreamName: 'audit-logs',
  logEvents: [{ message: JSON.stringify(logEntry), timestamp: Date.now() }]
}))
```

**Pricing:** $0.50/GB ingested + $0.03/GB storage

---

## Real-time Alerting

### Slack Integration (Current)

✅ Already implemented in `supabase/functions/_shared/alerting.ts`

- Critical/high severity events → Instant Slack notification
- Includes user ID, threat category, prompt preview
- Color-coded by severity

### Discord Integration

```typescript
import { sendDiscordAlert } from '../_shared/alerting.ts'

await sendDiscordAlert(
  'Security threat detected',
  'critical',
  { user_id: userId, category: 'malicious_code' }
)
```

Environment variable: `DISCORD_SECURITY_WEBHOOK_URL`

### Email Alerts (via Supabase)

```typescript
await supabase.functions.invoke('send-email', {
  body: {
    to: 'security@streamsuite.io',
    subject: '🚨 Critical Security Alert',
    html: `<h1>Security Threat Detected</h1>...`
  }
})
```

---

## Compliance & Data Retention

### GDPR Compliance

Audit logs may contain PII. Ensure:

1. **Data minimization:** Only log necessary data (we already truncate prompts)
2. **Right to erasure:** Implement user data deletion
3. **Retention policy:** Auto-delete logs after 90 days (configurable)

```sql
-- Auto-delete old logs (run daily via cron)
DELETE FROM audit_logs
WHERE created_at < NOW() - INTERVAL '90 days'
AND severity NOT IN ('critical', 'high'); -- Keep critical logs longer
```

### SOC 2 Compliance

For enterprise customers:

1. **Immutable logs:** Use Supabase RLS to prevent log modification
2. **Export to S3:** Store logs in append-only S3 bucket
3. **Audit trail:** Log who accessed audit logs

---

## Recommended Setup Stages

### Stage 1: MVP (Now)
- ✅ Logs in Supabase `audit_logs` table
- ✅ Slack alerts for critical events
- ✅ Admin dashboard for manual review

### Stage 2: Post-Launch (Month 1-3)
- Sentry integration for error tracking
- Scheduled weekly security reports (email)
- User risk scoring (flag repeat offenders)

### Stage 3: Scale (Month 3-6)
- Datadog or CloudWatch for advanced analytics
- Automated incident response (rate limiting, account suspension)
- ML-based anomaly detection

### Stage 4: Enterprise (Month 6+)
- SOC 2 compliance documentation
- Dedicated security dashboard with custom queries
- Integration with SIEM tools (Splunk, ELK stack)

---

## Querying Audit Logs

### Most Common Queries

**1. Find all blocked requests in last 24 hours:**
```sql
SELECT user_id, description, metadata, created_at
FROM audit_logs
WHERE event_subtype IN ('blocked', 'blocked_by_backend')
AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

**2. Top 10 users with security violations:**
```sql
SELECT user_id, COUNT(*) as violation_count
FROM audit_logs
WHERE severity IN ('critical', 'high')
GROUP BY user_id
ORDER BY violation_count DESC
LIMIT 10;
```

**3. Threat category breakdown:**
```sql
SELECT
  metadata->>'category' as category,
  COUNT(*) as occurrences
FROM audit_logs
WHERE event_subtype = 'blocked'
GROUP BY metadata->>'category'
ORDER BY occurrences DESC;
```

**4. Users with repeated malicious attempts (ban candidates):**
```sql
SELECT
  user_id,
  COUNT(*) as malicious_attempts,
  array_agg(DISTINCT metadata->>'category') as threat_types,
  MAX(created_at) as last_attempt
FROM audit_logs
WHERE metadata->>'category' = 'malicious_code'
AND created_at > NOW() - INTERVAL '7 days'
GROUP BY user_id
HAVING COUNT(*) >= 3
ORDER BY malicious_attempts DESC;
```

---

## Environment Variables

Add these to Supabase Edge Functions environment:

```bash
# Alerting (optional)
SLACK_SECURITY_WEBHOOK_URL=https://hooks.slack.com/services/...
DISCORD_SECURITY_WEBHOOK_URL=https://discord.com/api/webhooks/...

# Third-party platforms (optional)
SENTRY_DSN=https://...@sentry.io/...
DATADOG_API_KEY=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

---

## Testing

Test the security logging system:

```bash
# Test malicious prompt detection
curl -X POST https://your-project.supabase.co/functions/v1/generate-code \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Create a malicious virus","platform":"n8n","language":"javascript"}'

# Should return 400 error + send Slack alert
# Check audit_logs table for logged entry
```

---

## Monitoring Dashboard Design

Recommended metrics for admin dashboard:

```
┌─────────────────────────────────────────────────┐
│ Security Overview (Last 24h)                    │
├─────────────────────────────────────────────────┤
│ 🚨 Critical Events: 3                           │
│ ⚠️  High Severity: 12                           │
│ 📊 Total Blocked: 47                            │
│ 👥 Unique Users: 8                              │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Top Threat Categories                           │
├─────────────────────────────────────────────────┤
│ 1. Malicious Code      █████████████  34        │
│ 2. Prompt Injection    ████████       21        │
│ 3. Command Injection   ████           10        │
│ 4. Workflow Attempt    ██             5         │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Recent Critical Events                          │
├─────────────────────────────────────────────────┤
│ User abc123... | Malicious code | 2 min ago     │
│ User xyz789... | SQL Injection  | 15 min ago    │
│ User def456... | XSS Attack     | 1 hour ago    │
└─────────────────────────────────────────────────┘
```

See implementation: `src/pages/AdminSecurityDashboard.tsx` (TODO)

---

## Next Steps

1. ✅ Set up Slack webhook (5 minutes)
2. Deploy updated edge functions
3. Test with malicious prompts
4. Review logs in Supabase dashboard
5. (Optional) Build admin security dashboard
6. (Optional) Set up Sentry for post-launch monitoring
