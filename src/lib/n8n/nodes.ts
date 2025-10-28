/**
 * Comprehensive n8n Node Definitions
 */

export const N8N_CORE_NODES = {
  // Trigger Nodes
  'n8n-nodes-base.manualTrigger': { displayName: 'Manual Trigger', category: 'core' },
  'n8n-nodes-base.webhook': { displayName: 'Webhook', category: 'core' },
  'n8n-nodes-base.scheduleTrigger': { displayName: 'Schedule Trigger', category: 'core' },
  
  // Sub-workflow Execution
  'n8n-nodes-base.executeworkflow': { displayName: 'Execute Sub-workflow', category: 'core' },
  'n8n-nodes-base.executeworkflowtrigger': { displayName: 'Execute Sub-workflow Trigger', category: 'core' },
  
  // Logic and Control Flow
  'n8n-nodes-base.if': { displayName: 'IF', category: 'core' },
  'n8n-nodes-base.switch': { displayName: 'Switch', category: 'core' },
  'n8n-nodes-base.merge': { displayName: 'Merge', category: 'core' },
  'n8n-nodes-base.filter': { displayName: 'Filter', category: 'core' },
  
  // Advanced Data Processing
  'n8n-nodes-base.splitinbatches': { displayName: 'Loop Over Items', category: 'core' },
  'n8n-nodes-base.itemlists': { displayName: 'Item Lists', category: 'core' },
  'n8n-nodes-base.aggregate': { displayName: 'Aggregate', category: 'core' },
  'n8n-nodes-base.sort': { displayName: 'Sort', category: 'core' },
  'n8n-nodes-base.limit': { displayName: 'Limit', category: 'core' },
  
  // Data Manipulation
  'n8n-nodes-base.set': { displayName: 'Set', category: 'core' },
  'n8n-nodes-base.function': { displayName: 'Function', category: 'core' },
  'n8n-nodes-base.code': { displayName: 'Code', category: 'core' },
  
  // HTTP and API
  'n8n-nodes-base.httpRequest': { displayName: 'HTTP Request', category: 'core' },
  
  // File Operations
  'n8n-nodes-base.readwritefile': { displayName: 'Read/Write Files from Disk', category: 'core' },
  'n8n-nodes-base.converttofile': { displayName: 'Convert to File', category: 'core' },
  'n8n-nodes-base.extractfromfile': { displayName: 'Extract From File', category: 'core' },
  'n8n-nodes-base.editimage': { displayName: 'Edit Image', category: 'core' },
  
  // Utility
  'n8n-nodes-base.wait': { displayName: 'Wait', category: 'core' },
  'n8n-nodes-base.noOp': { displayName: 'No Operation', category: 'core' },
} as const;

export const N8N_APP_NODES = {
  // Communication & Messaging
  'n8n-nodes-base.slack': {
    displayName: 'Slack',
    description: 'Send messages and interact with Slack workspaces',
    category: 'communication',
    operations: ['postMessage', 'updateMessage', 'getChannel', 'getUser'],
    example: {
      resource: 'message',
      operation: 'post',
      channel: '#general',
      text: '={{$json["message"]}} - sent from n8n!',
      attachments: []
    }
  },
  
  'n8n-nodes-base.discord': {
    displayName: 'Discord',
    description: 'Send messages to Discord channels',
    category: 'communication',
    operations: ['sendMessage', 'editMessage'],
    example: {
      webhookUrl: 'https://discord.com/api/webhooks/...',
      text: 'Alert: {{$json["status"]}} detected!',
      username: 'n8n Bot'
    }
  },

  'n8n-nodes-base.gmail': {
    displayName: 'Gmail',
    description: 'Send and manage emails via Gmail',
    category: 'communication',
    operations: ['send', 'reply', 'get', 'getAll', 'delete'],
    example: {
      resource: 'message',
      operation: 'send',
      to: '={{$json["email"]}}',
      subject: 'Welcome {{$json["name"]}}!',
      message: 'Thank you for signing up.',
      attachments: []
    }
  },

  // Productivity & Data
  'n8n-nodes-base.googleSheets': {
    displayName: 'Google Sheets',
    description: 'Read and write data to Google Sheets',
    category: 'productivity',
    operations: ['append', 'clear', 'create', 'delete', 'lookup', 'read', 'update'],
    example: {
      resource: 'spreadsheet',
      operation: 'appendOrUpdate',
      documentId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
      sheetName: 'Sheet1',
      columns: 'A:D',
      values: [['={{$json["name"]}}', '={{$json["email"]}}', '={{$json["status"]}}', '={{$now}}']]
    }
  },

  'n8n-nodes-base.airtable': {
    displayName: 'Airtable',
    description: 'Manage records in Airtable bases',
    category: 'productivity',
    operations: ['append', 'delete', 'list', 'read', 'update'],
    example: {
      operation: 'append',
      application: 'appXXXXXXXXXXXXXX',
      table: 'Contacts',
      fields: {
        'Name': '={{$json["name"]}}',
        'Email': '={{$json["email"]}}',
        'Status': '={{$json["status"]}}'
      }
    }
  },

  'n8n-nodes-base.notion': {
    displayName: 'Notion',
    description: 'Create and manage Notion pages and databases',
    category: 'productivity',
    operations: ['create', 'get', 'getAll', 'update'],
    example: {
      resource: 'page',
      operation: 'create',
      databaseId: 'database_id_here',
      title: '={{$json["title"]}}',
      properties: {
        'Status': { select: { name: '={{$json["status"]}}' } },
        'Priority': { number: '={{$json["priority"]}}' }
      }
    }
  },

  // AI & Machine Learning
  'n8n-nodes-base.openAi': {
    displayName: 'OpenAI',
    description: 'Use OpenAI GPT models and AI capabilities',
    category: 'ai',
    operations: ['chat', 'completion', 'image', 'embedding'],
    example: {
      resource: 'text',
      operation: 'message',
      model: 'gpt-4o-mini',
      messages: {
        values: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: '={{$json["prompt"]}}' }
        ]
      },
      options: {
        temperature: 0.7,
        maxTokens: 1000
      }
    }
  },

  // Development & Version Control
  'n8n-nodes-base.github': {
    displayName: 'GitHub',
    description: 'Manage GitHub repositories, issues, and pull requests',
    category: 'development',
    operations: ['create', 'get', 'getAll', 'update'],
    example: {
      resource: 'issue',
      operation: 'create',
      owner: 'username',
      repository: 'repo-name',
      title: 'New Issue: {{$json["title"]}}',
      body: '={{$json["description"]}}',
      labels: ['bug', 'urgent']
    }
  },

  // E-commerce
  'n8n-nodes-base.shopify': {
    displayName: 'Shopify',
    description: 'Manage Shopify store data and orders',
    category: 'ecommerce',
    operations: ['create', 'get', 'getAll', 'update'],
    example: {
      resource: 'order',
      operation: 'get',
      orderId: '={{$json["order_id"]}}',
      options: { fields: 'id,name,email,total_price' }
    }
  },

  // Databases
  'n8n-nodes-base.postgres': {
    displayName: 'PostgreSQL',
    description: 'Execute queries against PostgreSQL databases',
    category: 'database',
    operations: ['executeQuery', 'insert', 'update', 'delete'],
    example: {
      operation: 'executeQuery',
      query: 'SELECT * FROM users WHERE status = $1',
      parameters: ['active'],
      options: { queryFormat: 'prepared' }
    }
  },

  'n8n-nodes-base.mysql': {
    displayName: 'MySQL',
    description: 'Execute queries against MySQL databases',
    category: 'database',
    operations: ['executeQuery', 'insert', 'update', 'delete'],
    example: {
      operation: 'executeQuery',
      query: 'SELECT * FROM products WHERE price > ?',
      parameters: [100]
    }
  },
} as const;

export const N8N_AUTH_TYPES = {
  'none': 'No authentication required',
  'genericCredentialType': 'Generic credentials for custom setups',
  'httpBasicAuth': 'Username and password authentication',
  'httpHeaderAuth': 'Authentication via custom headers',
  'httpQueryAuth': 'Authentication via query parameters',
  'httpDigestAuth': 'Digest authentication method',
  'oAuth1Api': 'OAuth 1.0 authentication flow',
  'oAuth2Api': 'OAuth 2.0 authentication flow',
  'jwtAuth': 'JSON Web Token authentication',
  'bearerTokenAuth': 'Bearer token in Authorization header',
} as const;