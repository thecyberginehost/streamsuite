/**
 * Template Service
 *
 * Manages n8n workflow templates - loading, searching, and recommending
 * templates based on user requirements.
 */

import {
  N8N_WORKFLOW_TEMPLATES,
  getTemplateById,
  getTemplatesByCategory,
  getTemplatesByTag,
  getTemplatesByComplexity,
  searchTemplates,
  getAllCategories,
  getAllTags,
  type WorkflowTemplate
} from '@/lib/n8n/workflowTemplates';

// Re-export for convenience
export type { WorkflowTemplate };

// =====================================================
// TEMPLATE LOADING
// =====================================================

/**
 * Load raw template JSON from file
 */
export async function loadTemplateJson(templateId: string): Promise<any> {
  try {
    const template = getTemplateById(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Load from the template loader (which has static imports)
    const { loadWorkflowTemplate } = await import('@/lib/n8n/templateLoader');
    const templateJson = await loadWorkflowTemplate(templateId);

    return templateJson;
  } catch (error) {
    console.error(`Failed to load template ${templateId}:`, error);
    throw new Error(`Could not load template: ${templateId}`);
  }
}

/**
 * Sanitize template JSON - remove personal data, credentials, etc.
 */
function sanitizeTemplateJson(templateJson: any): any {
  const sanitized = JSON.parse(JSON.stringify(templateJson)); // Deep clone

  // Remove sensitive fields
  if (sanitized.nodes) {
    sanitized.nodes.forEach((node: any) => {
      // Remove credential IDs
      if (node.credentials) {
        delete node.credentials;
      }

      // Reset webhook paths to generic
      if (node.type === 'n8n-nodes-base.webhook' && node.parameters?.path) {
        node.parameters.path = 'webhook';
      }

      // Remove instance-specific IDs
      if (node.parameters?.instanceId) {
        delete node.parameters.instanceId;
      }
    });
  }

  // Remove instance metadata
  if (sanitized.id) {
    delete sanitized.id;
  }

  // Set to inactive by default
  sanitized.active = false;

  return sanitized;
}

// =====================================================
// TEMPLATE DISCOVERY
// =====================================================

/**
 * Get all available templates
 */
export function getAllTemplates(): WorkflowTemplate[] {
  return N8N_WORKFLOW_TEMPLATES;
}

/**
 * Get templates by category
 */
export function getTemplatesInCategory(category: string): WorkflowTemplate[] {
  return getTemplatesByCategory(category);
}

/**
 * Search templates by query
 */
export function searchTemplatesByQuery(query: string): WorkflowTemplate[] {
  return searchTemplates(query);
}

/**
 * Get template by ID
 */
export function getTemplate(id: string): WorkflowTemplate | undefined {
  return getTemplateById(id);
}

/**
 * Get templates by tag
 */
export function getTemplatesWithTag(tag: string): WorkflowTemplate[] {
  return getTemplatesByTag(tag);
}

/**
 * Get templates by complexity level
 */
export function getTemplatesAtComplexity(complexity: 'beginner' | 'intermediate' | 'advanced'): WorkflowTemplate[] {
  return getTemplatesByComplexity(complexity);
}

/**
 * Get all categories
 */
export function getCategories(): string[] {
  return getAllCategories();
}

/**
 * Get all tags
 */
export function getTags(): string[] {
  return getAllTags();
}

// =====================================================
// TEMPLATE RECOMMENDATION
// =====================================================

export interface TemplateRecommendation {
  template: WorkflowTemplate;
  score: number;
  matchReasons: string[];
}

/**
 * Recommend templates based on user prompt
 * Uses keyword matching, integration detection, and semantic similarity
 */
export function recommendTemplates(userPrompt: string, limit: number = 3): TemplateRecommendation[] {
  const prompt = userPrompt.toLowerCase();
  const recommendations: TemplateRecommendation[] = [];

  N8N_WORKFLOW_TEMPLATES.forEach(template => {
    let score = 0;
    const matchReasons: string[] = [];

    // 1. Check for integration matches (highest weight)
    template.requiredIntegrations.forEach(integration => {
      const integrationLower = integration.toLowerCase();
      if (prompt.includes(integrationLower)) {
        score += 20;
        matchReasons.push(`Uses ${integration}`);
      }
    });

    // 2. Check tag matches
    template.tags.forEach(tag => {
      const tagLower = tag.toLowerCase();
      if (prompt.includes(tagLower)) {
        score += 10;
        matchReasons.push(`Matches "${tag}"`);
      }
    });

    // 3. Check use case matches
    template.useCases.forEach(useCase => {
      const useCaseLower = useCase.toLowerCase();
      const commonWords = extractCommonWords(prompt, useCaseLower);
      if (commonWords.length >= 2) {
        score += 8;
        matchReasons.push(`Similar use case: ${useCase}`);
      }
    });

    // 4. Check name and description matches
    const nameWords = template.name.toLowerCase().split(' ');
    const descWords = template.description.toLowerCase().split(' ');
    const promptWords = prompt.split(' ');

    nameWords.forEach(word => {
      if (word.length > 3 && promptWords.includes(word)) {
        score += 5;
      }
    });

    descWords.forEach(word => {
      if (word.length > 4 && promptWords.includes(word)) {
        score += 3;
      }
    });

    // 5. Category relevance (basic keyword matching)
    if (prompt.includes('chat') || prompt.includes('bot')) {
      if (template.category === 'AI & Chatbots') score += 15;
    }
    if (prompt.includes('email') || prompt.includes('marketing')) {
      if (template.category === 'Marketing Automation') score += 15;
    }
    if (prompt.includes('document') || prompt.includes('pdf') || prompt.includes('file')) {
      if (template.category === 'Document Processing') score += 15;
    }
    if (prompt.includes('crm') || prompt.includes('lead') || prompt.includes('sales')) {
      if (template.category === 'CRM & Sales') score += 15;
    }
    if (prompt.includes('calendar') || prompt.includes('schedule') || prompt.includes('productivity')) {
      if (template.category === 'Productivity') score += 15;
    }

    // Only include if score > 0
    if (score > 0) {
      recommendations.push({
        template,
        score,
        matchReasons: matchReasons.slice(0, 3) // Limit to top 3 reasons
      });
    }
  });

  // Sort by score (descending) and return top N
  return recommendations
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Extract common words between two strings (excluding common stop words)
 */
function extractCommonWords(str1: string, str2: string): string[] {
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'from', 'by']);

  const words1 = str1.split(' ').filter(w => w.length > 3 && !stopWords.has(w));
  const words2 = str2.split(' ').filter(w => w.length > 3 && !stopWords.has(w));

  return words1.filter(w => words2.includes(w));
}

// =====================================================
// TEMPLATE STATISTICS
// =====================================================

/**
 * Get template library statistics
 */
export function getTemplateStats() {
  const templates = getAllTemplates();
  const categories = getCategories();

  return {
    total: templates.length,
    categories: categories.length,
    byCategory: categories.map(cat => ({
      category: cat,
      count: getTemplatesByCategory(cat).length
    })),
    byComplexity: {
      beginner: getTemplatesByComplexity('beginner').length,
      intermediate: getTemplatesByComplexity('intermediate').length,
      advanced: getTemplatesByComplexity('advanced').length
    },
    averageNodes: Math.round(
      templates.reduce((sum, t) => sum + t.estimatedNodes, 0) / templates.length
    ),
    topIntegrations: getTopIntegrations(templates, 10)
  };
}

/**
 * Get most popular integrations across templates
 */
function getTopIntegrations(templates: WorkflowTemplate[], limit: number = 10) {
  const integrationCounts = new Map<string, number>();

  templates.forEach(template => {
    template.requiredIntegrations.forEach(integration => {
      integrationCounts.set(
        integration,
        (integrationCounts.get(integration) || 0) + 1
      );
    });
  });

  return Array.from(integrationCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([integration, count]) => ({ integration, count }));
}

// =====================================================
// TEMPLATE PREVIEW
// =====================================================

/**
 * Generate a preview/summary of a template
 */
export interface TemplatePreview {
  id: string;
  name: string;
  description: string;
  category: string;
  complexity: string;
  nodeCount: number;
  integrations: string[];
  useCases: string[];
  tags: string[];
}

/**
 * Get template preview without loading full JSON
 */
export function getTemplatePreview(templateId: string): TemplatePreview | null {
  const template = getTemplateById(templateId);
  if (!template) return null;

  return {
    id: template.id,
    name: template.name,
    description: template.description,
    category: template.category,
    complexity: template.complexity,
    nodeCount: template.estimatedNodes,
    integrations: template.requiredIntegrations,
    useCases: template.useCases,
    tags: template.tags
  };
}

/**
 * Check if template matches user's required integrations
 */
export function templateMatchesIntegrations(
  templateId: string,
  requiredIntegrations: string[]
): boolean {
  const template = getTemplateById(templateId);
  if (!template) return false;

  return requiredIntegrations.every(required =>
    template.requiredIntegrations.some(integration =>
      integration.toLowerCase().includes(required.toLowerCase())
    )
  );
}
