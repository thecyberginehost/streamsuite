# n8n Workflow Templates

This directory contains 15 curated n8n workflow templates sourced from the n8n community and Hostinger n8n server.

## 📋 Template Catalog

### AI & Chatbots (4 templates)
- **telegram-ai-chatbot-with-image-generation.json** - Telegram bot with OpenAI chat and DALL-E image generation
- **twilio-sms-chatbot-with-redis.json** - SMS chatbot with Redis memory and debouncing
- **appointment-scheduling-with-cal-twilio.json** - AI appointment booking via SMS with Cal.com integration
- **mongodb-ai-travel-planner-agent.json** - Travel assistant with MongoDB Atlas vector search

### Document Processing (4 templates)
- **pdf-qa-with-pinecone-vector-search.json** - PDF Q&A using Pinecone vector database
- **audio-transcription-summary-to-notion.json** - Audio transcription with GPT-4 summarization
- **notion-ai-workflow-generator.json** - Meta-workflow that generates other n8n workflows
- **website-seo-audit-with-ai.json** - Comprehensive on-page SEO analysis

### Marketing Automation (3 templates)
- **linkedin-post-automation-with-approval.json** - LinkedIn content scheduling with approval workflow
- **personalized-email-marketing-with-ai.json** - AI-powered email personalization with segmentation
- **blog-content-automation-wordpress.json** - End-to-end blog content creation and publishing

### CRM & Sales (2 templates)
- **linkedin-lead-scoring-to-google-sheets.json** - AI lead scoring and qualification
- **hubspot-customer-onboarding-automation.json** - Automated customer onboarding pipeline

### Productivity (2 templates)
- **outlook-calendar-sync-to-notion.json** - Bi-directional calendar sync
- **ms-teams-weekly-report-summarizer.json** - AI-powered team activity reports

## 🔒 Legal & Licensing

All templates are provided under the **Apache 2.0 / Fair Code License** from n8n.

**You are legally permitted to:**
- ✅ Use these templates commercially
- ✅ Modify and adapt them
- ✅ Distribute them to users
- ✅ Include them in your SaaS product

**Attribution (recommended):**
```
Template sourced from n8n community (https://n8n.io)
```

## ⚠️ Important: Sanitization Required

These templates contain **user-specific data** that must be sanitized before production use:

### What needs to be removed:
1. **Credential IDs** - Example: `"id": "C6ueSke246Slwxww"`
   - Replace with: `"id": "USER_CREDENTIAL"`

2. **Instance IDs** - Example: `"instanceId": "1d1680ff..."`
   - Remove entirely from `meta` section

3. **Personal Emails** - Example: `shindearyan179@gmail.com`
   - Replace with: `user@example.com`

4. **Webhook IDs** - Generate new random IDs
   - Replace with: `crypto.randomUUID()`

5. **Hardcoded URLs/IDs** - Google Sheets, Airtable, etc.
   - Replace with: Placeholder values or variables

### Automated Sanitization

Use the provided `templateLoader.ts` utility:

```typescript
import { sanitizeWorkflowJson } from '@/lib/n8n/templateLoader';

const rawTemplate = await fetch('/templates/telegram-ai-chatbot.json');
const sanitized = sanitizeWorkflowJson(await rawTemplate.json());
```

## 📦 Usage in StreamSuite

### Loading Templates

```typescript
import {
  N8N_WORKFLOW_TEMPLATES,
  getTemplateById,
  searchTemplates
} from '@/lib/n8nKnowledgeBase';

// Get template metadata
const template = getTemplateById('telegram-ai-chatbot-image');

// Search templates
const results = searchTemplates('linkedin');

// Get by category
const chatbots = getTemplatesByCategory('AI & Chatbots');
```

### Template Recommendation

```typescript
import { recommendTemplate } from '@/lib/n8n/templateLoader';

// AI-powered template matching
const userIntent = "I want to create a chatbot for customer support via SMS";
const recommended = recommendTemplate(userIntent);
// Returns: [twilio-sms-chatbot-with-redis, appointment-scheduling-with-cal-twilio]
```

### Display in UI

```typescript
import { formatTemplateForDisplay } from '@/lib/n8n/templateLoader';

const template = getTemplateById('pdf-qa-pinecone-vector');
const markdown = formatTemplateForDisplay(template);
// Renders as formatted markdown with all template details
```

## 🏗️ Template Structure

Each template JSON follows n8n's standard workflow schema:

```json
{
  "name": "workflow-name",
  "nodes": [
    {
      "id": "unique-node-id",
      "name": "Node Name",
      "type": "n8n-nodes-base.nodeName",
      "position": [x, y],
      "parameters": { ... },
      "credentials": { ... }
    }
  ],
  "connections": { ... },
  "settings": { ... },
  "meta": { ... }
}
```

## 🎯 Integration Requirements

Most templates require these common integrations:

**AI Services:**
- OpenAI (GPT-4, GPT-4o-mini, DALL-E, Whisper)
- Anthropic Claude
- Google Gemini

**Communication:**
- Telegram
- Twilio
- Microsoft Teams
- Gmail
- Slack

**Productivity:**
- Notion
- Google Calendar
- Google Sheets
- Airtable
- Microsoft Outlook

**CRM & Sales:**
- HubSpot
- LinkedIn (via Ghost Genius API)

**Databases:**
- MongoDB Atlas
- Pinecone
- Redis

**Content & Publishing:**
- WordPress
- Perplexity

## 🚀 Template Complexity Levels

**Beginner (0 templates)**
- Simple linear workflows
- 3-6 nodes
- Single integration

**Intermediate (7 templates)**
- Conditional logic
- 8-14 nodes
- 2-4 integrations

**Advanced (8 templates)**
- AI agents
- 15+ nodes
- 4+ integrations
- Complex error handling

## 📊 Template Statistics

```
Total Templates: 15
Categories: 5
Unique Integrations: 25+
Total Nodes: ~200
Average Complexity: Advanced
```

## 🛠️ Development Notes

### Adding New Templates

1. Export workflow from n8n as JSON
2. Rename file descriptively (lowercase-with-hyphens.json)
3. Add metadata to `workflowTemplates.ts`
4. Update this README
5. Test sanitization with `templateLoader.ts`

### Testing Templates

```bash
# Validate JSON structure
npm run validate-templates

# Test sanitization
npm run test-sanitization

# Generate template stats
npm run template-stats
```

## 🐛 Known Issues

1. **Credential References** - Templates reference original user's credentials by ID
   - **Solution**: Sanitize before use (see above)

2. **Webhook URLs** - May contain instance-specific webhook endpoints
   - **Solution**: Regenerate webhook IDs on import

3. **Resource IDs** - Hardcoded Google Sheet IDs, Airtable base IDs, etc.
   - **Solution**: Replace with user variables

4. **Version Compatibility** - Templates tested with n8n 1.x
   - **Solution**: May need minor adjustments for future n8n versions

## 📚 Additional Resources

- [n8n Documentation](https://docs.n8n.io)
- [n8n Community Templates](https://n8n.io/workflows)
- [n8n GitHub](https://github.com/n8n-io/n8n)
- [StreamSuite SaaS Documentation](https://streamsuite.io/docs)

## 🤝 Contributing

To suggest new templates or improvements:

1. Test workflow thoroughly in n8n
2. Export as JSON
3. Sanitize credentials and personal data
4. Submit with detailed use case description
5. Include required integrations list

---

**Last Updated:** 2025-10-11
**Template Count:** 15
**License:** Apache 2.0 / Fair Code
