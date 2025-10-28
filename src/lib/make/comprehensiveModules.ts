/**
 * Make.com Comprehensive Module Library
 * Complete coverage of Make.com apps and built-in modules for AI workflow generation
 */

export const MAKE_COMPREHENSIVE_MODULES = {
  // AI & Machine Learning
  ai_modules: {
    "openai-gpt-3": "OpenAI (ChatGPT, Whisper, DALL-E)",
    "anthropic-claude": "Anthropic Claude",
    "elevenlabs": "ElevenLabs text-to-speech",
    "leonardo-ai": "Leonardo.ai image generation",
    "cloudinary": "Cloudinary media management",
    "google-vision": "Google Vision AI",
    "microsoft-cognitive": "Microsoft Cognitive Services"
  },

  // Built-in Tools (Core Make.com modules)
  builtin_modules: {
    "webhook": "Webhook trigger/receiver",
    "builtin:iterator": "Process arrays item by item",
    "builtin:aggregator": "Combine multiple bundles into arrays",
    "builtin:BasicRouter": "Split workflow into multiple paths",
    "builtin:filter": "Control data flow with conditions",
    "builtin:sleep": "Add delays between operations",
    "builtin:set-variables": "Set and store variables",
    "builtin:break": "Stop scenario execution",
    "builtin:repeater": "Repeat operations a set number of times",
    "builtin:incrementor": "Generate sequential numbers",
    "json": "Parse and process JSON data",
    "text-parser": "Extract data from text using patterns",
    "math": "Mathematical calculations and operations",
    "date-time": "Date and time manipulation",
    "file": "File processing and manipulation",
    "image": "Image processing and transformation",
    "pdf": "PDF creation and processing",
    "excel": "Excel file processing",
    "csv": "CSV data processing"
  },

  // Communication & Messaging
  communication: {
    "slack": "Slack messaging and notifications",
    "microsoft-teams": "Microsoft Teams integration",
    "discord": "Discord messaging",
    "telegram": "Telegram bot integration",
    "whatsapp": "WhatsApp messaging",
    "sms": "SMS sending services",
    "email": "Email sending and processing",
    "twilio": "Twilio communication services",
    "sendgrid": "SendGrid email service",
    "mailchimp": "Mailchimp email marketing",
    "constant-contact": "Constant Contact email marketing"
  },

  // Productivity & Project Management
  productivity: {
    "google-sheets": "Google Sheets spreadsheet operations",
    "google-calendar": "Google Calendar scheduling",
    "google-drive": "Google Drive file management",
    "google-docs": "Google Docs document processing",
    "microsoft-excel": "Microsoft Excel operations",
    "microsoft-outlook": "Microsoft Outlook email and calendar",
    "microsoft-onedrive": "Microsoft OneDrive file storage",
    "notion": "Notion database and page management",
    "airtable": "Airtable database operations",
    "monday": "Monday.com project management",
    "clickup": "ClickUp task management",
    "trello": "Trello board management",
    "asana": "Asana project management",
    "jira": "Jira issue tracking",
    "github": "GitHub repository management",
    "gitlab": "GitLab repository management"
  },

  // CRM & Sales
  crm_sales: {
    "salesforce": "Salesforce CRM operations",
    "hubspot": "HubSpot CRM and marketing",
    "pipedrive": "Pipedrive sales pipeline",
    "zoho-crm": "Zoho CRM operations",
    "freshworks": "Freshworks CRM",
    "copper": "Copper CRM",
    "close": "Close CRM",
    "intercom": "Intercom customer messaging",
    "zendesk": "Zendesk customer support",
    "freshdesk": "Freshdesk help desk",
    "help-scout": "Help Scout customer service"
  },

  // E-commerce & Payments
  ecommerce: {
    "shopify": "Shopify e-commerce platform",
    "woocommerce": "WooCommerce WordPress integration",
    "magento": "Magento e-commerce",
    "bigcommerce": "BigCommerce platform",
    "stripe": "Stripe payment processing",
    "paypal": "PayPal payment integration",
    "square": "Square payment system",
    "amazon": "Amazon marketplace integration",
    "ebay": "eBay marketplace",
    "etsy": "Etsy marketplace"
  },

  // Marketing & Social Media
  marketing: {
    "facebook-pages-2": "Facebook Pages management",
    "instagram-business": "Instagram Business operations",
    "facebook-lead-ads": "Facebook Lead Ads",
    "linkedin": "LinkedIn business operations",
    "twitter": "Twitter/X social media",
    "youtube": "YouTube video management",
    "pinterest": "Pinterest content management",
    "tiktok": "TikTok content operations",
    "bluesky": "Bluesky social network",
    "google-ads": "Google Ads campaign management",
    "facebook-ads": "Facebook Ads management",
    "linkedin-ads": "LinkedIn advertising",
    "mailchimp": "Mailchimp email marketing",
    "active-campaign": "ActiveCampaign marketing automation",
    "convertkit": "ConvertKit email marketing",
    "google-analytics": "Google Analytics tracking"
  },

  // Database & Storage
  database: {
    "mysql": "MySQL database operations",
    "postgresql": "PostgreSQL database",
    "mongodb": "MongoDB NoSQL database",
    "redis": "Redis cache database",
    "firebase": "Firebase real-time database",
    "aws-dynamodb": "AWS DynamoDB",
    "aws-s3": "AWS S3 file storage",
    "dropbox": "Dropbox file storage",
    "box": "Box file storage",
    "onedrive": "OneDrive file storage"
  },

  // Cloud Services & Infrastructure
  cloud_services: {
    "aws-lambda": "AWS Lambda functions",
    "aws-ses": "AWS Simple Email Service",
    "aws-s3": "AWS S3 storage",
    "aws-ec2": "AWS EC2 instances",
    "google-cloud": "Google Cloud Platform",
    "microsoft-azure": "Microsoft Azure services",
    "cloudflare": "Cloudflare CDN and security",
    "digital-ocean": "DigitalOcean cloud services"
  },

  // Development & APIs
  development: {
    "http": "HTTP REST API requests",
    "graphql": "GraphQL API operations",
    "soap": "SOAP web services",
    "ftp": "FTP file transfer",
    "ssh": "SSH secure shell operations",
    "docker": "Docker container management",
    "kubernetes": "Kubernetes orchestration",
    "terraform": "Terraform infrastructure"
  },

  // Business & Enterprise
  enterprise: {
    "sharepoint": "Microsoft SharePoint",
    "dynamics-365": "Microsoft Dynamics 365",
    "sap": "SAP enterprise systems",
    "oracle": "Oracle database and applications",
    "workday": "Workday HR platform",
    "servicenow": "ServiceNow IT service management",
    "tableau": "Tableau data visualization",
    "power-bi": "Microsoft Power BI",
    "quickbooks": "QuickBooks accounting",
    "xero": "Xero accounting software"
  },

  // Content & Media
  content_media: {
    "wordpress": "WordPress content management",
    "drupal": "Drupal CMS",
    "contentful": "Contentful headless CMS",
    "strapi": "Strapi headless CMS",
    "youtube": "YouTube video operations",
    "vimeo": "Vimeo video platform",
    "spotify": "Spotify music platform",
    "soundcloud": "SoundCloud audio platform",
    "twitch": "Twitch streaming platform"
  },

  // Survey & Forms
  forms_surveys: {
    "typeform": "Typeform interactive forms",
    "google-forms": "Google Forms",
    "jotform": "JotForm form builder",
    "surveymonkey": "SurveyMonkey surveys",
    "calendly": "Calendly scheduling",
    "cal-com": "Cal.com open-source scheduling",
    "acuity": "Acuity Scheduling",
    "wufoo": "Wufoo form builder",
    "tally": "Tally form builder"
  },

  // Modern Development & No-Code
  modern_dev: {
    "linear": "Linear issue tracking",
    "height": "Height project management",
    "notion": "Notion workspace and databases",
    "coda": "Coda docs and automation",
    "retool": "Retool internal tools",
    "bubble": "Bubble no-code platform",
    "webflow": "Webflow website builder",
    "framer": "Framer design and CMS",
    "vercel": "Vercel deployment platform",
    "netlify": "Netlify hosting platform",
    "supabase": "Supabase backend platform",
    "railway": "Railway infrastructure",
    "render": "Render cloud platform"
  },

  // Modern Communication & Collaboration
  modern_communication: {
    "discord": "Discord community platform",
    "telegram": "Telegram messaging",
    "whatsapp": "WhatsApp Business API",
    "intercom": "Intercom customer messaging",
    "crisp": "Crisp customer support",
    "front": "Front shared inbox",
    "missive": "Missive team collaboration",
    "superhuman": "Superhuman email client"
  },

  // Fintech & Payments
  fintech: {
    "stripe": "Stripe payment processing",
    "plaid": "Plaid financial data API",
    "wise": "Wise international transfers",
    "revolut": "Revolut business banking",
    "mercury": "Mercury banking platform",
    "brex": "Brex corporate cards",
    "ramp": "Ramp expense management",
    "bill-com": "Bill.com AP automation",
    "chargebee": "Chargebee subscription billing",
    "recurly": "Recurly subscription management",
    "paddle": "Paddle payment platform"
  },

  // Analytics & Business Intelligence
  analytics_bi: {
    "google-analytics": "Google Analytics tracking",
    "mixpanel": "Mixpanel product analytics",
    "amplitude": "Amplitude behavioral analytics",
    "segment": "Segment customer data platform",
    "heap": "Heap analytics automation",
    "posthog": "PostHog product analytics",
    "metabase": "Metabase BI tool",
    "looker": "Looker data platform",
    "dbt": "dbt data transformation"
  },

  // Developer Tools
  developer_tools: {
    "github": "GitHub repository management",
    "gitlab": "GitLab DevOps platform",
    "bitbucket": "Bitbucket code hosting",
    "linear": "Linear issue tracking",
    "jira": "Jira project management",
    "sentry": "Sentry error monitoring",
    "datadog": "Datadog monitoring",
    "pagerduty": "PagerDuty incident management",
    "opsgenie": "Opsgenie alerting",
    "statuspage": "Statuspage status communication"
  },

  // Video & Media
  video_media: {
    "zoom": "Zoom video conferencing",
    "loom": "Loom video messaging",
    "mux": "Mux video streaming",
    "cloudinary": "Cloudinary media management",
    "imgix": "Imgix image optimization",
    "vimeo": "Vimeo video platform",
    "youtube": "YouTube video operations",
    "twitch": "Twitch streaming platform"
  }
};

export const MAKE_ADVANCED_PATTERNS = {
  // Complex workflow patterns
  workflow_patterns: {
    multi_step_approval: "Sequential approval workflows with conditional routing",
    data_synchronization: "Bi-directional sync between multiple systems",
    batch_processing: "Process large datasets in chunks with error handling",
    real_time_monitoring: "Monitor systems and trigger alerts/actions",
    content_pipeline: "Automated content creation, review, and publishing",
    lead_nurturing: "Progressive lead scoring and automated follow-ups",
    order_fulfillment: "Complete e-commerce order processing workflow",
    customer_onboarding: "Automated customer activation sequences",
    financial_reporting: "Automated report generation and distribution",
    inventory_management: "Stock monitoring and automatic reordering"
  },

  // Error handling strategies
  error_handling: {
    retry_logic: "Exponential backoff with maximum retry attempts",
    circuit_breaker: "Stop processing when failure rate exceeds threshold",
    dead_letter_queue: "Store failed items for manual processing",
    graceful_degradation: "Continue with reduced functionality during failures",
    notification_chains: "Alert appropriate teams when errors occur",
    rollback_procedures: "Undo operations when workflow fails"
  },

  // Performance optimization
  optimization: {
    bulk_operations: "Process multiple records in single API calls",
    parallel_processing: "Execute independent operations simultaneously",
    caching_strategies: "Store frequently accessed data to reduce API calls",
    rate_limiting: "Respect API limits with delays and queuing",
    data_filtering: "Process only relevant data to reduce overhead",
    conditional_execution: "Skip unnecessary operations based on conditions"
  }
};

export const MAKE_INTEGRATION_EXAMPLES = {
  // Real-world integration scenarios
  scenarios: {
    crm_marketing_sync: {
      description: "Sync leads between CRM and marketing automation",
      modules: ["webhook", "salesforce", "hubspot", "builtin:Filter", "email"],
      pattern: "Lead capture → CRM creation → Marketing automation → Follow-up"
    },
    social_media_management: {
      description: "Cross-platform social media posting and monitoring",
      modules: ["google-sheets", "openai", "facebook-pages", "instagram-business", "linkedin"],
      pattern: "Content planning → AI enhancement → Multi-platform posting → Analytics"
    },
    ecommerce_automation: {
      description: "Complete order processing and fulfillment",
      modules: ["shopify", "stripe", "aws-ses", "google-sheets", "slack"],
      pattern: "Order received → Payment processing → Inventory update → Shipping → Notifications"
    },
    customer_support_automation: {
      description: "Intelligent ticket routing and response",
      modules: ["zendesk", "openai", "slack", "google-calendar", "email"],
      pattern: "Ticket creation → AI analysis → Smart routing → Escalation → Resolution tracking"
    },
    content_creation_pipeline: {
      description: "Automated content creation and publishing",
      modules: ["google-sheets", "openai", "wordpress", "social-media", "analytics"],
      pattern: "Topic planning → AI content generation → Review workflow → Publishing → Performance tracking"
    }
  }
};