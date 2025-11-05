/**
 * AI Service - Secure Edge Function Integration
 *
 * This is the BRAIN of StreamSuite - handles all AI-powered workflow generation
 * using Supabase Edge Functions (Claude API calls happen server-side for security).
 */

import { supabase } from '@/integrations/supabase/client';
import { getTemplateById, searchTemplates, type WorkflowTemplate } from '@/lib/n8n/workflowTemplates';

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

    // Get authentication token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Please log in to generate workflows');
    }

    // Call Supabase Edge Function (secure server-side)
    const { data, error } = await supabase.functions.invoke('generate-workflow', {
      body: {
        prompt: request.prompt,
        platform: request.platform,
        useTemplateId: request.useTemplateId,
      },
    });

    if (error) {
      console.error('Edge Function error:', error);
      throw new Error(error.message || 'Failed to generate workflow');
    }

    if (!data || !data.workflow) {
      throw new Error('Invalid response from workflow generation service');
    }

    // Validate the returned workflow
    validateWorkflow(data.workflow, request.platform);

    return {
      workflow: data.workflow,
      templateUsed: data.templateUsed,
      creditsUsed: data.creditsUsed || 1,
      tokensUsed: data.tokensUsed || { input: 0, output: 0, total: 0 }
    };
  } catch (error) {
    console.error('Workflow generation error:', error);
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
 * Parse workflow response from Claude (legacy - unused, kept for backward compatibility)
 */
function parseWorkflowResponse(response: any): any {
  // Extract text content
  const textContent = response.content.find((c: any) => c.type === 'text');
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
 * Generate batch of interconnected workflows (planning + generation done server-side)
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

    // Get authentication token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Please log in to generate batch workflows');
    }

    // Call Supabase Edge Function (secure server-side)
    const { data, error } = await supabase.functions.invoke('batch-generate', {
      body: {
        prompt: request.prompt,
        platform: 'n8n',
        workflowCount: maxWorkflows,
      },
    });

    if (error) {
      console.error('Edge Function error:', error);
      throw new Error(error.message || 'Failed to generate batch workflows');
    }

    if (!data || !data.workflows) {
      throw new Error('Invalid response from batch workflow generation service');
    }

    // Process each workflow from the Edge Function response
    const processedWorkflows: BatchWorkflowItem[] = data.workflows.map((item: any, index: number) => {
      // Validate workflow structure
      validateWorkflow(item.json, 'n8n');

      return {
        name: item.name || `Workflow ${index + 1}`,
        description: item.description || 'No description',
        workflow: item.json,
        workflowType: item.json.meta?.workflowType,
        dependsOn: item.json.meta?.dependsOn || [],
        nodeCount: item.nodeCount || item.json.nodes?.length || 0
      };
    });

    // Use tokens and credits from Edge Function response
    const tokensUsed = data.tokensUsed || {
      input: 0,
      output: 0,
      total: 0
    };

    const creditsUsed = data.creditsUsed || maxWorkflows;

    console.log('✅ Batch workflows generated!', {
      count: processedWorkflows.length,
      tokens: tokensUsed.total,
      credits: creditsUsed
    });

    return {
      workflows: processedWorkflows,
      plan: {
        systemOverview: request.prompt,
        workflowCount: processedWorkflows.length,
        workflows: processedWorkflows.map((w, i) => ({
          name: w.name,
          type: w.workflowType || 'workflow',
          purpose: w.description,
          dependencies: w.dependsOn
        }))
      },
      creditsUsed,
      tokensUsed
    };

  } catch (error) {
    console.error('Batch workflow generation error:', error);
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

/**
 * Generate custom code for n8n Code nodes, Make.com modules, or Zapier Code steps
 */
export async function generateCustomCode(
  request: GenerateCodeRequest
): Promise<GenerateCodeResponse> {
  try {
    // Get authentication token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Please log in to generate code');
    }

    // Call Supabase Edge Function (secure server-side)
    const { data, error } = await supabase.functions.invoke('generate-code', {
      body: {
        prompt: request.prompt,
        platform: request.platform,
        language: request.language,
      },
    });

    // Check if backend blocked the request (validation failure)
    if (data?.blocked) {
      console.warn('[generateCustomCode] Backend blocked request:', {
        category: data.category,
        threatLevel: data.threatLevel,
        error: data.error
      });

      // Log to audit_logs if this was a security threat
      if (data.threatLevel && ['critical', 'high'].includes(data.threatLevel)) {
        try {
          await supabase.from('audit_logs').insert({
            user_id: session.user.id,
            event_type: 'code_generation',
            event_subtype: 'blocked_by_backend',
            severity: data.threatLevel,
            description: data.error || 'Code generation blocked by backend validation',
            metadata: {
              platform: request.platform,
              language: request.language,
              category: data.category,
              threat_level: data.threatLevel,
              prompt_preview: request.prompt.substring(0, 100)
            }
          });
        } catch (logError) {
          console.error('[generateCustomCode] Failed to log blocked request:', logError);
        }
      }

      // Throw user-friendly error
      throw new Error(data.error || 'Request blocked by security validation');
    }

    if (error) {
      console.error('Edge Function error:', error);
      throw new Error(error.message || 'Failed to generate code');
    }

    if (!data || !data.code) {
      throw new Error('Invalid response from code generation service');
    }

    return {
      code: data.code,
      explanation: data.explanation,
      tokensUsed: data.tokensUsed || 0
    };
  } catch (error) {
    console.error('Generate code error:', error);
    throw error instanceof Error ? error : new Error('Failed to generate code');
  }
}

// =====================================================
// WORKFLOW DEBUGGING
// =====================================================

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

    // Get authentication token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Please log in to debug workflows');
    }

    // Call Supabase Edge Function (secure server-side)
    const { data, error } = await supabase.functions.invoke('debug-workflow', {
      body: {
        workflowJson: originalWorkflow,
        errorDescription: request.errorMessage,
        platform: 'n8n',
      },
    });

    if (error) {
      console.error('Edge Function error:', error);
      throw new Error(error.message || 'Failed to debug workflow');
    }

    if (!data || !data.fixedWorkflow) {
      throw new Error('Invalid response from workflow debugging service');
    }

    // Validate fixed workflow
    validateWorkflow(data.fixedWorkflow, 'n8n');

    // Extract fixes
    const fixesApplied = data.issues || ['AI analysis and fixes applied'];

    console.log('✅ Workflow debugging complete!', {
      issues: issues.length,
      fixes: fixesApplied.length,
      credits: data.creditsUsed
    });

    return {
      originalWorkflow,
      fixedWorkflow: data.fixedWorkflow,
      issuesFound: issues,
      fixesApplied,
      creditsUsed: data.creditsUsed || 1,
      tokensUsed: data.tokensUsed || { input: 0, output: 0, total: 0 }
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
