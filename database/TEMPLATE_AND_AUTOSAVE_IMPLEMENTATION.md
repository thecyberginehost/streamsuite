# Template Restrictions & Auto-Save History Implementation Guide

## Overview

This guide explains how to implement template access restrictions and auto-save history based on subscription tiers.

---

## Database Setup

### Run Migration

Execute the migration script in Supabase SQL Editor:

```bash
# In Supabase Dashboard → SQL Editor → New Query
# Paste and run: database/017_add_template_restrictions_and_auto_save.sql
```

### What Gets Created

1. **`workflow_templates` table** - Stores all n8n workflow templates
2. **`auto_saved` column** - Added to `workflows` table to track auto-saves
3. **Helper functions** - Feature access checks
4. **`accessible_templates` view** - Shows only templates user can access
5. **3 starter templates** - Seeded for Starter tier users

---

## Feature Implementation

### 1. Template Access Control

#### Backend (Database)

The database has a helper function to check template access:

```sql
SELECT can_access_template('starter', template_id);  -- true/false
SELECT has_full_template_access('pro');  -- true (Pro+ get all)
```

#### Frontend (React)

Use the `accessible_templates` view to fetch only accessible templates:

```typescript
// src/services/templateService.ts
import { supabase } from '@/integrations/supabase/client';

export async function getAccessibleTemplates() {
  const { data, error } = await supabase
    .from('accessible_templates')
    .select('*')
    .eq('can_access', true)  // Only templates user can access
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Check template count for display
export async function getTemplateAccessInfo(userTier: string) {
  const templates = await getAccessibleTemplates();

  return {
    totalAccessible: templates.length,
    isLimited: userTier === 'starter',
    maxTemplates: userTier === 'starter' ? 3 : null,  // null = unlimited
    hasFullAccess: ['pro', 'growth', 'agency'].includes(userTier)
  };
}
```

#### Usage in Components

```typescript
// In Templates.tsx
import { getAccessibleTemplates, getTemplateAccessInfo } from '@/services/templateService';
import { useProfile } from '@/hooks/useProfile';

export default function Templates() {
  const { profile } = useProfile();
  const [templates, setTemplates] = useState([]);
  const [accessInfo, setAccessInfo] = useState(null);

  useEffect(() => {
    async function loadTemplates() {
      const data = await getAccessibleTemplates();
      const info = await getTemplateAccessInfo(profile.subscription_tier);

      setTemplates(data);
      setAccessInfo(info);
    }

    loadTemplates();
  }, [profile]);

  return (
    <div>
      {accessInfo?.isLimited && (
        <Alert>
          You have access to {accessInfo.totalAccessible} templates.
          Upgrade to Pro for unlimited templates!
        </Alert>
      )}

      {templates.map(template => (
        <TemplateCard key={template.id} template={template} />
      ))}
    </div>
  );
}
```

---

### 2. Auto-Save History

#### Backend Logic

The database function determines if auto-save is enabled:

```sql
SELECT has_auto_save_history('pro');  -- true
SELECT has_auto_save_history('starter');  -- false
```

#### Frontend Implementation

Update workflow generation to auto-save for Pro+ users:

```typescript
// src/services/workflowService.ts
import { supabase } from '@/integrations/supabase/client';
import { hasAutoSaveHistory } from '@/config/subscriptionPlans';

export async function saveWorkflowToHistory(
  workflowData: any,
  userTier: string,
  isManualSave: boolean = false
) {
  // Check if auto-save or manual save
  const autoSaved = !isManualSave && hasAutoSaveHistory(userTier);

  const { data, error } = await supabase
    .from('workflows')
    .insert({
      workflow_data: workflowData,
      auto_saved: autoSaved,
      user_id: (await supabase.auth.getUser()).data.user?.id
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// After workflow generation
export async function handleWorkflowGenerated(
  workflow: any,
  userTier: string
) {
  // Auto-save for Pro, Growth, Agency
  if (hasAutoSaveHistory(userTier)) {
    await saveWorkflowToHistory(workflow, userTier, false);
    console.log('✅ Workflow auto-saved to history');
  } else {
    // Show "Save to History" button for Free/Starter
    console.log('💾 Workflow ready - user must manually save');
  }
}
```

#### Usage in Generator Component

```typescript
// src/pages/Generator.tsx
import { handleWorkflowGenerated } from '@/services/workflowService';
import { useProfile } from '@/hooks/useProfile';
import { hasAutoSaveHistory } from '@/config/subscriptionPlans';

export default function Generator() {
  const { profile } = useProfile();
  const [generatedWorkflow, setGeneratedWorkflow] = useState(null);
  const [showSaveButton, setShowSaveButton] = useState(false);

  async function onWorkflowGenerated(workflow: any) {
    setGeneratedWorkflow(workflow);

    // Auto-save for Pro+
    if (hasAutoSaveHistory(profile.subscription_tier)) {
      await handleWorkflowGenerated(workflow, profile.subscription_tier);
      toast.success('Workflow generated and saved to history!');
    } else {
      // Show manual save button for Free/Starter
      setShowSaveButton(true);
      toast.success('Workflow generated! Click "Save to History" to keep it.');
    }
  }

  async function handleManualSave() {
    await saveWorkflowToHistory(generatedWorkflow, profile.subscription_tier, true);
    toast.success('Saved to history!');
    setShowSaveButton(false);
  }

  return (
    <div>
      {/* ... workflow generation UI ... */}

      {showSaveButton && (
        <Button onClick={handleManualSave}>
          <Save className="mr-2 h-4 w-4" />
          Save to History
        </Button>
      )}
    </div>
  );
}
```

---

## Feature Matrix

| Feature | Free | Starter | Pro | Growth | Agency |
|---------|------|---------|-----|--------|--------|
| **Template Access** | ❌ None | ✅ 3 only | ✅ All | ✅ All | ✅ All |
| **Auto-Save History** | ❌ Manual | ❌ Manual | ✅ Auto | ✅ Auto | ✅ Auto |
| **History Access** | ❌ | ✅ | ✅ | ✅ | ✅ |

---

## Database Functions Reference

### `has_auto_save_history(user_tier TEXT)`
Returns `true` if user's tier has auto-save enabled (Pro, Growth, Agency).

```sql
SELECT has_auto_save_history('pro');  -- true
SELECT has_auto_save_history('starter');  -- false
```

### `has_full_template_access(user_tier TEXT)`
Returns `true` if user can access all templates (Pro, Growth, Agency).

```sql
SELECT has_full_template_access('growth');  -- true
SELECT has_full_template_access('starter');  -- false
```

### `can_access_template(user_tier TEXT, template_id UUID)`
Returns `true` if user can access a specific template.

```sql
SELECT can_access_template('starter', 'template-uuid');  -- Checks if starter-accessible
SELECT can_access_template('pro', 'any-template-uuid');  -- Always true for Pro+
```

---

## Adding New Templates

### For Starter Tier (3 templates maximum)

```sql
INSERT INTO public.workflow_templates (
  template_name,
  template_slug,
  description,
  category,
  difficulty,
  is_featured,
  is_starter_accessible,  -- TRUE for Starter access
  template_data,
  tags
) VALUES (
  'My Starter Template',
  'my-starter-template',
  'A simple workflow for beginners',
  'Productivity',
  'beginner',
  true,
  true,  -- ⬅️ Makes it accessible to Starter tier
  '{"nodes": [], "connections": {}}'::jsonb,
  ARRAY['tag1', 'tag2']
);
```

### For Pro+ Only

```sql
INSERT INTO public.workflow_templates (
  template_name,
  template_slug,
  description,
  category,
  difficulty,
  is_featured,
  is_starter_accessible,  -- FALSE for Pro+ only
  template_data,
  tags
) VALUES (
  'Advanced Pro Template',
  'advanced-pro-template',
  'Complex workflow with advanced features',
  'Advanced',
  'advanced',
  true,
  false,  -- ⬅️ Only Pro+ can access
  '{"nodes": [], "connections": {}}'::jsonb,
  ARRAY['advanced', 'pro']
);
```

---

## Testing

### Test Template Access

```typescript
// Should show 3 templates for Starter
const starterTemplates = await getAccessibleTemplates();
console.log('Starter sees:', starterTemplates.length, 'templates');

// Should show all templates for Pro
const proTemplates = await getAccessibleTemplates();
console.log('Pro sees:', proTemplates.length, 'templates');
```

### Test Auto-Save

```typescript
// Starter user - should NOT auto-save
await handleWorkflowGenerated(workflow, 'starter');
// Expected: showSaveButton = true

// Pro user - should auto-save
await handleWorkflowGenerated(workflow, 'pro');
// Expected: workflow saved automatically, showSaveButton = false
```

---

## Deployment Checklist

- [ ] Run migration 017 in Supabase
- [ ] Replace placeholder template data with real n8n workflows
- [ ] Add more templates (mark Pro+ as `is_starter_accessible = false`)
- [ ] Implement `getAccessibleTemplates()` in frontend
- [ ] Update Generator to use `hasAutoSaveHistory()`
- [ ] Add "Save to History" button for Free/Starter users
- [ ] Test template restrictions with different tiers
- [ ] Test auto-save with different tiers
- [ ] Update Settings page to show feature differences
- [ ] Add upgrade prompts for template access

---

## Questions?

See the subscription plans configuration: `src/config/subscriptionPlans.ts`
