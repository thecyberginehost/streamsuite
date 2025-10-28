/**
 * Business Process Automation Patterns
 */

export const N8N_BUSINESS_PROCESS_AUTOMATION = {
  overview: {
    description: 'Common business workflow patterns for approval processes, data validation, and notification systems',
    corePatterns: [
      'Approval Workflows',
      'Data Validation Pipelines', 
      'Notification Systems',
      'Content Management',
      'Customer Journey Automation',
      'Inventory Management'
    ],
    businessBenefits: [
      'Reduced manual errors',
      'Faster process execution',
      'Consistent business rules application',
      'Audit trail and compliance',
      'Scalable operations'
    ]
  },

  approvalWorkflows: {
    singleStepApproval: {
      description: 'Simple approval process with one approver',
      structure: [
        'Trigger (Form/Request)',
        'Data Collection & Validation',
        'Approver Notification',
        'Wait for Response',
        'Process Decision',
        'Notify Requester'
      ],
      implementation: `{
  "nodes": [
    {
      "type": "webhook",
      "name": "Approval Request",
      "parameters": {
        "httpMethod": "POST",
        "path": "approval-request"
      }
    },
    {
      "type": "set",
      "name": "Format Request Data",
      "parameters": {
        "values": [
          {
            "name": "request_id",
            "value": "{{ $json.id }}"
          },
          {
            "name": "approver_email",
            "value": "{{ $json.approver.email }}"
          },
          {
            "name": "approval_url",
            "value": "{{ $baseUrl }}/approve/{{ $json.id }}"
          }
        ]
      }
    },
    {
      "type": "sendEmail",
      "name": "Notify Approver",
      "parameters": {
        "to": "{{ $json.approver_email }}",
        "subject": "Approval Required: {{ $json.request_title }}",
        "body": "Please review and approve: {{ $json.approval_url }}"
      }
    },
    {
      "type": "wait",
      "name": "Wait for Decision",
      "parameters": {
        "resume": "webhook",
        "webhook_path": "approval-decision"
      }
    }
  ]
}`
    },

    multiLevelApproval: {
      description: 'Complex approval process with multiple approvers and escalation',
      workflow: `// Multi-level approval with escalation
const approvalLevels = [
  { level: 1, approver: 'manager@company.com', timeout: 24 },
  { level: 2, approver: 'director@company.com', timeout: 48 },
  { level: 3, approver: 'ceo@company.com', timeout: 72 }
];

const processApproval = (requestData) => {
  return {
    request_id: generateId(),
    current_level: 1,
    max_level: getRequiredApprovalLevel(requestData.amount),
    approvers: approvalLevels.slice(0, getRequiredApprovalLevel(requestData.amount)),
    status: 'pending',
    created_at: new Date().toISOString(),
    escalation_timer: 24
  };
};

const getRequiredApprovalLevel = (amount) => {
  if (amount < 1000) return 1;
  if (amount < 10000) return 2;
  return 3;
};`,
      escalationRules: {
        timeBasedEscalation: `// Escalate after timeout
{
  "type": "wait",
  "parameters": {
    "resume": "after_time_interval",
    "amount": "{{ $json.escalation_timer }}",
    "unit": "hours"
  }
}`,
        conditionalEscalation: `// Skip to higher level for urgent requests
const shouldSkipLevel = (request) => {
  return request.priority === 'urgent' || 
         request.amount > 50000 ||
         request.category === 'emergency';
};`
      }
    },

    conditionalApproval: {
      description: 'Approval routing based on request attributes',
      routingLogic: `// Dynamic approval routing
const getApprovalRoute = (request) => {
  const routes = {
    expense: {
      low: 'manager@company.com',      // < $500
      medium: 'director@company.com',   // $500-$5000
      high: 'cfo@company.com'          // > $5000
    },
    hr: {
      leave: 'hr-manager@company.com',
      hiring: 'hr-director@company.com',
      policy: 'ceo@company.com'
    },
    procurement: {
      supplies: 'procurement@company.com',
      equipment: 'it-director@company.com',
      services: 'operations@company.com'
    }
  };

  const category = request.category;
  const subcategory = request.subcategory;
  const amount = request.amount || 0;

  if (category === 'expense') {
    if (amount < 500) return routes.expense.low;
    if (amount < 5000) return routes.expense.medium;
    return routes.expense.high;
  }

  return routes[category]?.[subcategory] || 'admin@company.com';
};`
    }
  },

  dataValidationPipelines: {
    inputValidation: {
      description: 'Comprehensive data validation before processing',
      validationRules: `// Comprehensive validation pipeline
const validateBusinessData = (data) => {
  const errors = [];
  const warnings = [];

  // Required field validation
  const requiredFields = ['email', 'name', 'company', 'phone'];
  requiredFields.forEach(field => {
    if (!data[field] || data[field].trim() === '') {
      errors.push(\`\${field} is required\`);
    }
  });

  // Format validation
  if (data.email && !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(data.email)) {
    errors.push('Invalid email format');
  }

  if (data.phone && !/^[\\+]?[\\d\\s\\-\\(\\)]+$/.test(data.phone)) {
    errors.push('Invalid phone format');
  }

  // Business logic validation
  if (data.start_date && data.end_date) {
    const start = new Date(data.start_date);
    const end = new Date(data.end_date);
    if (start >= end) {
      errors.push('End date must be after start date');
    }
  }

  // Data consistency checks
  if (data.age && data.birth_date) {
    const calculatedAge = Math.floor((new Date() - new Date(data.birth_date)) / (365.25 * 24 * 60 * 60 * 1000));
    if (Math.abs(calculatedAge - data.age) > 1) {
      warnings.push('Age and birth date may be inconsistent');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    data: data
  };
};`
    },

    dataEnrichment: {
      description: 'Enhance data with additional information from external sources',
      implementation: `// Data enrichment pipeline
const enrichmentPipeline = {
  stages: [
    {
      name: 'Company Lookup',
      enricher: async (data) => {
        if (data.company_domain) {
          const companyInfo = await lookupCompanyInfo(data.company_domain);
          return {
            ...data,
            company_size: companyInfo.employee_count,
            company_industry: companyInfo.industry,
            company_revenue: companyInfo.annual_revenue
          };
        }
        return data;
      }
    },
    {
      name: 'Geographic Data',
      enricher: async (data) => {
        if (data.zip_code) {
          const geoData = await lookupGeographicData(data.zip_code);
          return {
            ...data,
            city: geoData.city,
            state: geoData.state,
            timezone: geoData.timezone,
            coordinates: geoData.coordinates
          };
        }
        return data;
      }
    },
    {
      name: 'Credit Score',
      enricher: async (data) => {
        if (data.ssn && data.consent_for_credit_check) {
          const creditInfo = await getCreditScore(data.ssn);
          return {
            ...data,
            credit_score: creditInfo.score,
            credit_tier: creditInfo.tier
          };
        }
        return data;
      }
    }
  ],

  process: async (inputData) => {
    let enrichedData = { ...inputData };
    
    for (const stage of enrichmentPipeline.stages) {
      try {
        enrichedData = await stage.enricher(enrichedData);
        enrichedData._enrichment_log = enrichedData._enrichment_log || [];
        enrichedData._enrichment_log.push({
          stage: stage.name,
          timestamp: new Date().toISOString(),
          status: 'success'
        });
      } catch (error) {
        enrichedData._enrichment_log = enrichedData._enrichment_log || [];
        enrichedData._enrichment_log.push({
          stage: stage.name,
          timestamp: new Date().toISOString(),
          status: 'error',
          error: error.message
        });
      }
    }
    
    return enrichedData;
  }
};`
    },

    dataQualityScoring: {
      description: 'Score data quality and completeness',
      implementation: `// Data quality scoring system
const dataQualityScorer = {
  criteria: {
    completeness: {
      weight: 0.3,
      requiredFields: ['name', 'email', 'phone', 'company'],
      optionalFields: ['address', 'website', 'linkedin']
    },
    accuracy: {
      weight: 0.25,
      validators: {
        email: (value) => /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(value),
        phone: (value) => /^[\\+]?[\\d\\s\\-\\(\\)]+$/.test(value),
        website: (value) => /^https?:\\/\\/.+/.test(value)
      }
    },
    consistency: {
      weight: 0.2,
      checks: [
        (data) => data.company_domain && data.email && data.email.includes(data.company_domain),
        (data) => data.state && data.zip_code && validateStateZip(data.state, data.zip_code)
      ]
    },
    freshness: {
      weight: 0.15,
      maxAge: 90 * 24 * 60 * 60 * 1000 // 90 days
    },
    uniqueness: {
      weight: 0.1,
      duplicateFields: ['email', 'phone']
    }
  },

  calculateScore: (data, existingRecords = []) => {
    let totalScore = 0;
    const details = {};

    // Completeness score
    const requiredComplete = dataQualityScorer.criteria.completeness.requiredFields
      .filter(field => data[field] && data[field].trim() !== '').length;
    const optionalComplete = dataQualityScorer.criteria.completeness.optionalFields
      .filter(field => data[field] && data[field].trim() !== '').length;
    
    const completenessScore = (
      (requiredComplete / dataQualityScorer.criteria.completeness.requiredFields.length) * 0.8 +
      (optionalComplete / dataQualityScorer.criteria.completeness.optionalFields.length) * 0.2
    ) * 100;
    
    details.completeness = completenessScore;
    totalScore += completenessScore * dataQualityScorer.criteria.completeness.weight;

    // Accuracy score
    const validators = dataQualityScorer.criteria.accuracy.validators;
    const accuracyChecks = Object.keys(validators).filter(field => data[field]);
    const accuracyPassed = accuracyChecks.filter(field => validators[field](data[field])).length;
    const accuracyScore = accuracyChecks.length > 0 ? (accuracyPassed / accuracyChecks.length) * 100 : 100;
    
    details.accuracy = accuracyScore;
    totalScore += accuracyScore * dataQualityScorer.criteria.accuracy.weight;

    // Consistency score
    const consistencyChecks = dataQualityScorer.criteria.consistency.checks;
    const consistencyPassed = consistencyChecks.filter(check => check(data)).length;
    const consistencyScore = consistencyChecks.length > 0 ? (consistencyPassed / consistencyChecks.length) * 100 : 100;
    
    details.consistency = consistencyScore;
    totalScore += consistencyScore * dataQualityScorer.criteria.consistency.weight;

    // Freshness score
    const dataAge = data.last_updated ? Date.now() - new Date(data.last_updated).getTime() : 0;
    const maxAge = dataQualityScorer.criteria.freshness.maxAge;
    const freshnessScore = Math.max(0, (1 - dataAge / maxAge)) * 100;
    
    details.freshness = freshnessScore;
    totalScore += freshnessScore * dataQualityScorer.criteria.freshness.weight;

    // Uniqueness score
    const duplicateFields = dataQualityScorer.criteria.uniqueness.duplicateFields;
    const hasDuplicates = duplicateFields.some(field => 
      existingRecords.some(record => record[field] === data[field])
    );
    const uniquenessScore = hasDuplicates ? 0 : 100;
    
    details.uniqueness = uniquenessScore;
    totalScore += uniquenessScore * dataQualityScorer.criteria.uniqueness.weight;

    return {
      overallScore: Math.round(totalScore),
      details,
      grade: totalScore >= 90 ? 'A' : totalScore >= 80 ? 'B' : totalScore >= 70 ? 'C' : totalScore >= 60 ? 'D' : 'F'
    };
  }
};`
    }
  },

  notificationSystems: {
    multiChannelNotification: {
      description: 'Send notifications across multiple channels with preferences',
      implementation: `// Multi-channel notification system
const notificationSystem = {
  channels: {
    email: {
      priority: 1,
      async: true,
      templates: ['welcome', 'alert', 'reminder', 'report'],
      retryAttempts: 3
    },
    sms: {
      priority: 2,
      async: false,
      characterLimit: 160,
      retryAttempts: 2
    },
    slack: {
      priority: 3,
      async: true,
      channels: ['#general', '#alerts', '#notifications'],
      retryAttempts: 3
    },
    push: {
      priority: 4,
      async: true,
      platforms: ['ios', 'android', 'web'],
      retryAttempts: 2
    }
  },

  send: async (message, recipients, preferences = {}) => {
    const results = [];
    
    // Determine channels based on message urgency and user preferences
    const selectedChannels = notificationSystem.selectChannels(message.urgency, preferences);
    
    for (const channel of selectedChannels) {
      try {
        const channelConfig = notificationSystem.channels[channel];
        const formattedMessage = notificationSystem.formatMessage(message, channel);
        
        const result = await notificationSystem.sendToChannel(
          channel, 
          formattedMessage, 
          recipients, 
          channelConfig
        );
        
        results.push({
          channel,
          status: 'success',
          messageId: result.messageId,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        results.push({
          channel,
          status: 'failed',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    return results;
  },

  selectChannels: (urgency, preferences) => {
    const channelsByUrgency = {
      low: ['email'],
      medium: ['email', 'slack'],
      high: ['email', 'sms', 'slack'],
      critical: ['sms', 'email', 'slack', 'push']
    };
    
    let channels = channelsByUrgency[urgency] || ['email'];
    
    // Apply user preferences
    if (preferences.disabledChannels) {
      channels = channels.filter(ch => !preferences.disabledChannels.includes(ch));
    }
    
    if (preferences.preferredChannels) {
      channels = [...new Set([...preferences.preferredChannels, ...channels])];
    }
    
    return channels;
  },

  formatMessage: (message, channel) => {
    const formatters = {
      email: (msg) => ({
        subject: msg.subject || msg.title,
        body: msg.body || msg.content,
        html: msg.htmlContent
      }),
      sms: (msg) => ({
        text: (msg.shortContent || msg.content).substring(0, 160)
      }),
      slack: (msg) => ({
        text: msg.content,
        attachments: msg.attachments,
        blocks: msg.slackBlocks
      }),
      push: (msg) => ({
        title: msg.title,
        body: msg.content.substring(0, 100),
        data: msg.metadata
      })
    };
    
    return formatters[channel] ? formatters[channel](message) : message;
  }
};`
    },

    escalationNotifications: {
      description: 'Escalate notifications based on response time and urgency',
      implementation: `// Notification escalation system
const escalationSystem = {
  rules: [
    {
      trigger: 'no_response',
      timeouts: {
        low: 24 * 60 * 60 * 1000,      // 24 hours
        medium: 4 * 60 * 60 * 1000,    // 4 hours  
        high: 60 * 60 * 1000,          // 1 hour
        critical: 15 * 60 * 1000       // 15 minutes
      },
      escalateTo: ['manager', 'director', 'c-level']
    },
    {
      trigger: 'negative_response',
      immediate: true,
      escalateTo: ['manager', 'hr']
    },
    {
      trigger: 'system_error',
      immediate: true,
      escalateTo: ['tech-team', 'operations']
    }
  ],

  processEscalation: async (originalNotification, trigger, level = 0) => {
    const rule = escalationSystem.rules.find(r => r.trigger === trigger);
    if (!rule || level >= rule.escalateTo.length) {
      return { escalated: false, reason: 'max_level_reached' };
    }

    const escalationTarget = rule.escalateTo[level];
    const escalatedMessage = {
      ...originalNotification,
      subject: \`ESCALATED: \${originalNotification.subject}\`,
      content: \`This is an escalated notification (Level \${level + 1}).\\n\\nOriginal message:\\n\${originalNotification.content}\`,
      urgency: 'high',
      metadata: {
        ...originalNotification.metadata,
        escalation_level: level + 1,
        escalation_trigger: trigger,
        original_timestamp: originalNotification.timestamp
      }
    };

    const recipients = await getRecipientsByRole(escalationTarget);
    const result = await notificationSystem.send(escalatedMessage, recipients);

    // Schedule next escalation if no response
    if (!rule.immediate && level < rule.escalateTo.length - 1) {
      const nextTimeout = rule.timeouts?.[originalNotification.urgency] || rule.timeouts?.medium;
      scheduleEscalation(originalNotification, trigger, level + 1, nextTimeout);
    }

    return {
      escalated: true,
      level: level + 1,
      target: escalationTarget,
      result
    };
  }
};`
    }
  }
} as const;