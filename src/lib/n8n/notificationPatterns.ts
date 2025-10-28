/**
 * Notification & Communication Patterns for n8n Workflows
 * Based on official n8n documentation and communication node capabilities
 */

export const N8N_COMMUNICATION_NODES = {
  slack: {
    nodeType: 'n8n-nodes-base.slack',
    description: 'Automate work in Slack and integrate with other applications',
    operations: {
      channel: [
        'Archive', 'Close', 'Create', 'Get', 'Get Many', 'History',
        'Invite', 'Join', 'Kick', 'Leave', 'Member', 'Open',
        'Rename', 'Replies', 'Sets purpose', 'Sets topic', 'Unarchive'
      ],
      message: [
        'Delete', 'Get', 'Get Many', 'Post', 'Update'
      ],
      file: [
        'Get', 'Get Many', 'Upload'
      ],
      reaction: [
        'Add', 'Get', 'Remove'
      ],
      star: [
        'Add', 'Delete', 'Get Many'
      ],
      user: [
        'Get', 'Get Many', 'Get Presence', 'Update Profile'
      ],
      userGroup: [
        'Create', 'Disable', 'Enable', 'Get Many', 'Update'
      ]
    },
    credentials: 'Slack OAuth2 or Bot Token authentication',
    aiToolCapable: true
  },
  
  sendEmail: {
    nodeType: 'n8n-nodes-base.sendemail',
    description: 'Send emails using SMTP email server',
    operations: [
      'Send', 'Send and Wait for Response'
    ],
    parameters: {
      fromEmail: 'Format: "Name" <email@domain.com>',
      toEmail: 'Multiple recipients: first@domain.com, "Name" <second@domain.com>',
      subject: 'Email subject line',
      emailFormat: 'Text, HTML, or Both',
      attachments: 'Binary properties for file attachments'
    },
    credentials: 'SMTP account credentials',
    aiToolCapable: true,
    features: [
      'CC and BCC support',
      'HTML and plain text formatting',
      'File attachments from binary data',
      'Reply-to configuration',
      'Wait for user response capability'
    ]
  },
  
  gmail: {
    nodeType: 'n8n-nodes-base.gmail',
    description: 'Automate Gmail operations and integrate with other applications',
    operations: {
      draft: ['Create', 'Delete', 'Get', 'Get Many', 'Update'],
      message: ['Delete', 'Get', 'Get Many', 'Reply', 'Send'],
      label: ['Create', 'Delete', 'Get', 'Get Many'],
      thread: ['Get', 'Get Many']
    },
    credentials: 'Google OAuth2 authentication',
    aiToolCapable: true,
    features: [
      'Rich email operations',
      'Label management',
      'Thread handling',
      'Draft management',
      'Advanced search capabilities'
    ]
  },
  
  twilio: {
    nodeType: 'n8n-nodes-base.twilio',
    description: 'Send SMS/MMS/WhatsApp messages and make phone calls',
    operations: {
      sms: ['Send SMS/MMS/WhatsApp message'],
      call: ['Make a phone call using text-to-speech']
    },
    credentials: 'Twilio Account SID and Auth Token',
    aiToolCapable: true,
    useCases: [
      'SMS notifications and alerts',
      'WhatsApp business messaging',
      'Voice call automation',
      'Two-factor authentication'
    ]
  },
  
  discord: {
    nodeType: 'n8n-nodes-base.discord',
    description: 'Send messages and manage Discord channels',
    operations: {
      channel: ['Create', 'Delete', 'Get', 'Get Many', 'Update'],
      message: [
        'Delete', 'Get', 'Get Many', 'React with Emoji',
        'Send', 'Send and Wait for Response'
      ],
      member: ['Get Many', 'Role Add', 'Role Remove']
    },
    credentials: 'Discord Bot Token or OAuth2',
    aiToolCapable: true,
    features: [
      'Channel management',
      'Message operations',
      'Emoji reactions',
      'Member role management',
      'Wait for user response'
    ]
  }
} as const;

export const N8N_NOTIFICATION_PATTERNS = {
  multiChannelMessaging: {
    description: 'Send coordinated messages across multiple communication channels',
    implementation: {
      parallelDelivery: {
        description: 'Send same message to multiple channels simultaneously',
        nodeStructure: [
          'Manual Trigger or Webhook (with message data)',
          'Set node (prepare message content)',
          'Split workflow into parallel branches',
          'Slack node (branch 1)',
          'Send Email node (branch 2)', 
          'Twilio SMS node (branch 3)',
          'Merge node (combine delivery results)'
        ],
        example: `
          Critical Alert Workflow:
          1. Webhook receives alert data
          2. Set node formats alert message
          3. Parallel execution:
             - Slack: Post to #alerts channel
             - Email: Send to oncall@company.com  
             - SMS: Send to emergency contact number
          4. Merge delivery confirmations
        `
      },
      
      conditionalChannelRouting: {
        description: 'Route messages based on urgency or user preferences',
        implementation: [
          'IF node to check message priority/type',
          'High priority → Slack + SMS + Email',
          'Medium priority → Slack + Email',
          'Low priority → Email only'
        ],
        expressions: {
          priorityCheck: '{{ $json.priority === "high" }}',
          userPreference: '{{ $json.user.notifications.includes("sms") }}',
          timeOfDay: '{{ new Date().getHours() >= 9 && new Date().getHours() <= 17 }}'
        }
      }
    }
  },
  
  messageFormatting: {
    description: 'Adapt message format for different channels',
    strategies: {
      sms: {
        constraints: ['160 characters max', 'Plain text only', 'Clear call-to-action'],
        template: 'ALERT: {{title}} - {{summary}}. Action: {{action_url}}'
      },
      
      email: {
        features: ['HTML formatting', 'Attachments', 'Rich content', 'Tracking pixels'],
        structure: ['Subject line', 'Header', 'Body content', 'Footer', 'Unsubscribe']
      },
      
      slack: {
        features: ['Rich formatting', 'Interactive buttons', 'Thread replies', 'Mentions'],
        elements: ['Blocks', 'Attachments', 'Actions', 'Emoji reactions']
      },
      
      teams: {
        features: ['Adaptive cards', 'Rich media', 'Interactive elements', 'Threading'],
        structure: ['Card header', 'Content body', 'Action buttons', 'Facts/metadata']
      }
    }
  },
  
  escalationWorkflows: {
    description: 'Automated escalation using n8n workflows and scheduling',
    timeBasedEscalation: {
      description: 'Escalate notifications based on response time',
      implementation: {
        workflowStructure: [
          '1. Manual Trigger or Webhook (initial alert)',
          '2. Send initial notification (Slack/Email)',
          '3. Wait node (15 minutes)',
          '4. Check for acknowledgment (database query or API call)',
          '5. IF node (no response) → escalate to manager',
          '6. Repeat escalation levels with increasing delays'
        ],
        
        escalationLevels: {
          level1: 'Immediate notification to assignee (Slack DM)',
          level2: '15 min → Reminder to assignee (Email + Slack)',
          level3: '30 min → Manager notification (Email + SMS)',
          level4: '1 hour → Director escalation (Phone + Email)',
          level5: '2 hours → Emergency broadcast (All channels)'
        }
      }
    },
    
    approvalWorkflows: {
      description: 'Human approval workflows with automated escalation',
      nodeSequence: [
        'Webhook/Manual Trigger (approval request)',
        'Send Email node with "Send and Wait for Response"',
        'Set response timeout and escalation rules',
        'IF node to process approval/rejection',
        'Automated actions based on response'
      ],
      
      implementation: `
        Expense Approval Workflow:
        1. Webhook receives expense request
        2. Format approval email with expense details
        3. Send Email node with "Approval" response type
        4. Set timeout for 24 hours
        5. IF approved → Process payment
        6. IF rejected → Notify requester
        7. IF no response → Escalate to director
      `
    }
  },
  
  responseHandling: {
    description: 'Handle user responses in n8n workflows',
    emailResponses: {
      description: 'Process email responses using Send Email node',
      responseTypes: {
        approval: 'Users can approve/disapprove from within email',
        freeText: 'Users submit response with form',
        multipleChoice: 'Users select from predefined options'
      },
      
      configuration: {
        responseType: 'Set in Send Email node operation settings',
        timeout: 'Configure workflow timeout for response',
        webhookEndpoint: 'n8n automatically creates response endpoint',
        dataProcessing: 'Response data available in subsequent nodes'
      }
    },
    
    discordResponses: {
      description: 'Interactive Discord messages with response handling',
      operations: [
        'Send and Wait for Response message operation',
        'React with Emoji for quick responses',
        'Message threading for conversations'
      ],
      
      useCases: [
        'Bot commands and interactions',
        'Approval workflows in Discord',
        'Interactive notifications',
        'Community engagement automation'
      ]
    }
  },
  
  notificationTemplates: {
    description: 'Standardized message templates using n8n expressions',
    slackTemplates: {
      alertMessage: {
        structure: {
          text: '🚨 {{ $json.severity.toUpperCase() }} Alert: {{ $json.title }}',
          blocks: [
            'Header with severity and timestamp',
            'Main content with issue description',
            'Action buttons for acknowledgment',
            'Footer with escalation information'
          ]
        },
        expressions: {
          timestamp: '{{ new Date().toISOString() }}',
          severity: '{{ $json.priority === "high" ? "🔴 HIGH" : "🟡 MEDIUM" }}',
          assignee: '{{ $json.assignee ? `<@${$json.assignee}>` : "@here" }}'
        }
      }
    },
    
    emailTemplates: {
      approvalRequest: {
        subject: '📋 Approval Required: {{ $json.requestType }} - {{ $json.requester }}',
        htmlBody: `
          <h2>Approval Request</h2>
          <p><strong>Requester:</strong> {{ $json.requester }}</p>
          <p><strong>Type:</strong> {{ $json.requestType }}</p>
          <p><strong>Amount:</strong> {{ $json.amount }}</p>
          <p><strong>Description:</strong> {{ $json.description }}</p>
          <p><strong>Deadline:</strong> {{ $json.deadline }}</p>
        `,
        responseOptions: ['Approve', 'Reject', 'Request More Info']
      },
      
      statusUpdate: {
        subject: '📊 {{ $json.projectName }} - Status: {{ $json.status }}',
        dynamicContent: {
          progressBar: '{{ "█".repeat(Math.floor($json.progress/10)) + "░".repeat(10-Math.floor($json.progress/10)) }}',
          nextSteps: '{{ $json.nextMilestone ? `Next: ${$json.nextMilestone}` : "Project Complete" }}'
        }
      }
    }
  },
  
  statusTracking: {
    description: 'Comprehensive notification delivery and response tracking',
    trackingMetrics: {
      deliveryMetrics: [
        'Sent timestamp',
        'Delivery confirmation',
        'Read/open timestamp',
        'Click-through rates',
        'Bounce/failure rates'
      ],
      
      responseMetrics: [
        'Acknowledgment timestamp',
        'Response time',
        'Escalation triggers',
        'Resolution time',
        'User satisfaction'
      ]
    },
    
    statusReporting: {
      realTimeStatus: {
        description: 'Live tracking of notification status',
        components: ['Delivery dashboard', 'Response monitoring', 'Escalation alerts', 'SLA tracking'],
        updates: 'Real-time status updates via WebSocket or polling'
      },
      
      periodicReports: {
        description: 'Regular reports on notification effectiveness',
        daily: 'Delivery rates, failure analysis, response times',
        weekly: 'Escalation patterns, channel effectiveness, user preferences',
        monthly: 'Trend analysis, optimization recommendations, SLA compliance'
      }
    },
    
    auditTrail: {
      description: 'Complete audit trail for compliance and debugging',
      loggedEvents: [
        'Notification triggered with context',
        'Channel delivery attempts and results',
        'User acknowledgments and responses',
        'Escalation events and triggers',
        'Final resolution and feedback'
      ]
    }
  },
  
  workflowTemplates: {
    description: 'Reusable notification workflow templates',
    templateTypes: {
      alert: {
        description: 'System alerts and monitoring notifications',
        structure: {
          subject: '🚨 ALERT: {{severity}} - {{system}} - {{issue}}',
          body: 'Issue detected in {{system}} at {{timestamp}}. Severity: {{severity}}. Description: {{description}}. Action required: {{action}}',
          footer: 'Response required within {{sla_time}}. Escalation: {{escalation_contact}}'
        }
      },
      
      approval: {
        description: 'Approval request notifications',
        structure: {
          subject: '📋 Approval Required: {{request_type}} - {{requester}}',
          body: 'Approval request from {{requester}} for {{request_type}}. Details: {{details}}. Business justification: {{justification}}',
          actions: ['Approve', 'Reject', 'Request More Info'],
          footer: 'Please respond by {{deadline}}. Auto-escalation in {{escalation_time}}'
        }
      },
      
      status: {
        description: 'Status update notifications',
        structure: {
          subject: '📊 Status Update: {{project}} - {{status}}',
          body: 'Project {{project}} status changed to {{status}}. Progress: {{progress}}%. Next milestone: {{next_milestone}}',
          footer: 'Full report: {{report_link}}'
        }
      },
      
      reminder: {
        description: 'Reminder and follow-up notifications',
        structure: {
          subject: '⏰ Reminder: {{task}} due {{due_date}}',
          body: 'This is a reminder that {{task}} is due {{due_date}}. Status: {{current_status}}. Please update or complete by deadline',
          footer: 'Need help? Contact {{support_contact}}'
        }
      }
    },
    
    personalization: {
      description: 'Personalize notifications based on user data',
      techniques: [
        'Use recipient name and role in greeting',
        'Include relevant context based on user permissions',
        'Adapt language tone based on user preferences',
        'Include personalized action items',
        'Reference previous interactions or history'
      ]
    }
  },
  
  communicationWorkflows: {
    description: 'Complex communication workflow patterns',
    workflows: {
      incidentCommunication: {
        description: 'Coordinated communication during incidents',
        phases: {
          detection: 'Initial alert to on-call team',
          assessment: 'Severity evaluation and stakeholder notification',
          response: 'Regular updates to affected parties',
          resolution: 'Resolution notification and post-mortem scheduling',
          followup: 'Lessons learned and improvement actions'
        }
      },
      
      campaignManagement: {
        description: 'Multi-touch communication campaigns',
        structure: [
          'Audience segmentation and targeting',
          'Message sequence planning',
          'Channel optimization and A/B testing',
          'Response tracking and analysis',
          'Follow-up and nurturing workflows'
        ]
      },
      
      customerJourney: {
        description: 'Lifecycle-based customer communications',
        stages: {
          onboarding: 'Welcome series and setup guidance',
          activation: 'Feature introduction and usage tips',
          engagement: 'Regular value delivery and education',
          retention: 'Renewal reminders and loyalty programs',
          reactivation: 'Win-back campaigns for inactive users'
        }
      }
    }
  }
} as const;

export const N8N_NOTIFICATION_BEST_PRACTICES = {
  designPrinciples: [
    'Clear and actionable message content',
    'Appropriate urgency and channel selection',
    'Respect user preferences and time zones',
    'Provide clear next steps and contact information',
    'Maintain consistent branding and tone'
  ],
  
  deliveryOptimization: [
    'Implement proper retry logic with exponential backoff',
    'Use delivery confirmations to verify receipt',
    'Monitor and optimize delivery rates by channel',
    'Respect rate limits and sending quotas',
    'Handle bounces and invalid addresses gracefully'
  ],
  
  compliance: [
    'Obtain proper consent for communications',
    'Provide easy unsubscribe mechanisms',
    'Respect do-not-contact preferences',
    'Maintain audit trails for compliance',
    'Follow GDPR, CAN-SPAM, and other regulations'
  ],
  
  testing: [
    'Test notifications in all target channels',
    'Verify message formatting and links',
    'Test escalation paths and timing',
    'Validate delivery confirmations',
    'Conduct end-to-end workflow testing'
  ],
  
  monitoring: [
    'Track delivery and engagement metrics',
    'Monitor response times and SLA compliance',
    'Analyze escalation patterns and effectiveness',
    'Measure user satisfaction and feedback',
    'Identify and resolve delivery issues quickly'
  ]
} as const;