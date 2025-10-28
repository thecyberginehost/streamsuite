# AI Agent Node Documentation

## Problem Solved

Previously, when users asked to "build an AI agent," the system would generate a basic **OpenAI node** (`n8n-nodes-base.openAi`) which only does simple LLM calls. This is **NOT** what n8n calls an "AI Agent."

In n8n, a proper **AI Agent** is a **LangChain-powered node** (`@n8n/n8n-nodes-langchain.agent`) with:
- ✅ Tool usage (Calculator, HTTP requests, custom workflows, etc.)
- ✅ Conversation memory (remembers context)
- ✅ Knowledge bases (vector stores for RAG)
- ✅ Multi-step reasoning
- ✅ Decision-making capabilities

## What Changed

### 1. Updated AI Knowledge Base (`src/lib/n8n/advanced/ai.ts`)

Added comprehensive documentation for:

```typescript
nodeTypes: {
  rootNodes: {
    'AI Agent': {
      nodeType: '@n8n/n8n-nodes-langchain.agent',
      description: 'Orchestrates multi-step AI tasks with tool usage, memory, and knowledge bases',
      capabilities: [
        'Use multiple tools dynamically',
        'Maintain conversation memory',
        'Access vector store knowledge bases',
        'Multi-step reasoning and planning',
        'Error recovery and retry logic'
      ],
      structure: {
        requiredInputs: ['Chat Model (OpenAI, Anthropic, etc.)'],
        optionalInputs: [
          'Tools (Calculator, HTTP Request, Custom Workflows)',
          'Memory (Buffer, Window, Summary, Vector Store)',
          'Vector Store (Pinecone, Supabase, Qdrant)',
          'Output Parser'
        ],
        parameters: {
          promptType: ['Auto-detect', 'Define below'],
          text: 'System prompt that defines agent behavior and role',
          hasOutputParser: false
        }
      },
      exampleWithTools: {
        // Full working example with agent + chat model + memory + tools
      }
    }
  },
  subNodes: {
    models: {
      'OpenAI Chat Model': {
        type: '@n8n/n8n-nodes-langchain.lmChatOpenAi',
        parameters: { model: 'gpt-4o-mini', temperature: 0.7 }
      },
      'Anthropic Chat Model': {
        type: '@n8n/n8n-nodes-langchain.lmChatAnthropic',
        parameters: { model: 'claude-3-5-sonnet-20241022' }
      }
    },
    memory: {
      'Buffer Window Memory': {
        type: '@n8n/n8n-nodes-langchain.memoryBufferWindow',
        parameters: { contextWindowLength: 10 }
      }
    },
    tools: {
      'Call n8n Workflow Tool': {
        type: '@n8n/n8n-nodes-langchain.toolWorkflow',
        description: 'Execute another n8n workflow as a tool',
        bestPractice: 'Give AI agents access to your existing n8n automations'
      },
      'HTTP Request Tool': {
        type: '@n8n/n8n-nodes-langchain.toolHttpRequest'
      },
      'Calculator Tool': {
        type: '@n8n/n8n-nodes-langchain.toolCalculator'
      },
      'Code Tool': {
        type: '@n8n/n8n-nodes-langchain.toolCode'
      }
    }
  }
}
```

### 2. Updated AI Service System Prompt (`src/services/aiService.ts`)

Added a new section: **"AI AGENT NODES (LangChain Integration)"**

Key additions:
- Node type: `@n8n/n8n-nodes-langchain.agent`
- Sub-nodes: Chat models, tools, memory, vector stores
- Clear differentiation between AI Agent and basic OpenAI node
- Example workflow structure with proper connection types

**Critical addition - When to use which node:**

```markdown
**When to use AI Agent vs OpenAI node:**

Use AI Agent (@n8n/n8n-nodes-langchain.agent) when:
- User asks for "AI agent", "intelligent assistant", or "chatbot with tools"
- You need tools (lookup data, send emails, make calculations, etc.)
- You need conversation memory
- You need access to knowledge bases (vector stores)
- Multi-step reasoning required

Use OpenAI node (n8n-nodes-base.openAi) when:
- Simple text completion or chat
- No tools needed
- No memory needed
- Just need a basic LLM response
```

**Example AI Agent workflow structure:**

```json
{
  "nodes": [
    {
      "id": "trigger-uuid",
      "name": "When chat message received",
      "type": "n8n-nodes-base.manualTrigger"
    },
    {
      "id": "agent-uuid",
      "name": "AI Agent",
      "type": "@n8n/n8n-nodes-langchain.agent",
      "parameters": {
        "promptType": "define",
        "text": "You are a helpful assistant with access to tools."
      }
    },
    {
      "id": "model-uuid",
      "name": "OpenAI Chat Model",
      "type": "@n8n/n8n-nodes-langchain.lmChatOpenAi",
      "parameters": {
        "model": "gpt-4o-mini",
        "options": { "temperature": 0.7 }
      }
    },
    {
      "id": "memory-uuid",
      "name": "Window Buffer Memory",
      "type": "@n8n/n8n-nodes-langchain.memoryBufferWindow",
      "parameters": { "contextWindowLength": 10 }
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
```

**CRITICAL**: AI Agent sub-nodes use special connection types:
- Chat Models: `"ai_languageModel"`
- Memory: `"ai_memory"`
- Tools: `"ai_tool"`
- Vector Stores: `"ai_vectorStore"`

## How to Test

### Test Case 1: Request an AI Agent

**User prompt:** "Build an AI agent that can answer customer questions and send emails"

**Expected result:** Workflow with:
1. Manual Trigger or Webhook
2. **AI Agent node** (`@n8n/n8n-nodes-langchain.agent`) ✅
3. **OpenAI Chat Model** sub-node (`@n8n/n8n-nodes-langchain.lmChatOpenAi`)
4. **Call n8n Workflow Tool** (for email sending)
5. **Buffer Window Memory** (for conversation history)

**NOT expected:** Basic OpenAI node (`n8n-nodes-base.openAi`) ❌

### Test Case 2: Request a Simple LLM Call

**User prompt:** "Generate a product description from product name"

**Expected result:** Workflow with:
1. Manual Trigger
2. **Basic OpenAI node** (`n8n-nodes-base.openAi`) ✅
3. No tools, no memory (simple completion)

### Test Case 3: AI Agent with Knowledge Base

**User prompt:** "Build an AI agent that can answer questions about our documentation using a knowledge base"

**Expected result:** Workflow with:
1. Manual Trigger
2. **AI Agent node**
3. **OpenAI Chat Model** sub-node
4. **Pinecone Vector Store** or **Supabase Vector Store** (for knowledge base) ✅
5. **Document Loader** (to load documentation)
6. **Embeddings** node (OpenAI Embeddings)
7. **Memory** node

## Available AI Agent Components

### Chat Models (Required - One per agent)
- `@n8n/n8n-nodes-langchain.lmChatOpenAi` - OpenAI (GPT-4, GPT-3.5)
- `@n8n/n8n-nodes-langchain.lmChatAnthropic` - Anthropic Claude
- `@n8n/n8n-nodes-langchain.lmChatAzureOpenAi` - Azure OpenAI
- `@n8n/n8n-nodes-langchain.lmChatGooglePalm` - Google PaLM/Gemini
- `@n8n/n8n-nodes-langchain.lmChatOllama` - Local Ollama models

### Tools (Optional - Multiple allowed)
- `@n8n/n8n-nodes-langchain.toolCalculator` - Mathematical calculations
- `@n8n/n8n-nodes-langchain.toolHttpRequest` - Make API calls
- `@n8n/n8n-nodes-langchain.toolCode` - Execute JavaScript/Python
- `@n8n/n8n-nodes-langchain.toolWorkflow` - **Call other n8n workflows** 🔥
- `@n8n/n8n-nodes-langchain.toolWikipedia` - Search Wikipedia
- `@n8n/n8n-nodes-langchain.toolSerpApi` - Google search

### Memory (Optional - One per agent)
- `@n8n/n8n-nodes-langchain.memoryBufferMemory` - Store full conversation
- `@n8n/n8n-nodes-langchain.memoryBufferWindow` - Store last N messages
- `@n8n/n8n-nodes-langchain.memoryConversationSummary` - Summarize long conversations
- `@n8n/n8n-nodes-langchain.memoryVectorStore` - Semantic search of history

### Vector Stores (Optional - For knowledge bases)
- `@n8n/n8n-nodes-langchain.vectorStorePinecone` - Pinecone
- `@n8n/n8n-nodes-langchain.vectorStoreSupabase` - Supabase
- `@n8n/n8n-nodes-langchain.vectorStoreQdrant` - Qdrant
- `@n8n/n8n-nodes-langchain.vectorStoreInMemory` - In-memory (testing)

## Common AI Agent Use Cases

1. **Customer Service Agent**
   - Tools: Lookup customer data (workflow tool), create support ticket (HTTP tool)
   - Memory: Buffer Window (last 10 messages)
   - Model: GPT-4o-mini

2. **Document Q&A Agent**
   - Vector Store: Pinecone (with company docs embedded)
   - Tools: Calculator (for numeric questions)
   - Memory: Buffer Memory
   - Model: Claude 3.5 Sonnet

3. **Sales Assistant Agent**
   - Tools: CRM lookup (workflow), send email (workflow), calculate pricing (calculator)
   - Memory: Conversation Summary (long sales calls)
   - Model: GPT-4o

4. **Code Review Agent**
   - Tools: GitHub API (HTTP), code execution (code tool)
   - Vector Store: Past code reviews
   - Memory: Buffer Window
   - Model: Claude 3 Opus

## Migration Guide

If you previously generated "AI agents" that were actually just OpenAI nodes:

**Before (Wrong):**
```json
{
  "nodes": [
    {
      "type": "n8n-nodes-base.openAi",
      "name": "AI Agent",
      "parameters": {
        "resource": "text",
        "operation": "message"
      }
    }
  ]
}
```

**After (Correct):**
```json
{
  "nodes": [
    {
      "type": "@n8n/n8n-nodes-langchain.agent",
      "name": "AI Agent",
      "parameters": {
        "promptType": "define",
        "text": "You are a helpful assistant."
      }
    },
    {
      "type": "@n8n/n8n-nodes-langchain.lmChatOpenAi",
      "name": "OpenAI Chat Model",
      "parameters": { "model": "gpt-4o-mini" }
    }
  ],
  "connections": {
    "OpenAI Chat Model": {
      "ai_languageModel": [[{
        "node": "AI Agent",
        "type": "ai_languageModel",
        "index": 0
      }]]
    }
  }
}
```

## Benefits of Proper AI Agent Nodes

1. **Tool Usage** - Agents can call APIs, execute code, run workflows
2. **Memory** - Maintain context across conversations
3. **Knowledge Bases** - Access vector stores for RAG (Retrieval-Augmented Generation)
4. **Multi-step Reasoning** - Break complex tasks into steps
5. **Error Recovery** - Retry with different tools if one fails
6. **Modularity** - Reuse tools across multiple agents

## References

- n8n LangChain Documentation: https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.agent/
- LangChain Concepts: https://docs.langchain.com/docs/
- n8n AI Agent Templates: See `/src/lib/n8n/raw-templates/` for working examples

---

**Summary**: Now when users ask for "AI agents," they'll get proper LangChain-powered agents with tools, memory, and knowledge base support - not just basic LLM calls! 🎉
