# AI Assistant Feature - "StreamBot"

## Concept Overview

An intelligent, conversational AI assistant that helps users navigate StreamSuite, build prompts, troubleshoot issues, and learn best practices.

**Name Ideas:**
- **StreamBot** (friendly, approachable)
- **FlowAI** (workflow-focused)
- **AutoMate** (automation helper)
- **Streamie** (cute, memorable)

---

## Core Features

### 1. **Conversational Prompt Building**

Instead of writing prompts manually, users chat with the assistant:

```
User: I need to automate my customer support

StreamBot: Great! I can help you build that workflow. Let me ask a few questions:

  1. Where do customer requests come from?
     [Email] [Slack] [Form] [Webhook] [Other]

User: They submit a form on our website

StreamBot: Perfect! And what should happen after someone submits the form?

User: Send them a confirmation email and notify our team on Slack

StreamBot: Got it! Should the team be notified immediately or only for certain types of requests?

User: Only urgent requests

StreamBot: Excellent! Here's what I'll create:
  ✓ Form submission trigger
  ✓ Check if request is urgent (AI categorization)
  ✓ Send confirmation email to customer
  ✓ If urgent: Send Slack notification to #support
  ✓ Log all requests to Google Sheets

  Want me to generate this workflow? [Generate] [Customize More]
```

---

### 2. **Interactive App Tour**

Assistant guides users through the app:

```
StreamBot: Hi! 👋 I'm StreamBot, your workflow automation assistant.
         I noticed this is your first time here. Want a quick tour?

         [Yes, show me around] [No thanks, I'll explore]

User: [Clicks "Yes, show me around"]

StreamBot: Perfect! Let's start with the basics.

         [Highlights Generator page]
         This is the Generator - where you create workflows from scratch.
         You can either write a prompt or chat with me to build one together.

         Try asking me: "How do I create a Slack notification workflow?"

         [Next: Templates →]

---

StreamBot: [Highlights Templates page]
         The Templates page has 15 ready-made workflows you can use
         immediately. Think of them as starting points you can customize.

         Popular templates:
         • Telegram AI Chatbot
         • LinkedIn Post Automation
         • PDF Q&A with AI

         [Next: Debugger →]

---

StreamBot: [Highlights Debugger page]
         Got a broken workflow? The Debugger can fix it automatically.
         Just upload your workflow JSON and I'll analyze what's wrong.

         I can detect:
         ✓ Missing connections
         ✓ Routing issues
         ✓ Configuration errors

         [Finish Tour] [Back]
```

---

### 3. **Contextual Help**

Assistant appears based on user behavior:

**Scenario 1: User stuck on empty prompt**
```
[User stares at empty textarea for 30 seconds]

StreamBot: 💡 Need help getting started?

         Not sure what to write? I can help you build a prompt by
         asking you a few questions.

         [Chat with me] [Show examples] [Browse templates]
```

**Scenario 2: User gets validation error**
```
[User gets "Prompt too vague" error]

StreamBot: 😅 Oops! Your prompt needs a bit more detail.

         I noticed you wrote: "send notifications"

         Let me help you make this more specific:
         • WHEN should it send notifications?
         • WHERE should they go? (Slack, Email, SMS?)
         • WHAT should trigger this?

         Want me to ask you some questions to flesh this out?

         [Yes, help me] [Show good examples]
```

**Scenario 3: User downloads workflow**
```
StreamBot: 🎉 Workflow downloaded!

         Here's what to do next:

         1. Open n8n and go to Workflows → Import
         2. Upload the JSON file you just downloaded
         3. Configure credentials for these nodes:
            • Slack (needs OAuth token)
            • Gmail (needs Google OAuth)
         4. Click "Execute Workflow" to test

         Need help setting up n8n?
         [Show setup guide] [Watch video tutorial] [I'm good]
```

---

### 4. **Troubleshooting Coach**

Assistant helps debug issues:

```
User: My workflow isn't working in n8n

StreamBot: I can help! Let me ask a few questions:

         1. Did you import the workflow successfully?
            [Yes] [No - got an error]

User: [Clicks "Yes"]

StreamBot: Good! Next question:

         2. When you try to execute, what happens?
            [Nothing happens]
            [Shows an error message]
            [Some nodes work, some don't]
            [Works but wrong output]

User: [Clicks "Shows an error message"]

StreamBot: Can you paste the error message here?

User: "Node 'Send Slack' failed: Missing authentication"

StreamBot: Ah, I see the issue! 🎯

         The Slack node needs credentials configured in n8n:

         1. In n8n, click on the "Send Slack" node
         2. Click the "Credentials" dropdown
         3. Click "Create New Credential"
         4. Choose "Slack OAuth2 API"
         5. Follow the OAuth flow to connect your Slack

         Here's a video showing exactly how to do this:
         [▶ Watch Setup Guide (2 min)]

         Once you've added credentials, try executing again!

         [I did it, still not working] [This fixed it, thanks!]
```

---

### 5. **Workflow Optimization Suggestions**

Assistant analyzes workflows and suggests improvements:

```
StreamBot: 👀 I analyzed your workflow and found some optimization opportunities:

         Current workflow: Manual Trigger → HTTP Request → Set → Slack

         Suggestions:

         1. 🚀 Performance
            Your HTTP Request has no retry logic. If the API fails,
            the workflow stops.

            Fix: Enable "Retry On Fail" with 3 attempts
            [Apply Fix]

         2. 💰 Cost Optimization
            You're using an AI Agent for simple text formatting.
            A Set node would be faster and free.

            Fix: Replace AI Agent with Set node
            [Apply Fix]

         3. ⚠️ Error Handling
            No error handling if Slack fails. Add a fallback.

            Fix: Add Email Send node as backup notification
            [Apply Fix]

         4. 📊 Best Practice
            Consider logging workflow runs to a database for tracking.

            Fix: Add Google Sheets node at the end
            [Apply Fix]

         [Apply All] [Skip] [Learn More]
```

---

### 6. **Learning & Documentation**

Assistant as a tutor:

```
User: What's the difference between IF and Switch nodes?

StreamBot: Great question! Let me explain:

         IF Node (2 outputs)
         ├─ TRUE: Condition is met
         └─ FALSE: Condition not met

         Use when: Simple yes/no decision
         Example: "If email contains 'urgent', route to priority"

         Switch Node (3+ outputs)
         ├─ Case 1: First condition match
         ├─ Case 2: Second condition match
         ├─ Case 3: Third condition match
         └─ Default: No matches

         Use when: Multiple possible paths
         Example: Route by category (sales, support, billing, other)

         Visual comparison:
         [Show diagram]

         Want me to generate an example workflow showing both?
         [Yes, show me] [I understand now]

---

User: How do I use AI Agents in n8n?

StreamBot: AI Agents are powerful! Let me walk you through it.

         An AI Agent is different from a basic OpenAI node:

         Basic OpenAI Node:
         • Single LLM call
         • No tools or memory
         • Simple input → output

         AI Agent:
         • Can use multiple tools
         • Has memory (remembers conversation)
         • Can make decisions and take actions
         • Multi-step reasoning

         AI Agent needs:
         ✓ Language Model (OpenAI, Anthropic, Google)
         ✓ Tools (optional): Calculator, Search, Custom workflows
         ✓ Memory (optional): Buffer, Redis, MongoDB
         ✓ Vector Store (optional): Knowledge base

         Want to see a working example?
         [Generate AI Agent workflow] [Show template]
```

---

## UI/UX Implementation

### Placement Options

#### Option 1: **Floating Chat Widget** (Recommended)
```tsx
<FloatingAssistant>
  <AssistantBubble
    position="bottom-right"
    minimized={isMinimized}
    onClick={toggle}
  >
    {isMinimized ? (
      <Avatar>
        <Bot className="h-6 w-6" />
        {hasNotification && <NotificationDot />}
      </Avatar>
    ) : (
      <ChatWindow>
        <ChatHeader>
          <Avatar><Bot /></Avatar>
          <div>
            <h4>StreamBot</h4>
            <Status>Online</Status>
          </div>
          <IconButton onClick={minimize}>
            <Minimize2 />
          </IconButton>
        </ChatHeader>

        <ChatMessages ref={messagesRef}>
          {messages.map(msg => (
            <ChatMessage
              key={msg.id}
              sender={msg.sender}
              avatar={msg.sender === 'bot' ? <Bot /> : <User />}
              timestamp={msg.timestamp}
            >
              {msg.content}
              {msg.actions && (
                <MessageActions>
                  {msg.actions.map(action => (
                    <Button
                      key={action.id}
                      onClick={action.handler}
                      variant={action.variant}
                    >
                      {action.label}
                    </Button>
                  ))}
                </MessageActions>
              )}
            </ChatMessage>
          ))}
          {isTyping && <TypingIndicator />}
        </ChatMessages>

        <ChatInput>
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything..."
            rows={1}
            autoResize
          />
          <IconButton onClick={sendMessage} disabled={!input.trim()}>
            <Send />
          </IconButton>
        </ChatInput>

        <QuickActions>
          <QuickAction onClick={buildPrompt}>
            <Wand2 /> Build Prompt
          </QuickAction>
          <QuickAction onClick={findTemplate}>
            <Search /> Find Template
          </QuickAction>
          <QuickAction onClick={debugWorkflow}>
            <Bug /> Debug Workflow
          </QuickAction>
        </QuickActions>
      </ChatWindow>
    )}
  </AssistantBubble>
</FloatingAssistant>
```

#### Option 2: **Sidebar Panel**
```tsx
<Sidebar side="right" className="w-96">
  <SidebarHeader>
    <h3>AI Assistant</h3>
    <Badge>Beta</Badge>
  </SidebarHeader>

  <SidebarContent>
    <AssistantChat />
  </SidebarContent>
</Sidebar>
```

#### Option 3: **Contextual Popover**
Appears inline where user is working:
```tsx
<PromptInput>
  <Textarea placeholder="Describe your workflow..." />

  {showAssistantSuggestion && (
    <AssistantPopover>
      <Avatar><Bot /></Avatar>
      <div>
        <p>Need help? I can build this prompt with you.</p>
        <Button size="sm" onClick={startChat}>
          Chat with me
        </Button>
      </div>
      <IconButton onClick={dismissSuggestion}>
        <X />
      </IconButton>
    </AssistantPopover>
  )}
</PromptInput>
```

---

## Conversation Flows

### Flow 1: First-Time User Onboarding

```typescript
const onboardingFlow = {
  trigger: 'user_visits_for_first_time',
  messages: [
    {
      type: 'greeting',
      content: "Hi! 👋 I'm StreamBot. I help you create workflow automations. Want a quick tour?",
      actions: [
        { label: 'Yes, show me around', handler: 'startTour' },
        { label: 'Skip tour', handler: 'skipTour' }
      ]
    },
    {
      type: 'tour_step',
      highlight: '#generator',
      content: "This is the Generator. Here's where you create workflows. You can write a prompt or chat with me to build one together.",
      actions: [
        { label: 'Next', handler: 'nextStep' }
      ]
    },
    // ... more tour steps
  ]
};
```

### Flow 2: Prompt Building Conversation

```typescript
const promptBuildingFlow = {
  trigger: 'user_clicks_chat_to_build_prompt',
  conversation: [
    {
      bot: "Great! Let's build your workflow prompt together. First question: What should trigger your workflow?",
      options: [
        'When a webhook is received',
        'On a schedule (daily, hourly, etc.)',
        'When a form is submitted',
        'Manually',
        'Other...'
      ],
      variable: 'trigger'
    },
    {
      bot: "Perfect! And what should happen when {trigger}?",
      options: [
        'Send a notification',
        'Process data',
        'Create/update records',
        'Use AI to decide',
        'Other...'
      ],
      variable: 'action'
    },
    {
      bot: "Got it! Which tools do you want to use?",
      multiSelect: true,
      options: [
        'Slack', 'Email', 'Google Sheets', 'Notion',
        'Airtable', 'Webhook', 'Database', 'AI/LLM'
      ],
      variable: 'tools'
    },
    {
      bot: "Excellent! Here's the prompt I built:\n\n**{constructedPrompt}**\n\nWant me to generate this workflow?",
      actions: [
        { label: 'Generate Workflow', handler: 'generateWithPrompt' },
        { label: 'Edit Prompt', handler: 'editPrompt' },
        { label: 'Start Over', handler: 'restart' }
      ]
    }
  ]
};
```

### Flow 3: Troubleshooting Assistant

```typescript
const troubleshootingFlow = {
  trigger: 'user_says_workflow_not_working',
  conversation: [
    {
      bot: "I can help troubleshoot! First, where is the workflow failing?",
      options: [
        "Can't import into n8n",
        "Imports but won't execute",
        "Executes but shows errors",
        "Executes but wrong output",
        "Not sure"
      ],
      variable: 'failure_point'
    },
    {
      condition: "failure_point === 'Executes but shows errors'",
      bot: "Can you paste the error message?",
      input: 'text',
      variable: 'error_message',
      onReceive: 'analyzeError'
    },
    {
      bot: "I found the issue: {diagnosedProblem}\n\nHere's how to fix it:\n\n{fixInstructions}",
      actions: [
        { label: 'Show me how (video)', handler: 'showVideo' },
        { label: 'This worked!', handler: 'markResolved' },
        { label: 'Still not working', handler: 'escalate' }
      ]
    }
  ]
};
```

---

## Technical Implementation

### Architecture

```
┌─────────────────────────────────────┐
│         Frontend (React)            │
│  ┌──────────────────────────────┐   │
│  │   AssistantWidget.tsx        │   │
│  │   - Chat UI                  │   │
│  │   - Message rendering        │   │
│  │   - Action handlers          │   │
│  └──────────────────────────────┘   │
│  ┌──────────────────────────────┐   │
│  │   useAssistant() hook        │   │
│  │   - State management         │   │
│  │   - WebSocket connection     │   │
│  │   - Message queue            │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│      Assistant Service Layer        │
│  ┌──────────────────────────────┐   │
│  │   assistantService.ts        │   │
│  │   - Conversation management  │   │
│  │   - Context tracking         │   │
│  │   - Intent classification    │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│      Claude API (Haiku 3.5)         │
│  - Fast responses (< 1s)            │
│  - Low cost ($0.80/M tokens)        │
│  - Streaming support                │
└─────────────────────────────────────┘
```

### Core Components

#### 1. **AssistantWidget.tsx**
```tsx
import { useState, useEffect, useRef } from 'react';
import { Bot, Send, Minimize2, X } from 'lucide-react';
import { useAssistant } from '@/hooks/useAssistant';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export default function AssistantWidget() {
  const {
    messages,
    isTyping,
    isMinimized,
    sendMessage,
    minimize,
    maximize,
  } = useAssistant();

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isMinimized ? (
        <Button
          onClick={maximize}
          className="rounded-full w-14 h-14 shadow-lg"
          size="icon"
        >
          <Bot className="h-6 w-6" />
        </Button>
      ) : (
        <div className="bg-white rounded-lg shadow-2xl w-96 h-[600px] flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">StreamBot</h3>
              <p className="text-xs text-green-600">● Online</p>
            </div>
            <Button variant="ghost" size="icon" onClick={minimize}>
              <Minimize2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${
                  msg.sender === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.sender === 'bot'
                      ? 'bg-blue-600'
                      : 'bg-gray-200'
                  }`}
                >
                  {msg.sender === 'bot' ? (
                    <Bot className="h-4 w-4 text-white" />
                  ) : (
                    <span className="text-sm">You</span>
                  )}
                </div>
                <div
                  className={`flex-1 ${
                    msg.sender === 'user' ? 'text-right' : ''
                  }`}
                >
                  <div
                    className={`inline-block rounded-lg p-3 ${
                      msg.sender === 'bot'
                        ? 'bg-gray-100 text-gray-900'
                        : 'bg-blue-600 text-white'
                    }`}
                  >
                    {msg.content}
                  </div>
                  {msg.actions && (
                    <div className="mt-2 space-y-2">
                      {msg.actions.map((action) => (
                        <Button
                          key={action.id}
                          onClick={action.handler}
                          variant={action.variant || 'outline'}
                          size="sm"
                          className="w-full"
                        >
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                className="resize-none"
                rows={1}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim()}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

#### 2. **useAssistant.ts Hook**
```typescript
import { useState, useEffect, useCallback } from 'react';
import { sendAssistantMessage, type AssistantMessage } from '@/services/assistantService';

export function useAssistant() {
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [context, setContext] = useState<Record<string, any>>({});

  // Initialize with greeting
  useEffect(() => {
    const isFirstVisit = !localStorage.getItem('streambot_greeted');
    if (isFirstVisit) {
      setTimeout(() => {
        addBotMessage(
          "Hi! 👋 I'm StreamBot. I can help you create workflows, find templates, or answer questions. Want to take a quick tour?",
          [
            {
              id: 'tour',
              label: 'Yes, show me around',
              handler: () => startTour(),
              variant: 'default'
            },
            {
              id: 'skip',
              label: 'No thanks',
              handler: () => dismissGreeting(),
              variant: 'ghost'
            }
          ]
        );
        setIsMinimized(false);
        localStorage.setItem('streambot_greeted', 'true');
      }, 2000);
    }
  }, []);

  const addBotMessage = (content: string, actions?: any[]) => {
    const message: AssistantMessage = {
      id: Date.now().toString(),
      sender: 'bot',
      content,
      actions,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, message]);
  };

  const addUserMessage = (content: string) => {
    const message: AssistantMessage = {
      id: Date.now().toString(),
      sender: 'user',
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, message]);
  };

  const sendMessage = useCallback(async (content: string) => {
    addUserMessage(content);
    setIsTyping(true);

    try {
      const response = await sendAssistantMessage({
        message: content,
        context: {
          ...context,
          currentPage: window.location.pathname,
          previousMessages: messages.slice(-5) // Last 5 messages for context
        }
      });

      setIsTyping(false);
      addBotMessage(response.content, response.actions);

      // Update context
      if (response.updateContext) {
        setContext(prev => ({ ...prev, ...response.updateContext }));
      }
    } catch (error) {
      setIsTyping(false);
      addBotMessage(
        "Sorry, I'm having trouble connecting. Please try again.",
        [
          {
            id: 'retry',
            label: 'Retry',
            handler: () => sendMessage(content)
          }
        ]
      );
    }
  }, [messages, context]);

  const startTour = () => {
    // Tour logic
    addBotMessage(
      "Great! Let's start with the Generator page.",
      [
        {
          id: 'next',
          label: 'Next →',
          handler: () => {/* next tour step */}
        }
      ]
    );
  };

  const dismissGreeting = () => {
    addBotMessage("No problem! I'm here if you need me. Just click the chat icon anytime.");
    setTimeout(() => setIsMinimized(true), 2000);
  };

  return {
    messages,
    isTyping,
    isMinimized,
    sendMessage,
    minimize: () => setIsMinimized(true),
    maximize: () => setIsMinimized(false),
    context,
    setContext
  };
}
```

#### 3. **assistantService.ts**
```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: import.meta.env.VITE_CLAUDE_API_KEY,
  dangerouslyAllowBrowser: true
});

const ASSISTANT_SYSTEM_PROMPT = `You are StreamBot, a friendly and helpful AI assistant for StreamSuite - a platform that generates n8n workflow automations.

Your role:
- Help users create workflow prompts through conversation
- Guide users through the app (Generator, Templates, Debugger, History, Settings)
- Troubleshoot workflow issues
- Answer questions about n8n, workflows, and automation
- Provide examples and best practices

Personality:
- Friendly and encouraging
- Patient with beginners
- Concise but thorough
- Use emojis sparingly (1-2 per message max)
- Ask clarifying questions when needed

Current app context:
- Generator: Create workflows from prompts
- Templates: 15 pre-built workflow templates
- Debugger: Fix broken workflows automatically
- History: View past workflows
- Settings: Manage account, billing, API keys

When helping build prompts, ask about:
1. Trigger (when should it run?)
2. Actions (what should it do?)
3. Tools/integrations (which services?)
4. Conditions/logic (any branching/routing?)

Always end with a clear next step or action.`;

interface AssistantRequest {
  message: string;
  context: {
    currentPage: string;
    previousMessages: any[];
    [key: string]: any;
  };
}

interface AssistantResponse {
  content: string;
  actions?: Array<{
    id: string;
    label: string;
    handler: () => void;
    variant?: 'default' | 'outline' | 'ghost';
  }>;
  updateContext?: Record<string, any>;
}

export async function sendAssistantMessage(
  request: AssistantRequest
): Promise<AssistantResponse> {
  console.log('🤖 StreamBot processing message:', request.message);

  try {
    // Build conversation history for context
    const conversationHistory = request.context.previousMessages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));

    // Call Claude API (using Haiku for speed and cost)
    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022', // Fast & cheap for chat
      max_tokens: 1024,
      system: ASSISTANT_SYSTEM_PROMPT + `\n\nCurrent page: ${request.context.currentPage}`,
      messages: [
        ...conversationHistory,
        {
          role: 'user',
          content: request.message
        }
      ]
    });

    const content = response.content[0].type === 'text'
      ? response.content[0].text
      : '';

    // Parse response for actions
    const actions = parseActionsFromResponse(content, request.context);

    // Determine context updates
    const updateContext = determineContextUpdates(request.message, content, request.context);

    return {
      content,
      actions,
      updateContext
    };
  } catch (error) {
    console.error('Assistant error:', error);
    throw error;
  }
}

function parseActionsFromResponse(content: string, context: any): any[] | undefined {
  // Look for action indicators in response
  const actions: any[] = [];

  // Example: If bot suggests generating a workflow
  if (content.includes('generate this workflow') || content.includes('Want me to generate')) {
    actions.push({
      id: 'generate',
      label: 'Generate Workflow',
      handler: () => {
        // Trigger workflow generation with constructed prompt
        window.dispatchEvent(new CustomEvent('assistant:generate', {
          detail: { prompt: context.constructedPrompt }
        }));
      },
      variant: 'default'
    });
  }

  // Example: If bot offers to show examples
  if (content.includes('show you examples') || content.includes('see some examples')) {
    actions.push({
      id: 'examples',
      label: 'Show Examples',
      handler: () => {
        window.dispatchEvent(new CustomEvent('assistant:showExamples'));
      },
      variant: 'outline'
    });
  }

  // Example: If bot suggests browsing templates
  if (content.includes('browse templates') || content.includes('check out templates')) {
    actions.push({
      id: 'templates',
      label: 'Browse Templates',
      handler: () => {
        window.location.href = '/templates';
      },
      variant: 'outline'
    });
  }

  return actions.length > 0 ? actions : undefined;
}

function determineContextUpdates(
  userMessage: string,
  botResponse: string,
  currentContext: any
): Record<string, any> | undefined {
  const updates: Record<string, any> = {};

  // Track prompt building progress
  if (botResponse.includes('trigger your workflow') && userMessage.toLowerCase().includes('webhook')) {
    updates.trigger = 'webhook';
  }

  if (botResponse.includes('what should happen') && userMessage.toLowerCase().includes('slack')) {
    updates.action = 'send slack notification';
    updates.tools = ['slack'];
  }

  return Object.keys(updates).length > 0 ? updates : undefined;
}
```

---

## Advanced Features

### 1. **Voice Input** (Future)
```tsx
<Button onClick={startVoiceInput}>
  <Mic /> Speak to StreamBot
</Button>
```

### 2. **Screen Sharing for Debugging**
User shares their n8n screen, assistant analyzes visually:
```
StreamBot: I see the issue! Your "HTTP Request" node on the right
          isn't connected. Draw a line from the "Manual Trigger"
          output to the HTTP Request input.
```

### 3. **Workflow Generation from Screenshots**
User uploads screenshot of a workflow diagram, assistant converts to JSON:
```
User: [Uploads whiteboard photo]

StreamBot: I can see your workflow design! Let me convert this:

          Detected nodes:
          ✓ Webhook trigger
          ✓ Parse JSON
          ✓ IF condition ("priority = high")
          ✓ Send Email (true branch)
          ✓ Log to Sheets (false branch)

          Generating workflow now...
```

### 4. **Multi-language Support**
```tsx
<LanguageSelector>
  <Option value="en">English</Option>
  <Option value="es">Español</Option>
  <Option value="fr">Français</Option>
  <Option value="de">Deutsch</Option>
</LanguageSelector>
```

---

## Cost & Performance

### Model Selection: Claude 3.5 Haiku

**Why Haiku?**
- ⚡ **Speed**: < 1 second response time
- 💰 **Cost**: $0.80 per million input tokens, $4.00 per million output tokens
- 🎯 **Quality**: Perfect for conversational chat and guidance
- 📊 **Context**: 200K context window

**Expected costs:**
- Average conversation: 10 messages
- Average message: 200 tokens in, 300 tokens out
- Cost per conversation: ~$0.002
- 1000 conversations/day: ~$2/day = $60/month

**Optimization:**
- Cache system prompt (90% savings)
- Limit conversation history to last 5 messages
- Use streaming for better UX
- Fallback to canned responses for common questions

---

## Implementation Roadmap

### Phase 1: MVP (Week 1-2)
- [ ] Basic chat widget UI
- [ ] Claude Haiku integration
- [ ] Simple conversational prompt building
- [ ] 5-10 canned responses for common questions
- [ ] Basic context tracking

### Phase 2: Enhanced (Week 3-4)
- [ ] App tour/onboarding flow
- [ ] Contextual help triggers
- [ ] Troubleshooting coach
- [ ] Action buttons in chat
- [ ] Workflow generation from chat

### Phase 3: Advanced (Week 5-6)
- [ ] Smart suggestions based on user behavior
- [ ] Workflow optimization analysis
- [ ] Integration with debugger
- [ ] Learning/documentation mode
- [ ] Usage analytics

### Phase 4: Polish (Week 7-8)
- [ ] Voice input
- [ ] Multi-language support
- [ ] Persistent conversation history
- [ ] User feedback & ratings
- [ ] Performance optimizations

---

## Success Metrics

**User Engagement:**
- 60%+ of new users engage with assistant
- 40%+ use assistant for prompt building
- 30%+ complete onboarding tour

**Effectiveness:**
- 70%+ of assisted workflows generate successfully
- 50% reduction in validation errors
- 40% faster workflow creation vs manual prompts

**Support Reduction:**
- 50% decrease in "how do I..." questions
- 40% decrease in workflow debugging requests
- 30% decrease in account setup issues

---

## Conclusion

The AI Assistant would be a **game-changer** for StreamSuite:

✅ **Lowers barrier to entry** - No need to know how to write prompts
✅ **Improves success rate** - Guided creation = better workflows
✅ **Reduces support burden** - Self-service troubleshooting
✅ **Increases engagement** - Interactive, fun experience
✅ **Competitive advantage** - Most competitors don't have this

**Recommendation:** Start with Phase 1 MVP (conversational prompt building + basic help), then iterate based on user feedback.

The ROI is high:
- Development: ~2-3 weeks
- Ongoing cost: ~$60-100/month (very low!)
- User impact: Massive (easier onboarding, higher success rate)

Let me know if you want to implement this! 🚀
