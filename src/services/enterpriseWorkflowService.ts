/**
 * Enterprise Workflow Builder Service
 *
 * Multi-agent orchestration system for generating complex workflows (20-100+ nodes)
 * Uses Claude Sonnet 4.5 with specialized agents for different phases
 */

import Anthropic from '@anthropic-ai/sdk';
import { selectRelevantExamples, type WorkflowExample } from './exampleSelectionService';
import { N8N_KNOWLEDGE_BASE, TEMPLATE_SELECTION_GUIDE } from '@/lib/n8nKnowledgeBase';
import { repairJSON, type RepairResult } from '@/utils/jsonRepair';

const anthropic = new Anthropic({
  apiKey: import.meta.env.VITE_CLAUDE_API_KEY,
  dangerouslyAllowBrowser: true
});

export interface EnterpriseWorkflowRequest {
  description: string;
  workflowType?: 'multi_department' | 'customer_journey' | 'data_pipeline' | 'complex_integration';
  departments?: string[];
  integrations?: string[];
  estimatedNodes?: number;
}

export interface WorkflowModule {
  name: string;
  description: string;
  estimatedNodes: number;
  integrations: string[];
  workflow: any;
}

export interface EnterpriseWorkflowResult {
  blueprint: {
    title: string;
    description: string;
    modules: Array<{
      name: string;
      description: string;
      estimatedNodes: number;
    }>;
    dataFlow: string;
    estimatedTotalNodes: number;
  };
  modules: WorkflowModule[];
  finalWorkflow: any;
  setupInstructions: string;
  creditsUsed: number;
}

export type ProgressCallback = (stage: string, message: string, progress: number) => void;

/**
 * Agent 1: Workflow Architect
 * Analyzes requirements and creates modular blueprint
 */
async function workflowArchitect(
  request: EnterpriseWorkflowRequest,
  examples: WorkflowExample[],
  onProgress: ProgressCallback
): Promise<any> {
  onProgress('architect', 'Analyzing requirements and creating workflow blueprint...', 10);

  const examplesContext = examples.map(ex => `
### ${ex.name} (${ex.complexity} - ${ex.nodeCount} nodes)
**Category**: ${ex.category}
**Description**: ${ex.description}
**Keywords**: ${ex.keywords.join(', ')}

**Structure Reference**:
\`\`\`json
${JSON.stringify(ex.content, null, 2).substring(0, 2000)}...
\`\`\`
`).join('\n\n');

  const systemPrompt = `You are an expert n8n workflow architect specializing in complex, multi-module automation systems.

# Your Task
Analyze the user's requirements and break down their complex workflow into logical, manageable modules.

# n8n Knowledge Base
${N8N_KNOWLEDGE_BASE}

${TEMPLATE_SELECTION_GUIDE}

# Reference Workflows
Study these production examples to understand complex workflow patterns:

${examplesContext}

# Instructions
1. Break down the workflow into 3-7 logical modules (each 10-30 nodes)
2. Define clear data flow between modules
3. Identify all required integrations
4. Estimate node count for each module
5. Design error handling strategy
6. Plan connection points between modules

Return a JSON blueprint in this exact format:
\`\`\`json
{
  "title": "Workflow Title",
  "description": "Brief overview",
  "modules": [
    {
      "name": "Module Name",
      "description": "What this module does",
      "estimatedNodes": 15,
      "integrations": ["hubspot", "slack"],
      "dependencies": ["previous_module_name"]
    }
  ],
  "dataFlow": "Detailed explanation of how data flows between modules",
  "errorHandling": "Error handling strategy",
  "estimatedTotalNodes": 50
}
\`\`\``;

  const userPrompt = `# Workflow Requirements

**Description**: ${request.description}

${request.workflowType ? `**Type**: ${request.workflowType}` : ''}
${request.departments && request.departments.length > 0 ? `**Departments**: ${request.departments.join(', ')}` : ''}
${request.integrations && request.integrations.length > 0 ? `**Integrations**: ${request.integrations.join(', ')}` : ''}

Create a detailed architectural blueprint for this complex workflow.`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userPrompt
      }
    ]
  });

  const response = message.content[0].type === 'text' ? message.content[0].text : '';

  // Extract JSON from response with multiple fallback patterns
  let jsonText: string | null = null;

  // Try pattern 1: ```json ... ```
  let jsonMatch = response.match(/```json\n([\s\S]+?)\n```/);
  if (jsonMatch) {
    jsonText = jsonMatch[1];
  }

  // Try pattern 2: ``` ... ``` (without json marker)
  if (!jsonText) {
    jsonMatch = response.match(/```\n?([\s\S]+?)\n?```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }
  }

  // Try pattern 3: Look for JSON object directly
  if (!jsonText) {
    jsonMatch = response.match(/(\{[\s\S]*"title"[\s\S]*"modules"[\s\S]*\})/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }
  }

  if (!jsonText) {
    console.error('Architect response:', response.substring(0, 500));
    throw new Error('Failed to extract blueprint JSON from architect response');
  }

  // Use comprehensive JSON repair
  const repairResult: RepairResult = repairJSON(jsonText);

  if (!repairResult.success) {
    console.error('Failed to parse blueprint JSON:', jsonText.substring(0, 500));
    throw new Error(`Failed to parse blueprint JSON: ${repairResult.error || 'Unknown error'}`);
  }

  if (repairResult.repairApplied) {
    console.log(`Successfully repaired blueprint JSON using strategy: ${repairResult.repairApplied}`);
  }

  return repairResult.data;
}

/**
 * Agent 2: Module Generator
 * Generates individual workflow modules based on blueprint
 */
async function generateModule(
  moduleName: string,
  moduleSpec: any,
  blueprint: any,
  examples: WorkflowExample[],
  onProgress: ProgressCallback
): Promise<any> {
  onProgress('module', `Generating ${moduleName} module...`, 0);

  // Select most relevant example for this specific module
  const moduleKeywords = [...moduleSpec.integrations, moduleName.toLowerCase()].join(' ');
  const relevantExamples = selectRelevantExamples(moduleKeywords, 2);

  const examplesContext = relevantExamples.map(ex => `
### ${ex.name}
\`\`\`json
${JSON.stringify(ex.content, null, 2)}
\`\`\`
`).join('\n\n');

  const systemPrompt = `You are an expert n8n workflow builder specializing in production-ready automation modules.

# n8n Knowledge Base
${N8N_KNOWLEDGE_BASE}

# Reference Examples
${examplesContext}

# Instructions
Generate a complete n8n workflow module with:
1. All required nodes configured properly
2. Proper connections between nodes
3. Error handling nodes
4. Data transformation nodes
5. Integration nodes with placeholder credentials

Return ONLY valid n8n JSON in this format:
\`\`\`json
{
  "name": "Module Name",
  "nodes": [...],
  "connections": {...},
  "settings": {...}
}
\`\`\``;

  const userPrompt = `# Module Specification

**Name**: ${moduleName}
**Description**: ${moduleSpec.description}
**Target Nodes**: ${moduleSpec.estimatedNodes}
**Integrations**: ${moduleSpec.integrations.join(', ')}
${moduleSpec.dependencies ? `**Depends On**: ${moduleSpec.dependencies.join(', ')}` : ''}

**Context from Blueprint**:
${blueprint.description}

**Data Flow**:
${blueprint.dataFlow}

Generate this module as a complete, working n8n workflow.`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userPrompt
      }
    ]
  });

  const response = message.content[0].type === 'text' ? message.content[0].text : '';

  // Extract JSON from response with multiple fallback patterns
  let jsonText: string | null = null;

  // Try pattern 1: ```json ... ```
  let jsonMatch = response.match(/```json\n([\s\S]+?)\n```/);
  if (jsonMatch) {
    jsonText = jsonMatch[1];
  }

  // Try pattern 2: ``` ... ``` (without json marker)
  if (!jsonText) {
    jsonMatch = response.match(/```\n?([\s\S]+?)\n?```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }
  }

  // Try pattern 3: Look for JSON object directly
  if (!jsonText) {
    jsonMatch = response.match(/(\{[\s\S]*"nodes"[\s\S]*"connections"[\s\S]*\})/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }
  }

  if (!jsonText) {
    console.error(`Module ${moduleName} response:`, response.substring(0, 500));
    throw new Error(`Failed to extract module JSON for ${moduleName}`);
  }

  // Use comprehensive JSON repair
  const repairResult: RepairResult = repairJSON(jsonText);

  if (!repairResult.success) {
    console.error(`Module ${moduleName} response:`, jsonText.substring(0, 500));
    throw new Error(
      `Failed to parse module JSON for ${moduleName}. ` +
      `${repairResult.error || 'Unknown error'}. ` +
      `JSON snippet: ${jsonText.substring(0, 200)}...`
    );
  }

  if (repairResult.repairApplied) {
    console.log(`Successfully repaired JSON for ${moduleName} using strategy: ${repairResult.repairApplied}`);
  }

  return repairResult.data;
}

/**
 * Agent 3: Integration Assembler
 * Combines all modules into single cohesive workflow
 */
async function assembleWorkflow(
  blueprint: any,
  modules: WorkflowModule[],
  onProgress: ProgressCallback
): Promise<any> {
  onProgress('assembly', 'Assembling modules into complete workflow...', 80);

  const systemPrompt = `You are an expert at integrating n8n workflow modules into cohesive systems.

# Your Task
Combine multiple workflow modules into a single, integrated n8n workflow.

# Instructions
1. Merge all nodes from all modules
2. Create connections between modules
3. Ensure proper data flow
4. Add error handling between module boundaries
5. Optimize node positioning for visual clarity
6. Validate all connections

# CRITICAL: Output Format
You MUST respond with ONLY valid n8n workflow JSON. No explanations, no markdown, just the JSON.
Structure: {"name": "...", "nodes": [...], "connections": {...}, "settings": {...}}

If the workflow is very large, prioritize including ALL nodes and connections over other fields.`;

  const userPrompt = `# Integration Task

**Blueprint**:
${JSON.stringify(blueprint, null, 2)}

**Modules to Integrate**:
${modules.map((m, i) => `
## Module ${i + 1}: ${m.name}
${JSON.stringify(m.workflow, null, 2)}
`).join('\n\n')}

Combine these modules into a single, working n8n workflow with proper inter-module connections.`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 32768, // Increased from 16384 to handle larger workflows
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userPrompt
      }
    ]
  });

  const response = message.content[0].type === 'text' ? message.content[0].text : '';

  // Check if response was truncated
  if (message.stop_reason === 'max_tokens') {
    console.warn('⚠️ Assembly response was truncated due to token limit');
  }

  // Extract JSON from response with multiple fallback patterns
  let jsonText: string | null = null;

  // Try pattern 1: ```json ... ```
  let jsonMatch = response.match(/```json\n([\s\S]+?)\n```/);
  if (jsonMatch) {
    jsonText = jsonMatch[1];
  }

  // Try pattern 2: ``` ... ``` (without json marker)
  if (!jsonText) {
    jsonMatch = response.match(/```\n?([\s\S]+?)\n?```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }
  }

  // Try pattern 3: Look for JSON object directly (greedy to capture incomplete JSON)
  if (!jsonText) {
    jsonMatch = response.match(/(\{[\s\S]*)/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
      // Remove any trailing markdown or text after the JSON
      const lastBrace = jsonText.lastIndexOf('}');
      if (lastBrace !== -1) {
        jsonText = jsonText.substring(0, lastBrace + 1);
      }
    }
  }

  if (!jsonText) {
    console.error('Assembly response:', response.substring(0, 500));
    throw new Error('Failed to extract assembled workflow JSON. AI response did not contain valid JSON.');
  }

  // Use comprehensive JSON repair
  const repairResult: RepairResult = repairJSON(jsonText);

  if (!repairResult.success) {
    console.error('Failed to parse assembled JSON:', jsonText.substring(0, 500));

    // If it's a truncation error, provide helpful context
    if (repairResult.error?.includes('truncated') || repairResult.error?.includes('token limits')) {
      throw new Error(
        `Workflow too large for assembly step. The AI hit token limits while combining ${modules.length} modules. ` +
        `Try: (1) Simplify your workflow goal, (2) Use fewer integrations, or (3) Break into separate workflows.`
      );
    }

    throw new Error(`Failed to parse assembled workflow JSON: ${repairResult.error || 'Unknown error'}`);
  }

  if (repairResult.repairApplied) {
    console.log(`Successfully repaired assembled workflow JSON using strategy: ${repairResult.repairApplied}`);
  }

  return repairResult.data;
}

/**
 * Main orchestration function
 * Coordinates all agents to generate complex workflow
 */
export async function generateEnterpriseWorkflow(
  request: EnterpriseWorkflowRequest,
  onProgress: ProgressCallback
): Promise<EnterpriseWorkflowResult> {
  try {
    onProgress('start', 'Starting Enterprise Workflow Builder...', 0);

    // Step 1: Select relevant examples
    const examples = selectRelevantExamples(request.description, 3);
    onProgress('examples', `Selected ${examples.length} reference examples`, 5);

    // Step 2: Create architectural blueprint
    const blueprint = await workflowArchitect(request, examples, onProgress);
    onProgress('blueprint', 'Blueprint created successfully', 20);

    // Step 3: Generate each module
    const modules: WorkflowModule[] = [];
    const totalModules = blueprint.modules.length;

    for (let i = 0; i < totalModules; i++) {
      const moduleSpec = blueprint.modules[i];
      const progress = 20 + ((i + 1) / totalModules) * 50;

      // Add delay between modules to respect rate limits (except for first module)
      if (i > 0) {
        onProgress('module', `Waiting to respect rate limits...`, progress - 5);
        await new Promise(resolve => setTimeout(resolve, 12000)); // 12 second delay
      }

      const moduleWorkflow = await generateModule(
        moduleSpec.name,
        moduleSpec,
        blueprint,
        examples,
        (stage, msg, p) => onProgress(stage, msg, progress)
      );

      modules.push({
        name: moduleSpec.name,
        description: moduleSpec.description,
        estimatedNodes: moduleSpec.estimatedNodes,
        integrations: moduleSpec.integrations,
        workflow: moduleWorkflow
      });

      onProgress('module', `Module ${i + 1}/${totalModules} complete`, progress);
    }

    // Step 4: Assemble final workflow
    const finalWorkflow = await assembleWorkflow(blueprint, modules, onProgress);
    onProgress('assembly', 'Workflow assembly complete', 90);

    // Step 5: Generate setup instructions
    const setupInstructions = generateSetupInstructions(blueprint, modules);
    onProgress('instructions', 'Setup instructions generated', 95);

    // Calculate credits (12-18 based on complexity)
    const creditsUsed = Math.min(18, Math.max(12, Math.ceil(blueprint.estimatedTotalNodes / 5)));

    onProgress('complete', 'Enterprise workflow generation complete!', 100);

    return {
      blueprint,
      modules,
      finalWorkflow,
      setupInstructions,
      creditsUsed
    };

  } catch (error) {
    console.error('Enterprise workflow generation error:', error);
    throw error;
  }
}

/**
 * Generate setup instructions
 */
function generateSetupInstructions(blueprint: any, modules: WorkflowModule[]): string {
  const integrations = new Set<string>();
  modules.forEach(m => m.integrations.forEach(i => integrations.add(i)));

  return `# Setup Instructions for ${blueprint.title}

## Overview
${blueprint.description}

## Required Integrations
${Array.from(integrations).map(i => `- ${i.charAt(0).toUpperCase() + i.slice(1)}`).join('\n')}

## Module Breakdown
${modules.map((m, i) => `
### ${i + 1}. ${m.name}
${m.description}
- **Estimated Nodes**: ${m.estimatedNodes}
- **Integrations**: ${m.integrations.join(', ')}
`).join('\n')}

## Setup Steps

1. **Configure Credentials**
   - Set up credentials for each integration in n8n
   - Test each connection before proceeding

2. **Import Workflow**
   - Copy the generated JSON
   - Import into n8n via "Import from JSON" option
   - Workflow will appear in your workflows list

3. **Configure Each Module**
${modules.map((m, i) => `   ${i + 1}. **${m.name}**: Review and customize parameters`).join('\n')}

4. **Test Data Flow**
   - Run workflow manually first
   - Verify data passes correctly between modules
   - Check error handling

5. **Activate**
   - Once tested, activate the workflow
   - Monitor execution for first few runs

## Estimated Total Nodes
${blueprint.estimatedTotalNodes} nodes

## Data Flow
${blueprint.dataFlow}

## Error Handling
${blueprint.errorHandling || 'Standard error handling configured between module boundaries'}

---
Generated by StreamSuite Enterprise Workflow Builder
`;
}
