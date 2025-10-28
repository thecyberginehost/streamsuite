/**
 * Make.com Knowledge Base
 * Comprehensive knowledge about Make.com automation platform for AI workflow generation
 */

// Core Make.com components
export { MAKE_TYPES } from './make/types';
export { MAKE_MODULES } from './make/modules';
export { MAKE_COMPREHENSIVE_MODULES, MAKE_ADVANCED_PATTERNS, MAKE_INTEGRATION_EXAMPLES } from './make/comprehensiveModules';
export { MAKE_FUNCTIONS_LIBRARY, MAKE_ADVANCED_EXPRESSIONS } from './make/functionsLibrary';
export { MAKE_SECURITY_PATTERNS, MAKE_SECURITY_EXAMPLES } from './make/securityPatterns';
export { MAKE_SCHEDULING_ADVANCED, MAKE_BUSINESS_EXAMPLES } from './make/advancedScheduling';
export { MAKE_ENTERPRISE_FEATURES, MAKE_ENTERPRISE_EXAMPLES } from './make/enterpriseFeatures';
export { MAKE_EXPRESSIONS } from './make/expressions';
export { MAKE_API_INTEGRATION } from './make/apiIntegration';
export { MAKE_DATABASE_INTEGRATION } from './make/databaseIntegration';
export { MAKE_NOTIFICATION_PATTERNS } from './make/notificationPatterns';
export { MAKE_PATTERNS } from './make/patterns';
export { MAKE_TESTING_QUALITY } from './make/testingQuality';
export { MAKE_INFRASTRUCTURE } from './make/infrastructure';
export { MAKE_AI } from './make/ai';
export { MAKE_ADVANCED } from './make/advanced';
export { VERIFIED_MODULE_NAMES, COMMON_MODULE_MISTAKES, MODULE_VALIDATION_NOTES } from './make/moduleValidation';
export { MAKE_BLUEPRINT_TEMPLATES, TEMPLATE_SELECTION_GUIDE } from './make/blueprintTemplates';
export { MAKE_MODULE_PARAMETERS, MAPPER_PATTERNS } from './make/moduleParameters';
export { validateMakeBlueprint, autoFixBlueprint, VALIDATION_EXAMPLES } from './make/blueprintValidation';

// Main knowledge base export function
export const getMakeKnowledgeBase = () => {
  return `# Make.com Automation Platform - Comprehensive Knowledge Base

## Platform Overview
Make.com (formerly Integromat) is a visual automation platform that connects apps and services through scenarios. It uses a visual editor with modules connected by lines to create automated workflows. The platform excels at connecting disparate systems and automating complex business processes through intuitive visual design.

## Core Concepts

### Scenarios
- **Definition**: Complete automation workflows that connect multiple apps and services
- **Structure**: Visual flowcharts with modules connected by lines representing data flow
- **Execution**: Triggered manually, on schedule, by webhooks, or through instant triggers
- **Data Flow**: Information passes between modules as "bundles" containing structured data
- **Scalability**: Can handle simple two-step automations to complex multi-branch workflows

### Modules
- **Triggers**: Initiate scenarios (webhooks, scheduled triggers, instant triggers, polling)
- **Actions**: Perform operations (create, update, delete, send, process records)
- **Searches**: Find and retrieve existing data without creating new records
- **Iterators**: Process arrays by converting them into individual bundles for sequential handling
- **Aggregators**: Combine multiple bundles back into arrays or structured data
- **Routers**: Split workflow into multiple conditional paths
- **Filters**: Control bundle flow based on specific criteria

### Bundles
- **Definition**: Individual data packages that flow through scenarios containing key-value pairs
- **Structure**: JSON-like objects with nested properties and arrays
- **Processing**: Each bundle processed independently through the entire scenario
- **Transformation**: Data can be modified, enriched, or restructured as it flows between modules
- **Limits**: Bundle size and processing time constraints apply based on plan

### Connections
- **Purpose**: Securely authenticate and connect to third-party services and APIs
- **Types**: OAuth 2.0, API keys, username/password, custom authentication methods
- **Scope**: Reusable across multiple scenarios within the organization
- **Security**: Encrypted storage and secure transmission of credentials
- **Testing**: Built-in connection testing and validation tools

## Functions & Expressions System

### String Functions
- **Text Manipulation**: capitalize, lower, upper, trim, replace, substring
- **Text Analysis**: contains, length, split, ascii encoding
- **Data Cleaning**: Format standardization, validation, sanitization
- **Pattern Matching**: Regular expressions for complex text processing

### Array Functions
- **Manipulation**: add, remove, slice, reverse, sort, unique
- **Access**: get items by index, join arrays into strings
- **Processing**: Length calculation, element validation
- **Transformation**: Convert between arrays and delimited strings

### Date Functions
- **Calculations**: addDays, addHours, dateDifference, now
- **Formatting**: formatDate with custom patterns, parseDate from strings
- **Manipulation**: setDate, startOfDay, timezone handling
- **Business Logic**: Working days, business hours, deadline calculations

### Math Functions
- **Basic Operations**: abs, ceil, floor, round with precision control
- **Statistical**: average, sum, min, max for arrays of numbers
- **Advanced**: Complex calculations, percentage computations
- **Financial**: Currency formatting, tax calculations, pricing logic

### General Functions
- **Conditional Logic**: if statements, switch cases for multi-condition logic
- **Data Validation**: isEmpty, isNumber, type checking functions
- **Type Conversion**: toString, toNumber, format transformations
- **Error Handling**: Null value management, default value assignment

## Integration Capabilities

### HTTP & API Integration
- **Custom Requests**: Full HTTP client with all methods (GET, POST, PUT, DELETE, PATCH)
- **Authentication**: Bearer tokens, API keys, OAuth 2.0, custom headers
- **Response Handling**: JSON, XML, HTML, binary data processing
- **Error Management**: Retry logic, timeout handling, status code processing
- **Rate Limiting**: Built-in respect for API limits and throttling

### Webhook System
- **Instant Triggers**: Real-time event reception from external systems
- **Custom Endpoints**: Generate unique URLs for receiving data
- **Security**: Signature validation, IP whitelisting, authentication
- **Data Processing**: Automatic parsing and structure recognition
- **Reliability**: Retry mechanisms and failure handling

### Database Integration
- **Built-in Data Stores**: NoSQL database for scenario data storage
- **External Databases**: MySQL, PostgreSQL, MongoDB connections
- **Operations**: Full CRUD operations, complex queries, transactions
- **Performance**: Connection pooling, query optimization, indexing
- **Migration**: Data import/export, schema management

### Pre-built Integrations
- **Popular Services**: 1000+ app integrations including Salesforce, HubSpot, Shopify
- **Enterprise Systems**: SAP, Oracle, Microsoft Dynamics integration
- **Communication**: Email, Slack, Teams, Discord, SMS platforms
- **Cloud Storage**: Google Drive, Dropbox, OneDrive, Amazon S3
- **Analytics**: Google Analytics, Facebook Ads, marketing platforms

## Workflow Patterns & Templates

### Common Automation Patterns
- **Data Synchronization**: Bi-directional sync between systems
- **Lead Processing**: Qualification, scoring, and routing workflows
- **Order Fulfillment**: E-commerce automation from order to delivery
- **Content Management**: Approval workflows and publishing automation
- **Customer Service**: Ticket routing and response automation

### Integration Strategies
- **API-First**: Direct API connections for real-time data flow
- **Webhook-Driven**: Event-based automation for immediate response
- **Batch Processing**: Scheduled large-scale data processing
- **Hub and Spoke**: Centralized data distribution to multiple systems
- **Event Sourcing**: Capture and replay business events

### Error Handling Patterns
- **Retry Logic**: Exponential backoff and circuit breaker patterns
- **Graceful Degradation**: Fallback mechanisms and default behaviors
- **Dead Letter Queues**: Failed message storage and manual processing
- **Monitoring**: Health checks, alerting, and performance tracking
- **Recovery**: Rollback procedures and compensation transactions

## AI & Intelligent Automation

### AI Integration
- **Natural Language Processing**: Text analysis, sentiment detection, translation
- **Machine Learning**: Predictive analytics, pattern recognition, classification
- **Content Generation**: AI-powered personalization and dynamic content creation
- **Decision Making**: AI-driven routing, scoring, and recommendation engines
- **Image Processing**: OCR, image recognition, and visual content analysis

### Intelligent Features
- **Smart Routing**: AI-powered decision trees for complex logic
- **Predictive Maintenance**: Failure prediction and preventive actions
- **Dynamic Personalization**: Real-time content adaptation based on user behavior
- **Anomaly Detection**: Automatic identification of unusual patterns or data
- **Optimization**: AI-driven performance tuning and resource allocation

## Infrastructure & Deployment

### Organization Management
- **Teams**: Role-based access control and collaboration features
- **Workspaces**: Logical grouping of scenarios and resources
- **Permissions**: Granular access control and security policies
- **Audit**: Comprehensive logging and compliance tracking
- **Scaling**: Enterprise features for large-scale deployments

### Variable Management
- **Scenario Variables**: Local variables for individual workflow execution
- **Custom Variables**: Organization-level configuration and settings
- **Environment Variables**: Secure storage of sensitive configuration data
- **Feature Flags**: Dynamic enabling/disabling of functionality
- **Configuration**: Environment-specific settings and parameters

### Deployment Strategies
- **Blueprint System**: Template-based scenario deployment and sharing
- **Version Control**: Track changes and enable rollback capabilities
- **Environment Promotion**: Systematic deployment across dev/staging/production
- **CI/CD Integration**: Automated testing and deployment pipelines
- **Custom Apps**: Build and deploy private integrations using SDK

## Blueprint JSON Structure (CRITICAL FOR AI GENERATION)

### Official Blueprint Format
Make.com blueprints must follow this EXACT structure for successful import:

\`\`\`json
{
  "name": "Scenario Name",
  "description": "Detailed description with setup instructions",
  "flow": [
    {
      "id": 1,
      "module": "webhook",
      "version": 1,
      "parameters": {},
      "mapper": {},
      "metadata": {
        "designer": { "x": 0, "y": 0 }
      }
    }
  ],
  "metadata": {
    "version": 1,
    "scenario": {
      "roundtrips": 1,
      "maxErrors": 3,
      "autoCommit": true,
      "autoCommitTriggerLast": true,
      "sequential": false,
      "confidential": false,
      "dataloss": false,
      "dlq": false,
      "freshVariables": false
    },
    "designer": { "orphans": [] }
  }
}
\`\`\`

### Correct Module Names (Use These Exact Names)
**CRITICAL: Use these exact module names for successful blueprint import**

**Built-in Modules:**
- **Webhook**: "webhook"
- **Iterator**: "builtin:iterator" 
- **Sleep**: "builtin:sleep"
- **Router**: "builtin:BasicRouter" (NOT "builtin:Router")
- **Filter**: "builtin:filter"
- **Aggregator**: "builtin:aggregator"
- **Set Variables**: "builtin:set-variables"
- **Break**: "builtin:break"

**AI & ML Modules:**
- **OpenAI**: "openai-gpt-3" (NOT "openai")
- **Anthropic Claude**: "anthropic-claude"

**Communication:**
- **Email**: "email"
- **Slack**: "slack"
- **Microsoft Teams**: "microsoft-teams"

**Productivity:**
- **Google Sheets**: "google-sheets"
- **Google Calendar**: "google-calendar"
- **Notion**: "notion"
- **Airtable**: "airtable"

**CRM & Sales:**
- **Salesforce**: "salesforce"
- **HubSpot**: "hubspot"

**Social Media:**
- **Facebook Pages**: "facebook-pages-2" (NOT "facebook-pages")
- **Instagram Business**: "instagram-business"
- **LinkedIn**: "linkedin"
- **Twitter**: "twitter"

**E-commerce & Payments:**
- **Shopify**: "shopify"
- **Stripe**: "stripe"
- **PayPal**: "paypal"

**Cloud Services:**
- **AWS SES**: "aws-ses"
- **AWS S3**: "aws-s3"
- **Google Drive**: "google-drive"

**Development:**
- **HTTP**: "http"
- **JSON**: "json"
- **Text Parser**: "text-parser"

**Database:**
- **MySQL**: "mysql"
- **PostgreSQL**: "postgresql"
- **MongoDB**: "mongodb"

### Blueprint Requirements
- Use "flow" array (NOT "scenario.modules")
- Include proper metadata section with scenario settings
- Use simple module names without complex namespace conventions
- Include designer coordinates for visual layout
- Add comprehensive description with setup instructions

### Module Name Validation
**CRITICAL VALIDATION RULES:**
- Always verify module names against working Make.com blueprints
- Test blueprint import before finalizing workflow generation
- Use exact casing and spelling as shown in verified examples
- Check for version suffixes (e.g., facebook-pages-2)
- Never guess module names - reference the verified module list

**Common Module Name Errors to Avoid:**
- ❌ "openai" → ✅ "openai-gpt-3"  
- ❌ "facebook-pages" → ✅ "facebook-pages-2"
- ❌ "builtin:Router" → ✅ "builtin:BasicRouter"
- ❌ "builtin:BasicIterator" → ✅ "builtin:iterator"
- ❌ "builtin:Sleep" → ✅ "builtin:sleep"
- ❌ "json:ParseJSON" → ✅ "json"

## Performance & Optimization

### Performance Patterns
- **Bulk Operations**: Process multiple records in single API calls
- **Parallel Processing**: Execute independent operations simultaneously
- **Caching**: Store frequently accessed data to reduce API calls
- **Lazy Loading**: Load data only when needed to optimize performance
- **Resource Management**: Efficient use of execution time and operations

### Monitoring & Observability
- **Execution Monitoring**: Real-time scenario performance tracking
- **Error Analytics**: Pattern analysis and failure investigation
- **Performance Metrics**: Throughput, latency, and resource utilization
- **Business Intelligence**: Workflow impact on business outcomes
- **Alerting**: Proactive notification of issues and anomalies

### Cost Optimization
- **Usage Analysis**: Track operations and identify optimization opportunities
- **Efficient Design**: Minimize unnecessary operations and API calls
- **Scheduling**: Optimize execution timing to reduce resource conflicts
- **Batch Processing**: Group operations to reduce per-transaction costs
- **Resource Planning**: Capacity planning and scaling strategies

## Testing & Quality Assurance

### Testing Approaches
- **Run Once**: Manual testing of individual modules and scenarios
- **Automated Testing**: Scheduled validation of scenario functionality
- **Integration Testing**: End-to-end workflow validation
- **Performance Testing**: Load testing and scalability validation
- **Error Testing**: Failure scenario and edge case validation

### Quality Practices
- **Documentation**: Comprehensive scenario and process documentation
- **Code Review**: Peer review of scenario logic and implementation
- **Validation**: Data quality checks and business rule enforcement
- **Monitoring**: Continuous health monitoring and alerting
- **Maintenance**: Regular updates and optimization reviews

## Security & Compliance

### Security Features
- **Encryption**: Data encryption at rest and in transit
- **Authentication**: Secure connection management and credential storage
- **Access Control**: Role-based permissions and audit trails
- **Network Security**: IP restrictions and secure communication protocols
- **Vulnerability Management**: Regular security updates and patches

### Compliance Support
- **Data Privacy**: GDPR, CCPA compliance features and controls
- **Industry Standards**: SOC 2, ISO 27001 compliance capabilities
- **Audit Trails**: Comprehensive logging for compliance reporting
- **Data Retention**: Configurable data retention and deletion policies
- **Geographic Controls**: Data residency and processing location control

This comprehensive knowledge base covers all aspects of Make.com's automation platform, from basic concepts to advanced enterprise features, providing everything needed to build sophisticated automation workflows.`;
};