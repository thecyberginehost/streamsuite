/**
 * Advanced AI Integration & LangChain
 */

export const N8N_ADVANCED_AI = {
  description: 'Advanced AI functionality using LangChain integration for agents, chains, and RAG patterns',
  
  // Core AI concepts
  concepts: {
    agents: {
      description: 'AI systems that can make decisions and use tools to accomplish tasks',
      capabilities: [
        'Dynamic tool selection based on context',
        'Multi-step reasoning and planning',
        'Error recovery and retry logic',
        'Memory and context management'
      ],
      useCase: 'Complex, multi-step tasks requiring decision-making'
    },
    
    chains: {
      description: 'Predefined sequences of AI operations for consistent workflows',
      capabilities: [
        'Sequential processing steps',
        'Predictable execution flow',
        'Optimized for specific tasks',
        'Deterministic outputs'
      ],
      useCase: 'Structured, repeatable AI processes'
    },
    
    tools: {
      description: 'Functions that AI agents can call to interact with external systems',
      types: [
        'API calls to external services',
        'Database queries and operations',
        'File processing and manipulation',
        'Mathematical calculations',
        'Custom n8n workflow execution'
      ],
      implementation: 'n8n workflows can serve as custom tools'
    },
    
    memory: {
      description: 'Context preservation across AI interactions',
      types: [
        'Conversation buffer memory',
        'Summary memory for long conversations',
        'Entity memory for key information',
        'Vector store memory for semantic search'
      ],
      persistence: 'Stored in databases or vector stores'
    }
  },

  // LangChain node types
  nodeTypes: {
    rootNodes: {
      'AI Agent': {
        nodeType: '@n8n/n8n-nodes-langchain.agent',
        displayName: 'AI Agent',
        description: 'Orchestrates multi-step AI tasks with tool usage, memory, and knowledge bases',
        capabilities: [
          'Use multiple tools dynamically',
          'Maintain conversation memory',
          'Access vector store knowledge bases',
          'Multi-step reasoning and planning',
          'Error recovery and retry logic'
        ],
        structure: {
          requiredInputs: [
            'Chat Model (OpenAI, Anthropic, etc.)',
          ],
          optionalInputs: [
            'Tools (Calculator, HTTP Request, Custom Workflows, etc.)',
            'Memory (Buffer, Window, Summary, Vector Store)',
            'Vector Store (Pinecone, Supabase, Qdrant for knowledge base)',
            'Output Parser'
          ],
          parameters: {
            promptType: ['Auto-detect', 'Define below'],
            text: 'System prompt that defines agent behavior and role',
            hasOutputParser: false
          }
        },
        exampleNode: {
          type: '@n8n/n8n-nodes-langchain.agent',
          typeVersion: 1.6,
          name: 'AI Agent',
          position: [840, 240],
          parameters: {
            promptType: 'define',
            text: 'You are a helpful customer service agent. You have access to tools to look up customer information, create support tickets, and send emails. Always be polite and helpful.'
          }
        },
        exampleWithTools: {
          agent: {
            type: '@n8n/n8n-nodes-langchain.agent',
            name: 'Customer Service Agent',
            parameters: {
              promptType: 'define',
              text: '=You are a customer service agent for {{ $env.COMPANY_NAME }}. Use the available tools to help customers with their requests.'
            }
          },
          chatModel: {
            type: '@n8n/n8n-nodes-langchain.lmChatOpenAi',
            name: 'OpenAI Chat Model',
            parameters: {
              model: 'gpt-4o-mini',
              options: {
                temperature: 0.3
              }
            }
          },
          memory: {
            type: '@n8n/n8n-nodes-langchain.memoryBufferWindow',
            name: 'Window Buffer Memory',
            parameters: {
              contextWindowLength: 10
            }
          },
          tools: [
            {
              type: '@n8n/n8n-nodes-langchain.toolWorkflow',
              name: 'Lookup Customer Tool',
              parameters: {
                description: 'Looks up customer information by email address. Returns customer ID, name, status, and order history.',
                workflowId: '={{$parameter["customerLookupWorkflowId"]}}'
              }
            },
            {
              type: '@n8n/n8n-nodes-langchain.toolHttpRequest',
              name: 'Create Support Ticket',
              parameters: {
                description: 'Creates a new support ticket in the helpdesk system.',
                method: 'POST',
                url: 'https://api.helpdesk.example.com/tickets'
              }
            }
          ]
        }
      },
      'AI Chain': 'Executes predefined AI workflows',
      'Chat Trigger': 'Starts workflows based on chat interactions',
      'Question and Answer Chain': 'Answers questions using knowledge bases',
      'Basic LLM Chain': 'Simple prompt-to-response workflows',
      'Summarization Chain': 'Condenses large texts into summaries'
    },
    
    subNodes: {
      models: {
        'OpenAI Chat Model': {
          type: '@n8n/n8n-nodes-langchain.lmChatOpenAi',
          description: 'Use OpenAI GPT models (GPT-4, GPT-3.5, etc.)',
          parameters: {
            model: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
            options: {
              temperature: 0.7,
              maxTokens: 2000,
              topP: 1
            }
          }
        },
        'Anthropic Chat Model': {
          type: '@n8n/n8n-nodes-langchain.lmChatAnthropic',
          description: 'Use Anthropic Claude models',
          parameters: {
            model: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'],
            options: {
              temperature: 0.7,
              maxTokens: 4096
            }
          }
        },
        'Azure OpenAI Chat Model': {
          type: '@n8n/n8n-nodes-langchain.lmChatAzureOpenAi',
          description: 'Use Azure-hosted OpenAI models',
          parameters: {
            deploymentName: 'your-deployment',
            options: { temperature: 0.7, maxTokens: 2000 }
          }
        },
        'Google Chat Model': {
          type: '@n8n/n8n-nodes-langchain.lmChatGooglePalm',
          description: 'Use Google PaLM 2 or Gemini models'
        },
        'Ollama Chat Model': {
          type: '@n8n/n8n-nodes-langchain.lmChatOllama',
          description: 'Use locally-hosted Ollama models',
          parameters: {
            model: 'llama2',
            baseUrl: 'http://localhost:11434'
          }
        }
      },

      memory: {
        'Buffer Memory': {
          type: '@n8n/n8n-nodes-langchain.memoryBufferMemory',
          description: 'Stores entire conversation history',
          useCase: 'Short conversations where full context is needed'
        },
        'Buffer Window Memory': {
          type: '@n8n/n8n-nodes-langchain.memoryBufferWindow',
          description: 'Stores last N messages only',
          parameters: {
            contextWindowLength: 10
          },
          useCase: 'Long conversations with limited context window'
        },
        'Conversation Summary Memory': {
          type: '@n8n/n8n-nodes-langchain.memoryConversationSummary',
          description: 'Summarizes conversation history to save tokens',
          useCase: 'Very long conversations requiring compression'
        },
        'Vector Store Memory': {
          type: '@n8n/n8n-nodes-langchain.memoryVectorStore',
          description: 'Semantic search of conversation history',
          useCase: 'Retrieve relevant past context based on current query'
        }
      },

      tools: {
        'Calculator Tool': {
          type: '@n8n/n8n-nodes-langchain.toolCalculator',
          description: 'Perform mathematical calculations',
          example: 'Agent can calculate: "What is 25% of $1,299?"'
        },
        'HTTP Request Tool': {
          type: '@n8n/n8n-nodes-langchain.toolHttpRequest',
          description: 'Make HTTP API requests',
          parameters: {
            description: 'Clear description of what this API does (for the AI)',
            method: 'GET',
            url: 'https://api.example.com/data',
            authentication: 'predefinedCredentialType'
          },
          example: 'Fetch real-time weather data from external API'
        },
        'Code Tool': {
          type: '@n8n/n8n-nodes-langchain.toolCode',
          description: 'Execute custom JavaScript/Python code',
          parameters: {
            description: 'What this code does (for the AI)',
            language: 'javascript',
            code: 'return { result: items[0].json.value * 2 }'
          },
          example: 'Custom data processing logic'
        },
        'Call n8n Workflow Tool': {
          type: '@n8n/n8n-nodes-langchain.toolWorkflow',
          description: 'Execute another n8n workflow as a tool',
          parameters: {
            description: 'Clear description of what this workflow does (for the AI to decide when to use it)',
            workflowId: 'workflow-id-here',
            mode: 'webhook'
          },
          example: 'Lookup customer data, send emails, create tickets - any complex n8n workflow',
          bestPractice: 'Use this to give AI agents access to your existing n8n automations'
        },
        'Wikipedia Tool': {
          type: '@n8n/n8n-nodes-langchain.toolWikipedia',
          description: 'Search and retrieve Wikipedia content',
          example: 'Agent can answer factual questions using Wikipedia'
        },
        'Serp API Tool': {
          type: '@n8n/n8n-nodes-langchain.toolSerpApi',
          description: 'Perform Google searches and retrieve results',
          example: 'Agent can search the web for current information'
        }
      },
      
      vectorStores: [
        'Pinecone Vector Store',
        'Supabase Vector Store',
        'Qdrant Vector Store',
        'Memory Vector Store',
        'Chroma Vector Store'
      ],
      
      documentLoaders: [
        'CSV Loader',
        'PDF Loader',
        'JSON Loader',
        'Text Loader',
        'Web Scraper'
      ],
      
      textSplitters: [
        'Character Text Splitter',
        'Recursive Character Text Splitter',
        'Token Text Splitter',
        'Markdown Text Splitter'
      ],
      
      embeddings: [
        'OpenAI Embeddings',
        'Azure OpenAI Embeddings',
        'Google Embeddings',
        'Hugging Face Embeddings'
      ]
    }
  },

  // Advanced workflow patterns
  workflowPatterns: {
    simpleRAG: {
      description: 'Retrieval-Augmented Generation for question answering',
      structure: [
        'Document Loader → Text Splitter → Embeddings → Vector Store',
        'User Question → Vector Store Retrieval → LLM with Context'
      ],
      example: 'Knowledge base Q&A system',
      nodes: ['Question and Answer Chain', 'Document Loader', 'Vector Store', 'Embeddings']
    },
    
    advancedRAG: {
      description: 'Multi-source RAG with reranking and filtering',
      structure: [
        'Multiple Document Sources → Processing → Vector Stores',
        'Query → Multi-Vector Retrieval → Reranking → LLM'
      ],
      features: [
        'Multiple knowledge sources',
        'Semantic and keyword search',
        'Result reranking and filtering',
        'Source attribution and confidence scoring'
      ],
      implementation: 'Use multiple retrieval chains with merge nodes'
    },
    
    agentWorkflow: {
      description: 'AI agent with multiple tools and decision-making',
      structure: [
        'Chat Trigger → AI Agent → Multiple Tools → Response',
        'Memory Component for context preservation'
      ],
      capabilities: [
        'Dynamic tool selection',
        'Multi-step task execution',
        'Error handling and recovery',
        'Context-aware responses'
      ],
      example: 'Customer service agent with access to CRM, knowledge base, and escalation tools'
    },
    
    workflowChaining: {
      description: 'Chain multiple AI operations for complex processing',
      structure: [
        'Input Processing → Summary Chain → Analysis Chain → Response Generation',
        'Each chain specialized for specific task'
      ],
      benefits: [
        'Modular AI processing',
        'Optimized prompts per task',
        'Error isolation',
        'Reusable components'
      ],
      example: 'Document analysis: extract → summarize → categorize → generate insights'
    },
    
    humanInTheLoop: {
      description: 'AI workflows with human oversight and intervention',
      structure: [
        'AI Processing → Confidence Check → Human Review (if needed) → Final Action',
        'Escalation paths for complex cases'
      ],
      patterns: [
        'Approval workflows for AI decisions',
        'Human fallback for low-confidence responses',
        'Expert review for sensitive operations',
        'Training data collection from human corrections'
      ],
      implementation: 'Use conditional logic and webhook notifications'
    },
    
    modelChaining: {
      description: 'Combine multiple AI models for enhanced capabilities',
      patterns: [
        'Specialist routing: Route queries to domain-specific models',
        'Consensus voting: Multiple models vote on answers',
        'Pipeline processing: Each model adds layer of analysis',
        'Validation chains: One model validates another\'s output'
      ],
      example: 'Legal document analysis: extraction model → classification model → risk assessment model'
    }
  },

  // Tool integration patterns
  toolIntegration: {
    customWorkflowTools: {
      description: 'Use n8n workflows as AI agent tools',
      setup: [
        'Create dedicated workflow for specific function',
        'Add Chat Trigger or Webhook Trigger',
        'Configure input parameters and return format',
        'Connect to AI Agent using Call n8n Workflow Tool'
      ],
      examples: [
        'CRM data lookup and updates',
        'Email sending and scheduling',
        'Database queries and analytics',
        'File processing and generation',
        'API integrations and data synchronization'
      ],
      benefits: [
        'Leverage existing n8n integrations',
        'Reusable across multiple AI workflows',
        'Complex logic encapsulation',
        'Error handling and retry logic'
      ]
    },
    
    toolChaining: {
      description: 'AI agents using multiple tools in sequence',
      patterns: [
        'Information gathering → Processing → Action execution',
        'Validation tools before execution tools',
        'Fallback tools for error recovery'
      ],
      configuration: {
        toolSelection: 'AI decides which tools to use based on context',
        toolOrdering: 'Agent determines optimal tool execution sequence',
        errorHandling: 'Automatic retry with alternative tools'
      }
    },
    
    conditionalTools: {
      description: 'Tools available based on context or user permissions',
      implementation: 'Dynamic tool availability based on user roles, request type, or system state',
      examples: [
        'Admin tools only for privileged users',
        'Financial tools only for finance-related requests',
        'Emergency tools only during incident response'
      ]
    }
  }
} as const;