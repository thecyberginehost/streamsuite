# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**StreamSuite** is an AI-powered SaaS platform for generating, converting, and debugging automation workflows across n8n, Make.com, and Zapier.

### Core Value Propositions
1. **Generate** workflows from natural language using AI
2. **Convert** workflows between platforms (n8n ↔ Make.com ↔ Zapier)
3. **Debug** broken workflows with AI-powered error detection

## Development Commands

- **Start development server**: `npm run dev` (runs on port 5173)
- **Build for production**: `npm run build`
- **Build for development**: `npm run build:dev`
- **Lint code**: `npm run lint`
- **Preview production build**: `npm run preview`

## Project Architecture

This is a React application built with Vite, TypeScript, and Supabase, designed as a multi-page SaaS application with authentication and credit-based usage.

### Key Technologies
- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: shadcn/ui components with Tailwind CSS
- **Backend**: Supabase (authentication, database, storage)
- **AI**: Claude API (Sonnet 4.5 + Haiku 3.5 for cost optimization)
- **State Management**: TanStack Query for server state, React Context for auth
- **Routing**: React Router DOM
- **Styling**: Tailwind CSS with custom design system
- **Payments**: Stripe (credit-based subscriptions)

### Application Structure

**Pages** (`src/pages/`):
- `Dashboard.tsx` - Main layout wrapper with sidebar navigation
- `Generator.tsx` - AI workflow generation from natural language (default route `/`)
- `Converter.tsx` - Platform-to-platform workflow conversion
- `Debugger.tsx` - AI-powered workflow debugging and error fixes
- `History.tsx` - User's workflow generation/conversion history
- `Settings.tsx` - User settings, billing, API keys
- `Login.tsx` - Authentication page
- `NotFound.tsx` - 404 fallback

**Services** (`src/services/`):
- `aiService.ts` - Claude API integration for generation/conversion/debugging
- `converterService.ts` - Logic for converting between workflow formats
- `validatorService.ts` - Workflow validation and compatibility checks
- `creditService.ts` - Credit tracking and management
- `cacheService.ts` - Prompt caching for API cost optimization

**Component Organization**:
- `src/components/ui/` - shadcn/ui component library
- `src/components/workflow/` - Workflow-specific components (JSON viewer, diff viewer, etc.)
- `src/hooks/` - Custom React hooks (auth, workflows, credits, etc.)
- `src/integrations/supabase/` - Supabase client and type definitions

### Routing Structure
```
/ (protected) → Dashboard layout
├── / → Generator (index route)
├── /converter → Converter page
├── /debugger → Debugger page
├── /history → History page
└── /settings → Settings page
/login → Login page (public)
```

## Business Logic

### Credit System
- Users purchase credits through subscription tiers
- Different operations consume different credit amounts:
  - **Simple generation**: 1 credit
  - **Complex generation**: 2 credits
  - **Platform conversion**: 4 credits
  - **Debug & fix**: 1 credit
- Credits roll over month-to-month (up to 50% of plan limit)
- Track credit usage in Supabase `credit_transactions` table

### AI Model Selection
- Use **Sonnet 4.5** for:
  - Simple workflow generation (<10 nodes)
  - Basic debugging (<30 nodes)
  - Small conversions (<20 nodes)
  - Complex workflows (10+ nodes)
  - Large conversions (20+ nodes)
  - Advanced debugging with detailed fixes

### Prompt Caching Strategy
- Cache system prompts (workflow generation rules, conversion mappings)
- First request pays full cost, subsequent requests save 90% on cached portions
- Implement cache keys based on operation type and platform
- Expected 30-40% overall cost reduction

## Database Schema (Supabase)

### Tables
- `profiles` - User profiles and metadata
- `subscriptions` - User subscription tiers and status
- `credits` - Current credit balance per user
- `credit_transactions` - History of credit usage/purchases
- `workflows` - Saved workflow generations/conversions
- `conversion_history` - Track conversion requests and results

## AI Integration

### Claude API Usage

**System Prompts** (cache these):
```typescript
const GENERATION_SYSTEM_PROMPT = `
You are an expert workflow automation engineer specializing in n8n, Make.com, and Zapier.
Your role is to generate production-ready workflow JSON from natural language descriptions.
[... detailed rules ...]
`;

const CONVERSION_SYSTEM_PROMPT = `
You are an expert at converting workflows between n8n, Make.com, and Zapier formats.
You understand the nuances and limitations of each platform.
[... platform-specific mapping rules ...]
`;

const DEBUG_SYSTEM_PROMPT = `
You are an expert at debugging workflow automations.
Analyze the workflow JSON and error logs to identify issues and suggest fixes.
[... debugging strategies ...]
`;
```

**Cost Optimization**:
- Estimate tokens before API call to show credit cost to user
- Implement prompt caching (90% savings on system prompts)
- Target: 80-90% gross margins

### n8n Template Library

**NEW: 15 Production-Ready Workflow Templates**

Located in `src/lib/n8n/raw-templates/` and `src/lib/n8n/workflowTemplates.ts`

**Template Categories:**
1. **AI & Chatbots** (4 templates) - Telegram bots, SMS chatbots, appointment scheduling
2. **Document Processing** (4 templates) - PDF Q&A, audio transcription, workflow generators
3. **Marketing Automation** (3 templates) - LinkedIn posts, email marketing, blog automation
4. **CRM & Sales** (2 templates) - Lead scoring, customer onboarding
5. **Productivity** (2 templates) - Calendar sync, team reports

**Usage in AI Generation:**
```typescript
import {
  N8N_WORKFLOW_TEMPLATES,
  recommendTemplate,
  TEMPLATE_SELECTION_GUIDE
} from '@/lib/n8nKnowledgeBase';

// Add to system prompt:
const systemPrompt = `
${TEMPLATE_SELECTION_GUIDE}

When generating n8n workflows:
1. ALWAYS check if a template exists for the use case first
2. If template exists: Recommend it + explain customizations needed
3. If no template: Generate from scratch using your knowledge

Example: User asks for "Telegram chatbot with image generation"
→ Recommend template ID: telegram-ai-chatbot-image
→ Explain required integrations: Telegram, OpenAI
→ Suggest customizations: Bot token, system prompt, custom commands
`;

// Template recommendation in code:
const userIntent = "I need a LinkedIn automation workflow";
const recommended = recommendTemplate(userIntent);
// Returns: [linkedin-post-automation-with-approval, ...]
```

**Template Benefits:**
- ✅ 70-90% faster workflow creation
- ✅ Higher success rate (proven templates vs AI generation)
- ✅ Lower AI costs (shorter prompts)
- ✅ Better user experience (instant results)

**Security Notes:**
- All templates are sanitized using `sanitizeWorkflowJson()` before use
- Credential IDs, instance IDs, and personal data removed
- Legal: Apache 2.0 / Fair Code (n8n) - commercial use allowed

### Workflow Formats

**n8n Format**:
```json
{
  "nodes": [
    {
      "id": "...",
      "name": "...",
      "type": "...",
      "position": [x, y],
      "parameters": {...}
    }
  ],
  "connections": {...}
}
```

**Make.com Format** (Blueprint):
```json
{
  "name": "...",
  "flow": [
    {
      "id": 1,
      "module": "...",
      "mapper": {...}
    }
  ],
  "metadata": {...}
}
```

**Zapier Custom Code**:
```javascript
// JavaScript or Python code
// Input: inputData
// Output: return { ... }
```

## Key Features to Implement

### MVP Features (Week 1-2)
1. **n8n Generator**: Natural language → n8n JSON
2. **Make → n8n Converter**: Upload Make blueprint → download n8n JSON
3. **Basic validation**: Check if generated/converted JSON is valid
4. **Authentication**: Supabase auth with email/password
5. **Credit tracking**: Display remaining credits, deduct on operations

### Phase 2 Features (Week 3-4)
1. **Stripe integration**: Subscribe to plans, purchase credits
2. **History page**: View past generations/conversions
3. **Download/copy results**: Easy export of generated workflows
4. **Error handling**: User-friendly error messages

### Phase 3 Features (Week 5-8)
1. **Bidirectional conversion**: n8n ↔ Make (both directions)
2. **Zapier code generation**: Generate Code by Zapier snippets
3. **Advanced debugging**: Upload broken workflow + error logs → get AI fixes
4. **Batch operations**: Convert multiple workflows at once

### Phase 4 Features (Week 9-12)
1. **API access**: RESTful API for programmatic access
2. **Template marketplace**: User-generated templates (20% commission)
3. **White-label**: Enterprise customers can brand the tool
4. **Analytics**: Usage stats, cost breakdowns

## Development Notes

- Uses path alias `@/` for `src/` directory
- Supabase integration in `src/integrations/supabase/`
- All UI components follow shadcn/ui patterns
- Authentication state managed globally via React Context
- Toast notifications handled by shadcn/ui toast + sonner
- **Cost optimization is critical**: Always use cheapest model that works
- **User experience**: Show credit cost BEFORE operations, not after

## Configuration Files
- `vite.config.ts` - Vite configuration with SWC React plugin
- `tailwind.config.ts` - Tailwind CSS configuration
- `components.json` - shadcn/ui component configuration
- `tsconfig.json` - TypeScript configuration

## Environment Variables
```
VITE_SUPABASE_URL=<your_supabase_project_url>
VITE_SUPABASE_ANON_KEY=<your_supabase_anon_key>
VITE_CLAUDE_API_KEY=<your_claude_api_key>
VITE_STRIPE_PUBLIC_KEY=<your_stripe_public_key>
```

## Branding

- **Name**: StreamSuite
- **Domain**: streamsuite.io (primary), getstreamsuite.com (redirect)
- **Tagline**: "Build workflow automations in 30 seconds"
- **Target Market**: SMBs, agencies, operations teams, developers
- **Positioning**: Speed + customization + intelligence (not templates)

## Important Principles

1. **Ship fast**: MVP in 7 days, iterate based on user feedback
2. **Cost-conscious**: 80-90% margins required for sustainability
3. **User-first**: Show costs upfront, no surprises
4. **Quality over quantity**: Better to do 3 things great than 10 things poorly
5. **Don't compete with templates**: Focus on custom generation and conversion
6. **Be transparent**: Credit system, pricing, limitations - all visible

---

IMPORTANT: This context may or may not be relevant to your tasks. You should not respond to this context unless it is highly relevant to your task.
