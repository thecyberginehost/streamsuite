/**
 * n8n Orchestration Knowledge Base
 *
 * Expert patterns for building production-grade multi-workflow systems
 * Based on @nateherk's advanced n8n architectures
 *
 * Access Level: Agency & Enterprise tiers only
 */

export const ORCHESTRATION_PATTERNS = {
  managerAgent: {
    description: "Manager/Delegator pattern - Main agent routes tasks to specialized sub-agents",
    when: "Building complex systems with multiple specialized capabilities",
    structure: {
      trigger: "Telegram/Slack webhook or schedule",
      mainAgent: {
        model: "GPT-4o Mini (cost-effective router)",
        role: "Delegator - NOT a worker",
        systemPrompt: "You are a manager agent. Delegate tasks to specialized tools. Do NOT execute tasks yourself.",
        tools: "10+ specialized sub-agents/tools"
      },
      errorHandling: {
        setting: "Continue on error (agent settings)",
        branches: ["Success → Log to Sheets", "Error → Alert to Slack"],
        logging: "Every action logged with timestamp, tokens, model"
      }
    }
  },

  subWorkflowPattern: {
    description: "Specialized sub-workflows called by main agent",
    when: "Handling binary data (images, videos, files) or complex operations",
    structure: {
      trigger: "When executed by another workflow",
      inputs: "Minimal parameters (IDs, strings, not full objects)",
      processing: "Self-contained logic with specific tools",
      outputs: "Return status + identifiers (URLs, IDs)",
      binaryHandling: "Handle all binary data within sub-workflow, return URLs"
    }
  },

  errorLogging: {
    description: "Comprehensive error tracking and logging",
    pattern: {
      allWorkflows: "Return intermediate steps enabled",
      checkErrors: "IF node checks for errors in execution",
      successBranch: "FALSE → Log to Google Sheets (normal activity)",
      errorBranch: "TRUE → Error Alert to Slack + Log to error sheet",
      mergePoint: "Workflow Complete node merges both paths",
      sheetStructure: ["timestamp", "workflow", "input", "output", "actions", "tokens", "model"]
    }
  },

  connectionPatterns: {
    description: "Proper node connection patterns to avoid disconnected nodes",
    critical: {
      trigger: "MUST connect to first processing node",
      agent: "MUST connect output to IF node (error check)",
      ifNode: {
        falseBranch: "Success path → Logging",
        trueBranch: "Error path → Alert"
      },
      merge: "Both branches MUST connect to final completion node"
    }
  }
};

export const WORKFLOW_ORCHESTRATION_GUIDE = `
# n8n Workflow Orchestration - Expert Patterns

## 1. MANAGER-WORKER ARCHITECTURE

### Manager Workflow (Main Orchestrator)
\`\`\`
[Telegram Trigger]
    ↓
[AI Agent - GPT-4o Mini]
  - Role: Delegator (routes tasks)
  - Tools: 10+ sub-agent tools
  - System prompt: "Delegate, don't execute"
    ↓
[Check for Errors] (IF node)
    ↓ FALSE (success)          ↓ TRUE (error)
[Log to Sheets]              [Slack Alert]
    ↓                              ↓
[Workflow Complete] ←──────────────┘
\`\`\`

**CRITICAL CONNECTIONS:**
1. Trigger → Agent (input)
2. Agent → IF node (output + intermediate steps)
3. IF FALSE → Log Success
4. IF TRUE → Alert Error
5. Both paths → Merge at completion

### Sub-Workflow Pattern
\`\`\`
[Trigger: Execute Workflow]
  - Input 1: file_id (string)
  - Input 2: operation_type (string)
  - Input 3: chat_id (string)
    ↓
[Download File from Drive] (if needed)
    ↓
[Process Operation]
  - Edit image, create video, etc.
    ↓
[Upload Result to Drive]
    ↓
[Send to Telegram] (binary data)
    ↓
[Return Response]
  - file_url, file_id, status
\`\`\`

## 2. ERROR HANDLING PATTERNS

### Every Workflow Must Have:
1. **Agent Settings:** "Continue on error" enabled
2. **Return intermediate steps:** Enabled
3. **Error routing:** IF node checks for errors
4. **Dual logging:** Success log + Error log
5. **Merge point:** Single completion node

### Error Check IF Node Logic:
\`\`\`javascript
// Check if intermediate steps contain errors
const steps = $('AI Agent').item.json.intermediate_steps || [];
const hasError = steps.some(step => step.error || step.status === 'error');
return hasError;
\`\`\`

## 3. FILE MANAGEMENT SYSTEM

### Folder Structure:
- \`media/\` - All images and videos
- \`media_analysis/\` - Research docs and reports
- \`outreach/\` - Generated emails and content
- \`logs/\` - Error logs and execution history

### File Sharing Rules:
1. Before posting to social media → Make file public
2. Before sending via email → Make viewable by anyone with link
3. Store file_id in database for retrieval
4. Return URLs, not binary data, between workflows

## 4. TOKEN & COST TRACKING

### Logging Structure (Google Sheets):
| Timestamp | Workflow | Input | Output | Actions | Tokens | Model |
|-----------|----------|-------|--------|---------|--------|-------|
| 2025-10-21 14:32 | Lead Processing | lead_email | enriched_data | [clearbit, hunter] | 1,234 | gpt-4o-mini |

### Model Selection Strategy:
- **Manager agent:** GPT-4o Mini (cheap router)
- **Content generation:** Claude Sonnet (quality writing)
- **Research/analysis:** GPT-4o Mini (cost-effective)
- **Image generation:** DALL-E 3
- **Video generation:** Runway V3 Fast

## 5. MEMORY & CONTEXT

### Context Window Pattern:
\`\`\`
[AI Agent]
  - Memory: Chat history (last 5-10 messages)
  - Storage: Supabase chat_history table
  - Retrieval: Query by user_id + timestamp
\`\`\`

### File Retrieval Pattern:
\`\`\`
User: "Edit that image from earlier"
  ↓
Manager checks memory → No recent image mention
  ↓
Calls Google Drive Agent → Search "media" folder
  ↓
Returns: speaker.jpg (uploaded 2 hours ago)
  ↓
Calls Creative Agent → Edit image tool
\`\`\`

## 6. COMMON MISTAKES TO AVOID

❌ **Disconnected Nodes:**
- Trigger not connected to first node
- Agent output not connected to error check
- Branches not merged at end

❌ **Missing Error Handling:**
- No "Continue on error" setting
- No IF node to check for errors
- Only one branch (success OR error, not both)

❌ **Binary Data Between Workflows:**
- Passing image binary between manager → sub-workflow
- Solution: Pass file_id, download in sub-workflow

❌ **Over-prompting Sub-Agents:**
- Putting detailed instructions in manager agent
- Solution: High-level in manager, detailed in sub-agent

❌ **No Logging:**
- Can't debug when workflows fail
- Can't track token costs
- Solution: Log everything to Google Sheets

## 7. PRODUCTION-READY CHECKLIST

✅ Manager agent has clear delegation role
✅ Sub-workflows use "Execute Workflow" trigger
✅ All workflows have error handling (IF node)
✅ Both success and error paths logged
✅ Paths merge at single completion node
✅ Binary data handled in sub-workflows only
✅ Files organized in dedicated folders
✅ Token usage tracked per workflow
✅ Context memory for multi-turn conversations
✅ Think tool available for complex decisions

## 8. EXAMPLE: SALES SDR SYSTEM

### Architecture:
1. **Manager Workflow**
   - Telegram trigger
   - GPT-4o Mini router
   - 7 tools: Lead Processing, Research, Outreach, Follow-up, Calendar, Reporting, Think

2. **Lead Processing Sub-Workflow**
   - Trigger: Execute Workflow
   - Inputs: lead_email, lead_name, company
   - Tools: Clearbit, Hunter.io, HubSpot
   - Output: lead_score, enriched_data

3. **Research Sub-Workflow**
   - Trigger: Execute Workflow (only for leads > 50 score)
   - Inputs: company_name, industry
   - Tools: Perplexity, LinkedIn scraper
   - Output: pain_points, recent_news

4. **Outreach Sub-Workflow**
   - Trigger: Execute Workflow
   - Inputs: lead_id, research_summary
   - Tools: Claude Sonnet (email writing), Gmail
   - Output: email_sent, tracking_id

5. **Follow-up Sub-Workflow**
   - Trigger: Schedule (daily at 9 AM)
   - Tools: Check email status, Claude for follow-ups
   - Output: follow_ups_sent

6. **Calendar Sub-Workflow**
   - Trigger: Execute Workflow
   - Inputs: prospect_email, interest_detected
   - Tools: Google Calendar, Calendly, Zoom
   - Output: meeting_scheduled

7. **Reporting Sub-Workflow**
   - Trigger: Schedule (daily at 5 PM)
   - Tools: HubSpot API, Chart.js
   - Output: daily_metrics posted to Slack

### Connection Flow:
\`\`\`
[Telegram: New lead email]
    ↓
[Manager Agent] → Decides: "This is a new lead"
    ↓
[Calls: Lead Processing Tool]
    ↓
[Lead Processing Workflow executes]
    ↓
[Returns: lead_score = 85]
    ↓
[Manager Agent] → Decides: "Score > 50, do research"
    ↓
[Calls: Research Tool]
    ↓
[Research Workflow executes]
    ↓
[Returns: pain_points, recent_news]
    ↓
[Manager Agent] → Decides: "Send personalized outreach"
    ↓
[Calls: Outreach Tool]
    ↓
[Outreach Workflow executes]
    ↓
[Returns: email_sent = true]
    ↓
[Check for Errors] (IF node)
    ↓ FALSE                    ↓ TRUE
[Log Success]              [Alert Error]
    ↓                            ↓
[Workflow Complete] ←───────────┘
\`\`\`

### Error Handling Example:
\`\`\`
Scenario: Hunter.io API fails in Lead Processing

[Manager calls Lead Processing]
    ↓
[Lead Processing tries Hunter.io] → ERROR: Rate limit
    ↓
[Continue on error = enabled, so workflow continues]
    ↓
[Skip email verification, use company domain]
    ↓
[Return: enriched_data (partial), error: "hunter_failed"]
    ↓
[Manager receives response with error flag]
    ↓
[Check for Errors] → TRUE
    ↓
[Slack Alert: "Lead processing partial failure - Hunter.io rate limit"]
    ↓
[Log to Error Sheet]
    ↓
[Workflow Complete]
\`\`\`

User can then manually verify email or upgrade Hunter.io plan.
`;

/**
 * System prompt addition for Agency/Enterprise tier batch generation
 */
export const ORCHESTRATION_SYSTEM_PROMPT = `
**ORCHESTRATION REQUIREMENTS (Agency/Enterprise Only):**

You are generating a PRODUCTION-GRADE multi-workflow system with proper orchestration.

**CRITICAL: PROPER NODE CONNECTIONS**

EVERY workflow must follow this exact connection pattern:

1. **Main Workflow Structure:**
\`\`\`
[Trigger Node]
    ↓ (connect main output)
[AI Agent Node]
    ↓ (connect main output AND intermediate_steps)
[IF Node: Check for Errors]
    ↓ FALSE (success)         ↓ TRUE (errors detected)
[Log to Google Sheets]      [Error Alert to Slack]
    ↓                              ↓
[Workflow Complete] ←──────────────┘
\`\`\`

2. **Connection Rules:**
- Trigger MUST connect to AI Agent (input connection)
- AI Agent MUST connect to IF node (output connection)
- IF node FALSE branch → Log Success node
- IF node TRUE branch → Error Alert node
- BOTH branches MUST merge at Workflow Complete node

3. **Sub-Workflow Structure:**
\`\`\`
[Trigger: Execute Workflow]
  Inputs: param1, param2, chat_id
    ↓
[Download/Fetch Data] (if needed)
    ↓
[Process Operation]
    ↓
[Upload/Save Result]
    ↓
[Return Response]
  Output: result_id, status
\`\`\`

**MANAGER AGENT PATTERN:**

The main workflow is a MANAGER/ROUTER, not a worker:
- Use GPT-4o Mini for cost-effective routing
- System prompt: "You are a manager agent. Your job is to delegate tasks to specialized tools. You should NOT execute tasks yourself (like writing emails or creating content). Call the appropriate tool for each task."
- Has 7-10 tools pointing to sub-workflows
- Each tool description is HIGH-LEVEL (detailed prompts go in sub-workflows)

**ERROR HANDLING (MANDATORY):**

Every workflow MUST have:
1. Agent settings: "Continue on error" enabled
2. Agent settings: "Return intermediate steps" enabled
3. IF node after agent to check for errors
4. Success branch (FALSE) → Log to Google Sheets
5. Error branch (TRUE) → Alert to Slack
6. Both branches merge at final "Workflow Complete" node

**ERROR CHECK IF NODE EXPRESSION:**
\`\`\`javascript
// This checks if any intermediate steps had errors
const steps = $('AI Agent').item.json.intermediate_steps || [];
const hasError = steps.some(step =>
  step.error ||
  step.status === 'error' ||
  (step.observation && step.observation.includes('error'))
);
return hasError;
\`\`\`

**LOGGING STRUCTURE:**

Google Sheets node must log:
- Column A: Timestamp (={{$now.format('yyyy-MM-dd HH:mm:ss')}})
- Column B: Workflow name
- Column C: Input (user message/trigger)
- Column D: Output (agent response)
- Column E: Actions (JSON of intermediate_steps)
- Column F: Tokens used (prompt + completion)
- Column G: Model used

**FILE MANAGEMENT:**

Create dedicated Google Drive folders:
- "media" → All images/videos
- "media_analysis" → Research docs
- "outreach" → Generated emails
- "logs" → Error logs

Before posting to social media or sending via email:
- Make file public or viewable by anyone with link
- Return file URL (not binary data) to manager agent

**BINARY DATA HANDLING:**

NEVER pass binary data between manager → sub-workflow
Instead:
1. Upload file to Google Drive in initial workflow
2. Pass file_id to sub-workflow as string
3. Sub-workflow downloads using file_id
4. Sub-workflow processes and uploads result
5. Sub-workflow returns new file_id/url

**SUB-WORKFLOW TOOLS:**

Each sub-workflow tool in manager agent:
\`\`\`json
{
  "name": "lead_processing_tool",
  "description": "Enriches lead data using Clearbit and Hunter.io. Use when user submits new lead or mentions lead enrichment.",
  "schema": {
    "type": "object",
    "properties": {
      "lead_email": {"type": "string"},
      "lead_name": {"type": "string"},
      "company": {"type": "string"},
      "chat_id": {"type": "string", "default": "{{$('Trigger').item.json.message.chat.id}}"}
    },
    "required": ["lead_email"]
  }
}
\`\`\`

**NODE POSITIONING:**

Arrange nodes for readability:
- Trigger: [250, 300]
- AI Agent: [450, 300]
- IF Node: [650, 300]
- Log Success: [850, 200]
- Error Alert: [850, 400]
- Workflow Complete: [1050, 300]

**VALIDATION BEFORE RETURNING:**

Check that EVERY node has proper connections:
- No orphaned nodes (disconnected)
- All paths from IF node are connected
- Final merge point exists
- All sub-workflow tools point to valid workflow IDs

If any nodes are disconnected, FIX the connections before returning the JSON.
`;

/**
 * Checks if user's subscription tier has access to orchestration features
 */
export function canAccessOrchestration(tier: string): boolean {
  return tier === 'agency' || tier === 'enterprise';
}

/**
 * Returns upgrade message for orchestration features
 */
export function getOrchestrationUpgradeMessage(): string {
  return "Advanced orchestration patterns with manager-worker architecture, error handling, and production-grade logging are available on Agency and Enterprise plans. Upgrade to build complex multi-workflow systems.";
}
