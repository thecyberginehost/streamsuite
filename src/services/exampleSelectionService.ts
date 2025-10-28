/**
 * Example Selection Service
 *
 * Intelligently selects the most relevant workflow examples from /examples folder
 * based on user's workflow description and requirements
 */

import aiAgentWorkflow from '../../examples/ai_agent_workflow.json';
import whatsappChatbot from '../../examples/ai-powered-whatsapp-chatbot-for-text-voice-images-pdf-rag.json';
import socialMediaAutomation from '../../examples/automate-multi-platform-ssm-content-creation-with-ai.json';
import tokenTracking from '../../examples/track-ai-agent-token-usage-and-estimate-cost-in-google-sheets.json';
import hubspotOnboarding from '../../examples/hubspot-customer-onboarding-automation.json';
import linkedinLeadScoring from '../../examples/linkedin-lead-scoring-to-google-sheets.json';
import emailMarketing from '../../examples/personalized-email-marketing-with-ai.json';
import shopifyHubspot from '../../examples/shopify-to-hubspot-customer-sync.json';
import sheetsGmailSync from '../../examples/google-sheets-gmail-data-sync.json';
import airtableAutomation from '../../examples/airtable-database-automation.json';
import slackNotifications from '../../examples/slack-notification-automation.json';
import asanaNotion from '../../examples/asana-notion-project-sync.json';
import jiraTickets from '../../examples/jira-ticket-management.json';
import githubDevops from '../../examples/github-devops-automation.json';

export interface WorkflowExample {
  name: string;
  description: string;
  keywords: string[];
  complexity: 'simple' | 'medium' | 'complex';
  category: string;
  content: any;
  nodeCount: number;
}

// Catalog of all available examples
const WORKFLOW_EXAMPLES: WorkflowExample[] = [
  {
    name: 'AI Agent Routing',
    description: 'AI-powered decision routing with switch logic and multiple outputs',
    keywords: ['ai', 'agent', 'routing', 'decision', 'switch', 'langchain', 'openai'],
    complexity: 'simple',
    category: 'AI & Automation',
    content: aiAgentWorkflow,
    nodeCount: 10
  },
  {
    name: 'WhatsApp RAG Chatbot',
    description: 'Complex chatbot with RAG, vector search, and multi-modal support',
    keywords: ['whatsapp', 'chatbot', 'rag', 'vector', 'pdf', 'ai', 'langchain', 'mongodb', 'messaging'],
    complexity: 'complex',
    category: 'AI & Automation',
    content: whatsappChatbot,
    nodeCount: 50
  },
  {
    name: 'Social Media Automation',
    description: 'Multi-platform content creation for LinkedIn, Instagram, Facebook, Twitter',
    keywords: ['social media', 'content', 'linkedin', 'instagram', 'facebook', 'twitter', 'marketing', 'ai'],
    complexity: 'complex',
    category: 'Marketing',
    content: socialMediaAutomation,
    nodeCount: 60
  },
  {
    name: 'Token Usage Tracking',
    description: 'Monitor and track AI token usage with cost estimation',
    keywords: ['tracking', 'monitoring', 'cost', 'analytics', 'token', 'ai', 'sheets'],
    complexity: 'medium',
    category: 'Analytics',
    content: tokenTracking,
    nodeCount: 25
  },
  {
    name: 'HubSpot Customer Onboarding',
    description: 'Automated customer onboarding with CRM, email, and calendar',
    keywords: ['hubspot', 'crm', 'onboarding', 'customer', 'gmail', 'calendar', 'sales'],
    complexity: 'medium',
    category: 'CRM & Sales',
    content: hubspotOnboarding,
    nodeCount: 35
  },
  {
    name: 'LinkedIn Lead Scoring',
    description: 'Lead enrichment and scoring with Google Sheets CRM',
    keywords: ['linkedin', 'lead', 'scoring', 'sales', 'crm', 'sheets', 'enrichment'],
    complexity: 'medium',
    category: 'CRM & Sales',
    content: linkedinLeadScoring,
    nodeCount: 28
  },
  {
    name: 'AI Email Marketing',
    description: 'Personalized email campaigns with AI-powered content generation',
    keywords: ['email', 'marketing', 'ai', 'personalization', 'campaign', 'gmail'],
    complexity: 'medium',
    category: 'Marketing',
    content: emailMarketing,
    nodeCount: 30
  },
  {
    name: 'Shopify to HubSpot Sync',
    description: 'E-commerce order sync to CRM',
    keywords: ['shopify', 'hubspot', 'ecommerce', 'order', 'crm', 'sync', 'customer'],
    complexity: 'simple',
    category: 'E-commerce',
    content: shopifyHubspot,
    nodeCount: 12
  },
  {
    name: 'Google Sheets Gmail Automation',
    description: 'Data processing and automated email workflows',
    keywords: ['sheets', 'gmail', 'data', 'email', 'automation', 'sync'],
    complexity: 'complex',
    category: 'Data & Communication',
    content: sheetsGmailSync,
    nodeCount: 45
  },
  {
    name: 'Airtable Database Operations',
    description: 'Database automation and record management',
    keywords: ['airtable', 'database', 'data', 'automation', 'records'],
    complexity: 'medium',
    category: 'Data Operations',
    content: airtableAutomation,
    nodeCount: 22
  },
  {
    name: 'Slack Team Notifications',
    description: 'Automated team alerts and notifications',
    keywords: ['slack', 'notification', 'alert', 'team', 'communication', 'webhook'],
    complexity: 'medium',
    category: 'Communication',
    content: slackNotifications,
    nodeCount: 32
  },
  {
    name: 'Asana to Notion Sync',
    description: 'Cross-platform project and task synchronization',
    keywords: ['asana', 'notion', 'project', 'task', 'sync', 'productivity'],
    complexity: 'medium',
    category: 'Project Management',
    content: asanaNotion,
    nodeCount: 18
  },
  {
    name: 'Jira Ticket Management',
    description: 'Issue tracking and ticket automation',
    keywords: ['jira', 'ticket', 'issue', 'tracking', 'devops', 'project'],
    complexity: 'medium',
    category: 'Project Management',
    content: jiraTickets,
    nodeCount: 16
  },
  {
    name: 'GitHub DevOps Automation',
    description: 'CI/CD and repository automation workflows',
    keywords: ['github', 'devops', 'ci/cd', 'repository', 'automation', 'developer'],
    complexity: 'complex',
    category: 'Developer Tools',
    content: githubDevops,
    nodeCount: 38
  }
];

/**
 * Extract keywords from user description
 */
function extractKeywords(description: string): string[] {
  const text = description.toLowerCase();
  const keywords: string[] = [];

  // Common integration names
  const integrations = [
    'hubspot', 'shopify', 'slack', 'gmail', 'sheets', 'airtable', 'notion',
    'asana', 'jira', 'github', 'linkedin', 'facebook', 'instagram', 'twitter',
    'whatsapp', 'telegram', 'mongodb', 'openai', 'langchain'
  ];

  // Common workflow types
  const types = [
    'chatbot', 'crm', 'email', 'lead', 'customer', 'order', 'sync', 'automation',
    'notification', 'alert', 'ai', 'agent', 'tracking', 'monitoring', 'project',
    'task', 'ticket', 'devops', 'marketing', 'social media', 'onboarding'
  ];

  [...integrations, ...types].forEach(keyword => {
    if (text.includes(keyword)) {
      keywords.push(keyword);
    }
  });

  return keywords;
}

/**
 * Calculate relevance score between user keywords and example
 */
function calculateRelevanceScore(
  userKeywords: string[],
  example: WorkflowExample
): number {
  let score = 0;

  // Exact keyword matches (high weight)
  userKeywords.forEach(keyword => {
    if (example.keywords.includes(keyword)) {
      score += 10;
    }
  });

  // Partial matches in description (medium weight)
  userKeywords.forEach(keyword => {
    if (example.description.toLowerCase().includes(keyword)) {
      score += 5;
    }
  });

  // Category match (low weight)
  userKeywords.forEach(keyword => {
    if (example.category.toLowerCase().includes(keyword)) {
      score += 2;
    }
  });

  return score;
}

/**
 * Select the most relevant workflow examples based on user description
 * Returns 2-3 best matches for the Enterprise Workflow Builder
 */
export function selectRelevantExamples(
  description: string,
  maxExamples: number = 3
): WorkflowExample[] {
  const userKeywords = extractKeywords(description);

  // Calculate scores for all examples
  const scoredExamples = WORKFLOW_EXAMPLES.map(example => ({
    example,
    score: calculateRelevanceScore(userKeywords, example)
  }));

  // Sort by score (descending)
  scoredExamples.sort((a, b) => b.score - a.score);

  // Return top N matches, but always include at least one complex example
  const topMatches = scoredExamples.slice(0, maxExamples);

  // Ensure diversity: if all matches are same complexity, swap one for different complexity
  const complexities = topMatches.map(m => m.example.complexity);
  const hasComplex = complexities.includes('complex');
  const hasMedium = complexities.includes('medium');

  if (!hasComplex && scoredExamples.length > maxExamples) {
    // Find first complex example not in top matches
    const complexExample = scoredExamples.find(
      se => se.example.complexity === 'complex' &&
      !topMatches.some(tm => tm.example.name === se.example.name)
    );
    if (complexExample) {
      topMatches[topMatches.length - 1] = complexExample;
    }
  }

  return topMatches.map(m => m.example);
}

/**
 * Get all curated examples (for always-include base knowledge)
 */
export function getAllExamples(): WorkflowExample[] {
  return WORKFLOW_EXAMPLES;
}

/**
 * Get examples by category
 */
export function getExamplesByCategory(category: string): WorkflowExample[] {
  return WORKFLOW_EXAMPLES.filter(ex => ex.category === category);
}

/**
 * Get examples by complexity
 */
export function getExamplesByComplexity(
  complexity: 'simple' | 'medium' | 'complex'
): WorkflowExample[] {
  return WORKFLOW_EXAMPLES.filter(ex => ex.complexity === complexity);
}
