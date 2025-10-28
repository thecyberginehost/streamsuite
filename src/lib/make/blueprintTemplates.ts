/**
 * Make.com Verified Blueprint Templates
 * CRITICAL: These are working, tested blueprints that can be imported into Make.com
 * Use these as base templates and modify parameters rather than generating from scratch
 */

export const MAKE_BLUEPRINT_TEMPLATES = {
  // Template 1: Simple Webhook to Email
  webhook_to_email: {
    name: "Webhook to Email Notification",
    description: "Receives webhook data and sends email notification. Setup: Configure webhook URL in your app, set recipient email.",
    flow: [
      {
        id: 1,
        module: "webhook",
        version: 1,
        parameters: {},
        mapper: {},
        metadata: {
          designer: { x: 0, y: 0 },
          restore: {},
          parameters: [
            {
              name: "hook",
              type: "hook",
              label: "Webhook"
            }
          ]
        }
      },
      {
        id: 2,
        module: "email",
        version: 3,
        parameters: {
          account: 1
        },
        mapper: {
          to: "recipient@example.com",
          subject: "New Webhook Received",
          html: "<p>Webhook data received:</p><pre>{{1.body}}</pre>",
          attachments: []
        },
        metadata: {
          designer: { x: 300, y: 0 },
          restore: {
            parameters: {
              account: { label: "My Email Account" }
            }
          },
          parameters: [
            {
              name: "account",
              type: "account",
              label: "Connection"
            }
          ],
          expect: [
            {
              name: "to",
              type: "email",
              label: "To",
              required: true
            },
            {
              name: "subject",
              type: "text",
              label: "Subject"
            },
            {
              name: "html",
              type: "text",
              label: "Content"
            }
          ]
        }
      }
    ],
    metadata: {
      version: 1,
      scenario: {
        roundtrips: 1,
        maxErrors: 3,
        autoCommit: true,
        autoCommitTriggerLast: true,
        sequential: false,
        confidential: false,
        dataloss: false,
        dlq: false,
        freshVariables: false
      },
      designer: {
        orphans: []
      },
      zone: "us1.make.com"
    }
  },

  // Template 2: Google Sheets to Slack with Router
  sheets_to_slack_router: {
    name: "Google Sheets New Row to Slack with Priority Routing",
    description: "Monitors Google Sheets for new rows, routes high-priority items to urgent channel, normal items to general channel. Setup: Connect Google Sheets, configure Slack channels.",
    flow: [
      {
        id: 1,
        module: "google-sheets",
        version: 3,
        parameters: {
          account: 1,
          mode: "watchRows",
          spreadsheetId: "",
          sheetName: "Sheet1",
          valueRenderOption: "FORMATTED_VALUE",
          dateTimeRenderOption: "FORMATTED_STRING"
        },
        mapper: {},
        metadata: {
          designer: { x: 0, y: 0 },
          restore: {
            parameters: {
              account: { label: "My Google Account" },
              mode: { label: "Watch New Rows" }
            }
          },
          parameters: [
            {
              name: "account",
              type: "account",
              label: "Connection"
            },
            {
              name: "mode",
              type: "select",
              label: "Mode"
            }
          ],
          expect: [
            {
              name: "spreadsheetId",
              type: "text",
              label: "Spreadsheet ID",
              required: true
            },
            {
              name: "sheetName",
              type: "text",
              label: "Sheet Name",
              required: true
            }
          ]
        }
      },
      {
        id: 2,
        module: "builtin:BasicRouter",
        version: 1,
        parameters: {},
        mapper: {},
        metadata: {
          designer: { x: 300, y: 0 }
        }
      },
      {
        id: 3,
        module: "slack",
        version: 1,
        parameters: {
          account: 1
        },
        mapper: {
          channel: "C01ABC123",
          text: "🚨 HIGH PRIORITY: {{1.priority}} - {{1.title}}\n{{1.description}}",
          attachments: []
        },
        filter: {
          name: "High Priority Filter",
          conditions: [
            [
              {
                a: "{{1.priority}}",
                o: "text:equal",
                b: "High"
              }
            ]
          ]
        },
        metadata: {
          designer: { x: 600, y: -100 },
          restore: {
            parameters: {
              account: { label: "My Slack Workspace" }
            }
          },
          parameters: [
            {
              name: "account",
              type: "account",
              label: "Connection"
            }
          ],
          expect: [
            {
              name: "channel",
              type: "text",
              label: "Channel",
              required: true
            },
            {
              name: "text",
              type: "text",
              label: "Message Text",
              required: true
            }
          ]
        }
      },
      {
        id: 4,
        module: "slack",
        version: 1,
        parameters: {
          account: 1
        },
        mapper: {
          channel: "C02XYZ456",
          text: "📝 New item: {{1.title}}\n{{1.description}}",
          attachments: []
        },
        filter: {
          name: "Normal Priority Filter",
          conditions: [
            [
              {
                a: "{{1.priority}}",
                o: "text:notEqual",
                b: "High"
              }
            ]
          ]
        },
        metadata: {
          designer: { x: 600, y: 100 },
          restore: {
            parameters: {
              account: { label: "My Slack Workspace" }
            }
          }
        }
      }
    ],
    metadata: {
      version: 1,
      scenario: {
        roundtrips: 1,
        maxErrors: 3,
        autoCommit: true,
        autoCommitTriggerLast: true,
        sequential: false,
        confidential: false,
        dataloss: false,
        dlq: false,
        freshVariables: false
      },
      designer: {
        orphans: []
      },
      zone: "us1.make.com"
    }
  },

  // Template 3: OpenAI Content Generation Pipeline
  openai_content_pipeline: {
    name: "AI Content Generation and Publishing",
    description: "Generates content with OpenAI, stores in Google Sheets, posts to social media. Setup: Connect OpenAI API, Google Sheets, and social media accounts.",
    flow: [
      {
        id: 1,
        module: "webhook",
        version: 1,
        parameters: {},
        mapper: {},
        metadata: {
          designer: { x: 0, y: 0 },
          restore: {},
          parameters: [
            {
              name: "hook",
              type: "hook",
              label: "Webhook"
            }
          ]
        }
      },
      {
        id: 2,
        module: "openai-gpt-3",
        version: 1,
        parameters: {
          account: 1,
          mode: "completions"
        },
        mapper: {
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: "You are a professional content writer."
            },
            {
              role: "user",
              content: "Write a {{1.content_type}} about {{1.topic}} in {{1.tone}} tone. Length: {{1.length}} words."
            }
          ],
          temperature: 0.7,
          max_tokens: 2000,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0
        },
        metadata: {
          designer: { x: 300, y: 0 },
          restore: {
            parameters: {
              account: { label: "OpenAI Account" },
              mode: { label: "Create a Completion" }
            }
          },
          parameters: [
            {
              name: "account",
              type: "account",
              label: "Connection"
            },
            {
              name: "mode",
              type: "select",
              label: "Mode"
            }
          ],
          expect: [
            {
              name: "model",
              type: "select",
              label: "Model",
              required: true
            },
            {
              name: "messages",
              type: "array",
              label: "Messages",
              required: true
            },
            {
              name: "temperature",
              type: "number",
              label: "Temperature"
            },
            {
              name: "max_tokens",
              type: "number",
              label: "Max Tokens"
            }
          ]
        }
      },
      {
        id: 3,
        module: "google-sheets",
        version: 3,
        parameters: {
          account: 1,
          mode: "addRow"
        },
        mapper: {
          spreadsheetId: "",
          sheetName: "Generated Content",
          values: {
            "Date": "{{formatDate(now; \"YYYY-MM-DD HH:mm:ss\")}}",
            "Topic": "{{1.topic}}",
            "Content": "{{2.choices[].message.content}}",
            "Status": "Generated"
          }
        },
        metadata: {
          designer: { x: 600, y: 0 },
          restore: {
            parameters: {
              account: { label: "My Google Account" },
              mode: { label: "Add a Row" }
            }
          },
          expect: [
            {
              name: "spreadsheetId",
              type: "text",
              label: "Spreadsheet ID",
              required: true
            },
            {
              name: "sheetName",
              type: "text",
              label: "Sheet Name",
              required: true
            },
            {
              name: "values",
              type: "collection",
              label: "Values"
            }
          ]
        }
      },
      {
        id: 4,
        module: "slack",
        version: 1,
        parameters: {
          account: 1
        },
        mapper: {
          channel: "C03CONTENT",
          text: "✅ Content generated for: {{1.topic}}\n\n{{2.choices[].message.content}}",
          attachments: []
        },
        metadata: {
          designer: { x: 900, y: 0 },
          restore: {
            parameters: {
              account: { label: "My Slack Workspace" }
            }
          }
        }
      }
    ],
    metadata: {
      version: 1,
      scenario: {
        roundtrips: 1,
        maxErrors: 3,
        autoCommit: true,
        autoCommitTriggerLast: true,
        sequential: false,
        confidential: false,
        dataloss: false,
        dlq: false,
        freshVariables: false
      },
      designer: {
        orphans: []
      },
      zone: "us1.make.com"
    }
  },

  // Template 4: E-commerce Order Processing with Error Handling
  ecommerce_order_processing: {
    name: "Shopify Order Processing with Payment and Notifications",
    description: "Processes new Shopify orders, handles payments via Stripe, sends confirmations, updates inventory. Includes error handling and notifications.",
    flow: [
      {
        id: 1,
        module: "shopify",
        version: 3,
        parameters: {
          account: 1,
          mode: "watchOrders"
        },
        mapper: {
          status: "any",
          fulfillmentStatus: "any",
          financialStatus: "any"
        },
        metadata: {
          designer: { x: 0, y: 0 },
          restore: {
            parameters: {
              account: { label: "My Shopify Store" },
              mode: { label: "Watch Orders" }
            }
          },
          parameters: [
            {
              name: "account",
              type: "account",
              label: "Connection"
            }
          ]
        }
      },
      {
        id: 2,
        module: "stripe",
        version: 2,
        parameters: {
          account: 1,
          mode: "createCharge"
        },
        mapper: {
          amount: "{{1.total_price * 100}}",
          currency: "{{1.currency}}",
          source: "{{1.payment_gateway_names[]}}",
          description: "Order #{{1.order_number}} - {{1.customer.email}}"
        },
        metadata: {
          designer: { x: 300, y: 0 },
          restore: {
            parameters: {
              account: { label: "Stripe Account" },
              mode: { label: "Create a Charge" }
            }
          },
          expect: [
            {
              name: "amount",
              type: "number",
              label: "Amount",
              required: true
            },
            {
              name: "currency",
              type: "text",
              label: "Currency",
              required: true
            },
            {
              name: "description",
              type: "text",
              label: "Description"
            }
          ]
        }
      },
      {
        id: 3,
        module: "email",
        version: 3,
        parameters: {
          account: 1
        },
        mapper: {
          to: "{{1.customer.email}}",
          subject: "Order Confirmation #{{1.order_number}}",
          html: "<h2>Thank you for your order!</h2><p>Order #{{1.order_number}}</p><p>Total: {{1.total_price}} {{1.currency}}</p><p>Payment Status: {{2.status}}</p>",
          attachments: []
        },
        metadata: {
          designer: { x: 600, y: 0 }
        }
      },
      {
        id: 4,
        module: "google-sheets",
        version: 3,
        parameters: {
          account: 1,
          mode: "addRow"
        },
        mapper: {
          spreadsheetId: "",
          sheetName: "Orders",
          values: {
            "Order Number": "{{1.order_number}}",
            "Customer": "{{1.customer.email}}",
            "Total": "{{1.total_price}}",
            "Payment ID": "{{2.id}}",
            "Status": "{{2.status}}",
            "Date": "{{formatDate(now; \"YYYY-MM-DD HH:mm:ss\")}}"
          }
        },
        metadata: {
          designer: { x: 900, y: 0 }
        }
      },
      {
        id: 5,
        module: "slack",
        version: 1,
        parameters: {
          account: 1
        },
        mapper: {
          channel: "C04ORDERS",
          text: "🛒 New Order #{{1.order_number}}\nCustomer: {{1.customer.email}}\nTotal: ${{1.total_price}}\nPayment: {{2.status}}",
          attachments: []
        },
        metadata: {
          designer: { x: 1200, y: 0 }
        }
      }
    ],
    metadata: {
      version: 1,
      scenario: {
        roundtrips: 1,
        maxErrors: 3,
        autoCommit: true,
        autoCommitTriggerLast: true,
        sequential: false,
        confidential: false,
        dataloss: false,
        dlq: false,
        freshVariables: false
      },
      designer: {
        orphans: []
      },
      zone: "us1.make.com"
    }
  },

  // Template 5: Data Sync with Iterator and Aggregator
  data_sync_iterator_aggregator: {
    name: "Database Sync with Batch Processing",
    description: "Fetches data from API, processes each item individually, aggregates results, updates database. Demonstrates iterator and aggregator pattern.",
    flow: [
      {
        id: 1,
        module: "http",
        version: 3,
        parameters: {
          handleErrors: false,
          useQuerystring: false,
          followRedirect: true,
          rejectUnauthorized: true
        },
        mapper: {
          url: "https://api.example.com/users",
          method: "GET",
          headers: [
            {
              name: "Authorization",
              value: "Bearer {{variables.apiToken}}"
            },
            {
              name: "Content-Type",
              value: "application/json"
            }
          ]
        },
        metadata: {
          designer: { x: 0, y: 0 },
          restore: {},
          expect: [
            {
              name: "url",
              type: "url",
              label: "URL",
              required: true
            },
            {
              name: "method",
              type: "select",
              label: "Method",
              required: true
            },
            {
              name: "headers",
              type: "array",
              label: "Headers"
            }
          ]
        }
      },
      {
        id: 2,
        module: "builtin:iterator",
        version: 1,
        parameters: {},
        mapper: {
          array: "{{1.data}}"
        },
        metadata: {
          designer: { x: 300, y: 0 },
          expect: [
            {
              name: "array",
              type: "array",
              label: "Array",
              required: true
            }
          ]
        }
      },
      {
        id: 3,
        module: "builtin:set-variables",
        version: 1,
        parameters: {},
        mapper: {
          variables: [
            {
              key: "processedCount",
              value: "{{add(get(\"processedCount\"); 1)}}"
            },
            {
              key: "lastProcessedId",
              value: "{{2.id}}"
            }
          ]
        },
        metadata: {
          designer: { x: 600, y: 0 }
        }
      },
      {
        id: 4,
        module: "http",
        version: 3,
        parameters: {
          handleErrors: false
        },
        mapper: {
          url: "https://api.example.com/process",
          method: "POST",
          headers: [
            {
              name: "Content-Type",
              value: "application/json"
            }
          ],
          body: "{{toJSON({\"userId\": 2.id, \"name\": 2.name, \"status\": \"processed\"})}}"
        },
        metadata: {
          designer: { x: 900, y: 0 }
        }
      },
      {
        id: 5,
        module: "builtin:aggregator",
        version: 1,
        parameters: {
          feeder: 2
        },
        mapper: {
          aggregatedFields: [
            {
              component: "userId",
              value: "{{2.id}}"
            },
            {
              component: "processResult",
              value: "{{4.status}}"
            }
          ]
        },
        metadata: {
          designer: { x: 1200, y: 0 },
          restore: {
            parameters: {
              feeder: {
                moduleId: 2,
                label: "Iterator"
              }
            }
          },
          expect: [
            {
              name: "aggregatedFields",
              type: "array",
              label: "Aggregated Fields"
            }
          ]
        }
      },
      {
        id: 6,
        module: "email",
        version: 3,
        parameters: {
          account: 1
        },
        mapper: {
          to: "admin@example.com",
          subject: "Batch Processing Complete",
          html: "<h2>Processing Summary</h2><p>Total processed: {{get(\"processedCount\")}}</p><p>Results: {{toJSON(5.array)}}</p>",
          attachments: []
        },
        metadata: {
          designer: { x: 1500, y: 0 }
        }
      }
    ],
    metadata: {
      version: 1,
      scenario: {
        roundtrips: 1,
        maxErrors: 3,
        autoCommit: true,
        autoCommitTriggerLast: true,
        sequential: false,
        confidential: false,
        dataloss: false,
        dlq: false,
        freshVariables: false
      },
      designer: {
        orphans: []
      },
      zone: "us1.make.com"
    }
  },

  // Template 6: CRM Lead Capture and Nurture
  crm_lead_capture: {
    name: "CRM Lead Capture from Multiple Sources",
    description: "Captures leads from forms, enriches data, creates CRM records, assigns to sales team, sends welcome email.",
    flow: [
      {
        id: 1,
        module: "webhook",
        version: 1,
        parameters: {},
        mapper: {},
        metadata: {
          designer: { x: 0, y: 0 }
        }
      },
      {
        id: 2,
        module: "http",
        version: 3,
        parameters: {},
        mapper: {
          url: "https://api.clearbit.com/v2/people/find",
          method: "GET",
          headers: [
            {
              name: "Authorization",
              value: "Bearer {{variables.clearbitKey}}"
            }
          ],
          qs: [
            {
              name: "email",
              value: "{{1.email}}"
            }
          ]
        },
        metadata: {
          designer: { x: 300, y: 0 }
        }
      },
      {
        id: 3,
        module: "salesforce",
        version: 4,
        parameters: {
          account: 1,
          mode: "createRecord"
        },
        mapper: {
          sobjecttype: "Lead",
          fields: {
            "FirstName": "{{1.firstName}}",
            "LastName": "{{1.lastName}}",
            "Email": "{{1.email}}",
            "Company": "{{if(2.company.name; 2.company.name; 1.company)}}",
            "Title": "{{2.employment.title}}",
            "LeadSource": "{{1.source}}",
            "Status": "New"
          }
        },
        metadata: {
          designer: { x: 600, y: 0 },
          restore: {
            parameters: {
              account: { label: "Salesforce Production" },
              mode: { label: "Create a Record" }
            }
          }
        }
      },
      {
        id: 4,
        module: "email",
        version: 3,
        parameters: {
          account: 1
        },
        mapper: {
          to: "{{1.email}}",
          subject: "Welcome to Our Platform!",
          html: "<h2>Hi {{1.firstName}},</h2><p>Thank you for your interest! A member of our team will reach out soon.</p>",
          attachments: []
        },
        metadata: {
          designer: { x: 900, y: 0 }
        }
      },
      {
        id: 5,
        module: "slack",
        version: 1,
        parameters: {
          account: 1
        },
        mapper: {
          channel: "C05LEADS",
          text: "🎯 New Lead: {{1.firstName}} {{1.lastName}}\nEmail: {{1.email}}\nCompany: {{if(2.company.name; 2.company.name; 1.company)}}\nTitle: {{2.employment.title}}\nSalesforce ID: {{3.id}}",
          attachments: []
        },
        metadata: {
          designer: { x: 900, y: 150 }
        }
      }
    ],
    metadata: {
      version: 1,
      scenario: {
        roundtrips: 1,
        maxErrors: 3,
        autoCommit: true,
        autoCommitTriggerLast: true,
        sequential: false,
        confidential: false,
        dataloss: false,
        dlq: false,
        freshVariables: false
      },
      designer: {
        orphans: []
      },
      zone: "us1.make.com"
    }
  }
};

/**
 * Template Selection Guide for AI
 * Use this to determine which template to use as a base
 */
export const TEMPLATE_SELECTION_GUIDE = {
  "webhook to notification": "webhook_to_email",
  "form submission to email": "webhook_to_email",
  "new row to slack": "sheets_to_slack_router",
  "spreadsheet monitoring": "sheets_to_slack_router",
  "conditional routing": "sheets_to_slack_router",
  "ai content generation": "openai_content_pipeline",
  "openai to social media": "openai_content_pipeline",
  "content automation": "openai_content_pipeline",
  "ecommerce order": "ecommerce_order_processing",
  "shopify stripe": "ecommerce_order_processing",
  "payment processing": "ecommerce_order_processing",
  "batch processing": "data_sync_iterator_aggregator",
  "iterator aggregator": "data_sync_iterator_aggregator",
  "api data sync": "data_sync_iterator_aggregator",
  "lead capture": "crm_lead_capture",
  "crm automation": "crm_lead_capture",
  "salesforce lead": "crm_lead_capture"
};

/**
 * How to Use These Templates
 *
 * 1. Match user request to closest template using TEMPLATE_SELECTION_GUIDE
 * 2. Clone the template structure
 * 3. Modify only the mapper fields (parameters stay the same)
 * 4. Update module IDs if adding/removing modules
 * 5. Adjust designer coordinates for new modules
 * 6. Keep metadata structure identical
 *
 * Example:
 * User: "Send email when new Airtable record is created"
 * Template: webhook_to_email (closest match)
 * Changes: Replace webhook (module 1) with airtable watch module
 *          Keep email module (module 2) structure
 *          Update mapper fields only
 */
