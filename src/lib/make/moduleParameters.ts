/**
 * Make.com Module-Specific Parameter Documentation
 * CRITICAL: Accurate parameter structures for each module type
 * Use this to generate correct mapper and parameters fields
 */

export const MAKE_MODULE_PARAMETERS = {
  // Webhook Module
  webhook: {
    module_name: "webhook",
    parameters: {},
    mapper: {},
    required_metadata: {
      parameters: [
        {
          name: "hook",
          type: "hook",
          label: "Webhook"
        }
      ]
    },
    common_patterns: {
      instant_trigger: "Used as first module to receive real-time data",
      custom_response: "Can return custom JSON/XML responses to sender"
    }
  },

  // HTTP Module
  http: {
    module_name: "http",
    parameters: {
      handleErrors: false,
      useQuerystring: false,
      followRedirect: true,
      rejectUnauthorized: true
    },
    mapper: {
      url: "https://api.example.com/endpoint",
      method: "GET", // GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS
      headers: [
        {
          name: "Authorization",
          value: "Bearer YOUR_TOKEN"
        },
        {
          name: "Content-Type",
          value: "application/json"
        }
      ],
      qs: [ // Query string parameters (for GET requests)
        {
          name: "param1",
          value: "value1"
        }
      ],
      body: "{}", // For POST/PUT/PATCH requests
      timeout: 30000
    },
    required_fields: ["url", "method"],
    auth_patterns: {
      bearer_token: {
        headers: [{ name: "Authorization", value: "Bearer {{token}}" }]
      },
      api_key_header: {
        headers: [{ name: "X-API-Key", value: "{{apiKey}}" }]
      },
      api_key_query: {
        qs: [{ name: "api_key", value: "{{apiKey}}" }]
      },
      basic_auth: {
        headers: [{ name: "Authorization", value: "Basic {{base64(username + \":\" + password)}}" }]
      }
    },
    response_handling: {
      json_parse: "Automatic if Content-Type is application/json",
      error_codes: "Use handleErrors: true to catch 4xx/5xx as errors",
      parse_response: "Access via {{module.data}}, {{module.headers}}, {{module.statusCode}}"
    }
  },

  // OpenAI GPT Module
  "openai-gpt-3": {
    module_name: "openai-gpt-3",
    parameters: {
      account: 1, // Connection ID
      mode: "completions" // or "chat", "edits", "embeddings"
    },
    mapper: {
      model: "gpt-4", // gpt-4, gpt-4-turbo, gpt-3.5-turbo
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant."
        },
        {
          role: "user",
          content: "User's question or prompt here"
        }
      ],
      temperature: 0.7, // 0.0 to 2.0
      max_tokens: 2000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      stop: [] // Optional stop sequences
    },
    required_fields: ["model", "messages"],
    best_practices: {
      temperature: "0.0-0.3 for factual, 0.7-1.0 for creative",
      max_tokens: "Set based on expected response length to control costs",
      system_message: "Always include to set AI behavior and context"
    },
    response_structure: {
      content: "{{module.choices[].message.content}}",
      tokens_used: "{{module.usage.total_tokens}}",
      model_used: "{{module.model}}"
    }
  },

  // Google Sheets Module
  "google-sheets": {
    module_name: "google-sheets",
    parameters: {
      account: 1,
      mode: "addRow" // watchRows, updateRow, getRow, searchRows, clearRow, deleteRow
    },
    mapper: {
      spreadsheetId: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
      sheetName: "Sheet1",
      // For addRow:
      values: {
        "Column A": "{{value1}}",
        "Column B": "{{value2}}",
        "Column C": "{{value3}}"
      },
      // For watchRows:
      limit: 100,
      // For updateRow:
      row: 5,
      // For searchRows:
      filter: {
        columnName: "Email",
        operator: "equals",
        value: "user@example.com"
      }
    },
    modes: {
      watchRows: {
        description: "Trigger on new rows",
        mapper_fields: ["spreadsheetId", "sheetName", "limit"],
        returns: "Array of new rows since last check"
      },
      addRow: {
        description: "Append new row to sheet",
        mapper_fields: ["spreadsheetId", "sheetName", "values"],
        returns: "Updated row data"
      },
      updateRow: {
        description: "Update existing row",
        mapper_fields: ["spreadsheetId", "sheetName", "row", "values"],
        returns: "Updated row data"
      },
      searchRows: {
        description: "Find rows matching criteria",
        mapper_fields: ["spreadsheetId", "sheetName", "filter", "limit"],
        returns: "Array of matching rows"
      }
    },
    column_mapping: {
      note: "Use exact column headers from first row",
      case_sensitive: true,
      special_chars: "Supported in column names"
    }
  },

  // Slack Module
  slack: {
    module_name: "slack",
    parameters: {
      account: 1
    },
    mapper: {
      channel: "C01ABC123", // Channel ID or name (#general)
      text: "Message text with {{variables}}",
      attachments: [], // Optional rich attachments
      blocks: [], // Optional block kit formatting
      thread_ts: "", // Optional - reply to thread
      username: "Bot Name", // Optional override
      icon_emoji: ":robot_face:", // Optional
      icon_url: "", // Optional
      link_names: true, // Auto-link @mentions
      mrkdwn: true, // Enable markdown
      parse: "full" // Link parsing mode
    },
    required_fields: ["channel", "text"],
    channel_formats: {
      by_id: "C01ABC123",
      by_name: "#general",
      dm_by_user_id: "U01ABC123",
      dm_by_email: "@user@example.com"
    },
    formatting: {
      bold: "*bold text*",
      italic: "_italic text_",
      code: "`code`",
      code_block: "```code block```",
      link: "<https://example.com|Link Text>",
      mention_user: "<@U01ABC123>",
      mention_channel: "<#C01ABC123>",
      mention_everyone: "<!everyone>",
      mention_here: "<!here>"
    },
    blocks_example: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*Title*\nDescription text"
        }
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "Click Me" },
            action_id: "button_click"
          }
        ]
      }
    ]
  },

  // Email Module
  email: {
    module_name: "email",
    parameters: {
      account: 1
    },
    mapper: {
      to: "recipient@example.com", // Comma-separated for multiple
      cc: "", // Optional
      bcc: "", // Optional
      from: "sender@example.com",
      fromName: "Sender Name",
      subject: "Email subject line",
      html: "<h1>HTML content</h1><p>Body text</p>",
      text: "Plain text alternative", // Optional fallback
      attachments: [
        {
          filename: "document.pdf",
          data: "{{base64data}}",
          contentType: "application/pdf"
        }
      ],
      replyTo: "reply@example.com" // Optional
    },
    required_fields: ["to", "subject"],
    content_types: {
      html_only: "Set html field, leave text empty",
      text_only: "Set text field, leave html empty",
      both: "Include both for maximum compatibility"
    },
    attachment_sources: {
      from_url: "Download file first with HTTP module",
      from_previous_module: "Use {{module.data}} or {{module.file}}",
      inline_base64: "Encode file data as base64"
    },
    best_practices: {
      multiple_recipients: "Use comma-separated emails in 'to' field",
      dynamic_content: "Use {{variables}} throughout subject and body",
      styling: "Inline CSS for best email client compatibility",
      testing: "Always test with multiple email clients"
    }
  },

  // Salesforce Module
  salesforce: {
    module_name: "salesforce",
    parameters: {
      account: 1,
      mode: "createRecord" // updateRecord, getRecord, searchRecords, deleteRecord
    },
    mapper: {
      sobjecttype: "Lead", // Lead, Contact, Account, Opportunity, Custom__c
      fields: {
        "FirstName": "{{firstName}}",
        "LastName": "{{lastName}}",
        "Email": "{{email}}",
        "Company": "{{company}}",
        "Status": "New"
      },
      // For updateRecord:
      id: "{{recordId}}",
      // For searchRecords:
      condition: "Email = '{{email}}' AND IsConverted = false",
      limit: 100
    },
    sobject_types: {
      Lead: ["FirstName", "LastName", "Email", "Company", "Status", "Phone", "Title", "LeadSource"],
      Contact: ["FirstName", "LastName", "Email", "Phone", "AccountId", "Title"],
      Account: ["Name", "Type", "Industry", "Phone", "Website", "BillingStreet", "BillingCity"],
      Opportunity: ["Name", "Amount", "StageName", "CloseDate", "AccountId", "Probability"],
      Case: ["Subject", "Status", "Priority", "Origin", "ContactId", "Description"]
    },
    field_types: {
      text: "String value",
      number: "Numeric value (no quotes)",
      boolean: "true or false (no quotes)",
      date: "YYYY-MM-DD format",
      datetime: "YYYY-MM-DDTHH:mm:ss.000Z format",
      picklist: "Must match exact picklist value",
      lookup: "Salesforce record ID (18 characters)"
    },
    soql_conditions: {
      equals: "Name = 'Acme Corp'",
      not_equals: "Status != 'Closed'",
      greater_than: "Amount > 10000",
      less_than: "CloseDate < TODAY",
      like: "Email LIKE '%@example.com'",
      in: "Status IN ('New', 'Working', 'Qualified')",
      and: "FirstName = 'John' AND LastName = 'Doe'",
      or: "Status = 'Hot' OR Rating = 'A'"
    }
  },

  // Shopify Module
  shopify: {
    module_name: "shopify",
    parameters: {
      account: 1,
      mode: "watchOrders" // createOrder, updateOrder, getOrder, createProduct, etc.
    },
    mapper: {
      // For watchOrders:
      status: "any", // any, open, closed, cancelled
      fulfillmentStatus: "any", // any, shipped, partial, unshipped
      financialStatus: "any", // any, authorized, pending, paid, refunded
      limit: 50,
      // For createOrder:
      email: "customer@example.com",
      line_items: [
        {
          variant_id: "{{variantId}}",
          quantity: 1,
          price: "29.99"
        }
      ],
      shipping_address: {
        first_name: "{{firstName}}",
        last_name: "{{lastName}}",
        address1: "{{street}}",
        city: "{{city}}",
        province: "{{state}}",
        country: "{{country}}",
        zip: "{{zipCode}}"
      },
      // For updateProduct:
      product_id: "{{productId}}",
      title: "{{productTitle}}",
      body_html: "<p>{{productDescription}}</p>",
      vendor: "{{vendor}}",
      product_type: "{{type}}",
      tags: "{{tags}}"
    },
    order_fields: {
      id: "Unique order ID",
      order_number: "Human-readable order number",
      email: "Customer email",
      total_price: "Total price as string",
      subtotal_price: "Subtotal before shipping/tax",
      total_tax: "Total tax amount",
      currency: "Currency code (USD, EUR, etc.)",
      financial_status: "Payment status",
      fulfillment_status: "Shipping status",
      line_items: "Array of products",
      customer: "Customer object with name, email, etc.",
      shipping_address: "Shipping address object",
      created_at: "ISO 8601 timestamp"
    },
    webhooks: {
      orders_create: "New order created",
      orders_updated: "Order modified",
      orders_paid: "Order payment received",
      products_create: "New product added",
      customers_create: "New customer registered"
    }
  },

  // Stripe Module
  stripe: {
    module_name: "stripe",
    parameters: {
      account: 1,
      mode: "createCharge" // createCustomer, createInvoice, etc.
    },
    mapper: {
      // For createCharge:
      amount: 2999, // Amount in cents (no decimals)
      currency: "usd",
      source: "{{token}}", // Payment source or token
      description: "Payment for Order #{{orderNumber}}",
      receipt_email: "{{customerEmail}}",
      metadata: {
        order_id: "{{orderId}}",
        customer_id: "{{customerId}}"
      },
      // For createCustomer:
      email: "customer@example.com",
      name: "{{customerName}}",
      phone: "{{phone}}",
      address: {
        line1: "{{street}}",
        city: "{{city}}",
        state: "{{state}}",
        postal_code: "{{zip}}",
        country: "US"
      }
    },
    amount_handling: {
      cents: "Always use smallest currency unit (cents for USD)",
      no_decimals: "2999 not 29.99",
      calculation: "{{multiply(price; 100)}}"
    },
    currency_codes: {
      usd: "US Dollar",
      eur: "Euro",
      gbp: "British Pound",
      jpy: "Japanese Yen (no decimal)",
      cad: "Canadian Dollar"
    },
    response_fields: {
      id: "Charge/Customer ID",
      status: "succeeded, pending, failed",
      amount: "Amount in cents",
      currency: "Currency code",
      receipt_url: "Link to receipt",
      created: "Unix timestamp"
    }
  },

  // Built-in Modules
  "builtin:iterator": {
    module_name: "builtin:iterator",
    parameters: {},
    mapper: {
      array: "{{previousModule.arrayField}}"
    },
    required_fields: ["array"],
    usage: {
      description: "Converts array into individual bundles",
      input: "Array from previous module",
      output: "One bundle per array item",
      common_use: "Process each item in a list individually"
    },
    array_sources: {
      api_response: "{{1.data.items}}",
      google_sheets: "{{1.rows}}",
      split_text: "{{split(text; ',')}}",
      manual_array: "[1, 2, 3, 4, 5]"
    }
  },

  "builtin:aggregator": {
    module_name: "builtin:aggregator",
    parameters: {
      feeder: 2 // Module ID of the iterator to aggregate
    },
    mapper: {
      aggregatedFields: [
        {
          component: "fieldName",
          value: "{{2.fieldValue}}" // Reference to iterator module
        }
      ]
    },
    required_fields: ["feeder", "aggregatedFields"],
    usage: {
      description: "Combines bundles back into array",
      typical_flow: "Iterator → Process → Aggregator",
      output: "Single bundle with array field"
    },
    aggregation_types: {
      array: "Collect all values into array",
      sum: "{{sum(aggregatedFields.value)}}",
      average: "{{avg(aggregatedFields.value)}}",
      count: "{{length(aggregatedFields)}}",
      concatenate: "{{join(aggregatedFields.value; ', ')}}"
    }
  },

  "builtin:BasicRouter": {
    module_name: "builtin:BasicRouter",
    parameters: {},
    mapper: {},
    usage: {
      description: "Splits flow into multiple conditional paths",
      setup: "Add filters to modules after router",
      execution: "All matching routes execute in parallel"
    },
    filter_setup: {
      location: "Applied to modules AFTER router, not router itself",
      condition_format: {
        a: "{{field}}", // Value to compare
        o: "operator", // See operators below
        b: "comparison value"
      }
    },
    filter_operators: {
      text: ["text:equal", "text:notEqual", "text:contains", "text:notContains", "text:startsWith", "text:endsWith"],
      numeric: ["numeric:equal", "numeric:notEqual", "numeric:greater", "numeric:greaterOrEqual", "numeric:less", "numeric:lessOrEqual"],
      date: ["date:equal", "date:notEqual", "date:after", "date:before"],
      boolean: ["boolean:equal"],
      exists: ["exists", "notExists"]
    }
  },

  "builtin:set-variables": {
    module_name: "builtin:set-variables",
    parameters: {},
    mapper: {
      variables: [
        {
          key: "variableName",
          value: "{{variableValue}}"
        }
      ]
    },
    usage: {
      set: "Store value: {{set('myVar'; 'value')}}",
      get: "Retrieve value: {{get('myVar')}}",
      increment: "Counter: {{set('count'; add(get('count'); 1))}}",
      scope: "Variables persist within single scenario execution"
    },
    common_patterns: {
      counter: "Track processed items",
      accumulator: "Sum values across bundles",
      cache: "Store API responses",
      state: "Track workflow state"
    }
  }
};

/**
 * Common Mapper Patterns
 * Reusable patterns for mapping data between modules
 */
export const MAPPER_PATTERNS = {
  // Accessing data from previous modules
  data_references: {
    current_module: "{{fieldName}}",
    specific_module: "{{1.fieldName}}", // Module ID 1
    nested_field: "{{1.data.user.email}}",
    array_item: "{{1.items[0].name}}",
    array_all: "{{1.items[].name}}", // All names from array
    conditional: "{{if(1.status = 'active'; 'Yes'; 'No')}}"
  },

  // Date formatting
  date_formatting: {
    current_time: "{{now}}",
    format_date: "{{formatDate(now; 'YYYY-MM-DD HH:mm:ss')}}",
    add_days: "{{addDays(now; 7)}}",
    add_hours: "{{addHours(now; 24)}}",
    parse_date: "{{parseDate('2024-01-15'; 'YYYY-MM-DD')}}",
    date_diff: "{{dateDifference(date1; date2; 'days')}}"
  },

  // String manipulation
  text_operations: {
    concatenate: "{{firstName}} {{lastName}}",
    uppercase: "{{upper(text)}}",
    lowercase: "{{lower(text)}}",
    trim: "{{trim(text)}}",
    replace: "{{replace(text; 'old'; 'new')}}",
    substring: "{{substring(text; 0; 10)}}",
    split: "{{split(text; ',')}}",
    join: "{{join(array; ', ')}}"
  },

  // Number operations
  math_operations: {
    add: "{{add(num1; num2)}}",
    subtract: "{{subtract(num1; num2)}}",
    multiply: "{{multiply(num1; num2)}}",
    divide: "{{divide(num1; num2)}}",
    round: "{{round(num; 2)}}", // 2 decimal places
    ceil: "{{ceil(num)}}",
    floor: "{{floor(num)}}",
    percentage: "{{multiply(divide(part; total); 100)}}"
  },

  // Conditional logic
  conditionals: {
    if_then_else: "{{if(condition; 'true value'; 'false value')}}",
    nested_if: "{{if(status = 'hot'; 'Urgent'; if(status = 'warm'; 'Follow up'; 'Low priority'))}}",
    default_value: "{{if(email; email; 'no-email@example.com')}}",
    check_exists: "{{if(length(field) > 0; field; 'N/A')}}"
  },

  // Array operations
  array_operations: {
    length: "{{length(array)}}",
    first_item: "{{array[0]}}",
    last_item: "{{array[length(array) - 1]}}",
    join: "{{join(array; ', ')}}",
    map: "{{array[].field}}", // Extract field from all items
    filter: "Use Iterator + Filter modules",
    slice: "{{slice(array; 0; 5)}}" // First 5 items
  },

  // JSON operations
  json_operations: {
    stringify: "{{toJSON(object)}}",
    parse: "{{parseJSON(jsonString)}}",
    get_value: "{{get(object; 'path.to.value')}}",
    pretty_print: "{{toJSON(object; true)}}"
  }
};
