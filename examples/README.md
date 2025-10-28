# n8n Workflow Examples

This folder contains 14 production-grade n8n workflow examples for reference by the Enterprise Workflow Builder AI.

## Purpose

These workflows serve as structural templates and pattern references for generating complex workflows. The AI uses these to understand:
- Complex node connections and data flow
- Integration patterns (API calls, webhooks, scheduling)
- Error handling strategies
- LangChain/AI agent configurations
- Multi-step business processes

## Workflow Categories

### AI & Automation (4 workflows)
- **ai_agent_workflow.json** (368 lines) - AI routing with switch logic
- **ai-powered-whatsapp-chatbot-for-text-voice-images-pdf-rag.json** (1,503 lines) - Complex RAG chatbot with vector search
- **automate-multi-platform-ssm-content-creation-with-ai.json** (1,699 lines) - Multi-platform social media automation
- **track-ai-agent-token-usage-and-estimate-cost-in-google-sheets.json** (731 lines) - Token tracking and cost monitoring

### CRM & Sales (3 workflows)
- **hubspot-customer-onboarding-automation.json** (889 lines) - Customer onboarding with HubSpot, Gmail, Google Calendar
- **linkedin-lead-scoring-to-google-sheets.json** (692 lines) - Lead enrichment and scoring
- **shopify-to-hubspot-customer-sync.json** (287 lines) - E-commerce to CRM sync

### Project Management (2 workflows)
- **asana-notion-project-sync.json** (371 lines) - Cross-platform project sync
- **jira-ticket-management.json** (358 lines) - Issue tracking automation

### Data & Communication (3 workflows)
- **google-sheets-gmail-data-sync.json** (1,256 lines) - Data processing and email automation
- **airtable-database-automation.json** (520 lines) - Database operations
- **slack-notification-automation.json** (896 lines) - Team notifications

### Developer Tools (2 workflows)
- **github-devops-automation.json** (925 lines) - CI/CD and repository automation
- **personalized-email-marketing-with-ai.json** (740 lines) - AI-powered marketing

## Total Stats
- **14 workflows**
- **11,137 total lines**
- **Average: 795 lines per workflow**
- **All workflows validated as valid JSON ✓**

## Complexity Levels
- **Simple** (10-30 nodes): 3 workflows
- **Medium** (30-50 nodes): 6 workflows  
- **Complex** (50-100 nodes): 5 workflows

## Usage by Enterprise Workflow Builder

The AI Enterprise Workflow Builder selects 2-3 most relevant examples based on:
1. User's requested integrations (e.g., "Shopify + HubSpot" → shopify-to-hubspot-customer-sync.json)
2. Workflow complexity (simple vs multi-step)
3. Pattern matching (e.g., "chatbot" → whatsapp-chatbot, "lead scoring" → linkedin-lead-scoring)

This ensures the AI learns from real production patterns while keeping token usage reasonable (~5-8K tokens per request).

## Source
- Original examples: Created by StreamSuite team
- Additional workflows: Curated from n8n community (4,139 workflow repository)
- All workflows sanitized to remove credentials and personal data
