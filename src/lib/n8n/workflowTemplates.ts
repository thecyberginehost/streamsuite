/**
 * n8n Workflow Templates
 *
 * This file provides a curated collection of n8n workflow templates for the StreamSuite SaaS platform.
 * All templates are sourced from the n8n community and are provided under the Apache 2.0 / Fair Code License.
 *
 * Templates are sanitized to remove user-specific credentials and personal data.
 */

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  complexity: 'beginner' | 'intermediate' | 'advanced';
  estimatedNodes: number;
  requiredIntegrations: string[];
  useCases: string[];
  fileName: string;
}

export const WORKFLOW_CATEGORIES = {
  AI_CHATBOTS: 'AI & Chatbots',
  DOCUMENT_PROCESSING: 'Document Processing',
  MARKETING_AUTOMATION: 'Marketing Automation',
  CRM_SALES: 'CRM & Sales',
  PRODUCTIVITY: 'Productivity',
  ECOMMERCE: 'E-commerce',
  CONTENT_CREATION: 'Content Creation',
  DATA_ANALYSIS: 'Data & Analytics'
} as const;

export const N8N_WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  // AI & Chatbots
  {
    id: 'telegram-ai-chatbot-image',
    name: 'Telegram AI Chatbot with Image Generation',
    description: 'A Telegram bot powered by OpenAI that can engage in conversations and generate images on demand using DALL-E. Supports command routing with /start and /image commands.',
    category: WORKFLOW_CATEGORIES.AI_CHATBOTS,
    tags: ['telegram', 'openai', 'chatbot', 'image-generation', 'dalle', 'gpt-4'],
    complexity: 'intermediate',
    estimatedNodes: 12,
    requiredIntegrations: ['Telegram', 'OpenAI'],
    useCases: [
      'Customer support bot',
      'Interactive FAQ bot',
      'Creative image generation bot',
      'Multi-language chat support'
    ],
    fileName: 'telegram-ai-chatbot-with-image-generation.json'
  },
  {
    id: 'twilio-sms-chatbot-redis',
    name: 'Twilio SMS Chatbot with Redis Memory',
    description: 'Advanced SMS chatbot using Twilio and Redis for message buffering. Implements debouncing to handle rapid message bursts and provides intelligent responses using OpenAI with chat history.',
    category: WORKFLOW_CATEGORIES.AI_CHATBOTS,
    tags: ['twilio', 'sms', 'openai', 'redis', 'chat-memory', 'debouncing'],
    complexity: 'advanced',
    estimatedNodes: 15,
    requiredIntegrations: ['Twilio', 'OpenAI', 'Redis'],
    useCases: [
      'SMS customer support',
      'WooCommerce support agent',
      'Conversational SMS marketing',
      'Automated SMS helpdesk'
    ],
    fileName: 'twilio-sms-chatbot-with-redis.json'
  },
  {
    id: 'appointment-scheduling-cal-twilio',
    name: 'AI Appointment Scheduling with Cal.com & Twilio',
    description: 'Comprehensive appointment booking system via SMS using AI agents. Integrates Cal.com for calendar management, Airtable for session tracking, and automated follow-ups.',
    category: WORKFLOW_CATEGORIES.AI_CHATBOTS,
    tags: ['twilio', 'cal.com', 'openai', 'airtable', 'appointment-scheduling', 'sms', 'ai-agent'],
    complexity: 'advanced',
    estimatedNodes: 28,
    requiredIntegrations: ['Twilio', 'Cal.com', 'OpenAI', 'Airtable'],
    useCases: [
      'Service appointment booking',
      'Consultation scheduling',
      'PC/laptop repair bookings',
      'Automated follow-up campaigns'
    ],
    fileName: 'appointment-scheduling-with-cal-twilio.json'
  },
  {
    id: 'mongodb-ai-travel-planner',
    name: 'MongoDB AI Travel Planner with Vector Search',
    description: 'AI travel planning agent powered by MongoDB Atlas vector search, Google Gemini, and OpenAI embeddings. Uses semantic search to recommend points of interest.',
    category: WORKFLOW_CATEGORIES.AI_CHATBOTS,
    tags: ['mongodb', 'gemini', 'openai', 'vector-search', 'ai-agent', 'embeddings', 'travel'],
    complexity: 'advanced',
    estimatedNodes: 10,
    requiredIntegrations: ['MongoDB Atlas', 'Google Gemini', 'OpenAI'],
    useCases: [
      'Travel recommendation system',
      'AI tour guide',
      'Location-based assistance',
      'Vector search demos'
    ],
    fileName: 'mongodb-ai-travel-planner-agent.json'
  },

  // Document Processing
  {
    id: 'pdf-qa-pinecone-vector',
    name: 'PDF Q&A with Pinecone Vector Search',
    description: 'Ask questions about PDF documents using AI. Loads PDFs from Google Drive, chunks them with RecursiveCharacterTextSplitter, stores in Pinecone, and provides a chat interface for Q&A.',
    category: WORKFLOW_CATEGORIES.DOCUMENT_PROCESSING,
    tags: ['pdf', 'pinecone', 'openai', 'google-drive', 'vector-search', 'embeddings', 'qa'],
    complexity: 'advanced',
    estimatedNodes: 14,
    requiredIntegrations: ['Google Drive', 'Pinecone', 'OpenAI'],
    useCases: [
      'Document knowledge base',
      'PDF research assistant',
      'Legal document Q&A',
      'Technical manual assistant'
    ],
    fileName: 'pdf-qa-with-pinecone-vector-search.json'
  },
  {
    id: 'audio-transcription-notion',
    name: 'Audio Transcription & Summary to Notion',
    description: 'Automatically transcribe audio files from Google Drive using OpenAI Whisper, generate summaries with GPT-4, and store structured results in Notion with metadata extraction.',
    category: WORKFLOW_CATEGORIES.DOCUMENT_PROCESSING,
    tags: ['audio', 'transcription', 'openai', 'whisper', 'gpt-4', 'notion', 'google-drive'],
    complexity: 'intermediate',
    estimatedNodes: 8,
    requiredIntegrations: ['Google Drive', 'OpenAI', 'Notion'],
    useCases: [
      'Meeting transcription',
      'Podcast summarization',
      'Interview analysis',
      'Audio content archiving'
    ],
    fileName: 'audio-transcription-summary-to-notion.json'
  },
  {
    id: 'notion-ai-workflow-generator',
    name: 'Notion AI Workflow Generator',
    description: 'Meta-workflow that generates other n8n workflows using AI. Takes natural language workflow descriptions from Notion and generates complete n8n JSON configurations.',
    category: WORKFLOW_CATEGORIES.DOCUMENT_PROCESSING,
    tags: ['notion', 'anthropic', 'claude', 'ai-agent', 'workflow-generation', 'meta-automation'],
    complexity: 'advanced',
    estimatedNodes: 22,
    requiredIntegrations: ['Notion', 'Anthropic Claude'],
    useCases: [
      'Automated workflow creation',
      'Workflow template generator',
      'No-code workflow builder',
      'AI-powered automation assistant'
    ],
    fileName: 'notion-ai-workflow-generator.json'
  },
  {
    id: 'website-seo-audit-ai',
    name: 'Website SEO Audit with AI',
    description: 'Comprehensive on-page SEO analysis tool. Scrapes websites, performs technical and content audits using OpenAI, and delivers detailed reports via email.',
    category: WORKFLOW_CATEGORIES.DOCUMENT_PROCESSING,
    tags: ['seo', 'openai', 'website-analysis', 'gmail', 'content-audit', 'technical-audit'],
    complexity: 'intermediate',
    estimatedNodes: 11,
    requiredIntegrations: ['OpenAI', 'Gmail'],
    useCases: [
      'SEO auditing service',
      'Website optimization',
      'Content quality analysis',
      'Technical SEO reports'
    ],
    fileName: 'website-seo-audit-with-ai.json'
  },

  // Marketing Automation
  {
    id: 'linkedin-post-approval',
    name: 'LinkedIn Post Automation with Approval',
    description: 'Schedule and publish AI-generated LinkedIn posts from Google Sheets. Includes email approval workflow, image handling, and automatic posting with retry logic.',
    category: WORKFLOW_CATEGORIES.MARKETING_AUTOMATION,
    tags: ['linkedin', 'openai', 'google-sheets', 'gmail', 'social-media', 'content-approval'],
    complexity: 'intermediate',
    estimatedNodes: 14,
    requiredIntegrations: ['LinkedIn', 'OpenAI', 'Google Sheets', 'Gmail'],
    useCases: [
      'LinkedIn content calendar',
      'Automated social posting',
      'Content approval workflow',
      'Social media management'
    ],
    fileName: 'linkedin-post-automation-with-approval.json'
  },
  {
    id: 'personalized-email-marketing-ai',
    name: 'Personalized Email Marketing with AI',
    description: 'Create hyper-personalized marketing emails using customer data and AI. Features dynamic coupon generation, A/B testing, and advanced segmentation logic.',
    category: WORKFLOW_CATEGORIES.MARKETING_AUTOMATION,
    tags: ['email-marketing', 'openai', 'personalization', 'coupons', 'ab-testing', 'segmentation'],
    complexity: 'intermediate',
    estimatedNodes: 18,
    requiredIntegrations: ['OpenAI', 'Email Service Provider'],
    useCases: [
      'E-commerce email campaigns',
      'Customer retention emails',
      'Personalized promotions',
      'Behavioral email triggers'
    ],
    fileName: 'personalized-email-marketing-with-ai.json'
  },
  {
    id: 'blog-content-wordpress',
    name: 'Blog Content Automation for WordPress',
    description: 'Full-stack content creation pipeline: research with Perplexity, write SEO content with GPT-4, publish to WordPress, notify via Slack/Gmail, and log to Notion.',
    category: WORKFLOW_CATEGORIES.CONTENT_CREATION,
    tags: ['wordpress', 'openai', 'perplexity', 'seo', 'slack', 'gmail', 'notion', 'content-creation'],
    complexity: 'advanced',
    estimatedNodes: 16,
    requiredIntegrations: ['WordPress', 'OpenAI', 'Perplexity', 'Slack', 'Gmail', 'Notion'],
    useCases: [
      'Automated blog publishing',
      'SEO content creation',
      'Content research pipeline',
      'Multi-channel notifications'
    ],
    fileName: 'blog-content-automation-wordpress.json'
  },

  // CRM & Sales
  {
    id: 'linkedin-lead-scoring-sheets',
    name: 'LinkedIn Lead Scoring to Google Sheets',
    description: 'Search LinkedIn companies using Ghost Genius API, score them with AI based on fit criteria, and automatically populate a Google Sheets CRM with qualified leads.',
    category: WORKFLOW_CATEGORIES.CRM_SALES,
    tags: ['linkedin', 'lead-scoring', 'openai', 'google-sheets', 'crm', 'prospecting', 'ai-scoring'],
    complexity: 'advanced',
    estimatedNodes: 18,
    requiredIntegrations: ['LinkedIn (Ghost Genius API)', 'OpenAI', 'Google Sheets'],
    useCases: [
      'B2B lead generation',
      'Sales prospecting automation',
      'AI-powered lead qualification',
      'CRM data enrichment'
    ],
    fileName: 'linkedin-lead-scoring-to-google-sheets.json'
  },
  {
    id: 'hubspot-customer-onboarding',
    name: 'HubSpot Customer Onboarding Automation',
    description: 'Automated customer onboarding triggered by HubSpot contact creation. Sends personalized welcome emails, schedules onboarding calls via Google Calendar, and assigns CSM.',
    category: WORKFLOW_CATEGORIES.CRM_SALES,
    tags: ['hubspot', 'openai', 'google-calendar', 'gmail', 'onboarding', 'customer-success'],
    complexity: 'advanced',
    estimatedNodes: 22,
    requiredIntegrations: ['HubSpot', 'OpenAI', 'Google Calendar', 'Gmail'],
    useCases: [
      'Customer onboarding',
      'Welcome email automation',
      'Meeting scheduling',
      'CSM assignment'
    ],
    fileName: 'hubspot-customer-onboarding-automation.json'
  },

  // Productivity
  {
    id: 'outlook-calendar-notion',
    name: 'Outlook Calendar Sync to Notion',
    description: 'Bi-directional sync between Outlook Calendar and Notion. Creates and updates Notion database pages for calendar events with automatic conflict resolution.',
    category: WORKFLOW_CATEGORIES.PRODUCTIVITY,
    tags: ['outlook', 'notion', 'calendar', 'sync', 'productivity', 'microsoft-365'],
    complexity: 'intermediate',
    estimatedNodes: 9,
    requiredIntegrations: ['Microsoft Outlook', 'Notion'],
    useCases: [
      'Calendar database in Notion',
      'Meeting tracking',
      'Event management',
      'Cross-platform sync'
    ],
    fileName: 'outlook-calendar-sync-to-notion.json'
  },
  {
    id: 'ms-teams-weekly-report',
    name: 'MS Teams Weekly Report Summarizer',
    description: 'Automatically summarize MS Teams channel activity into weekly reports. Analyzes messages, groups by user, generates individual and team reports using AI, and posts back to channel.',
    category: WORKFLOW_CATEGORIES.PRODUCTIVITY,
    tags: ['microsoft-teams', 'openai', 'reporting', 'team-collaboration', 'ai-summary'],
    complexity: 'advanced',
    estimatedNodes: 14,
    requiredIntegrations: ['Microsoft Teams', 'OpenAI'],
    useCases: [
      'Weekly team reports',
      'Channel activity summary',
      'Remote team updates',
      'Project status reports'
    ],
    fileName: 'ms-teams-weekly-report-summarizer.json'
  }
];

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: string): WorkflowTemplate[] {
  return N8N_WORKFLOW_TEMPLATES.filter(template => template.category === category);
}

/**
 * Get templates by tag
 */
export function getTemplatesByTag(tag: string): WorkflowTemplate[] {
  return N8N_WORKFLOW_TEMPLATES.filter(template =>
    template.tags.some(t => t.toLowerCase().includes(tag.toLowerCase()))
  );
}

/**
 * Get templates by complexity
 */
export function getTemplatesByComplexity(complexity: 'beginner' | 'intermediate' | 'advanced'): WorkflowTemplate[] {
  return N8N_WORKFLOW_TEMPLATES.filter(template => template.complexity === complexity);
}

/**
 * Search templates by name or description
 */
export function searchTemplates(query: string): WorkflowTemplate[] {
  const lowerQuery = query.toLowerCase();
  return N8N_WORKFLOW_TEMPLATES.filter(template =>
    template.name.toLowerCase().includes(lowerQuery) ||
    template.description.toLowerCase().includes(lowerQuery) ||
    template.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): WorkflowTemplate | undefined {
  return N8N_WORKFLOW_TEMPLATES.find(template => template.id === id);
}

/**
 * Get all available categories
 */
export function getAllCategories(): string[] {
  return Object.values(WORKFLOW_CATEGORIES);
}

/**
 * Get all unique tags
 */
export function getAllTags(): string[] {
  const tagSet = new Set<string>();
  N8N_WORKFLOW_TEMPLATES.forEach(template => {
    template.tags.forEach(tag => tagSet.add(tag));
  });
  return Array.from(tagSet).sort();
}

/**
 * Get template statistics
 */
export function getTemplateStats() {
  return {
    total: N8N_WORKFLOW_TEMPLATES.length,
    byCategory: Object.values(WORKFLOW_CATEGORIES).map(category => ({
      category,
      count: getTemplatesByCategory(category).length
    })),
    byComplexity: {
      beginner: getTemplatesByComplexity('beginner').length,
      intermediate: getTemplatesByComplexity('intermediate').length,
      advanced: getTemplatesByComplexity('advanced').length
    },
    totalIntegrations: new Set(
      N8N_WORKFLOW_TEMPLATES.flatMap(t => t.requiredIntegrations)
    ).size
  };
}
