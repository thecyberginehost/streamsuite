/**
 * AI Assistant Service - StreamBot conversational assistant
 * Uses GPT-4o for fast, intelligent interactions
 */

import OpenAI from 'openai';

// Lazy initialization - only create client when needed
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key is not configured. Please add VITE_OPENAI_API_KEY to your .env file.');
    }
    openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true,
    });
  }
  return openai;
}

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface AssistantContext {
  currentPage: string;
  hasGeneratedWorkflow: boolean;
  hasConvertedWorkflow: boolean;
  hasDebugged: boolean;
  userPlan: string | null;
}

export interface AssistantAction {
  type: 'navigate' | 'fillPrompt' | 'showTip' | 'none';
  payload?: any;
}

export interface AssistantResponse {
  message: string;
  action?: AssistantAction;
  tokensUsed: {
    input: number;
    output: number;
    total: number;
  };
}

const STREAMBOT_SYSTEM_PROMPT = `You are StreamBot, a friendly and helpful AI assistant for StreamSuite - an AI-powered workflow automation platform.

# Your Role
You help users create workflow automations for n8n, Make.com, and Zapier. You are:
- **Conversational**: Ask follow-up questions to understand user needs
- **Helpful**: Guide users through the app and suggest best practices
- **Concise**: Keep responses short and actionable (2-3 sentences max)
- **Educational**: Teach users about workflow automation concepts

# Core Features You Help With
1. **Generator**: Create workflows from natural language descriptions
2. **Converter**: Convert workflows between platforms (n8n ↔ Make.com ↔ Zapier)
3. **Debugger**: Fix broken workflows and identify issues
4. **Templates**: Browse and customize pre-built workflow templates

# Conversational Prompt Building
When users want to generate a workflow, ask clarifying questions:
- What's the trigger? (webhook, schedule, manual, form submission, etc.)
- What actions should happen? (send email, create ticket, update database, etc.)
- What conditions or logic? (if/then, routing, filtering)
- What platforms/services? (Slack, Google Sheets, email, APIs, etc.)

# Example Conversations

User: "I need a workflow"
You: "I'd love to help! What should trigger your workflow? For example: a form submission, a scheduled time, a webhook from another app, or something else?"

User: "When someone submits a form"
You: "Great! What should happen after the form is submitted? For instance: send a confirmation email, create a ticket, save to a database, or notify your team?"

User: "Send an email and notify Slack"
You: "Perfect! Should both actions happen every time, or should there be conditions? For example: only notify Slack for high-priority submissions, or send different emails based on the form data?"

# Navigation Actions
You can guide users to different pages:
- Generator page: "/generator" or "/" - Create new workflows
- Converter page: "/converter" - Convert between platforms
- Debugger page: "/debugger" - Fix broken workflows
- Templates page: "/templates" - Browse pre-built templates
- History page: "/history" - View past workflows
- Settings page: "/settings" - Manage account and credits

# Best Practices to Teach
- **Be specific**: Mention exact node types (HTTP Request, Send Email, IF node)
- **Include triggers**: Every workflow needs a starting point
- **Add logic**: Use IF/Switch nodes for conditional routing
- **Consider errors**: Add error handling for API calls
- **Test incrementally**: Start simple, add complexity gradually

# Response Format
- Keep responses under 50 words when possible
- Ask ONE question at a time
- Use friendly, conversational language
- Avoid jargon unless the user uses it first

# CRITICAL: Workflow Prompt Style
When building the final workflow prompt, write it like a USER would naturally describe it:
- Use conversational language: "I want to...", "When someone does X, do Y"
- Focus on the OUTCOME, not technical details
- No structured formats like "Trigger: X, Action: Y, Condition: Z"
- No bullet points or lists
- Just natural sentences describing what should happen

GOOD examples:
- "I want to send a welcome email whenever someone fills out my contact form"
- "When a customer leaves a 5-star review, post it to our Slack channel and send a thank you email"
- "Every Monday morning, scan my Notion database for new leads and send me a summary email"

BAD examples (too structured):
- "Trigger: Form submission. Action: Send email. Condition: None."
- "1. Monitor webhook 2. Filter data 3. Send to Slack"
- "Create workflow: Trigger=Schedule, Action=Database scan, Output=Email"

Write prompts as if you're explaining it to a friend, not programming a system.

# Actions You Can Take
Return JSON action objects when you want to:
- Navigate: { "type": "navigate", "payload": { "to": "/converter" } }
- Fill prompt: { "type": "fillPrompt", "payload": { "prompt": "workflow description" } }
- Show tip: { "type": "showTip", "payload": { "tip": "helpful advice" } }

# Important Rules
1. Never generate workflow JSON yourself - guide users to use the Generator
2. Don't write code - point users to the right features
3. If users ask about billing/credits, direct them to Settings
4. If workflow is broken, guide them to the Debugger
5. Keep it conversational - you're a helpful guide, not a command-line interface

# Tone
- Friendly and encouraging
- Patient with beginners
- Excited about automation
- Supportive when users struggle
- Celebratory when users succeed`;

export class AssistantService {
  private conversationHistory: AssistantMessage[] = [];
  private context: AssistantContext = {
    currentPage: '/',
    hasGeneratedWorkflow: false,
    hasConvertedWorkflow: false,
    hasDebugged: false,
    userPlan: null,
  };

  constructor() {
    console.log('🤖 AssistantService initialized');
  }

  /**
   * Update the assistant's context about user's current state
   */
  updateContext(updates: Partial<AssistantContext>) {
    this.context = { ...this.context, ...updates };
    console.log('🔄 Assistant context updated:', this.context);
  }

  /**
   * Get the current conversation history
   */
  getConversationHistory(): AssistantMessage[] {
    return this.conversationHistory;
  }

  /**
   * Clear the conversation history
   */
  clearHistory() {
    this.conversationHistory = [];
    console.log('🗑️ Conversation history cleared');
  }

  /**
   * Send a message to the assistant and get a response
   */
  async sendMessage(userMessage: string): Promise<AssistantResponse> {
    console.log('💬 User message:', userMessage);

    // Add user message to history
    const userMsg: AssistantMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };
    this.conversationHistory.push(userMsg);

    try {
      // Build context-aware system prompt
      const contextPrompt = this.buildContextPrompt();

      // Prepare conversation messages for OpenAI
      const messages = this.conversationHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Call GPT-4o (fast and intelligent)
      const client = getOpenAIClient();
      const response = await client.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 300, // Keep responses concise
        temperature: 0.7,
        messages: [
          {
            role: 'system',
            content: STREAMBOT_SYSTEM_PROMPT + '\n\n' + contextPrompt,
          },
          ...messages as any,
        ],
      });

      const assistantContent = response.choices[0]?.message?.content || '';

      // Add assistant response to history
      const assistantMsg: AssistantMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date(),
      };
      this.conversationHistory.push(assistantMsg);

      // Parse for actions
      const action = this.parseAction(assistantContent);

      return {
        message: assistantContent,
        action,
        tokensUsed: {
          input: response.usage?.prompt_tokens || 0,
          output: response.usage?.completion_tokens || 0,
          total: response.usage?.total_tokens || 0,
        },
      };
    } catch (error) {
      console.error('❌ Assistant error:', error);

      // Add error message to history
      const errorMsg: AssistantMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "I'm having trouble connecting right now. Could you try that again?",
        timestamp: new Date(),
      };
      this.conversationHistory.push(errorMsg);

      return {
        message: errorMsg.content,
        tokensUsed: { input: 0, output: 0, total: 0 },
      };
    }
  }

  /**
   * Get a greeting message based on context
   */
  getGreeting(): string {
    const greetings = [
      "Hi! I'm StreamBot. Want to build a workflow? Tell me what you need!",
      "Hey there! I can help you create, convert, or debug workflows. What are you working on?",
      "Hello! Ready to automate something? I'm here to help you build it!",
      "Hi! I'm your workflow assistant. What would you like to create today?",
    ];

    // Context-aware greeting
    if (this.context.currentPage === '/converter') {
      return "Hi! I see you're on the Converter. Want to convert a workflow between platforms?";
    }
    if (this.context.currentPage === '/debugger') {
      return "Hey! Need help fixing a workflow? Tell me what's broken and I'll guide you!";
    }
    if (this.context.currentPage === '/templates') {
      return "Hi! Browsing templates? I can help you find the perfect one for your use case!";
    }

    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  /**
   * Build context-aware prompt additions
   */
  private buildContextPrompt(): string {
    let prompt = '\n\n# Current Context\n';
    prompt += `- User is on: ${this.context.currentPage}\n`;
    prompt += `- Has generated workflow: ${this.context.hasGeneratedWorkflow ? 'Yes' : 'No'}\n`;
    prompt += `- Has converted workflow: ${this.context.hasConvertedWorkflow ? 'Yes' : 'No'}\n`;
    prompt += `- Has used debugger: ${this.context.hasDebugged ? 'Yes' : 'No'}\n`;

    if (this.context.userPlan) {
      prompt += `- User's plan: ${this.context.userPlan}\n`;
    }

    // First-time user detection
    if (!this.context.hasGeneratedWorkflow && !this.context.hasConvertedWorkflow) {
      prompt += '\n**This appears to be a new user. Be extra welcoming and offer a quick tour!**';
    }

    return prompt;
  }

  /**
   * Parse assistant response for structured actions
   */
  private parseAction(content: string): AssistantAction | undefined {
    // Look for JSON action blocks
    const actionMatch = content.match(/\{[^}]*"type":\s*"(navigate|fillPrompt|showTip)"[^}]*\}/);

    if (actionMatch) {
      try {
        return JSON.parse(actionMatch[0]) as AssistantAction;
      } catch (e) {
        console.warn('Failed to parse action:', e);
      }
    }

    // Implicit actions based on content
    if (content.toLowerCase().includes('let me fill that for you') ||
        content.toLowerCase().includes('i\'ll fill the prompt')) {
      // Extract quoted text as potential prompt
      const promptMatch = content.match(/"([^"]+)"/);
      if (promptMatch) {
        return {
          type: 'fillPrompt',
          payload: { prompt: promptMatch[1] },
        };
      }
    }

    return undefined;
  }
}

// Singleton instance
export const assistantService = new AssistantService();
