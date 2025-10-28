# Enterprise Workflow Builder

## Overview

The Enterprise Workflow Builder is a sophisticated multi-agent AI system for generating complex n8n workflows (20-100+ nodes). It uses an agentic approach to break down complex requirements into modular workflows, ensuring better quality and avoiding token truncation issues.

## Architecture

### Multi-Agent Orchestration

**Agent 1: Workflow Architect (Sonnet 4.5)**
- Analyzes user requirements
- Creates modular blueprint (3-7 modules)
- Estimates complexity and node counts
- Defines data flow between modules
- Plans error handling strategy

**Agent 2: Module Generator (Sonnet 4.5)**
- Generates individual modules independently
- Each module: 10-30 nodes
- Focused context per module
- Integration-specific logic
- Runs in parallel for speed

**Agent 3: Integration Assembler (Sonnet 4.5)**
- Combines all modules into single workflow
- Creates inter-module connections
- Validates data flow
- Optimizes node positioning
- Ensures cohesive structure

### Smart Example Selection

The system automatically selects 2-3 most relevant examples from 14 curated workflows based on:
- Keyword matching (integrations, workflow type)
- Complexity similarity
- Category relevance
- Diversity (ensures different patterns shown)

**Reference Examples (14 total)**:
- AI & Automation (4): AI agents, RAG chatbots, social media automation
- CRM & Sales (3): HubSpot onboarding, lead scoring, e-commerce sync
- Project Management (2): Asana-Notion sync, Jira tickets
- Data & Communication (3): Sheets-Gmail sync, Airtable automation, Slack notifications
- Developer Tools (2): GitHub DevOps, email marketing

## Features

### Complex Workflow Mode
- Single large workflow (20-100+ nodes)
- Multi-department processes
- Customer journey automation
- Data pipelines
- Complex integrations (3+ systems)

### Workflow Sets Mode
- Multiple related workflows
- Orchestrated systems
- Currently redirects to Batch Generator
- Future: Direct batch generation in Enterprise Builder

## Credit Pricing

**Dynamic pricing based on complexity:**
- Minimum: 12 credits
- Maximum: 18 credits
- Calculation: Based on estimated node count
- Formula: `min(18, max(12, ceil(totalNodes / 5)))`

Example:
- 50 nodes = 10 credits → 12 credits (minimum applies)
- 60 nodes = 12 credits
- 90 nodes = 18 credits (maximum cap)

## Access Control

**Tier Gating:**
- ✅ Growth plan ($99/mo)
- ✅ Agency plan ($499/mo)
- ❌ Free, Starter, Pro plans

Enforced via:
- `requiredFeature: 'batch_operations'` in Sidebar
- Badge display: "Growth+"
- Route protection in Dashboard

## User Flow

1. **Input Requirements**
   - Detailed description (min 50 characters)
   - Optional: Workflow type (multi-department, customer journey, etc.)
   - Optional: Departments, integrations

2. **Generation Process**
   - Progress tracking (0-100%)
   - Real-time status messages
   - Stages: Examples → Blueprint → Modules → Assembly → Instructions

3. **Results**
   - Complete n8n JSON workflow
   - Module breakdown
   - Setup instructions
   - Integration requirements
   - Download/copy options

## File Structure

```
src/
├── services/
│   ├── exampleSelectionService.ts    # Smart example matching
│   └── enterpriseWorkflowService.ts   # Multi-agent orchestration
├── pages/
│   └── EnterpriseBuilder.tsx          # Main UI component
└── components/
    └── Sidebar.tsx                    # Updated with Enterprise Builder link

examples/
└── 14 production workflows            # Reference patterns
```

## Key Benefits

### For Users
✅ Generate workflows up to 100+ nodes without truncation
✅ Modular approach = easier testing and debugging
✅ Production-grade patterns from real examples
✅ Detailed setup instructions included
✅ Higher success rate than single-shot generation

### For Business
✅ Premium feature differentiation (Growth+ only)
✅ Justifies higher tier pricing
✅ Lower AI costs (focused modules < giant single prompt)
✅ Better margins (12-18 credits charged, ~$2-3 actual cost)
✅ Higher customer satisfaction (quality output)

## Technical Implementation

### Cost Optimization
- **Example Selection**: Only 2-3 relevant examples (~5-8K tokens)
- **Module Generation**: Parallel execution (faster, not cheaper but better UX)
- **Focused Context**: Each module has targeted system prompt
- **Estimated Cost**: $2-3 per enterprise workflow
- **Credit Charge**: 12-18 credits ($6-9 equivalent)
- **Gross Margin**: 50-70%

### Token Management
- Architect prompt: ~20K tokens
- Module prompts: 6 × 15K = ~90K tokens
- Assembly prompt: ~30K tokens
- Total: ~140K tokens (within Sonnet 4.5 limits)

### Error Handling
- JSON extraction with regex
- Validation at each stage
- User-friendly error messages
- Graceful degradation
- Credit refund on failure

## Future Enhancements

1. **Template Library Integration**
   - Suggest existing templates before generating
   - Hybrid approach: template + customization

2. **Workflow Sets Direct Generation**
   - Remove redirect to Batch Generator
   - Multi-workflow orchestration in single interface

3. **Preview & Edit**
   - Visual preview of blueprint before generation
   - Edit module specs before generating

4. **Version Control**
   - Save multiple versions
   - Compare iterations
   - Rollback capability

5. **Collaboration**
   - Team comments on workflows
   - Approval workflows
   - Shared workspace (Agency plan)

## Metrics to Track

- Generation success rate
- Average node count
- Average credits used
- Time to generate
- User satisfaction (surveys)
- Conversion: Free → Growth (because of Enterprise Builder)

---

**Status**: ✅ Fully Implemented
**Route**: `/enterprise-builder`
**Tier Required**: Growth or Agency
**Credits**: 12-18 per workflow
