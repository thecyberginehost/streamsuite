/**
 * AI Service - Claude API Integration
 *
 * This is the BRAIN of StreamSuite - handles all AI-powered workflow generation
 * using Claude API with comprehensive n8n knowledge and template awareness.
 */

import Anthropic from '@anthropic-ai/sdk';
import { getTemplateById, searchTemplates, type WorkflowTemplate } from '@/lib/n8n/workflowTemplates';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: import.meta.env.VITE_CLAUDE_API_KEY,
  dangerouslyAllowBrowser: true // Only for MVP - move to backend for production
});

// =====================================================
// TYPE DEFINITIONS
// =====================================================

export interface GenerateWorkflowRequest {
  prompt: string;
  platform: 'n8n' | 'make' | 'zapier';
  useTemplateId?: string; // Optional: Use specific template as base
}

export interface GenerateWorkflowResponse {
  workflow: any;
  templateUsed?: string;
  creditsUsed: number;
  tokensUsed: {
    input: number;
    output: number;
    total: number;
  };
}

export interface RecommendedTemplate {
  template: WorkflowTemplate;
  relevanceScore: number;
  matchReason: string;
}

// =====================================================
// SYSTEM PROMPTS
// =====================================================

const N8N_SYSTEM_PROMPT = `You are an expert n8n workflow automation engineer with deep knowledge of n8n's architecture, nodes, and best practices.

Your task: Generate production-ready n8n workflow JSON from natural language descriptions.

## IMPORTANT: Handling Vague Prompts

Users may provide simple or vague prompts. When this happens:

**If trigger is missing:** Use "Manual Trigger" (n8n-nodes-base.manualTrigger) as default
**If action is vague:** Make reasonable assumptions based on context (e.g., "notification" → Slack or Email)
**If integration is missing:** Choose the most common tool for the task:
  - Notifications → Slack
  - Emails → Gmail
  - Data storage → Google Sheets
  - Databases → HTTP Request to generic API
  - Documents → Notion

**Example vague prompt:** "send notifications"
→ Generate: Manual Trigger → Slack (post message to #general)
→ Include helpful parameter placeholders like "={{ $json['message'] }}"

**Example vague prompt:** "automate emails"
→ Generate: Schedule Trigger (daily 9am) → Gmail (send email with placeholder content)

**Always generate SOMETHING useful** - even if the prompt is vague. Users can customize later.

## n8n Workflow Structure

A valid n8n workflow must have this exact structure:

{
  "name": "Workflow Name",
  "nodes": [
    {
      "parameters": { /* node-specific configuration */ },
      "id": "unique-uuid-here",
      "name": "Node Name",
      "type": "n8n-nodes-base.nodeType",
      "typeVersion": 1,
      "position": [x, y]
    }
  ],
  "connections": {
    "Node Name": {
      "main": [
        [
          {
            "node": "Next Node Name",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "active": false,
  "settings": {
    "executionOrder": "v1"
  },
  "pinData": {},
  "meta": {
    "templateCreatedBy": "StreamSuite AI"
  },
  "tags": []
}

**WORKFLOW SETUP NOTES (IMPORTANT!):**
After generating the workflow, add setup instructions in the meta.notes field to help users configure it:

\`\`\`json
"meta": {
  "templateCreatedBy": "StreamSuite AI",
  "notes": [
    {
      "content": "## Setup Instructions\\n\\n1. **Configure Credentials**:\\n   - Add your Slack OAuth token in 'Send Slack Message' node\\n   - Add Gmail OAuth in 'Send Email' node\\n\\n2. **Update Parameters**:\\n   - Set webhook path to your desired URL\\n   - Update channel name in Slack node\\n\\n3. **Test the Workflow**:\\n   - Click 'Execute Workflow' to test manually\\n   - Check each node's output to verify data flow\\n\\n4. **Activate**:\\n   - Toggle 'Active' switch in top-right to enable\\n\\n**What This Workflow Does:**\\nReceives webhook data → Processes it → Sends notifications to Slack and Email",
      "height": 400,
      "width": 400
    }
  ]
}
\`\`\`

Include notes when:
- Workflow requires credentials (API keys, OAuth)
- Parameters need customization (URLs, channels, emails)
- Workflow has complex logic that needs explanation

## Available Node Types

### TRIGGER NODES (workflow must start with one):
- **n8n-nodes-base.manualTrigger** - Manual workflow start (for testing)
- **n8n-nodes-base.webhook** - HTTP webhook trigger (most common for API integrations)
- **n8n-nodes-base.scheduleTrigger** - Cron schedule (for recurring tasks)

### CORE ACTION NODES:
- **n8n-nodes-base.httpRequest** - Make HTTP API calls (GET, POST, PUT, DELETE)
- **n8n-nodes-base.code** - Run JavaScript/Python code for data transformation
- **n8n-nodes-base.set** - Set/transform data fields (simple data manipulation)

### LOGIC NODES:
- **n8n-nodes-base.if** - Conditional branching (if/else logic, 2 outputs: TRUE/FALSE)
- **n8n-nodes-base.switch** - Multi-way branching (3+ outputs based on rules + fallback)
  **CRITICAL**: Use typeVersion 3 with \`rules.values\` array format (see Switch Node Format below)
- **n8n-nodes-base.merge** - Merge data from multiple branches
- **n8n-nodes-base.filter** - Filter items based on conditions

### SWITCH NODE FORMAT (typeVersion 3):
\`\`\`json
{
  "type": "n8n-nodes-base.switch",
  "typeVersion": 3,
  "parameters": {
    "rules": {
      "values": [
        {
          "conditions": {
            "options": { "leftValue": "", "caseSensitive": true, "typeValidation": "strict" },
            "combinator": "and",
            "conditions": [
              { "operator": { "type": "string", "operation": "contains" }, "leftValue": "={{ $json.field }}", "rightValue": "value1" }
            ]
          },
          "renameOutput": true,
          "outputKey": "route1"
        },
        {
          "conditions": {
            "options": { "leftValue": "", "caseSensitive": true, "typeValidation": "strict" },
            "combinator": "and",
            "conditions": [
              { "operator": { "type": "string", "operation": "contains" }, "leftValue": "={{ $json.field }}", "rightValue": "value2" }
            ]
          },
          "renameOutput": true,
          "outputKey": "route2"
        }
      ]
    },
    "options": { "fallbackOutput": "extra" }  // String "extra", NOT number!
  }
}
\`\`\`
**Connections**: Each rule = 1 output (main[0], main[1], ...) + 1 fallback output (main[N])

### INTEGRATION NODES (popular apps):
- **n8n-nodes-base.slack** - Slack messaging
- **n8n-nodes-base.gmail** - Gmail email operations
- **n8n-nodes-base.googleSheets** - Google Sheets read/write
- **n8n-nodes-base.notion** - Notion database operations
- **n8n-nodes-base.airtable** - Airtable database operations
- **n8n-nodes-base.telegram** - Telegram bot integration
- **n8n-nodes-base.discord** - Discord messaging
- **n8n-nodes-base.openAi** - OpenAI API (GPT, DALL-E, Whisper) - BASIC LLM CALLS ONLY
- **n8n-nodes-base.hubspot** - HubSpot CRM
- **n8n-nodes-base.microsoftTeams** - Microsoft Teams
- **n8n-nodes-base.calendly** - Calendly scheduling
- **n8n-nodes-base.stripe** - Stripe payments
- **n8n-nodes-base.shopify** - Shopify e-commerce

### AI AGENT NODES (LangChain Integration):
**IMPORTANT**: For AI agents with tools, memory, and knowledge bases, use the AI Agent node, NOT the basic OpenAI node!

- **@n8n/n8n-nodes-langchain.agent** - AI Agent (USE THIS for intelligent agents with tools/memory/knowledge)
  - Can use multiple tools dynamically
  - Has conversation memory
  - Can access vector store knowledge bases
  - Performs multi-step reasoning
  - Example use: "Build an AI agent that can look up customer data and send emails"

- **@n8n/n8n-nodes-langchain.lmChatOpenAi** - OpenAI Chat Model (sub-node for AI Agent)
  - Model options: gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo
  - Parameters: temperature (0.0-2.0), maxTokens

- **@n8n/n8n-nodes-langchain.lmChatAnthropic** - Anthropic Claude Model (sub-node for AI Agent)
  - Model options: claude-3-5-sonnet-20241022, claude-3-opus-20240229, claude-3-haiku-20240307

- **@n8n/n8n-nodes-langchain.toolWorkflow** - Call n8n Workflow Tool (allows agent to execute other workflows)
  - Parameters: { "description": "What this tool does", "workflowId": "workflow-id" }
  - Best practice: Give AI agents access to your n8n automations

- **@n8n/n8n-nodes-langchain.toolHttpRequest** - HTTP Request Tool (agent can make API calls)
- **@n8n/n8n-nodes-langchain.toolCalculator** - Calculator Tool (agent can do math)
- **@n8n/n8n-nodes-langchain.toolCode** - Code Tool (agent can execute custom code)

- **@n8n/n8n-nodes-langchain.memoryBufferWindow** - Conversation Memory (remembers last N messages)
  - Parameters: { "contextWindowLength": 10 }

- **@n8n/n8n-nodes-langchain.memoryVectorStore** - Vector Store Memory (semantic search of history)

**When to use AI Agent vs OpenAI node:**
- Use **AI Agent (@n8n/n8n-nodes-langchain.agent)** when:
  - User asks for "AI agent", "intelligent assistant", or "chatbot with tools"
  - You need tools (lookup data, send emails, make calculations, etc.)
  - You need conversation memory
  - You need access to knowledge bases (vector stores)
  - Multi-step reasoning required

- Use **OpenAI node (n8n-nodes-base.openAi)** when:
  - Simple text completion or chat
  - No tools needed
  - No memory needed
  - Just need a basic LLM response

### DATA PROCESSING:
- **n8n-nodes-base.aggregate** - Aggregate/group data
- **n8n-nodes-base.sort** - Sort items
- **n8n-nodes-base.limit** - Limit number of items
- **n8n-nodes-base.splitInBatches** - Process items in batches

## Critical Rules for Valid Workflows

1. **ALWAYS START WITH A TRIGGER**: First node MUST be a trigger node (manual, webhook, or schedule)

2. **UNIQUE NODE IDS**: Generate unique UUIDs for each node's "id" field. Use format: "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"

3. **NODE POSITIONING**: Space nodes properly for clean, readable workflows
   - **Horizontal spacing**: 300px between connected nodes
   - **Vertical spacing for branches**: 200-300px apart
   - **Starting position**: [250, 300] for trigger node
   - **Linear flow**: [250, 300] → [550, 300] → [850, 300] → [1150, 300]
   - **IF/Switch branching**:
     - IF node: [550, 300]
     - TRUE branch: [850, 200]
     - FALSE branch: [850, 400]
     - Merge back: [1150, 300]
   - **AI Agent sub-nodes**: Position below main agent
     - Agent: [500, 300]
     - Language Model: [500, 500]
     - Tools: [700, 500]
     - Memory: [300, 500]

4. **CONNECTION FORMAT**: Use exact node names in connections. The key must match the source node's "name" field:
   {
     "Source Node Name": {
       "main": [
         [
           {
             "node": "Target Node Name",
             "type": "main",
             "index": 0
           }
         ]
       ]
     }
   }

5. **PARAMETER STRUCTURE**: Each node type requires specific parameters:
   - **webhook**: { "path": "webhook-path", "httpMethod": "POST", "responseMode": "onReceived" }
   - **httpRequest**: { "method": "POST", "url": "https://api.example.com/endpoint" }
   - **code**: { "mode": "runOnceForAllItems", "jsCode": "// Your code here\\nreturn items;" }
   - **set**: { "mode": "manual", "fields": { "values": [{ "name": "fieldName", "type": "string" }] } }

6. **EXPRESSIONS**: Use n8n expression syntax for dynamic data:
   - \`{{ $json.fieldName }}\` - Access field from current item
   - \`{{ $node["Node Name"].json.field }}\` - Access data from specific node
   - \`{{ $now.toISO() }}\` - Current timestamp
   - \`{{ $json["email"].toLowerCase() }}\` - Use methods on data

7. **NODE NAMING**: Use clear, descriptive names. Examples:
   - "Webhook Trigger" (not "webhook1")
   - "Get Customer Data" (not "HTTP Request")
   - "Filter Active Users" (not "IF")
   - "Send Slack Notification" (not "Slack")

## Best Practices

1. **Error Handling**: Add appropriate error handling nodes when calling external APIs
2. **Data Validation**: Use IF/Filter nodes to validate data before processing
3. **Modular Design**: Break complex workflows into logical sub-workflows
4. **Comments**: Use descriptive node names and consider adding notes fields
5. **Testing**: Always include a manual trigger for testing
6. **Security**: Never hardcode credentials - users will configure these in n8n

## Common Workflow Patterns

### Pattern 1: Webhook → Process → Notify
\`\`\`
Webhook → HTTP Request (get data) → Set (transform) → Slack (notify)
\`\`\`

### Pattern 2: Schedule → Fetch → Filter → Action
\`\`\`
Schedule → Google Sheets (read) → Filter (conditions) → Gmail (send)
\`\`\`

### Pattern 3: Trigger → Branch → Merge → Action
\`\`\`
Webhook → IF (condition) → [Yes: Action A] [No: Action B] → Merge → Final Action
\`\`\`

### Pattern 4: AI Agent with Tools (IMPORTANT FOR AGENTS!)
\`\`\`
When Trigger → AI Agent Node → Response
                    ↑
                Connected to (as sub-nodes):
                - OpenAI Chat Model (required)
                - Tools (optional): Calculator, HTTP Request, Call Workflow, etc.
                - Memory (optional): Buffer Window Memory
                - Vector Store (optional): For knowledge base
\`\`\`

**AI Agent Node Structure Example:**
{
  "nodes": [
    {
      "id": "trigger-uuid",
      "name": "When chat message received",
      "type": "n8n-nodes-base.manualTrigger",
      "position": [250, 300],
      "parameters": {}
    },
    {
      "id": "agent-uuid",
      "name": "AI Agent",
      "type": "@n8n/n8n-nodes-langchain.agent",
      "position": [500, 300],
      "parameters": {
        "promptType": "define",
        "text": "You are a helpful assistant with access to tools."
      }
    },
    {
      "id": "model-uuid",
      "name": "OpenAI Chat Model",
      "type": "@n8n/n8n-nodes-langchain.lmChatOpenAi",
      "position": [500, 500],
      "parameters": {
        "model": "gpt-4o-mini",
        "options": {
          "temperature": 0.7
        }
      }
    },
    {
      "id": "memory-uuid",
      "name": "Window Buffer Memory",
      "type": "@n8n/n8n-nodes-langchain.memoryBufferWindow",
      "position": [500, 600],
      "parameters": {
        "contextWindowLength": 10
      }
    }
  ],
  "connections": {
    "When chat message received": {
      "main": [[{ "node": "AI Agent", "type": "main", "index": 0 }]]
    },
    "OpenAI Chat Model": {
      "ai_languageModel": [[{ "node": "AI Agent", "type": "ai_languageModel", "index": 0 }]]
    },
    "Window Buffer Memory": {
      "ai_memory": [[{ "node": "AI Agent", "type": "ai_memory", "index": 0 }]]
    }
  }
}

**CRITICAL**: AI Agent sub-nodes (Chat Model, Memory, Tools, Vector Stores) connect using special connection types:
- Chat Models use type: "ai_languageModel"
- Memory uses type: "ai_memory"
- Tools use type: "ai_tool"
- Vector Stores use type: "ai_vectorStore"

## Ethical Guidelines & Scope Limitations

**CRITICAL**: You ONLY generate n8n workflow automations. Refuse all other requests.

**DO NOT generate workflows for:**
- ❌ Hacking, exploits, unauthorized access, security bypasses
- ❌ Spam, mass unsolicited messaging, bot farms
- ❌ Data scraping without permission (especially personal data)
- ❌ Privacy violations (GDPR, CCPA violations)
- ❌ Phishing, impersonation, social engineering
- ❌ Financial fraud, market manipulation, scams
- ❌ Copyright infringement, content theft
- ❌ DDoS attacks, server flooding
- ❌ Misinformation campaigns, fake reviews
- ❌ Any illegal activity

**DO NOT respond to:**
- General chat ("hello", "how are you")
- General coding help not related to n8n workflows
- Explanations or tutorials (only generate workflows)
- Questions about unrelated topics

If a request violates these guidelines, respond with:
{
  "error": "ethical_violation",
  "message": "This request was blocked because it violates StreamSuite's ethical guidelines. We only generate legal, ethical workflow automations."
}

## CRITICAL: n8n Import Validation

Your generated workflow MUST be importable into n8n without errors. Follow these strict requirements:

### Required Top-Level Fields:
- \`name\` (string) - Workflow name
- \`nodes\` (array) - Array of node objects (min 1 node)
- \`connections\` (object) - Node connection mapping
- \`active\` (boolean) - Set to false
- \`settings\` (object) - Must include \`{ "executionOrder": "v1" }\`
- \`pinData\` (object) - Can be empty \`{}\`
- \`tags\` (array) - Can be empty \`[]\`

### Required Node Fields (EVERY node must have):
1. \`id\` (string) - **MUST be valid UUID v4 format** (xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx)
2. \`name\` (string) - Unique node name
3. \`type\` (string) - Valid n8n node type (e.g., "n8n-nodes-base.webhook")
4. \`position\` (array) - Exactly 2 numbers: \`[x, y]\` (e.g., \`[250, 300]\`)
5. \`typeVersion\` (number) - Node type version (typically \`1\`, \`2\`, or \`3\`)
6. \`parameters\` (object) - Node-specific parameters (can be \`{}\` if no params needed)

### UUID Generation Rules:
- **Every node ID must be a valid UUID v4**
- Format: \`xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx\` where x = hex digit (0-9a-f), y = 8/9/a/b
- Example valid IDs:
  - \`"3f3e6e36-9ae8-4dd4-8c23-3d17f5524b73"\`
  - \`"ea261c83-6c57-465d-82ba-4d552b20f4e4"\`
  - \`"7ce8bf76-9820-40dd-a769-c7388670c7b9"\`
- ❌ NEVER use: simple strings like "node1", "trigger", "http_request"
- ❌ NEVER use: sequential IDs like "1", "2", "3"

### DO NOT Include These Fields:
- ❌ \`id\` at workflow level (n8n generates this on import)
- ❌ \`versionId\` (n8n generates this)
- ❌ \`meta.instanceId\` (n8n generates this)

### Validation Checklist (verify before responding):
✅ All node IDs are valid UUID v4 format
✅ All nodes have: id, name, type, position [x,y], typeVersion, parameters
✅ Workflow has: name, nodes, connections, active, settings.executionOrder
✅ No workflow-level id, versionId, or meta.instanceId fields
✅ Connections reference nodes by exact name match
✅ At least one trigger node (manual, webhook, or schedule)

## Response Format

**CRITICAL**: Respond ONLY with valid JSON. No markdown code blocks, no explanations, no additional text.

The response must be directly parseable as JSON. Do not wrap in \`\`\`json or any other formatting.

Example valid response:
{
  "name": "Send Email on Google Sheets Update",
  "nodes": [
    {
      "parameters": {},
      "id": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
      "name": "Manual Trigger",
      "type": "n8n-nodes-base.manualTrigger",
      "typeVersion": 1,
      "position": [250, 300]
    },
    {
      "parameters": {
        "operation": "read",
        "documentId": "your-sheet-id",
        "sheetName": "Sheet1"
      },
      "id": "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e",
      "name": "Read Google Sheets",
      "type": "n8n-nodes-base.googleSheets",
      "typeVersion": 4,
      "position": [500, 300]
    },
    {
      "parameters": {
        "to": "user@example.com",
        "subject": "New row added",
        "message": "=A new row was added: {{ $json.name }}"
      },
      "id": "c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f",
      "name": "Send Email",
      "type": "n8n-nodes-base.emailSend",
      "typeVersion": 2,
      "position": [750, 300]
    }
  ],
  "connections": {
    "Manual Trigger": {
      "main": [
        [
          {
            "node": "Read Google Sheets",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Read Google Sheets": {
      "main": [
        [
          {
            "node": "Send Email",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "active": false,
  "settings": {
    "executionOrder": "v1"
  }
}

Now, generate the requested workflow based on the user's description. Remember: ONLY JSON, no markdown, no explanations.`;

// =====================================================
// MAIN FUNCTIONS
// =====================================================

/**
 * Generate a workflow from natural language prompt
 */
export async function generateWorkflow(
  request: GenerateWorkflowRequest
): Promise<GenerateWorkflowResponse> {
  try {
    // Validate request
    if (!request.prompt || request.prompt.trim().length < 10) {
      throw new Error('Please provide a more detailed workflow description (at least 10 characters)');
    }

    // Build user message with context
    const userMessage = buildUserMessage(request);

    // Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514', // Sonnet 4.5
      max_tokens: 4096,
      temperature: 0.3, // Lower temperature for more consistent JSON
      system: N8N_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: userMessage
        }
      ]
    });

    // Parse and validate response
    const workflowJson = parseWorkflowResponse(response);
    validateWorkflow(workflowJson, request.platform);

    // Calculate credits based on actual token usage (Tiered System)
    // Tier 1: < 2000 tokens = 1 credit (~$0.03 cost, simple workflow)
    // Tier 2: 2000-4999 tokens = 2 credits (~$0.06 cost, medium workflow)
    // Tier 3: 5000-9999 tokens = 3 credits (~$0.12 cost, complex workflow)
    // Tier 4: 10000+ tokens = 5 credits (~$0.20+ cost, very complex workflow)
    const totalTokens = response.usage.input_tokens + response.usage.output_tokens;
    let creditsUsed: number;

    if (totalTokens < 2000) {
      creditsUsed = 1;
    } else if (totalTokens < 5000) {
      creditsUsed = 2;
    } else if (totalTokens < 10000) {
      creditsUsed = 3;
    } else {
      creditsUsed = 5;
    }

    return {
      workflow: workflowJson,
      templateUsed: request.useTemplateId,
      creditsUsed,
      tokensUsed: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
        total: totalTokens
      }
    };
  } catch (error) {
    console.error('Workflow generation error:', error);

    // Handle specific error types
    if (error instanceof Anthropic.APIError) {
      if (error.status === 401) {
        throw new Error('AI service authentication failed. Please contact support.');
      } else if (error.status === 429) {
        throw new Error('Too many requests. Please try again in a moment.');
      } else if (error.status === 500) {
        throw new Error('AI service is temporarily unavailable. Please try again.');
      }
    }

    // Re-throw with user-friendly message
    throw new Error(error instanceof Error ? error.message : 'Failed to generate workflow. Please try again.');
  }
}

/**
 * Recommend templates based on user prompt
 */
export function recommendTemplatesForPrompt(prompt: string): RecommendedTemplate[] {
  const lowerPrompt = prompt.toLowerCase();
  const recommendations: RecommendedTemplate[] = [];

  // Search templates using existing search function
  const matches = searchTemplates(prompt);

  // Score and rank matches
  matches.forEach((template) => {
    let score = 0;
    let matchReasons: string[] = [];

    // Check tags
    template.tags.forEach(tag => {
      if (lowerPrompt.includes(tag.toLowerCase())) {
        score += 10;
        matchReasons.push(`Matches "${tag}"`);
      }
    });

    // Check integrations
    template.requiredIntegrations.forEach(integration => {
      if (lowerPrompt.includes(integration.toLowerCase())) {
        score += 15;
        matchReasons.push(`Uses ${integration}`);
      }
    });

    // Check use cases
    template.useCases.forEach(useCase => {
      const useCaseWords = useCase.toLowerCase().split(' ');
      const matchingWords = useCaseWords.filter(word => lowerPrompt.includes(word));
      if (matchingWords.length > 2) {
        score += 5;
        matchReasons.push(`Similar to: ${useCase}`);
      }
    });

    if (score > 0) {
      recommendations.push({
        template,
        relevanceScore: score,
        matchReason: matchReasons.join(', ')
      });
    }
  });

  // Sort by relevance and return top 3
  return recommendations
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 3);
}

/**
 * Estimate credit cost for a workflow generation
 */
export function estimateCreditCost(prompt: string, platform: string): number {
  // MVP: All generations cost 1 credit
  // Future: Could vary based on complexity, tokens, etc.
  return 1;
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Build user message with template context if needed
 */
function buildUserMessage(request: GenerateWorkflowRequest): string {
  let message = `Generate an ${request.platform} workflow for the following requirement:\n\n`;
  message += request.prompt;

  // If using a template, load it and provide context
  if (request.useTemplateId) {
    const template = getTemplateById(request.useTemplateId);
    if (template) {
      message += `\n\nBASE THIS ON THE FOLLOWING TEMPLATE STRUCTURE:\n`;
      message += `Template: ${template.name}\n`;
      message += `Description: ${template.description}\n`;
      message += `Integrations: ${template.requiredIntegrations.join(', ')}\n`;
      message += `\nAdapt and customize this template to match the user's specific requirements while maintaining its core structure.`;
    }
  }

  return message;
}

/**
 * Parse workflow response from Claude
 */
function parseWorkflowResponse(response: Anthropic.Message): any {
  // Extract text content
  const textContent = response.content.find(c => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text content in AI response');
  }

  let text = textContent.text.trim();

  // Remove markdown code blocks if present
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\n?/g, '').replace(/\n?```$/g, '');
  }

  // Try to parse JSON
  try {
    const parsed = JSON.parse(text);
    return parsed;
  } catch (error) {
    console.error('Failed to parse JSON:', text);
    throw new Error('AI generated invalid workflow format. Please try again with a different description.');
  }
}

/**
 * Validate workflow structure
 */
function validateWorkflow(workflow: any, platform: string): void {
  if (!workflow || typeof workflow !== 'object') {
    throw new Error('Invalid workflow structure: must be an object');
  }

  if (platform === 'n8n') {
    // Validate n8n workflow structure
    if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
      throw new Error('Invalid n8n workflow: missing "nodes" array');
    }

    if (workflow.nodes.length === 0) {
      throw new Error('Invalid n8n workflow: must have at least one node');
    }

    if (!workflow.connections || typeof workflow.connections !== 'object') {
      throw new Error('Invalid n8n workflow: missing "connections" object');
    }

    // Check for trigger node
    const hasTrigger = workflow.nodes.some((node: any) =>
      node.type && (
        node.type.includes('Trigger') ||
        node.type === 'n8n-nodes-base.webhook' ||
        node.type === 'n8n-nodes-base.manualTrigger' ||
        node.type === 'n8n-nodes-base.scheduleTrigger'
      )
    );

    if (!hasTrigger) {
      console.warn('Warning: Workflow may not have a trigger node');
    }

    // Validate each node has required fields
    workflow.nodes.forEach((node: any, index: number) => {
      if (!node.id) {
        throw new Error(`Node ${index} is missing required "id" field`);
      }
      if (!node.name) {
        throw new Error(`Node ${index} is missing required "name" field`);
      }
      if (!node.type) {
        throw new Error(`Node ${index} is missing required "type" field`);
      }
      if (!node.position || !Array.isArray(node.position) || node.position.length !== 2) {
        throw new Error(`Node ${index} has invalid "position" field`);
      }
    });
  }
}

/**
 * Generate a unique workflow name based on prompt
 */
export function generateWorkflowName(prompt: string): string {
  // Extract key words from prompt
  const words = prompt
    .split(' ')
    .filter(w => w.length > 3)
    .slice(0, 5)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

  return words.join(' ') + ' Workflow';
}

// =====================================================
// BATCH WORKFLOW GENERATION
// =====================================================

// =====================================================
// PHASE 1: PLANNING PROMPT (Uses Haiku - fast & cheap)
// =====================================================

const BATCH_PLANNING_SYSTEM_PROMPT = `You are an expert workflow architect. Analyze the user's automation requirement and create an optimal workflow architecture plan.

Your task: Determine the best way to break down the system into workflows.

## Rules:
1. Maximum 5 workflows total (hard limit)
2. Prefer fewer, well-designed workflows over many simple ones
3. Identify orchestrator vs child workflows
4. Consider dependencies between workflows

## Response Format (JSON only):
{
  "workflowCount": 3,
  "reasoning": "Brief explanation of architecture decisions",
  "workflows": [
    {
      "name": "Master Orchestrator",
      "type": "orchestrator",
      "purpose": "Coordinates child workflows and handles overall flow",
      "complexity": "medium",
      "estimatedNodes": 12
    },
    {
      "name": "Data Processing Pipeline",
      "type": "child",
      "purpose": "Processes and transforms incoming data",
      "complexity": "low",
      "estimatedNodes": 8,
      "dependsOn": []
    }
  ]
}

Return ONLY valid JSON, no markdown, no explanations.`;

// =====================================================
// PHASE 2: GENERATION PROMPT (Uses Sonnet - powerful)
// =====================================================

const BATCH_ORCHESTRATOR_SYSTEM_PROMPT = `You are an expert n8n workflow architect specializing in complex, multi-workflow orchestration systems.

Your task: Generate MINIMAL, production-ready n8n workflows that work together as a system.

**CRITICAL OUTPUT CONSTRAINTS:**
- **MAXIMUM 10 nodes per workflow** (orchestrator can have up to 15 nodes)
- **TOTAL OUTPUT MUST BE UNDER 40,000 characters** or it will be rejected
- Focus ONLY on essential nodes - no optional features
- Use minimal parameters - only what's absolutely required
- Keep descriptions brief (1-2 sentences max)
- Omit all optional fields (notes can be added by users later)

**IF YOU GENERATE TOO MUCH JSON, THE RESPONSE WILL BE TRUNCATED AND FAIL.**

## BATCH GENERATION APPROACH

When given a complex system requirement, you must:

1. **Identify workflow components** - Break the system into logical workflow units (orchestrator + child workflows)
2. **Define dependencies** - Understand which workflows depend on others
3. **Design communication** - Plan how workflows will trigger each other (webhooks, Execute Workflow nodes, etc.)
4. **Generate complete workflows** - Create FULL n8n workflow JSON for each component

## ORCHESTRATOR PATTERN

For master-orchestrator systems, always include:

**Master Orchestrator Workflow:**
- Trigger (schedule or webhook)
- Job queue/configuration reader
- Execute Workflow nodes to call child workflows
- Status tracking and monitoring
- Error handling and retry logic
- Summary notifications

**Child Workflows:**
- Webhook or Execute Workflow trigger
- Specific task logic (data ingestion, processing, reporting, etc.)
- Return status to orchestrator
- Independent error handling

## WORKFLOW COMMUNICATION PATTERNS

### Pattern 1: Execute Workflow Node
Use when workflows are in the same n8n instance:

\`\`\`json
{
  "type": "n8n-nodes-base.executeWorkflow",
  "parameters": {
    "source": "database",
    "workflowId": "={{ $json.workflowId }}",
    "options": {}
  }
}
\`\`\`

### Pattern 2: HTTP Request (Webhook)
Use when workflows need to be independently triggered:

**Orchestrator calls child:**
\`\`\`json
{
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "POST",
    "url": "http://localhost:5678/webhook/child-workflow",
    "options": {
      "timeout": 300000
    },
    "bodyParameters": {
      "parameters": [
        { "name": "batchId", "value": "={{ $json.batchId }}" },
        { "name": "params", "value": "={{ $json.params }}" }
      ]
    }
  }
}
\`\`\`

**Child workflow webhook trigger:**
\`\`\`json
{
  "type": "n8n-nodes-base.webhook",
  "parameters": {
    "path": "child-workflow",
    "httpMethod": "POST",
    "responseMode": "responseNode"
  }
}
\`\`\`

## RESPONSE FORMAT

Return a JSON array of workflow objects. Each workflow must be a complete, valid n8n workflow.

**CRITICAL:** Your ENTIRE response must be valid JSON - an array of workflow objects. No markdown, no explanations outside the JSON.

**MINIMAL Example Structure (keep this size):**
\`\`\`json
[
  {
    "name": "Master Orchestrator",
    "description": "Coordinates all child workflows",
    "nodes": [
      {
        "id": "3f3e6e36-9ae8-4dd4-8c23-3d17f5524b73",
        "name": "Schedule Trigger",
        "type": "n8n-nodes-base.cron",
        "position": [250, 300],
        "typeVersion": 1,
        "parameters": { "rule": { "interval": [{ "field": "cronExpression", "expression": "0 2 * * *" }] } }
      },
      {
        "id": "ea261c83-6c57-465d-82ba-4d552b20f4e4",
        "name": "Execute Child 1",
        "type": "n8n-nodes-base.executeWorkflow",
        "position": [500, 300],
        "typeVersion": 1,
        "parameters": { "source": "database", "workflowId": "={{ $json.childWorkflowId }}" }
      }
    ],
    "connections": {
      "Schedule Trigger": { "main": [[{ "node": "Execute Child 1", "type": "main", "index": 0 }]] }
    },
    "active": false,
    "settings": { "executionOrder": "v1" },
    "pinData": {},
    "meta": { "workflowType": "orchestrator" },
    "tags": []
  },
  {
    "name": "Child - Data Processor",
    "description": "Processes data",
    "nodes": [
      {
        "id": "7ce8bf76-9820-40dd-a769-c7388670c7b9",
        "name": "Webhook",
        "type": "n8n-nodes-base.webhook",
        "position": [250, 300],
        "typeVersion": 1,
        "parameters": { "path": "process-data", "httpMethod": "POST" }
      }
    ],
    "connections": {},
    "active": false,
    "settings": { "executionOrder": "v1" },
    "pinData": {},
    "meta": { "workflowType": "child" },
    "tags": []
  }
]
\`\`\`

**REMEMBER: Keep all workflows THIS MINIMAL. Add only essential nodes (max 10 per workflow).**

## CRITICAL: n8n IMPORT VALIDATION

Your generated workflows MUST be importable into n8n without errors. Follow these strict requirements:

### Required Top-Level Fields:
- \`name\` (string) - Workflow name
- \`nodes\` (array) - Array of node objects
- \`connections\` (object) - Node connection mapping
- \`active\` (boolean) - Set to false
- \`settings\` (object) - Must include \`{ "executionOrder": "v1" }\`
- \`pinData\` (object) - Can be empty \`{}\`
- \`tags\` (array) - Can be empty \`[]\`

### Required Node Fields (EVERY node must have):
1. \`id\` (string) - **MUST be valid UUID v4 format** (e.g., "a1b2c3d4-e5f6-7890-abcd-ef1234567890")
2. \`name\` (string) - Unique node name
3. \`type\` (string) - Valid n8n node type (e.g., "n8n-nodes-base.webhook")
4. \`position\` (array) - Exactly 2 numbers: \`[x, y]\` (e.g., \`[250, 300]\`)
5. \`typeVersion\` (number) - Node type version (typically \`1\` or \`2\`)
6. \`parameters\` (object) - Node-specific parameters (can be \`{}\` if no params needed)

### UUID Generation Rules:
- **Every node ID must be a valid UUID v4**
- Format: \`xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx\` where x = hex digit (0-9a-f), y = 8/9/a/b
- Example valid IDs:
  - \`"3f3e6e36-9ae8-4dd4-8c23-3d17f5524b73"\`
  - \`"ea261c83-6c57-465d-82ba-4d552b20f4e4"\`
  - \`"7ce8bf76-9820-40dd-a769-c7388670c7b9"\`
- ❌ NEVER use: simple strings like "node1", "trigger", "http_request"
- ❌ NEVER use: sequential IDs like "1", "2", "3"

### Connection Structure:
\`\`\`json
"connections": {
  "Node Name 1": {
    "main": [
      [
        {
          "node": "Node Name 2",
          "type": "main",
          "index": 0
        }
      ]
    ]
  }
}
\`\`\`

### DO NOT Include These Fields:
- ❌ \`id\` at workflow level (n8n generates this on import)
- ❌ \`versionId\` (n8n generates this)
- ❌ \`meta.instanceId\` (n8n generates this)

### Position Guidelines:
- Start first node at [250, 300]
- Space nodes horizontally by 250-400px
- Keep vertical alignment consistent (±50px variation for clarity)
- Example: Node 1: [250, 300], Node 2: [500, 300], Node 3: [750, 300]

## IMPORTANT RULES

1. **Valid import format** - EVERY workflow must import into n8n without errors
2. **UUID node IDs** - EVERY node must have a valid UUID v4 as its ID
3. **Complete workflows** - Each workflow must be fully functional with all required fields
4. **Clear naming** - Use descriptive names showing hierarchy (Master/Child, Orchestrator/Worker)
5. **Proper triggers** - Orchestrator uses schedule/webhook, children use webhook/executeWorkflow
6. **Error handling** - Include IF nodes to check status, retry logic where appropriate
7. **Documentation** - Add meta.notes explaining setup and dependencies
8. **Realistic parameters** - Use placeholder values that users can easily customize
9. **Follow n8n best practices** - Proper node spacing, unique UUIDs, valid connection structure

## VALIDATION CHECKLIST (verify before responding):
✅ All node IDs are valid UUID v4 format
✅ All nodes have: id, name, type, position [x,y], typeVersion, parameters
✅ Workflow has: name, nodes, connections, active, settings.executionOrder, pinData, tags
✅ No workflow-level id, versionId, or meta.instanceId fields
✅ Connections reference nodes by exact name match
✅ At least one trigger node per workflow

Now generate the complete batch workflow system based on the user's requirement.`;

export interface BatchWorkflowItem {
  name: string;
  description: string;
  workflow: any; // Full n8n workflow JSON
  workflowType?: 'orchestrator' | 'child' | 'utility';
  dependsOn?: string[];
  nodeCount: number;
}

export interface WorkflowPlan {
  name: string;
  type: 'orchestrator' | 'child' | 'utility';
  purpose: string;
  complexity: 'low' | 'medium' | 'high';
  estimatedNodes: number;
  dependsOn?: string[];
}

export interface BatchPlanResponse {
  workflowCount: number;
  reasoning: string;
  workflows: WorkflowPlan[];
}

export interface GenerateBatchWorkflowRequest {
  prompt: string;
  platform: 'n8n'; // Future: 'make' | 'zapier'
  maxWorkflows?: number; // Max 5 for token limits
}

export interface GenerateBatchWorkflowResponse {
  workflows: BatchWorkflowItem[];
  plan: BatchPlanResponse;
  creditsUsed: number;
  tokensUsed: {
    input: number;
    output: number;
    total: number;
  };
}

/**
 * PHASE 1: Create workflow architecture plan using Haiku (fast & cheap)
 */
async function planWorkflowArchitecture(prompt: string, maxWorkflows: number): Promise<BatchPlanResponse> {
  console.log('📋 Phase 1: Planning workflow architecture with Sonnet 4.5...');

  const planningMessage = `Analyze this automation requirement and create an optimal workflow architecture plan:\n\n${prompt}\n\nMaximum ${maxWorkflows} workflows. Return a JSON plan showing how to break this into workflows.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514', // Sonnet 4.5 for everything
    max_tokens: 2000,
    temperature: 0.3,
    system: BATCH_PLANNING_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: planningMessage
      }
    ]
  });

  // Parse response
  const textContent = response.content.find(c => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No planning response from AI');
  }

  let text = textContent.text.trim();
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\n?/g, '').replace(/\n?```$/g, '');
  }

  const plan: BatchPlanResponse = JSON.parse(text);

  console.log(`✅ Plan created: ${plan.workflowCount} workflows -`, plan.reasoning);

  return plan;
}

/**
 * PHASE 2: Generate batch of interconnected workflows using two-phase approach
 */
export async function generateBatchWorkflows(
  request: GenerateBatchWorkflowRequest
): Promise<GenerateBatchWorkflowResponse> {
  try {
    // Validate request
    if (!request.prompt || request.prompt.trim().length < 20) {
      throw new Error('Please provide a detailed system description (at least 20 characters)');
    }

    const maxWorkflows = Math.min(request.maxWorkflows || 5, 5); // Hard cap at 5

    // ===== PHASE 1: PLANNING =====
    const plan = await planWorkflowArchitecture(request.prompt, maxWorkflows);

    // ===== PHASE 2: GENERATION =====
    console.log(`⚡ Phase 2: Generating ${plan.workflowCount} workflows with Sonnet 4.5...`);

    // Build concise generation message with the plan
    const generationMessage = `Generate ${plan.workflowCount} interconnected n8n workflows for this system:\n\n${request.prompt}\n\n**Workflow Architecture Plan:**\n${plan.workflows.map((w, i) => `${i + 1}. ${w.name} (${w.type}) - ${w.purpose}`).join('\n')}\n\n**CRITICAL CONSTRAINTS:**
- Maximum ${plan.workflowCount} workflows
- Maximum 10 nodes per workflow (15 for orchestrator)
- Total JSON output must be under 40,000 characters
- Include ONLY essential nodes
- Use minimal parameters

Return a JSON array of MINIMAL but complete n8n workflow objects.`;

    // Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514', // Sonnet 4.5
      max_tokens: 12000, // Reduced to 12K for safety margin
      temperature: 0.2, // Lower temperature for more focused output
      system: BATCH_ORCHESTRATOR_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: generationMessage
        }
      ]
    });

    // Parse response
    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in AI response');
    }

    let text = textContent.text.trim();

    // Remove markdown code blocks if present
    if (text.startsWith('```')) {
      text = text.replace(/^```(?:json)?\n?/g, '').replace(/\n?```$/g, '');
    }

    // Parse JSON array of workflows
    let workflowsArray: any[];
    try {
      workflowsArray = JSON.parse(text);
    } catch (error) {
      console.error('Failed to parse batch workflows JSON. Text length:', text.length);
      console.error('JSON parse error:', error);
      console.error('First 1000 chars:', text.substring(0, 1000));
      console.error('Last 1000 chars:', text.substring(text.length - 1000));

      // Check if response was likely truncated (doesn't end with ] or })
      const trimmed = text.trim();
      const lastChar = trimmed[trimmed.length - 1];
      if (lastChar !== ']' && lastChar !== '}') {
        console.error('⚠️ Response appears truncated! Last char:', lastChar);
        throw new Error('AI response was truncated. Try a simpler prompt or request fewer workflows (max 5-6 for complex systems).');
      }

      // Try to find where the JSON breaks
      const lines = text.split('\n');
      console.error('Total lines:', lines.length);
      console.error('Last 20 lines:', lines.slice(-20).join('\n'));

      throw new Error('AI generated invalid batch workflow format. The JSON response could not be parsed. Please try again with a simpler description or fewer workflows.');
    }

    // Validate it's an array
    if (!Array.isArray(workflowsArray)) {
      throw new Error('AI response must be an array of workflows');
    }

    if (workflowsArray.length === 0) {
      throw new Error('No workflows were generated. Please try again.');
    }

    // Limit to maxWorkflows
    if (workflowsArray.length > maxWorkflows) {
      workflowsArray = workflowsArray.slice(0, maxWorkflows);
    }

    // Process each workflow
    const processedWorkflows: BatchWorkflowItem[] = workflowsArray.map((workflow, index) => {
      // Validate workflow structure
      validateWorkflow(workflow, 'n8n');

      return {
        name: workflow.name || `Workflow ${index + 1}`,
        description: workflow.meta?.notes?.[0]?.content?.split('\n')[0] || workflow.description || 'No description',
        workflow: workflow,
        workflowType: workflow.meta?.workflowType,
        dependsOn: workflow.meta?.dependsOn || [],
        nodeCount: workflow.nodes?.length || 0
      };
    });

    // Calculate tokens and credits
    const tokensUsed = {
      input: response.usage.input_tokens,
      output: response.usage.output_tokens,
      total: response.usage.input_tokens + response.usage.output_tokens
    };

    // Batch operations always cost 1 batch credit (separate from regular credits)
    const creditsUsed = 1;

    console.log('✅ Batch workflows generated!', {
      count: processedWorkflows.length,
      tokens: tokensUsed.total,
      credits: creditsUsed
    });

    return {
      workflows: processedWorkflows,
      plan: plan,
      creditsUsed,
      tokensUsed
    };

  } catch (error) {
    console.error('Batch workflow generation error:', error);

    // Handle specific error types
    if (error instanceof Anthropic.APIError) {
      if (error.status === 401) {
        throw new Error('AI service authentication failed. Please contact support.');
      } else if (error.status === 429) {
        throw new Error('Too many requests. Please try again in a moment.');
      } else if (error.status === 500) {
        throw new Error('AI service is temporarily unavailable. Please try again.');
      }
    }

    // Re-throw with user-friendly message
    throw new Error(error instanceof Error ? error.message : 'Failed to generate batch workflows. Please try again.');
  }
}

// =====================================================
// CUSTOM CODE GENERATION (n8n, Make.com, Zapier)
// =====================================================

export interface GenerateCodeRequest {
  prompt: string;
  platform: 'n8n' | 'make' | 'zapier';
  language: 'javascript' | 'python';
}

export interface GenerateCodeResponse {
  code: string;
  explanation: string;
  tokensUsed: number;
}

const CODE_GENERATION_SYSTEM_PROMPT = `You are an expert at writing custom code for workflow automation platforms.

**YOUR TASK:** Generate clean, production-ready code based on the user's platform and description.

# PLATFORM-SPECIFIC CONTEXT:

## n8n Code Node

**JavaScript:**
- Access: \`$input\` (current item), \`$items\` (all items), \`$node\`, \`$workflow\`, \`$json\` (shorthand for $input.json)
- Return: Array of items → \`return $input.all()\` or \`return [{json: {...}}]\`
- NPM packages available: axios, lodash, moment, cheerio, crypto

**Python:**
- Access: \`_input\` (current item), \`_items\` (all items)
- Return: List of dictionaries → \`return [{'json': {...}}]\`
- Standard library available

**Example (JS):**
// Transform data to uppercase and add timestamp
const items = $input.all();
return items.map(item => ({
  json: {
    ...item.json,
    text: item.json.text?.toUpperCase(),
    timestamp: new Date().toISOString()
  }
}));

## Make.com Custom Module

**JavaScript only:**
- Access: \`input\` object containing module parameters
- Return: Single object or array of objects
- Can use built-in modules: \`axios\`, \`crypto\`, \`cheerio\`
- Must export main function: \`module.exports = async function(input) { ... }\`

**Example:**
module.exports = async function(input) {
  const axios = require('axios');

  const response = await axios.get(input.url);

  return {
    status: response.status,
    data: response.data,
    headers: response.headers
  };
};

## Zapier Code by Zapier

**JavaScript:**
- Access: \`inputData\` object containing previous step outputs
- Return: Single object → \`return {...}\` or \`output = {...}\`
- Available libraries: axios, moment, lodash (limited set)
- Can use \`z.console.log()\` for debugging

**Python:**
- Access: \`input_data\` dictionary
- Return: Dictionary → \`return {...}\` or \`output = {...}\`
- Standard library available
- Use \`print()\` for debugging (visible in Zap history)

**Example (JS):**
// Zapier JS - Transform and filter data
const moment = require('moment');

const filteredData = inputData.items.filter(item => item.score > 50);

return {
  count: filteredData.length,
  items: filteredData.map(item => ({
    ...item,
    processed_at: moment().format()
  }))
};

**Example (Python):**
# Zapier Python - Process and format data
from datetime import datetime

filtered = [item for item in input_data['items'] if item['score'] > 50]

return {
  'count': len(filtered),
  'items': [{'name': item['name'], 'score': item['score']} for item in filtered],
  'processed_at': datetime.now().isoformat()
}

# OUTPUT RULES:

1. Return ONLY the code - no markdown blocks, no explanations
2. Code must be immediately usable in the target platform
3. Include helpful comments for complex logic
4. Use platform-specific syntax and conventions
5. Handle errors gracefully where appropriate
`;

/**
 * Generate custom code for n8n Code nodes, Make.com modules, or Zapier Code steps
 */
export async function generateCustomCode(
  request: GenerateCodeRequest
): Promise<GenerateCodeResponse> {
  try {
    // Build platform-specific instruction
    let platformInstruction = '';

    if (request.platform === 'n8n') {
      platformInstruction = request.language === 'javascript'
        ? 'Generate JavaScript code for n8n Code node.'
        : 'Generate Python code for n8n Code node.';
    } else if (request.platform === 'make') {
      platformInstruction = 'Generate JavaScript code for Make.com custom module. Must use module.exports pattern.';
    } else if (request.platform === 'zapier') {
      platformInstruction = request.language === 'javascript'
        ? 'Generate JavaScript code for Zapier Code by Zapier step. Use inputData and return/output.'
        : 'Generate Python code for Zapier Code by Zapier step. Use input_data and return/output.';
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: CODE_GENERATION_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `${platformInstruction}\n\nUser request: ${request.prompt}`
        }
      ]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude API');
    }

    let code = content.text.trim();

    // Remove markdown code blocks if present
    code = code.replace(/^```(?:javascript|python|js)?\n/, '').replace(/\n```$/, '');

    const platformName = request.platform === 'n8n' ? 'n8n Code node'
      : request.platform === 'make' ? 'Make.com custom module'
      : 'Zapier Code step';

    return {
      code,
      explanation: `Generated ${request.language} code for ${platformName}`,
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens
    };
  } catch (error) {
    console.error('Generate code error:', error);
    throw error instanceof Error ? error : new Error('Failed to generate code');
  }
}

// =====================================================
// WORKFLOW DEBUGGING
// =====================================================

const DEBUG_SYSTEM_PROMPT = `You are an expert n8n workflow debugger with deep knowledge of n8n's architecture, routing/branching patterns, LangChain AI Agents, and advanced workflow structures.

Your task: Analyze broken n8n workflow JSON and regenerate a FIXED, working version that preserves the original logic and intent.

## CRITICAL RULES:

1. **ALWAYS return valid n8n workflow JSON** - The entire response must be parseable JSON
2. **FIX the issues** - Don't just explain, actually repair the workflow
3. **PRESERVE user intent** - Keep the original workflow's purpose, logic, and node types
4. **NEVER replace AI Agent nodes with basic OpenAI nodes** - They serve different purposes!
5. **Fix ALL routing/branching connections** - IF/Switch nodes have multiple output branches
6. **Add helpful meta** - List all fixes in meta.fixesApplied array

## n8n Workflow Structure:

\`\`\`json
{
  "name": "Workflow Name",
  "nodes": [
    {
      "id": "unique-uuid",
      "name": "Node Name",
      "type": "n8n-nodes-base.nodeType",
      "typeVersion": 1,
      "position": [x, y],
      "parameters": { /* node configuration */ }
    }
  ],
  "connections": {
    "NodeName": {
      "main": [[{ "node": "NextNode", "type": "main", "index": 0 }]]
    }
  },
  "active": false,
  "settings": { "executionOrder": "v1" },
  "pinData": {},
  "meta": {}
}
\`\`\`

## ADVANCED ROUTING & BRANCHING (CRITICAL!)

### IF Node Routing (Two Branches):
IF nodes have **TWO output branches**: TRUE (output 0) and FALSE (output 1)

**Connection Structure:**
\`\`\`json
"IF Node Name": {
  "main": [
    [{ "node": "True Branch Node", "type": "main", "index": 0 }],  // Output 0: TRUE
    [{ "node": "False Branch Node", "type": "main", "index": 0 }]  // Output 1: FALSE
  ]
}
\`\`\`

**Common Mistake:** Only connecting one branch (usually TRUE), leaving FALSE branch disconnected
**Fix:** Connect BOTH branches to appropriate nodes

**Example:**
\`\`\`json
"Check Priority": {
  "main": [
    [{ "node": "Send Urgent Email", "type": "main", "index": 0 }],     // TRUE: High priority
    [{ "node": "Send Standard Email", "type": "main", "index": 0 }]    // FALSE: Low priority
  ]
}
\`\`\`

### Switch Node Routing (Multiple Branches):
Switch nodes can have **3+ output branches** based on different cases

**CRITICAL: Use typeVersion 3 format with rules.values structure!**

**Node Structure (typeVersion 3):**
\`\`\`json
{
  "name": "Route By Category",
  "type": "n8n-nodes-base.switch",
  "typeVersion": 3,
  "parameters": {
    "rules": {
      "values": [
        {
          "conditions": {
            "options": { "leftValue": "", "caseSensitive": true, "typeValidation": "strict" },
            "combinator": "and",
            "conditions": [
              {
                "operator": { "type": "string", "operation": "contains" },
                "leftValue": "={{ $json.category }}",
                "rightValue": "email"
              }
            ]
          },
          "renameOutput": true,
          "outputKey": "email"
        },
        {
          "conditions": {
            "options": { "leftValue": "", "caseSensitive": true, "typeValidation": "strict" },
            "combinator": "and",
            "conditions": [
              {
                "operator": { "type": "string", "operation": "contains" },
                "leftValue": "={{ $json.category }}",
                "rightValue": "data"
              }
            ]
          },
          "renameOutput": true,
          "outputKey": "data"
        }
      ]
    },
    "options": {
      "fallbackOutput": "extra"  // MUST be string "extra", NOT number!
    }
  },
  "position": [850, 300]
}
\`\`\`

**Connection Structure:**
\`\`\`json
"Route By Category": {
  "main": [
    [{ "node": "Email Handler", "type": "main", "index": 0 }],   // Output 0: email rule
    [{ "node": "Data Handler", "type": "main", "index": 0 }],    // Output 1: data rule
    [{ "node": "Default Handler", "type": "main", "index": 0 }]  // Output 2: fallback (extra)
  ]
}
\`\`\`

**IMPORTANT FORMAT RULES:**
1. Use \`rules.values\` array, NOT \`conditions\` object
2. Each rule is a separate object in the values array
3. Each rule has its own \`conditions\` object with \`combinator: "and"\`
4. Each rule MUST have \`renameOutput: true\` and \`outputKey: "name"\`
5. Fallback is \`options.fallbackOutput: "extra"\` (STRING, not number!)
6. Number of outputs = rules.values.length + 1 (for fallback)

**Common Mistake:** Using old v1/v2 format with \`conditions\` object and \`combinator: "or"\`
**Fix:** Use v3 format with \`rules.values\` array and individual rule conditions

## LANGCHAIN AI AGENT NODES (NEVER REPLACE THESE!)

### AI Agent vs Basic OpenAI Node:
- **@n8n/n8n-nodes-langchain.agent** = AI Agent with tools, memory, decision-making
- **n8n-nodes-base.openAi** = Basic LLM API call (no tools, no memory)

**NEVER convert AI Agent → OpenAI node!** They are NOT interchangeable.

### AI Agent Connection Types (SPECIAL!):
AI Agents use **special connection types** (NOT "main"):

1. **ai_languageModel** - Connect language model (OpenAI, Anthropic, Google)
2. **ai_tool** - Connect tools (Vector Store, Calculator, HTTP, Custom Workflows)
3. **ai_memory** - Connect memory (Buffer, Window, MongoDB, Redis)
4. **ai_outputParser** - Connect output parser (JSON, Structured)

**Connection Structure:**
\`\`\`json
"connections": {
  "OpenAI Chat Model": {
    "ai_languageModel": [[{ "node": "AI Agent", "type": "ai_languageModel", "index": 0 }]]
  },
  "Vector Store Tool": {
    "ai_tool": [[{ "node": "AI Agent", "type": "ai_tool", "index": 0 }]]
  },
  "MongoDB Memory": {
    "ai_memory": [[{ "node": "AI Agent", "type": "ai_memory", "index": 0 }]]
  },
  "Manual Trigger": {
    "main": [[{ "node": "AI Agent", "type": "main", "index": 0 }]]  // Main input is regular
  }
}
\`\`\`

**Common Mistakes:**
1. Using "main" type for language model/tools (WRONG!)
2. Not connecting language model to AI Agent (Agent won't work!)
3. Replacing AI Agent with basic OpenAI node (loses tools/memory!)

### AI Agent Sub-Nodes (LangChain Ecosystem):
- **@n8n/n8n-nodes-langchain.lmChatOpenAi** - OpenAI language model
- **@n8n/n8n-nodes-langchain.lmChatAnthropic** - Anthropic/Claude model
- **@n8n/n8n-nodes-langchain.lmChatGoogleGemini** - Google Gemini model
- **@n8n/n8n-nodes-langchain.toolCalculator** - Calculator tool
- **@n8n/n8n-nodes-langchain.toolWorkflow** - Execute n8n workflow as tool
- **@n8n/n8n-nodes-langchain.memoryBufferWindow** - Window buffer memory
- **@n8n/n8n-nodes-langchain.memoryRedisChat** - Redis chat memory
- **@n8n/n8n-nodes-langchain.memoryMongoDb** - MongoDB memory
- **@n8n/n8n-nodes-langchain.vectorStorePinecone** - Pinecone vector store
- **@n8n/n8n-nodes-langchain.vectorStoreSupabase** - Supabase vector store

## Common Issues & Fixes:

### 1. Routing Issues:
**Problem:** IF node only connects TRUE branch, FALSE branch disconnected
**Fix:** Add FALSE branch connection:
\`\`\`json
"IF Node": {
  "main": [
    [{ "node": "True Path", "type": "main", "index": 0 }],
    [{ "node": "False Path", "type": "main", "index": 0 }]  // ADD THIS!
  ]
}
\`\`\`

### 2. AI Agent Misconfiguration:
**Problem:** AI Agent replaced with basic OpenAI node
**Fix:** Restore original AI Agent node + connect language model properly:
\`\`\`json
{
  "type": "@n8n/n8n-nodes-langchain.agent",  // NOT n8n-nodes-base.openAi!
  "name": "AI Agent",
  "parameters": {
    "promptType": "define",
    "text": "Your system prompt here"
  }
}
// Connections:
"OpenAI Model": {
  "ai_languageModel": [[{ "node": "AI Agent", "type": "ai_languageModel", "index": 0 }]]
}
\`\`\`

### 3. Dead-End Nodes (Multiple Terminal Nodes):
**Problem:** Workflow branches (IF/Switch) but routes never merge back - creates multiple endpoints
**Fix:** Add Merge node or final completion node

**Example:**
\`\`\`json
// Before (BROKEN):
"Switch Node": {
  "main": [
    [{ "node": "Send Email", ... }],      // Dead end!
    [{ "node": "Send Slack", ... }],      // Dead end!
    [{ "node": "Log Data", ... }]         // Dead end!
  ]
}
// No connections from Send Email, Send Slack, or Log Data!

// After (FIXED):
{
  "nodes": [
    ...existing nodes...,
    {
      "id": "merge-uuid",
      "name": "Workflow Complete",
      "type": "n8n-nodes-base.set",
      "parameters": {
        "mode": "manual",
        "fields": {
          "values": [
            { "name": "status", "type": "string", "stringValue": "completed" },
            { "name": "timestamp", "type": "string", "stringValue": "={{ $now.toISO() }}" }
          ]
        }
      },
      "position": [1450, 300]
    }
  ],
  "connections": {
    "Send Email": {
      "main": [[{ "node": "Workflow Complete", "type": "main", "index": 0 }]]
    },
    "Send Slack": {
      "main": [[{ "node": "Workflow Complete", "type": "main", "index": 0 }]]
    },
    "Log Data": {
      "main": [[{ "node": "Workflow Complete", "type": "main", "index": 0 }]]
    }
  }
}
\`\`\`

### 4. Disconnected Nodes:
**Problem:** Nodes exist but no connections point to them (no incoming connections)
**Fix:** Connect them logically in the workflow sequence

### 5. Missing Trigger:
**Problem:** No trigger node (workflow can't start)
**Fix:** Add n8n-nodes-base.manualTrigger as first node

### 6. Invalid Node Types:
**Problem:** Node type "slack" instead of "n8n-nodes-base.slack"
**Fix:** Use full package name format

### 7. Missing Required Parameters:
**Problem:** HTTP Request node has no "url" parameter
**Fix:** Add placeholder: { "url": "https://api.example.com/endpoint" }

## Debugging Steps:

**Step 1:** Identify node types
- Check for AI Agents (@n8n/n8n-nodes-langchain.agent)
- Check for routing nodes (IF, Switch)
- Check for LangChain sub-nodes

**Step 2:** Analyze connections
- IF/Switch: Verify ALL branches are connected
- AI Agents: Verify ai_languageModel, ai_tool, ai_memory connections
- Regular nodes: Verify main connections

**Step 3:** Fix routing issues
- Add missing branch connections (IF FALSE branch, Switch cases)
- Use correct connection types (ai_languageModel vs main)
- Merge branched routes back together (add completion node or Merge node)
- Check for dead-end nodes after branching (Should all routes merge back? Or are multiple endpoints intentional?)

**Step 4:** Fix node configurations
- Add missing parameters
- Fix node type strings
- Preserve original node types (don't replace AI Agents!)

**Step 5:** Validate structure
- All nodes have id, name, type, position, parameters
- All connections reference existing nodes
- Workflow has at least one trigger

**Step 6:** Fix node positions for clean layout
- Trigger nodes: Start at [250, 300]
- Horizontal spacing: 300 pixels between connected nodes
- Vertical spacing for branches: 200-300 pixels apart
- Example linear flow: [250, 300] → [550, 300] → [850, 300]
- Example IF branching:
  - IF node: [550, 300]
  - TRUE branch: [850, 200]
  - FALSE branch: [850, 400]

## Response Format:

Return ONLY the fixed JSON (no text before/after):

\`\`\`json
{
  "name": "Fixed Workflow",
  "nodes": [...],
  "connections": {...},
  "active": false,
  "settings": { "executionOrder": "v1" },
  "pinData": {},
  "meta": {
    "templateCreatedBy": "StreamSuite AI Debugger",
    "fixesApplied": [
      "Connected FALSE branch of 'Check Priority' IF node to 'Send Low Priority Email'",
      "Connected OpenAI model to AI Agent using ai_languageModel connection type",
      "Added missing TRUE branch for 'Route Decision' Switch node"
    ]
  }
}
\`\`\`

REMEMBER:
- Preserve node types (especially AI Agents!)
- Fix ALL routing branches (IF, Switch)
- Use correct connection types (ai_languageModel, ai_tool, ai_memory)
- Return ONLY JSON (no explanations outside JSON)`;

export interface DebugWorkflowRequest {
  workflowJson: string;
  errorMessage?: string;
  platform: 'n8n'; // Currently only n8n supported
}

export interface DebugWorkflowResponse {
  originalWorkflow: any;
  fixedWorkflow: any;
  issuesFound: string[];
  fixesApplied: string[];
  creditsUsed: number;
  tokensUsed: {
    input: number;
    output: number;
    total: number;
  };
}

/**
 * Debug and regenerate a broken workflow using Claude AI
 */
export async function debugWorkflow(request: DebugWorkflowRequest): Promise<DebugWorkflowResponse> {
  console.log('🔧 Debugging workflow with AI...');

  try {
    // Parse the original workflow
    let originalWorkflow;
    try {
      originalWorkflow = JSON.parse(request.workflowJson);
    } catch (error) {
      throw new Error('Invalid JSON format. Please ensure the workflow JSON is valid.');
    }

    // Analyze workflow to identify issues
    const issues = analyzeWorkflowIssues(originalWorkflow, request.errorMessage);

    // Build debug prompt
    let userMessage = `Analyze and fix this broken n8n workflow:\n\n`;
    userMessage += `\`\`\`json\n${JSON.stringify(originalWorkflow, null, 2)}\n\`\`\`\n\n`;

    if (issues.length > 0) {
      userMessage += `**Issues detected:**\n`;
      issues.forEach(issue => {
        userMessage += `- ${issue}\n`;
      });
      userMessage += `\n`;
    }

    if (request.errorMessage && request.errorMessage.trim()) {
      userMessage += `**User reported error:**\n${request.errorMessage}\n\n`;
    }

    userMessage += `Please regenerate a FIXED version of this workflow that resolves all issues.`;

    // Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      system: DEBUG_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: userMessage
        }
      ]
    });

    // Parse fixed workflow from response
    const fixedWorkflow = parseWorkflowResponse(response);

    // Validate fixed workflow
    validateWorkflow(fixedWorkflow, 'n8n');

    // Extract fixes from meta if available
    const fixesApplied = fixedWorkflow.meta?.fixesApplied || ['AI analysis and fixes applied'];

    // Calculate tokens and credits
    const tokensUsed = {
      input: response.usage.input_tokens,
      output: response.usage.output_tokens,
      total: response.usage.input_tokens + response.usage.output_tokens
    };

    const creditsUsed = 1; // Debug operations cost 1 credit

    console.log('✅ Workflow debugging complete!', {
      issues: issues.length,
      fixes: fixesApplied.length,
      tokens: tokensUsed.total,
      credits: creditsUsed
    });

    return {
      originalWorkflow,
      fixedWorkflow,
      issuesFound: issues,
      fixesApplied,
      creditsUsed,
      tokensUsed
    };

  } catch (error) {
    console.error('Debug error:', error);

    if (error instanceof Error) {
      throw error;
    }

    throw new Error('Failed to debug workflow. Please try again.');
  }
}

/**
 * Analyze workflow to identify specific issues
 */
function analyzeWorkflowIssues(workflow: any, userError?: string): string[] {
  const issues: string[] = [];

  // Check structure
  if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
    issues.push('Missing or invalid "nodes" array');
  }

  if (!workflow.connections || typeof workflow.connections !== 'object') {
    issues.push('Missing or invalid "connections" object');
  }

  // Check for trigger
  if (workflow.nodes && Array.isArray(workflow.nodes)) {
    const hasTrigger = workflow.nodes.some((node: any) =>
      node.type?.includes('Trigger') ||
      node.type === 'n8n-nodes-base.webhook' ||
      node.type === 'n8n-nodes-base.manualTrigger'
    );

    if (!hasTrigger) {
      issues.push('No trigger node found (workflow must start with a trigger)');
    }

    // Build connection maps for analysis
    const nodesWithIncomingConnections = new Set<string>();
    const nodesWithOutgoingConnections = new Set<string>();

    if (workflow.connections) {
      Object.entries(workflow.connections).forEach(([sourceName, connections]: [string, any]) => {
        // Track which nodes have outgoing connections
        nodesWithOutgoingConnections.add(sourceName);

        // Track which nodes receive connections (have incoming)
        if (connections.main) {
          connections.main.forEach((targets: any[]) => {
            if (Array.isArray(targets)) {
              targets.forEach((target: any) => {
                if (target?.node) nodesWithIncomingConnections.add(target.node);
              });
            }
          });
        }

        // Also check special AI connection types
        ['ai_languageModel', 'ai_tool', 'ai_memory', 'ai_outputParser'].forEach(connType => {
          if (connections[connType]) {
            connections[connType].forEach((targets: any[]) => {
              if (Array.isArray(targets)) {
                targets.forEach((target: any) => {
                  if (target?.node) nodesWithIncomingConnections.add(target.node);
                });
              }
            });
          }
        });
      });
    }

    // Node types that should typically have outgoing connections
    const intermediateNodeTypes = [
      'n8n-nodes-base.httpRequest',
      'n8n-nodes-base.set',
      'n8n-nodes-base.function',
      'n8n-nodes-base.code',
      'n8n-nodes-base.filter',
      'n8n-nodes-base.merge',
      'n8n-nodes-base.if',
      'n8n-nodes-base.switch',
      '@n8n/n8n-nodes-langchain.agent',
      '@n8n/n8n-nodes-langchain.chainLlm'
    ];

    // Terminal node types (can be endpoints)
    const terminalNodeTypes = [
      'n8n-nodes-base.emailSend',
      'n8n-nodes-base.slack',
      'n8n-nodes-base.discord',
      'n8n-nodes-base.telegram',
      'n8n-nodes-base.twilioSms',
      'n8n-nodes-base.microsoftTeams',
      'n8n-nodes-base.respondToWebhook'
    ];

    workflow.nodes.forEach((node: any) => {
      // Check for invalid node structure
      if (!node.id) {
        issues.push(`Node "${node.name || 'unnamed'}" missing required "id" field`);
      }
      if (!node.name) {
        issues.push(`Node missing required "name" field`);
      }
      if (!node.type) {
        issues.push(`Node "${node.name || 'unnamed'}" missing required "type" field`);
      }
      if (!node.position || !Array.isArray(node.position)) {
        issues.push(`Node "${node.name}" has invalid position (must be [x, y])`);
      }

      // Check for nodes with no incoming connections (disconnected inputs)
      const isTrigger = node.type?.includes('Trigger') || node.type === 'n8n-nodes-base.webhook';
      const isSubNode = node.type?.startsWith('@n8n/n8n-nodes-langchain.lm') ||
                        node.type?.startsWith('@n8n/n8n-nodes-langchain.memory') ||
                        node.type?.startsWith('@n8n/n8n-nodes-langchain.tool') ||
                        node.type?.startsWith('@n8n/n8n-nodes-langchain.vectorStore');

      if (workflow.nodes.length > 1 && !nodesWithIncomingConnections.has(node.name) && !isTrigger && !isSubNode) {
        issues.push(`Node "${node.name}" has no incoming connections (disconnected input)`);
      }

      // Check for dead-end nodes (nodes that should have outputs but don't)
      if (!nodesWithOutgoingConnections.has(node.name) && !isTrigger && !isSubNode) {
        // Check if this is an intermediate node that should have outputs
        const isIntermediate = intermediateNodeTypes.some(type => node.type === type || node.type?.startsWith(type));
        const isTerminal = terminalNodeTypes.some(type => node.type === type);

        // Count how many terminal nodes exist in the workflow
        const terminalNodeCount = workflow.nodes.filter((n: any) =>
          terminalNodeTypes.some(type => n.type === type) &&
          !nodesWithOutgoingConnections.has(n.name)
        ).length;

        // If intermediate node OR multiple terminal nodes without outputs = problem
        if (isIntermediate) {
          issues.push(`Node "${node.name}" has no outgoing connections but should connect to next step (dead end)`);
        } else if (terminalNodeCount > 1 && !nodesWithOutgoingConnections.has(node.name)) {
          issues.push(`Node "${node.name}" is a dead end - workflow has ${terminalNodeCount} terminal nodes. Consider merging routes or adding completion node.`);
        }
      }

      // Check for missing parameters
      if (!node.parameters || (typeof node.parameters === 'object' && Object.keys(node.parameters).length === 0)) {
        issues.push(`Node "${node.name}" has no parameters configured`);
      }
    });
  }

  // Add user error if provided
  if (userError && userError.trim()) {
    issues.push(`User reported: ${userError.trim()}`);
  }

  return issues;
}
