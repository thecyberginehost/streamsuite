/**
 * Comprehensive n8n Knowledge Base - Main Index
 * Re-exports all n8n knowledge components for backward compatibility
 */

// Export core types and interfaces
export * from './n8n/types';

// Export node definitions  
export * from './n8n/nodes';

// Export expressions and patterns
export * from './n8n/expressions';

// Export workflow patterns
export * from './n8n/patterns';

// Export advanced features
export * from './n8n/advanced';

// Export infrastructure
export * from './n8n/infrastructure';

// Export additional knowledge base sections
export * from './n8n/apiIntegration';
export * from './n8n/databaseIntegration';
export * from './n8n/notificationPatterns';
export * from './n8n/testingQuality';

// Export workflow templates
export * from './n8n/workflowTemplates';
export * from './n8n/templateLoader';

// Export for Enterprise Workflow Builder
export const N8N_KNOWLEDGE_BASE = `# n8n Workflow Automation Knowledge Base

## Core Workflow Structure
n8n workflows are JSON-based structures that define automated processes through connected nodes.

### Essential Components:
- **Workflow Definition**: JSON structure with nodes and connections
- **Node Types**: Core nodes, app nodes, and custom integrations
- **Expressions**: Dynamic data access and manipulation
- **Error Handling**: Comprehensive error management patterns
- **Advanced Features**: AI integration, binary processing, security patterns

### Key Node Categories:
1. **Trigger Nodes**: Start workflows (Manual, Webhook, Schedule)
2. **Action Nodes**: Perform operations (HTTP Request, Database, APIs)
3. **Logic Nodes**: Control flow (IF, Switch, Merge, Filter)
4. **Data Nodes**: Transform data (Set, Function, Code, Aggregate)

### Expression System:
- Syntax: \`{{ expression }}\`
- Data Access: \`$json\`, \`$node["Name"]\`, \`$items\`
- Functions: String, Date, Math, Array operations
- Conditionals: Ternary operators, boolean logic

### Advanced Patterns:
- Sub-workflow composition for modularity
- Binary file processing and manipulation
- AI integration with LangChain nodes
- Security and credential management
- Performance monitoring and optimization

### Business Automation:
- Approval workflows with escalation
- Data validation and enrichment pipelines
- Multi-channel notification systems
- Complex scheduling and timing patterns
`;

export const TEMPLATE_SELECTION_GUIDE = `# Template Selection Guide

When generating workflows:
1. Check if a template exists for the use case first
2. If template exists: Recommend it + explain customizations needed
3. If no template: Generate from scratch using your knowledge

Use templates as structural references but adapt to user requirements.
`;

// Utility functions for building comprehensive knowledge base content
export const buildN8nKnowledgeBase = () => {
  return `# n8n Workflow Automation Knowledge Base

## Core Workflow Structure
n8n workflows are JSON-based structures that define automated processes through connected nodes.

### Essential Components:
- **Workflow Definition**: JSON structure with nodes and connections
- **Node Types**: Core nodes, app nodes, and custom integrations  
- **Expressions**: Dynamic data access and manipulation
- **Error Handling**: Comprehensive error management patterns
- **Advanced Features**: AI integration, binary processing, security patterns

### Key Node Categories:
1. **Trigger Nodes**: Start workflows (Manual, Webhook, Schedule)
2. **Action Nodes**: Perform operations (HTTP Request, Database, APIs)
3. **Logic Nodes**: Control flow (IF, Switch, Merge, Filter)
4. **Data Nodes**: Transform data (Set, Function, Code, Aggregate)

### Expression System:
- Syntax: \`{{ expression }}\`
- Data Access: \`$json\`, \`$node["Name"]\`, \`$items\`
- Functions: String, Date, Math, Array operations
- Conditionals: Ternary operators, boolean logic

### Advanced Patterns:
- Sub-workflow composition for modularity
- Binary file processing and manipulation  
- AI integration with LangChain nodes
- Security and credential management
- Performance monitoring and optimization

### Business Automation:
- Approval workflows with escalation
- Data validation and enrichment pipelines
- Multi-channel notification systems
- Complex scheduling and timing patterns

This knowledge base covers comprehensive n8n workflow patterns for building robust, scalable automation solutions.
`;
};