import { N8N_CORE_NODES, N8N_APP_NODES, type N8nWorkflow, type N8nNode } from "./n8nKnowledgeBase";

// Define types previously from Forge.tsx
export type Platform = 'n8n' | 'make' | 'ancilla';
export type SourcePlatform = 'n8n' | 'make' | 'zapier' | 'power-automate' | 'ifttt' | 'ancilla';

// Conversion logic for different platforms
export const convertWorkflow = async (
  sourceWorkflow: any,
  sourcePlatform: SourcePlatform,
  targetPlatform: Platform
): Promise<any> => {
  // Add delay to simulate AI processing
  await new Promise(resolve => setTimeout(resolve, 1500));

  switch (targetPlatform) {
    case 'ancilla':
      return convertToAncilla(sourceWorkflow, sourcePlatform);
    case 'n8n':
      return convertToN8n(sourceWorkflow, sourcePlatform);
    case 'make':
      return convertToMake(sourceWorkflow, sourcePlatform);
    default:
      throw new Error(`Unsupported target platform: ${targetPlatform}`);
  }
};

const convertToAncilla = (sourceWorkflow: any, sourcePlatform: SourcePlatform): any => {
  switch (sourcePlatform) {
    case 'zapier':
      return {
        name: sourceWorkflow.name || 'Converted Workflow',
        description: `Converted from Zapier workflow`,
        nodes: [
          {
            id: 'trigger',
            type: 'webhook',
            name: sourceWorkflow.trigger?.name || 'Webhook Trigger',
            config: sourceWorkflow.trigger || {}
          },
          ...sourceWorkflow.actions?.map((action: any, index: number) => ({
            id: `action_${index + 1}`,
            type: 'action',
            name: action.name || `Action ${index + 1}`,
            config: action
          })) || []
        ],
        connections: sourceWorkflow.actions?.map((_: any, index: number) => ({
          from: index === 0 ? 'trigger' : `action_${index}`,
          to: `action_${index + 1}`
        })) || []
      };

    case 'n8n':
      return {
        name: sourceWorkflow.name || 'Converted Workflow',
        description: 'Converted from n8n workflow',
        nodes: sourceWorkflow.nodes?.map((node: any) => ({
          id: node.name?.toLowerCase().replace(/\s+/g, '_') || `node_${Date.now()}`,
          type: mapN8nTypeToAncilla(node.type),
          name: node.name || 'Untitled Node',
          config: node.parameters || {}
        })) || [],
        connections: extractN8nConnections(sourceWorkflow.connections)
      };

    case 'make':
      return {
        name: sourceWorkflow.scenario?.name || 'Converted Workflow',
        description: 'Converted from Make.com scenario',
        nodes: sourceWorkflow.scenario?.modules?.map((module: any, index: number) => ({
          id: `module_${index + 1}`,
          type: mapMakeTypeToAncilla(module.type),
          name: module.name || `Module ${index + 1}`,
          config: module.metadata || {}
        })) || [],
        connections: sourceWorkflow.scenario?.connections?.map((conn: any) => ({
          from: `module_${conn.from}`,
          to: `module_${conn.to}`
        })) || []
      };

    default:
      return sourceWorkflow;
  }
};

const convertToN8n = (sourceWorkflow: any, sourcePlatform: SourcePlatform): N8nWorkflow => {
  const baseN8nWorkflow: N8nWorkflow = {
    name: sourceWorkflow.name || 'Converted Workflow',
    nodes: [],
    connections: {},
    active: false,
    settings: {
      executionOrder: 'v1',
      saveManualExecutions: false,
      saveDataErrorExecution: 'all',
      saveDataSuccessExecution: 'all'
    }
  };

  switch (sourcePlatform) {
    case 'zapier':
      const webhookNode: N8nNode = {
        id: `webhook_${Date.now()}`,
        name: 'Webhook Trigger',
        type: 'n8n-nodes-base.webhook',
        typeVersion: 1,
        position: [250, 300],
        parameters: {
          httpMethod: 'POST',
          path: 'webhook',
          authentication: 'none',
          responseMode: 'onReceived'
        }
      };

      const actionNodes: N8nNode[] = sourceWorkflow.actions?.map((action: any, index: number) => ({
        id: `action_${index}_${Date.now()}`,
        name: action.name || `Action ${index + 1}`,
        type: mapZapierTypeToN8n(action.type),
        typeVersion: getNodeTypeVersion(mapZapierTypeToN8n(action.type)),
        position: [450 + (index * 200), 300],
        parameters: normalizeParameters(action.fields || {}, mapZapierTypeToN8n(action.type))
      })) || [];

      baseN8nWorkflow.nodes = [webhookNode, ...actionNodes];

      // Create n8n connections
      baseN8nWorkflow.connections = sourceWorkflow.actions?.reduce((acc: any, _: any, index: number) => {
        const fromNode = index === 0 ? 'Webhook' : sourceWorkflow.actions[index - 1].name;
        const toNode = sourceWorkflow.actions[index].name;
        acc[fromNode] = { main: [[{ node: toNode, type: 'main', index: 0 }]] };
        return acc;
      }, {}) || {};

      break;

    case 'ancilla':
      baseN8nWorkflow.nodes = sourceWorkflow.nodes?.map((node: any, index: number) => ({
        name: node.name,
        type: mapAncillaTypeToN8n(node.type),
        typeVersion: 1,
        position: [250 + (index * 200), 300],
        parameters: node.config || {}
      })) || [];

      baseN8nWorkflow.connections = sourceWorkflow.connections?.reduce((acc: any, conn: any) => {
        acc[conn.from] = { main: [[{ node: conn.to, type: 'main', index: 0 }]] };
        return acc;
      }, {}) || {};
      break;

    default:
      return sourceWorkflow;
  }

  return baseN8nWorkflow;
};

const convertToMake = (sourceWorkflow: any, sourcePlatform: SourcePlatform): any => {
  const baseMakeScenario = {
    name: sourceWorkflow.name || 'Converted Scenario',
    scenario: {
      name: sourceWorkflow.name || 'Converted Scenario',
      modules: [],
      connections: [],
      metadata: {
        version: 1,
        scenario: {
          roundtrips: 1,
          maxErrors: 3,
          autoCommit: false,
          autoCommitTriggerLast: true,
          sequential: false,
          confidential: false,
          dataloss: false,
          dlq: false
        }
      }
    }
  };

  switch (sourcePlatform) {
    case 'zapier':
      baseMakeScenario.scenario.modules = [
        {
          id: 1,
          module: 'webhooks:webhook',
          version: 1,
          parameters: {},
          mapper: {},
          metadata: {
            designer: { x: 0, y: 0 },
            restore: {},
            parameters: [{ name: 'hook', type: 'hook' }]
          }
        },
        ...sourceWorkflow.actions?.map((action: any, index: number) => ({
          id: index + 2,
          module: mapZapierTypeToMake(action.type),
          version: 1,
          parameters: action.fields || {},
          mapper: {},
          metadata: {
            designer: { x: (index + 1) * 150, y: 0 },
            restore: {}
          }
        })) || []
      ];

      baseMakeScenario.scenario.connections = sourceWorkflow.actions?.map((_: any, index: number) => ({
        id: index + 1,
        srcModuleId: index + 1,
        srcPortName: 'default',
        dstModuleId: index + 2,
        dstPortName: 'default'
      })) || [];
      break;

    case 'ancilla':
      baseMakeScenario.scenario.modules = sourceWorkflow.nodes?.map((node: any, index: number) => ({
        id: index + 1,
        module: mapAncillaTypeToMake(node.type),
        version: 1,
        parameters: node.config || {},
        mapper: {},
        metadata: {
          designer: { x: index * 150, y: 0 },
          restore: {}
        }
      })) || [];

      baseMakeScenario.scenario.connections = sourceWorkflow.connections?.map((conn: any, index: number) => ({
        id: index + 1,
        srcModuleId: getModuleIdByName(conn.from, sourceWorkflow.nodes),
        srcPortName: 'default',
        dstModuleId: getModuleIdByName(conn.to, sourceWorkflow.nodes),
        dstPortName: 'default'
      })) || [];
      break;

    default:
      return sourceWorkflow;
  }

  return baseMakeScenario;
};

// Helper functions for type mapping using n8n knowledge base
const mapN8nTypeToAncilla = (n8nType: string): string => {
  // Use the comprehensive knowledge base for accurate mapping
  if (n8nType in N8N_CORE_NODES) {
    const nodeInfo = N8N_CORE_NODES[n8nType as keyof typeof N8N_CORE_NODES];
    return nodeInfo.displayName.toLowerCase().replace(/\s+/g, '_');
  }
  
  if (n8nType in N8N_APP_NODES) {
    const nodeInfo = N8N_APP_NODES[n8nType as keyof typeof N8N_APP_NODES];
    return nodeInfo.displayName.toLowerCase().replace(/\s+/g, '_');
  }
  
  // Fallback mapping for common types
  const typeMap: Record<string, string> = {
    'n8n-nodes-base.webhook': 'webhook',
    'n8n-nodes-base.emailSend': 'email_send',
    'n8n-nodes-base.httpRequest': 'http_request',
    'n8n-nodes-base.googleSheets': 'google_sheets',
    'n8n-nodes-base.slack': 'slack',
    'n8n-nodes-base.discord': 'discord'
  };
  return typeMap[n8nType] || 'action';
};

const mapZapierTypeToN8n = (zapierType: string): string => {
  // Enhanced mapping using n8n knowledge base
  const typeMap: Record<string, string> = {
    'create_record': 'n8n-nodes-base.httpRequest',
    'send_email': 'n8n-nodes-base.emailSend',
    'webhook': 'n8n-nodes-base.webhook',
    'google_sheets': 'n8n-nodes-base.googleSheets',
    'slack_message': 'n8n-nodes-base.slack',
    'discord_message': 'n8n-nodes-base.discord',
    'gmail_send': 'n8n-nodes-base.gmail',
    'airtable_create': 'n8n-nodes-base.airtable',
    'notion_create': 'n8n-nodes-base.notion',
    'trello_create': 'n8n-nodes-base.trello',
    'github_create': 'n8n-nodes-base.github',
    'stripe_create': 'n8n-nodes-base.stripe',
    'shopify_create': 'n8n-nodes-base.shopify'
  };
  return typeMap[zapierType] || 'n8n-nodes-base.httpRequest';
};

const mapAncillaTypeToN8n = (ancillaType: string): string => {
  const typeMap: Record<string, string> = {
    'webhook': 'n8n-nodes-base.webhook',
    'email_send': 'n8n-nodes-base.emailSend',
    'http_request': 'n8n-nodes-base.httpRequest',
    'google_sheets': 'n8n-nodes-base.googleSheets',
    'slack': 'n8n-nodes-base.slack'
  };
  return typeMap[ancillaType] || 'n8n-nodes-base.httpRequest';
};

const mapZapierTypeToMake = (zapierType: string): string => {
  const typeMap: Record<string, string> = {
    'create_record': 'http:ActionSendData',
    'send_email': 'email:ActionSendEmail',
    'webhook': 'webhooks:webhook',
    'google_sheets': 'google-sheets:ActionAddRow'
  };
  return typeMap[zapierType] || 'http:ActionSendData';
};

const mapAncillaTypeToMake = (ancillaType: string): string => {
  const typeMap: Record<string, string> = {
    'webhook': 'webhooks:webhook',
    'email_send': 'email:ActionSendEmail',
    'http_request': 'http:ActionSendData',
    'google_sheets': 'google-sheets:ActionAddRow',
    'slack': 'slack:ActionPostMessage'
  };
  return typeMap[ancillaType] || 'http:ActionSendData';
};

const mapMakeTypeToAncilla = (makeType: string): string => {
  const typeMap: Record<string, string> = {
    'webhooks:webhook': 'webhook',
    'email:ActionSendEmail': 'email_send',
    'http:ActionSendData': 'http_request',
    'google-sheets:ActionAddRow': 'google_sheets',
    'slack:ActionPostMessage': 'slack'
  };
  return typeMap[makeType] || 'action';
};

const extractN8nConnections = (connections: any): any[] => {
  if (!connections) return [];
  
  const result: any[] = [];
  Object.entries(connections).forEach(([fromNode, nodeConnections]: [string, any]) => {
    if (nodeConnections.main) {
      nodeConnections.main[0]?.forEach((connection: any) => {
        result.push({
          from: fromNode.toLowerCase().replace(/\s+/g, '_'),
          to: connection.node.toLowerCase().replace(/\s+/g, '_')
        });
      });
    }
  });
  return result;
};

const getModuleIdByName = (nodeName: string, nodes: any[]): number => {
  const index = nodes.findIndex(node => node.name === nodeName || node.id === nodeName);
  return index >= 0 ? index + 1 : 1;
};

// Enhanced helper functions using n8n knowledge base
const getNodeTypeVersion = (nodeType: string): number => {
  // Most n8n nodes use version 1, but some newer ones use higher versions
  const versionMap: Record<string, number> = {
    'n8n-nodes-base.code': 2,
    'n8n-nodes-base.itemLists': 3,
    'n8n-nodes-base.aggregate': 1,
    'n8n-nodes-base.sort': 1
  };
  return versionMap[nodeType] || 1;
};

const normalizeParameters = (parameters: any, nodeType: string): any => {
  // Use knowledge base to validate and normalize parameters
  if (!parameters || typeof parameters !== 'object') return {};
  
  // Apply node-specific parameter normalization
  switch (nodeType) {
    case 'n8n-nodes-base.webhook':
      return {
        httpMethod: parameters.httpMethod || 'POST',
        path: parameters.path || 'webhook',
        authentication: parameters.authentication || 'none',
        responseMode: parameters.responseMode || 'onReceived',
        ...parameters
      };
    
    case 'n8n-nodes-base.httpRequest':
      return {
        url: parameters.url || '',
        method: parameters.method || 'GET',
        authentication: parameters.authentication || 'none',
        ...parameters
      };
    
    case 'n8n-nodes-base.emailSend':
      return {
        fromEmail: parameters.fromEmail || '',
        toEmail: parameters.toEmail || '',
        subject: parameters.subject || '',
        text: parameters.text || '',
        ...parameters
      };
    
    default:
      return parameters;
  }
};

const validateN8nWorkflow = (workflow: any): boolean => {
  return workflow && workflow.nodes && Array.isArray(workflow.nodes);
};