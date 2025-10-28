/**
 * Template Loader Utility
 *
 * Loads and sanitizes n8n workflow templates from JSON files.
 * Removes user-specific credentials, instance IDs, and personal data.
 */

import { N8N_WORKFLOW_TEMPLATES, type WorkflowTemplate } from './workflowTemplates';

/**
 * Sanitize a workflow JSON to remove user-specific data
 */
export function sanitizeWorkflowJson(workflowJson: any): any {
  const sanitized = JSON.parse(JSON.stringify(workflowJson)); // Deep clone

  // Remove instance ID
  if (sanitized.meta?.instanceId) {
    delete sanitized.meta.instanceId;
  }

  // Sanitize nodes
  if (sanitized.nodes && Array.isArray(sanitized.nodes)) {
    sanitized.nodes.forEach((node: any) => {
      // Remove credentials with placeholder
      if (node.credentials) {
        Object.keys(node.credentials).forEach(credType => {
          if (node.credentials[credType]?.id) {
            node.credentials[credType].id = 'USER_CREDENTIAL';
            node.credentials[credType].name = 'User Credential (Configure after import)';
          }
        });
      }

      // Sanitize webhook IDs
      if (node.webhookId) {
        node.webhookId = 'WEBHOOK_' + Math.random().toString(36).substring(7);
      }

      // Sanitize specific node types with personal data
      if (node.parameters) {
        // Email addresses
        if (node.parameters.sendTo && typeof node.parameters.sendTo === 'string') {
          if (node.parameters.sendTo.includes('@')) {
            node.parameters.sendTo = 'user@example.com';
          }
        }

        // Replace hardcoded emails in other fields
        if (typeof node.parameters === 'object') {
          sanitizeEmailsInObject(node.parameters);
        }
      }
    });
  }

  // Remove any tags that might be user-specific
  if (sanitized.tags) {
    sanitized.tags = [];
  }

  return sanitized;
}

/**
 * Recursively sanitize email addresses in an object
 */
function sanitizeEmailsInObject(obj: any): void {
  if (!obj || typeof obj !== 'object') return;

  Object.keys(obj).forEach(key => {
    const value = obj[key];

    if (typeof value === 'string') {
      // Check if it's an email
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      if (emailRegex.test(value)) {
        // Replace with placeholder, but preserve structure if it's in a larger string
        obj[key] = value.replace(emailRegex, 'user@example.com');
      }
    } else if (typeof value === 'object') {
      sanitizeEmailsInObject(value);
    }
  });
}

// Import all template JSON files statically
import telegramChatbot from './raw-templates/telegram-ai-chatbot-with-image-generation.json';
import twilioSms from './raw-templates/twilio-sms-chatbot-with-redis.json';
import appointmentScheduling from './raw-templates/appointment-scheduling-with-cal-twilio.json';
import mongodbTravel from './raw-templates/mongodb-ai-travel-planner-agent.json';
import pdfQa from './raw-templates/pdf-qa-with-pinecone-vector-search.json';
import audioTranscription from './raw-templates/audio-transcription-summary-to-notion.json';
import notionWorkflow from './raw-templates/notion-ai-workflow-generator.json';
import seoAudit from './raw-templates/website-seo-audit-with-ai.json';
import linkedinPost from './raw-templates/linkedin-post-automation-with-approval.json';
import emailMarketing from './raw-templates/personalized-email-marketing-with-ai.json';
import blogContent from './raw-templates/blog-content-automation-wordpress.json';
import linkedinLeadScoring from './raw-templates/linkedin-lead-scoring-to-google-sheets.json';
import hubspotOnboarding from './raw-templates/hubspot-customer-onboarding-automation.json';
import outlookCalendar from './raw-templates/outlook-calendar-sync-to-notion.json';
import msTeamsReport from './raw-templates/ms-teams-weekly-report-summarizer.json';

// Template ID to JSON mapping
const TEMPLATE_JSON_MAP: Record<string, any> = {
  'telegram-ai-chatbot-image': telegramChatbot,
  'twilio-sms-chatbot-redis': twilioSms,
  'appointment-scheduling-cal-twilio': appointmentScheduling,
  'mongodb-ai-travel-planner': mongodbTravel,
  'pdf-qa-pinecone-vector': pdfQa,
  'audio-transcription-notion': audioTranscription,
  'notion-ai-workflow-generator': notionWorkflow,
  'website-seo-audit-ai': seoAudit,
  'linkedin-post-approval': linkedinPost,
  'personalized-email-marketing-ai': emailMarketing,
  'blog-content-wordpress': blogContent,
  'linkedin-lead-scoring-sheets': linkedinLeadScoring,
  'hubspot-customer-onboarding': hubspotOnboarding,
  'outlook-calendar-notion': outlookCalendar,
  'ms-teams-weekly-report': msTeamsReport
};

/**
 * Load a workflow template by ID and return sanitized JSON
 */
export async function loadWorkflowTemplate(templateId: string): Promise<any> {
  const template = N8N_WORKFLOW_TEMPLATES.find(t => t.id === templateId);

  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }

  const templateJson = TEMPLATE_JSON_MAP[templateId];

  if (!templateJson) {
    throw new Error(`Template JSON not available for: ${templateId}`);
  }

  return sanitizeWorkflowJson(templateJson);
}

/**
 * Check if template JSON is available for loading
 */
export function isTemplateAvailable(templateId: string): boolean {
  return templateId in TEMPLATE_JSON_MAP;
}

/**
 * Get all available template IDs that have JSON files
 */
export function getAvailableTemplateIds(): string[] {
  return Object.keys(TEMPLATE_JSON_MAP);
}

/**
 * Get a template recommendation based on user intent
 * This uses a simple keyword matching algorithm
 */
export function recommendTemplate(userIntent: string): WorkflowTemplate[] {
  const lowerIntent = userIntent.toLowerCase();
  const keywords = lowerIntent.split(/\s+/);

  const scored = N8N_WORKFLOW_TEMPLATES.map(template => {
    let score = 0;

    // Check name
    keywords.forEach(keyword => {
      if (template.name.toLowerCase().includes(keyword)) score += 3;
      if (template.description.toLowerCase().includes(keyword)) score += 2;
      if (template.tags.some(tag => tag.toLowerCase().includes(keyword))) score += 1;
      if (template.useCases.some(uc => uc.toLowerCase().includes(keyword))) score += 1;
    });

    // Boost for exact category matches
    if (lowerIntent.includes(template.category.toLowerCase())) {
      score += 5;
    }

    return { template, score };
  });

  // Sort by score and return top 5
  return scored
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(item => item.template);
}

/**
 * Template selection guide for AI
 * This helps the AI model select the most appropriate template
 */
export const TEMPLATE_SELECTION_GUIDE = `
# n8n Template Selection Guide

When a user asks to generate an n8n workflow, first check if a template exists that matches their use case.

## Available Templates:

${N8N_WORKFLOW_TEMPLATES.map(t => `
### ${t.name} (ID: ${t.id})
**Category:** ${t.category}
**Complexity:** ${t.complexity} (${t.estimatedNodes} nodes)
**Description:** ${t.description}
**Integrations:** ${t.requiredIntegrations.join(', ')}
**Use Cases:**
${t.useCases.map(uc => `- ${uc}`).join('\n')}
**Tags:** ${t.tags.join(', ')}
`).join('\n---\n')}

## Selection Strategy:

1. **Exact Match**: If the user's request closely matches a template's use case, recommend that template
2. **Partial Match**: If multiple templates are relevant, suggest the one with the most overlapping integrations
3. **No Match**: If no template matches, generate from scratch using your knowledge

## How to Use a Template:

When recommending a template:
1. Mention the template name and why it's a good fit
2. List the required integrations the user needs to set up
3. Explain any customizations they might need to make
4. Provide the template ID so they can load it

Example response:
"I recommend using the 'LinkedIn Post Automation with Approval' template (ID: linkedin-post-approval).
This template already includes the LinkedIn posting workflow, Google Sheets integration for content scheduling,
and email approval logic. You'll need to set up credentials for LinkedIn, Google Sheets, and Gmail.
The main customization needed is updating the email approval address to match your team's workflow."
`;

/**
 * Format template for display
 */
export function formatTemplateForDisplay(template: WorkflowTemplate): string {
  return `
# ${template.name}

${template.description}

**Category:** ${template.category}
**Complexity:** ${template.complexity}
**Estimated Nodes:** ${template.estimatedNodes}

## Required Integrations
${template.requiredIntegrations.map(i => `- ${i}`).join('\n')}

## Use Cases
${template.useCases.map(uc => `- ${uc}`).join('\n')}

## Tags
${template.tags.map(t => `\`${t}\``).join(', ')}
`;
}

/**
 * Check if user has required integrations for a template
 * This would be used in the UI to show which templates are ready to use
 */
export function checkTemplateRequirements(
  template: WorkflowTemplate,
  userIntegrations: string[]
): {
  isReady: boolean;
  missing: string[];
  available: string[];
} {
  const lowerUserIntegrations = userIntegrations.map(i => i.toLowerCase());
  const missing: string[] = [];
  const available: string[] = [];

  template.requiredIntegrations.forEach(required => {
    const hasIntegration = lowerUserIntegrations.some(userInt =>
      userInt.includes(required.toLowerCase()) || required.toLowerCase().includes(userInt)
    );

    if (hasIntegration) {
      available.push(required);
    } else {
      missing.push(required);
    }
  });

  return {
    isReady: missing.length === 0,
    missing,
    available
  };
}
