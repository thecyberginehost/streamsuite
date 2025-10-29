# Security Migration - Complete

## Overview
Successfully migrated all Claude API calls from browser-exposed (insecure) to Supabase Edge Functions (secure server-side).

## Changes Made

### 1. Created Supabase Edge Functions
Created 4 secure server-side Edge Functions in `supabase/functions/`:

#### `generate-workflow/index.ts`
- Handles single workflow generation
- Accepts: `prompt`, `platform`, `useTemplateId`
- Returns: `workflow`, `templateUsed`, `creditsUsed`, `tokensUsed`

#### `debug-workflow/index.ts`
- Handles workflow debugging and fixing
- Accepts: `workflowJson`, `errorDescription`, `platform`
- Returns: `fixedWorkflow`, `creditsUsed`, `tokensUsed`, `issues`

#### `batch-generate/index.ts`
- Handles batch workflow generation (2-10 workflows)
- Accepts: `prompt`, `platform`, `workflowCount`
- Returns: `workflows[]`, `creditsUsed`, `tokensUsed`

#### `generate-code/index.ts`
- Handles custom code generation for n8n, Make.com, Zapier
- Accepts: `prompt`, `platform`, `language`
- Returns: `code`, `explanation`, `tokensUsed`

### 2. Updated Frontend Service (`src/services/aiService.ts`)

#### Removed:
- `import Anthropic from '@anthropic-ai/sdk'` - No longer needed
- Direct Claude API instantiation: `new Anthropic({ apiKey, dangerouslyAllowBrowser: true })`
- All system prompts (N8N_SYSTEM_PROMPT, BATCH_PLANNING_SYSTEM_PROMPT, etc.) - Moved to Edge Functions
- All direct `anthropic.messages.create()` calls
- `planWorkflowArchitecture()` internal function - Now handled by Edge Function

#### Added:
- `import { supabase } from '@/integrations/supabase/client'` - For Edge Function calls

#### Updated Functions:
1. **generateWorkflow()** - Now calls `generate-workflow` Edge Function
2. **debugWorkflow()** - Now calls `debug-workflow` Edge Function
3. **generateBatchWorkflows()** - Now calls `batch-generate` Edge Function
4. **generateCustomCode()** - Now calls `generate-code` Edge Function

### 3. Security Pattern

All Edge Functions follow this secure pattern:

```typescript
// 1. Verify authentication
const { data: { user } } = await supabaseClient.auth.getUser()
if (!user) {
  return Response with 401 Unauthorized
}

// 2. Get Claude API key from server-side environment
const claudeApiKey = Deno.env.get('VITE_CLAUDE_API_KEY')

// 3. Call Claude API server-side (hidden from browser)
const response = await fetch('https://api.anthropic.com/v1/messages', {
  headers: { 'x-api-key': claudeApiKey },
  body: JSON.stringify({ ... })
})

// 4. Return processed result
return Response with workflow/code/debug result
```

Frontend pattern:

```typescript
// 1. Get auth session
const { data: { session } } = await supabase.auth.getSession()
if (!session) throw new Error('Please log in')

// 2. Call Edge Function
const { data, error } = await supabase.functions.invoke('function-name', {
  body: { /* parameters */ }
})

// 3. Handle response
return processed data
```

## Security Improvements

### Before (INSECURE):
- ❌ Claude API key exposed in browser via `import.meta.env.VITE_CLAUDE_API_KEY`
- ❌ API key visible in Network tab (dev tools)
- ❌ `dangerouslyAllowBrowser: true` flag enabled
- ❌ Anyone with frontend access could extract the key
- ❌ All system prompts exposed in frontend bundle

### After (SECURE):
- ✅ Claude API key stored server-side only (Supabase secrets)
- ✅ Never exposed to browser
- ✅ Authentication required for all AI operations
- ✅ All API calls happen on Supabase Edge Functions
- ✅ System prompts moved to Edge Functions (not in frontend bundle)
- ✅ Frontend only sends user prompts, receives results

## Deployment Requirements

### 1. Set Supabase Secrets
```bash
# Set Claude API key in Supabase (DO NOT commit this!)
supabase secrets set VITE_CLAUDE_API_KEY=your-claude-api-key-here
```

### 2. Deploy Edge Functions
```bash
# Deploy all functions
supabase functions deploy generate-workflow
supabase functions deploy debug-workflow
supabase functions deploy batch-generate
supabase functions deploy generate-code
```

### 3. Remove from Vercel Environment Variables
- ❌ REMOVE `VITE_CLAUDE_API_KEY` from Vercel env vars (no longer needed in frontend)
- ✅ Keep `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (these are public)

## Testing Checklist

- [ ] Test workflow generation from Generator page
- [ ] Test batch workflow generation from Batch Generator page
- [ ] Test workflow debugging from Debugger page
- [ ] Test custom code generation from Generator page (Code tab)
- [ ] Verify API key NOT visible in browser Network tab
- [ ] Verify authentication required (test when logged out)
- [ ] Test error handling (invalid inputs, API failures)

## Files Modified

### Frontend:
- `src/services/aiService.ts` - Updated all functions to call Edge Functions

### Backend (New):
- `supabase/functions/generate-workflow/index.ts`
- `supabase/functions/debug-workflow/index.ts`
- `supabase/functions/batch-generate/index.ts`
- `supabase/functions/generate-code/index.ts`

## Cost Impact

**No change in API costs** - Same number of Claude API calls, just moved server-side.

**Supabase Edge Function costs** (minimal):
- First 2 million invocations/month: FREE
- After that: $0.40 per 1M invocations
- Expected: Well within free tier

## Next Steps

1. Deploy Edge Functions to Supabase
2. Set VITE_CLAUDE_API_KEY secret in Supabase
3. Remove VITE_CLAUDE_API_KEY from Vercel
4. Test all AI features
5. Update INVESTOR_DEMO_READINESS.md (mark security blocker as resolved)

## Rollback Plan

If issues arise:
1. Git revert to previous commit
2. Redeploy frontend
3. API key will be back in browser (insecure but functional)

---

**Migration Date**: 2025-10-28
**Status**: ✅ COMPLETE - Ready for deployment
**Security Level**: 🔒 SECURE - API keys no longer exposed
