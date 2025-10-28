# StreamSuite MVP - Complete Build Guide

## 🎯 Mission: Launch Production-Ready MVP in 6 Days

This document contains EVERYTHING needed to build a production-quality StreamSuite MVP from scratch in a new development session.

---

## 📋 Project Context

**StreamSuite** is an AI-powered SaaS that generates n8n workflow JSON from natural language descriptions.

**Core Value Prop**: "Build workflow automations in 30 seconds" - Users describe what they want, AI generates production-ready n8n JSON.

**Tech Stack**:
- Frontend: React 18 + TypeScript + Vite
- UI: shadcn/ui + Tailwind CSS
- Backend: Supabase (Auth + Database)
- AI: Claude API (Sonnet 4.5)
- Deployment: Vercel

**Business Model**: Credit-based (deferred to v2 - MVP will have unlimited free access for beta users)

---

## 🏗️ Current Codebase Status

### ✅ Already Built (DO NOT REBUILD):
- Complete React + Vite + TypeScript setup
- All shadcn/ui components in `src/components/ui/`
- Supabase client in `src/integrations/supabase/client.ts`
- Comprehensive n8n knowledge base in `src/lib/n8n/`
- 15 production-ready n8n templates in `src/lib/n8n/raw-templates/`
- Workflow converter logic in `src/lib/workflowConverter.ts`
- App routing structure in `src/App.tsx`
- All hooks in `src/hooks/`

### ❌ Missing (MUST BUILD):

#### 1. **Page Components** (`src/pages/`)
- `Login.tsx` - Authentication page
- `Dashboard.tsx` - Main layout wrapper with sidebar
- `Generator.tsx` - Core AI workflow generation interface
- `NotFound.tsx` - 404 page

#### 2. **Service Layer** (`src/services/`)
- `aiService.ts` - Claude API integration for workflow generation
- `workflowService.ts` - Save/load workflows to/from Supabase
- `templateService.ts` - Load and recommend n8n templates

#### 3. **Workflow Components** (`src/components/workflow/`)
- `WorkflowJsonViewer.tsx` - Display generated JSON with syntax highlighting
- `TemplateRecommendation.tsx` - Show recommended templates
- `DownloadButton.tsx` - Download workflow as JSON file

#### 4. **Supabase Database Setup**
- Database schema (SQL provided below)
- Row Level Security (RLS) policies

#### 5. **Environment Configuration**
- `.env` file with API keys

---

## 🗄️ Supabase Database Schema

### Required Tables

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  credits INTEGER DEFAULT 100, -- Start with 100 free credits for beta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Workflows table (saved generations)
CREATE TABLE public.workflows (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  platform TEXT DEFAULT 'n8n', -- 'n8n', 'make', 'zapier'
  workflow_json JSONB NOT NULL,
  prompt TEXT, -- Original user prompt
  credits_used INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;

-- Workflows policies
CREATE POLICY "Users can view their own workflows"
  ON public.workflows FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create workflows"
  ON public.workflows FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workflows"
  ON public.workflows FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workflows"
  ON public.workflows FOR DELETE
  USING (auth.uid() = user_id);

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Indexes for performance
CREATE INDEX idx_workflows_user_id ON public.workflows(user_id);
CREATE INDEX idx_workflows_created_at ON public.workflows(created_at DESC);
```

---

## 🔑 Environment Variables

Create `.env` file in project root:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Claude AI Configuration
VITE_CLAUDE_API_KEY=sk-ant-api03-your-key-here

# Application Configuration
VITE_APP_URL=http://localhost:5173
VITE_APP_NAME=StreamSuite

# Feature Flags (for MVP)
VITE_ENABLE_PAYMENTS=false
VITE_ENABLE_HISTORY=false
VITE_ENABLE_CONVERTER=false
```

**How to get these:**
1. **Supabase**: Create new project at https://supabase.com → Settings → API
2. **Claude API**: Get key at https://console.anthropic.com → API Keys

---

## 📝 Implementation Specifications

### 1. Login Page (`src/pages/Login.tsx`)

**Requirements**:
- Email/password authentication via Supabase
- Toggle between Sign In / Sign Up modes
- Form validation with react-hook-form + zod
- Auto-redirect to dashboard after login
- Error handling for invalid credentials

**Key Features**:
- Clean, minimal UI (centered card)
- "Continue with Email" flow
- Password strength indicator on signup
- Loading states during auth
- Toast notifications for errors/success

**Code Structure**:
```typescript
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  // Form handling
  // Auth logic
  // Error handling

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
      <Card className="w-full max-w-md p-8">
        {/* Login form */}
      </Card>
    </div>
  );
}
```

---

### 2. Dashboard Layout (`src/pages/Dashboard.tsx`)

**Requirements**:
- Sidebar navigation with links
- Top bar with user menu and credit balance
- Responsive layout (collapsible sidebar on mobile)
- Outlet for nested routes
- Protected route wrapper

**Navigation Items**:
- 🏠 Generator (default `/`)
- ⚙️ Settings (future)
- 📊 History (future)

**Top Bar Elements**:
- Logo/branding
- Credit balance badge (e.g., "Credits: 95")
- User avatar dropdown (logout, profile)

**Code Structure**:
```typescript
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';

export default function Dashboard() {
  const { user, profile } = useAuth();

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar user={user} credits={profile?.credits || 0} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

---

### 3. Generator Page (`src/pages/Generator.tsx`)

**This is the CORE of the MVP - make it exceptional.**

**Requirements**:
- Large textarea for natural language prompt
- Platform selector (n8n, Make.com, Zapier) - default to n8n
- "Generate Workflow" button with loading state
- Template recommendations (before generation)
- JSON output viewer with syntax highlighting
- Download button for generated workflow
- Error handling and validation

**User Flow**:
1. User enters prompt: "Send an email when a new row is added to Google Sheets"
2. System shows recommended templates (if any match)
3. User clicks "Generate" or "Use Template"
4. Loading state with progress messages
5. Generated JSON appears in viewer
6. User can download, copy, or regenerate

**Key Features**:
- Real-time character count
- Example prompts (clickable)
- Cost estimation (e.g., "This will use ~1 credit")
- Template preview on hover
- Syntax-highlighted JSON output
- One-click download as `.json` file
- Copy to clipboard button
- Regenerate with modifications

**Code Structure**:
```typescript
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { generateWorkflow } from '@/services/aiService';
import { recommendTemplate } from '@/services/templateService';
import WorkflowJsonViewer from '@/components/workflow/WorkflowJsonViewer';
import TemplateRecommendation from '@/components/workflow/TemplateRecommendation';

export default function Generator() {
  const [prompt, setPrompt] = useState('');
  const [platform, setPlatform] = useState<'n8n' | 'make' | 'zapier'>('n8n');
  const [loading, setLoading] = useState(false);
  const [workflow, setWorkflow] = useState<any>(null);
  const [templates, setTemplates] = useState<any[]>([]);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await generateWorkflow(prompt, platform);
      setWorkflow(result);
    } catch (error) {
      // Error handling
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold mb-2">Generate Workflow</h1>
        <p className="text-gray-600 mb-6">
          Describe your workflow in plain English and we'll generate it for you.
        </p>

        {/* Prompt input */}
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Example: Send a Slack notification when a new customer signs up in Stripe..."
          rows={6}
          className="mb-4"
        />

        {/* Platform selector */}
        {/* Template recommendations */}
        {/* Generate button */}
      </div>

      {/* Workflow output */}
      {workflow && (
        <div className="bg-white rounded-lg shadow p-6">
          <WorkflowJsonViewer workflow={workflow} />
        </div>
      )}
    </div>
  );
}
```

---

### 4. AI Service (`src/services/aiService.ts`)

**This is the BRAIN of the application - make it production-quality.**

**Requirements**:
- Claude API integration (Anthropic SDK)
- Intelligent model selection (Sonnet 4.5 for all MVP workflows)
- Comprehensive system prompt with n8n knowledge
- Template-aware generation
- Robust error handling
- Retry logic for API failures
- Token estimation for credit calculation

**System Prompt Strategy**:
```typescript
const SYSTEM_PROMPT = `
You are an expert n8n workflow automation engineer.

Your task: Generate production-ready n8n workflow JSON from natural language descriptions.

## n8n Workflow Structure

A valid n8n workflow has this structure:
{
  "name": "Workflow Name",
  "nodes": [
    {
      "id": "unique-id",
      "name": "Node Name",
      "type": "n8n-nodes-base.nodetype",
      "typeVersion": 1,
      "position": [x, y],
      "parameters": { /* node-specific config */ }
    }
  ],
  "connections": {
    "Node Name": {
      "main": [[{ "node": "Next Node", "type": "main", "index": 0 }]]
    }
  },
  "active": false,
  "settings": {
    "executionOrder": "v1"
  }
}

## Available Templates

${JSON.stringify(TEMPLATE_METADATA, null, 2)}

## Node Types Reference

### Trigger Nodes:
- n8n-nodes-base.webhook (HTTP webhook trigger)
- n8n-nodes-base.schedule (Cron schedule)
- n8n-nodes-base.manualTrigger (Manual start)

### Action Nodes:
- n8n-nodes-base.httpRequest (HTTP API calls)
- n8n-nodes-base.googleSheets (Google Sheets)
- n8n-nodes-base.slack (Slack messaging)
- n8n-nodes-base.gmail (Gmail)
- n8n-nodes-base.notion (Notion)
- n8n-nodes-base.airtable (Airtable)
- n8n-nodes-base.emailSend (Send emails)

### Logic Nodes:
- n8n-nodes-base.if (Conditional branching)
- n8n-nodes-base.switch (Multi-way branching)
- n8n-nodes-base.merge (Merge data from multiple sources)
- n8n-nodes-base.filter (Filter items)

### Data Nodes:
- n8n-nodes-base.set (Set/transform data)
- n8n-nodes-base.code (JavaScript/Python code)
- n8n-nodes-base.function (Legacy JS function)

## Generation Rules

1. **ALWAYS start with a trigger node** (webhook, schedule, or manual)
2. **Use realistic node positions** (space nodes 200px apart horizontally)
3. **Connect nodes properly** using the connections object
4. **Validate node types** - only use real n8n node types
5. **Include proper parameters** for each node type
6. **Add helpful node names** that describe what they do
7. **Test logic** - ensure the workflow makes sense end-to-end

## Response Format

Respond ONLY with valid JSON. No markdown, no explanations, no code blocks.
The response should be parseable as JSON directly.

Example response:
{
  "name": "Send Email on Google Sheets Update",
  "nodes": [...],
  "connections": {...},
  "active": false,
  "settings": {"executionOrder": "v1"}
}
`;
```

**Implementation**:
```typescript
import Anthropic from '@anthropic-ai/sdk';
import { N8N_WORKFLOW_TEMPLATES, recommendTemplate } from '@/lib/n8n/workflowTemplates';

const anthropic = new Anthropic({
  apiKey: import.meta.env.VITE_CLAUDE_API_KEY,
  dangerouslyAllowBrowser: true // Only for MVP - move to backend for production
});

export interface GenerateWorkflowRequest {
  prompt: string;
  platform: 'n8n' | 'make' | 'zapier';
  useTemplate?: string; // Optional template ID
}

export interface GenerateWorkflowResponse {
  workflow: any;
  templateUsed?: string;
  creditsUsed: number;
  tokensUsed: number;
}

export async function generateWorkflow(
  request: GenerateWorkflowRequest
): Promise<GenerateWorkflowResponse> {
  // 1. Check for template recommendations
  const recommendedTemplates = recommendTemplate(request.prompt);

  // 2. Build system prompt with context
  const systemPrompt = buildSystemPrompt(request.platform, recommendedTemplates);

  // 3. Call Claude API
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: `Generate an ${request.platform} workflow for: ${request.prompt}`
      }]
    });

    // 4. Parse response
    const workflowJson = parseWorkflowResponse(response.content[0].text);

    // 5. Validate workflow
    validateWorkflow(workflowJson, request.platform);

    // 6. Return result
    return {
      workflow: workflowJson,
      creditsUsed: 1,
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens
    };
  } catch (error) {
    console.error('Workflow generation failed:', error);
    throw new Error('Failed to generate workflow. Please try again.');
  }
}

function buildSystemPrompt(platform: string, templates: any[]): string {
  // Build comprehensive system prompt with n8n knowledge base
  // Include template recommendations if available
  return SYSTEM_PROMPT;
}

function parseWorkflowResponse(text: string): any {
  // Remove markdown code blocks if present
  let cleanText = text.trim();
  if (cleanText.startsWith('```')) {
    cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  }

  try {
    return JSON.parse(cleanText);
  } catch (error) {
    throw new Error('Invalid JSON response from AI');
  }
}

function validateWorkflow(workflow: any, platform: string): void {
  if (!workflow || typeof workflow !== 'object') {
    throw new Error('Invalid workflow structure');
  }

  if (platform === 'n8n') {
    if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
      throw new Error('Workflow must have a nodes array');
    }
    if (!workflow.connections || typeof workflow.connections !== 'object') {
      throw new Error('Workflow must have a connections object');
    }
    if (workflow.nodes.length === 0) {
      throw new Error('Workflow must have at least one node');
    }
  }
}
```

---

### 5. Template Service (`src/services/templateService.ts`)

**Requirements**:
- Load n8n templates from `src/lib/n8n/raw-templates/`
- Recommend templates based on user prompt
- Provide template metadata and previews
- Sanitize templates before use

**Implementation**:
```typescript
import { N8N_WORKFLOW_TEMPLATES, recommendTemplate as baseRecommend } from '@/lib/n8n/workflowTemplates';

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  keywords: string[];
  nodes: number;
  integrations: string[];
  preview?: string;
}

export function getTemplates(): Template[] {
  return N8N_WORKFLOW_TEMPLATES;
}

export function getTemplateById(id: string): Template | null {
  return N8N_WORKFLOW_TEMPLATES.find(t => t.id === id) || null;
}

export function recommendTemplate(userPrompt: string): Template[] {
  return baseRecommend(userPrompt);
}

export function searchTemplates(query: string): Template[] {
  const lowerQuery = query.toLowerCase();
  return N8N_WORKFLOW_TEMPLATES.filter(t =>
    t.name.toLowerCase().includes(lowerQuery) ||
    t.description.toLowerCase().includes(lowerQuery) ||
    t.keywords.some(k => k.toLowerCase().includes(lowerQuery))
  );
}
```

---

### 6. Workflow Service (`src/services/workflowService.ts`)

**Requirements**:
- Save generated workflows to Supabase
- Load user's workflow history
- Delete workflows
- Update workflow metadata

**Implementation**:
```typescript
import { supabase } from '@/integrations/supabase/client';

export interface SaveWorkflowRequest {
  name: string;
  description?: string;
  platform: string;
  workflowJson: any;
  prompt: string;
  creditsUsed: number;
}

export async function saveWorkflow(request: SaveWorkflowRequest) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('workflows')
    .insert({
      user_id: user.id,
      name: request.name,
      description: request.description,
      platform: request.platform,
      workflow_json: request.workflowJson,
      prompt: request.prompt,
      credits_used: request.creditsUsed
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getUserWorkflows() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('workflows')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function deleteWorkflow(workflowId: string) {
  const { error } = await supabase
    .from('workflows')
    .delete()
    .eq('id', workflowId);

  if (error) throw error;
}
```

---

### 7. Workflow JSON Viewer Component (`src/components/workflow/WorkflowJsonViewer.tsx`)

**Requirements**:
- Syntax-highlighted JSON display
- Collapsible sections
- Copy to clipboard button
- Download as file button
- Line numbers
- Dark mode support

**Suggested Library**: `react-json-view` or build custom with `highlight.js`

**Implementation**:
```typescript
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Download, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WorkflowJsonViewerProps {
  workflow: any;
  name?: string;
}

export default function WorkflowJsonViewer({ workflow, name }: WorkflowJsonViewerProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(JSON.stringify(workflow, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Copied to clipboard!' });
  };

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(workflow, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name || 'workflow'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Workflow downloaded!' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Generated Workflow</h3>
        <div className="flex gap-2">
          <Button onClick={handleCopy} variant="outline" size="sm">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          <Button onClick={handleDownload} variant="outline" size="sm">
            <Download className="h-4 w-4" />
            Download
          </Button>
        </div>
      </div>

      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
        <code>{JSON.stringify(workflow, null, 2)}</code>
      </pre>
    </div>
  );
}
```

---

### 8. Template Recommendation Component (`src/components/workflow/TemplateRecommendation.tsx`)

**Requirements**:
- Display recommended templates
- Show template preview on hover
- "Use This Template" button
- Template metadata (integrations, category)

**Implementation**:
```typescript
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  integrations: string[];
}

interface TemplateRecommendationProps {
  templates: Template[];
  onSelectTemplate: (templateId: string) => void;
}

export default function TemplateRecommendation({ templates, onSelectTemplate }: TemplateRecommendationProps) {
  if (templates.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-700">
        💡 We found {templates.length} template{templates.length > 1 ? 's' : ''} that might match:
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map(template => (
          <Card key={template.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold">{template.name}</h4>
                <p className="text-sm text-gray-600 mt-1">{template.description}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{template.category}</Badge>
                {template.integrations.slice(0, 3).map(int => (
                  <Badge key={int} variant="outline">{int}</Badge>
                ))}
              </div>

              <Button
                onClick={() => onSelectTemplate(template.id)}
                variant="outline"
                size="sm"
                className="w-full"
              >
                Use This Template
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

---

## 🎨 UI/UX Guidelines

### Design Principles
1. **Speed First**: Every action should feel instant
2. **Clarity**: Always show what's happening (loading states, errors)
3. **Progressive Disclosure**: Don't overwhelm with options
4. **Feedback**: Toast notifications for all actions

### Color Scheme
- **Primary**: Deep Blue (#0F172A)
- **Accent**: Electric Cyan (#06B6D4)
- **Success**: Green (#10B981)
- **Error**: Red (#EF4444)
- **Background**: Light Gray (#F9FAFB)

### Typography
- **Headings**: Bold, 2xl-4xl
- **Body**: Regular, base-lg
- **Code**: Monospace (Fira Code, JetBrains Mono)

### Spacing
- Use Tailwind spacing scale (4px increments)
- Generous padding (p-6, p-8)
- Consistent gaps (gap-4, gap-6)

---

## 🚀 Deployment Checklist

### Pre-Deploy
- [ ] All environment variables set in Vercel
- [ ] Supabase production database configured
- [ ] Database tables created with RLS policies
- [ ] Claude API key configured
- [ ] Test auth flow end-to-end
- [ ] Test workflow generation with 10 different prompts
- [ ] Error boundaries in place
- [ ] Loading states on all async operations
- [ ] Toast notifications working

### Vercel Configuration
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "env": {
    "VITE_SUPABASE_URL": "@supabase-url",
    "VITE_SUPABASE_ANON_KEY": "@supabase-anon-key",
    "VITE_CLAUDE_API_KEY": "@claude-api-key"
  }
}
```

### Post-Deploy
- [ ] Test on production URL
- [ ] Create 3 test accounts
- [ ] Generate 5 workflows in production
- [ ] Monitor Supabase logs for errors
- [ ] Monitor Claude API usage
- [ ] Set up error tracking (Sentry)

---

## 🐛 Error Handling Strategy

### API Errors
```typescript
try {
  const result = await generateWorkflow(request);
  return result;
} catch (error) {
  if (error instanceof Anthropic.APIError) {
    if (error.status === 429) {
      toast({ title: 'Rate limit exceeded', description: 'Please try again in a moment' });
    } else if (error.status === 401) {
      toast({ title: 'API key invalid', description: 'Please contact support' });
    } else {
      toast({ title: 'Generation failed', description: 'Please try again' });
    }
  } else {
    toast({ title: 'Unexpected error', description: error.message });
  }
  throw error;
}
```

### Network Errors
- Show retry button
- Offline detection
- Timeout handling (30s max)

### Validation Errors
- Inline form validation
- Clear error messages
- Suggested fixes

---

## 🧪 Testing Requirements

### Manual Testing Checklist
- [ ] Sign up new account
- [ ] Sign in existing account
- [ ] Generate workflow with simple prompt
- [ ] Generate workflow with complex prompt
- [ ] Download workflow JSON
- [ ] Copy workflow to clipboard
- [ ] Use recommended template
- [ ] Sign out and verify redirect
- [ ] Test on mobile viewport
- [ ] Test with slow network (throttle)

### Test Prompts
1. "Send a Slack message when a new row is added to Google Sheets"
2. "Create a customer onboarding workflow that sends welcome emails"
3. "Build a Telegram chatbot that responds to messages using OpenAI"
4. "Monitor a webhook and save data to Airtable"
5. "Generate daily reports from Notion and email them"

---

## 📊 Success Metrics (Post-Launch)

### Day 1-7
- 10 beta signups
- 50 workflows generated
- 0 critical bugs
- Average generation time < 10s

### Week 2-4
- 100 total users
- 500 workflows generated
- 10 paying customers (manual invoicing)
- 4.5+ star rating

---

## 🔒 Security Considerations

### MVP Security (Good Enough for Beta)
1. **Supabase RLS** - Row Level Security enabled on all tables
2. **API Key Protection** - Claude API key in environment variables (client-side is OK for MVP)
3. **Auth Flow** - Supabase handles auth securely
4. **Input Sanitization** - Validate user prompts (max length, no XSS)
5. **Rate Limiting** - Supabase has built-in rate limiting

### Production Security (Post-MVP)
1. Move Claude API calls to backend (Supabase Edge Functions)
2. Implement proper rate limiting per user
3. Add CAPTCHA on signup
4. Implement API key rotation
5. Add audit logs for all operations

---

## 📚 Additional Context Files to Reference

### Essential Files
1. `CLAUDE.md` - Full project context and guidelines
2. `src/lib/n8n/workflowTemplates.ts` - Template metadata and loader
3. `src/lib/n8n/nodes.ts` - Complete n8n node reference
4. `src/lib/workflowConverter.ts` - Conversion logic (reference for validation)

### Knowledge Base Files (Use as System Prompt Context)
- `src/lib/n8n/types.ts` - n8n type definitions
- `src/lib/n8n/patterns.ts` - Common workflow patterns
- `src/lib/n8n/advanced/ai.ts` - AI node integration patterns
- `src/lib/n8n/apiIntegration.ts` - API integration examples

---

## 🎯 MVP Definition of Done

**An MVP is DONE when:**
1. ✅ A user can sign up and log in
2. ✅ A user can generate an n8n workflow from a text prompt
3. ✅ The generated workflow is valid n8n JSON
4. ✅ The user can download the workflow as a .json file
5. ✅ The user can see their credit balance (even if not deducting yet)
6. ✅ The app is deployed and accessible at a public URL
7. ✅ 5 test prompts generate valid workflows
8. ✅ Zero critical bugs (auth works, generation works, download works)

**What can be broken/missing:**
- History page (save to DB but no UI)
- Credit deduction (show balance but don't deduct)
- Payments (manual invoicing)
- Converter/Debugger (v2)
- Settings page (v2)
- Mobile optimization (desktop-first)
- SEO (not needed for beta)

---

## 🚨 Common Pitfalls to Avoid

1. **Over-engineering** - Don't build abstractions for v2 features
2. **Perfect UI** - Good enough is fine for MVP
3. **Testing everything** - Focus on happy path
4. **Premature optimization** - Ship first, optimize later
5. **Feature creep** - Only build what's in this doc
6. **Analysis paralysis** - Make decisions quickly
7. **Bikeshedding** - Don't debate button colors for 30 minutes

---

## 📞 Final Notes

**Priority Order:**
1. Authentication (must work perfectly)
2. Workflow generation (core value)
3. UI polish (good enough)
4. Everything else (nice-to-have)

**Time Allocation:**
- 40% AI service + workflow generation
- 30% UI components + pages
- 20% Supabase setup + auth
- 10% Testing + deployment

**When Stuck:**
- Check CLAUDE.md for context
- Review n8n knowledge base files
- Test with simpler prompts first
- Deploy often, iterate quickly

---

## 🎉 You're Ready to Build!

This document contains everything needed for a production-quality MVP. Focus on completing features in order, test frequently, and ship fast.

**Start Here:**
1. Set up Supabase database (run SQL schema)
2. Configure .env file
3. Build Login.tsx
4. Build Generator.tsx
5. Build aiService.ts
6. Test end-to-end
7. Deploy to Vercel
8. Celebrate! 🎉

Good luck! 🚀
