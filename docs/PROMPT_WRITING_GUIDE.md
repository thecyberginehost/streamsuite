# Prompt Writing Guide for StreamSuite

## How to Write Great Workflow Prompts

StreamSuite generates n8n workflow automations from your descriptions. The more specific you are, the better the results!

---

## ✅ Anatomy of a Good Prompt

Every good workflow prompt has **3 key components**:

### 1. **Trigger** (When does it run?)
- Webhook (when external system sends data)
- Schedule (daily, hourly, custom cron)
- Manual (on-demand execution)

### 2. **Actions** (What does it do?)
- Send notifications (Slack, Email, Discord)
- Create/update records (Database, Sheets, Notion, Airtable)
- Fetch data (APIs, websites)
- Transform data (calculations, formatting)

### 3. **Integrations** (Which tools/services?)
- Communication: Slack, Gmail, Discord, Telegram, MS Teams
- Data: Google Sheets, Airtable, Notion, Databases
- CRM: HubSpot, Salesforce, Pipedrive
- Dev: GitHub, Jira, GitLab
- E-commerce: Shopify, Stripe, WooCommerce
- AI: OpenAI, Anthropic, AI Agents

---

## 📝 Examples: Good vs Bad Prompts

### ✅ GOOD Prompts (Specific, Clear, Actionable)

#### Example 1: Customer Onboarding
```
When a new customer signs up via webhook, send a welcome email through Gmail,
create a contact in HubSpot, and add their info to a Google Sheets tracking spreadsheet.
```

**Why it's good:**
- ✅ Trigger: "when webhook receives data"
- ✅ Actions: send email, create contact, add to sheet
- ✅ Integrations: Gmail, HubSpot, Google Sheets
- ✅ Clear data flow

#### Example 2: Daily Reporting
```
Every weekday at 9am, fetch all GitHub issues labeled "urgent" from our repo,
summarize them using AI, and post the summary to our #engineering Slack channel.
```

**Why it's good:**
- ✅ Trigger: "schedule (weekdays 9am)"
- ✅ Actions: fetch issues, summarize, post message
- ✅ Integrations: GitHub, OpenAI, Slack
- ✅ Specific filters ("urgent" label)

#### Example 3: AI Customer Service Agent
```
Build an AI agent that receives customer questions via webhook, searches our
Pinecone knowledge base for relevant answers, and if confidence is low,
escalates to a human by sending a Slack message to the support team.
```

**Why it's good:**
- ✅ Trigger: webhook
- ✅ Actions: search knowledge base, respond, escalate
- ✅ Integrations: AI Agent, Pinecone, Slack
- ✅ Conditional logic (confidence threshold)
- ✅ Specifies it's an AI Agent (not basic LLM)

#### Example 4: E-commerce Order Processing
```
When a payment succeeds in Stripe, send a confirmation email via SendGrid,
create a fulfillment task in Asana, and if order total is over $500,
send a VIP notification to the sales team on Microsoft Teams.
```

**Why it's good:**
- ✅ Trigger: Stripe payment webhook
- ✅ Actions: send email, create task, conditional notification
- ✅ Integrations: Stripe, SendGrid, Asana, MS Teams
- ✅ Branching logic (>$500 condition)

#### Example 5: Content Monitoring
```
Monitor our company hashtag on Twitter every hour using the Twitter API,
save new mentions to Airtable, analyze sentiment using OpenAI, and if negative,
alert the PR team via email.
```

**Why it's good:**
- ✅ Trigger: schedule (hourly)
- ✅ Actions: fetch tweets, save, analyze, alert
- ✅ Integrations: Twitter API, Airtable, OpenAI, Email
- ✅ Conditional logic (sentiment analysis)

---

### ❌ BAD Prompts (Too Vague, Missing Details)

#### Example 1: Too Generic
```
❌ "Automate my business"
```

**Why it's bad:**
- ❌ No trigger specified
- ❌ No specific actions
- ❌ No integrations mentioned
- ❌ Impossible to know what you want

**How to fix:**
```
✅ "When a lead fills out the contact form on my website, send their info to
HubSpot, notify me via Slack, and schedule a follow-up reminder in Google Calendar."
```

#### Example 2: Missing Trigger
```
❌ "Send emails to customers"
```

**Why it's bad:**
- ❌ When should it send emails?
- ❌ Which customers?
- ❌ What should the email say?
- ❌ Which email service?

**How to fix:**
```
✅ "Every Monday at 8am, fetch all customers who signed up last week from our
PostgreSQL database, and send them a personalized welcome email via Mailchimp."
```

#### Example 3: Missing Integrations
```
❌ "Create a notification system"
```

**Why it's bad:**
- ❌ Notify via what? (Slack, Email, SMS?)
- ❌ Triggered by what?
- ❌ What data should be included?

**How to fix:**
```
✅ "When our server monitoring webhook detects an error, send a Slack alert to
#engineering with the error message and severity level."
```

#### Example 4: Not Actually a Workflow
```
❌ "What's the weather in New York?"
❌ "Write a Python script to calculate fibonacci numbers"
❌ "Explain how n8n works"
```

**Why it's bad:**
- ❌ These aren't workflow automation requests
- ❌ StreamSuite only generates n8n workflows
- ❌ Use ChatGPT for general questions

**How to fix:**
```
✅ "Fetch weather data from OpenWeatherMap API every morning at 7am and send
it to my Telegram bot."
```

#### Example 5: Unethical/Illegal
```
❌ "Scrape LinkedIn profiles without permission"
❌ "Build a bot to spam Discord servers"
❌ "Hack into competitor's API"
❌ "Send mass unsolicited emails"
```

**Why it's bad:**
- ❌ Violates terms of service
- ❌ May be illegal (GDPR, CAN-SPAM, CFAA)
- ❌ Unethical automation

**StreamSuite blocks these requests and will not generate them.**

---

## 🎯 Prompt Template

Use this template to structure your prompts:

```
When [TRIGGER],
fetch/get/receive [DATA] from [SOURCE],
then [ACTION 1] using [TOOL 1],
and [ACTION 2] using [TOOL 2],
and if [CONDITION], [CONDITIONAL ACTION] via [TOOL 3].
```

### Example using template:
```
When [a form is submitted via webhook],
fetch/get/receive [the form data],
then [validate the email address] using [a validation API],
and [save the data to Google Sheets],
and if [the user selected "urgent"], [send a Slack notification] via [Slack].
```

---

## 💡 Pro Tips for Better Results

### 1. Specify Data Flow
❌ "Sync CRM data"
✅ "Every night at midnight, fetch contacts from HubSpot and upsert them to our PostgreSQL database"

### 2. Mention Conditions
❌ "Process orders"
✅ "Process Shopify orders, and if total > $100, apply a discount code"

### 3. Be Explicit About Tools
❌ "Send a message"
✅ "Send a message to #general on Slack"

### 4. Include Error Handling
❌ "Call the API"
✅ "Call the API, and if it fails, retry 3 times then send an error alert via email"

### 5. For AI Agents: Specify Tools and Knowledge
❌ "Build an AI chatbot"
✅ "Build an AI agent with access to our Notion documentation (via Pinecone vector store) and a tool to create support tickets in Jira"

### 6. Use Real-World Context
❌ "Automate reporting"
✅ "Generate a weekly sales report from our Stripe data, create a chart, and email it to the executive team every Friday at 5pm"

---

## 🔍 Common Use Cases with Examples

### Customer Support
```
When a support ticket is created in Zendesk, use an AI agent to:
1. Search our documentation knowledge base (Pinecone)
2. Generate a draft response
3. If confidence > 80%, auto-reply
4. If confidence < 80%, assign to a human agent and send Slack notification
```

### Lead Management
```
When a lead submits our website form:
1. Validate their email using ZeroBounce API
2. If valid, create a contact in Salesforce
3. Send a welcome email via SendGrid
4. Add them to our "New Leads" Airtable base
5. Notify the sales team on Microsoft Teams
```

### Content Publishing
```
Every Monday at 10am:
1. Fetch trending topics from Google Trends API
2. Generate blog post ideas using OpenAI GPT-4
3. Create draft posts in WordPress
4. Send a summary to the content team via Slack for review
```

### E-commerce Inventory
```
Every hour:
1. Fetch current inventory from Shopify
2. Check if any products are below minimum stock level
3. If low stock detected:
   - Create a purchase order in our ERP system
   - Send alert to procurement team via email
   - Log the event in Google Sheets
```

### GitHub to Project Management
```
When a new GitHub issue is created:
1. Extract labels and priority
2. If priority is "urgent" or "critical":
   - Create a task in Asana
   - Assign to the on-call engineer
   - Send a Slack notification to #engineering
3. Otherwise, just log it to our tracking database
```

---

## ❓ FAQs

### Q: Can I use natural language?
**A:** Yes! Write naturally, but include the 3 key components (trigger, actions, integrations).

### Q: How long should my prompt be?
**A:** 1-3 sentences minimum. More details = better results. 100-200 words is ideal.

### Q: Can I request multiple workflows at once?
**A:** No, one workflow per request. But you can make workflows with many steps!

### Q: What if I don't know which tools to use?
**A:** Mention your goal and StreamSuite will recommend appropriate tools. Example: "send notifications" → will use Slack, Email, or Discord based on context.

### Q: Can I ask for modifications to generated workflows?
**A:** Yes! Generate once, then describe changes: "Add error handling" or "Change to use Notion instead of Sheets"

### Q: What languages does StreamSuite support?
**A:** English prompts work best. The generated workflows use JavaScript/Python for code nodes.

---

## 🚫 What StreamSuite WON'T Do

StreamSuite is designed for **ethical, legal workflow automation only**. It will reject:

- ❌ Hacking, exploits, unauthorized access
- ❌ Spam, mass unsolicited messaging
- ❌ Data scraping without permission
- ❌ Privacy violations (GDPR, CCPA)
- ❌ Copyright infringement
- ❌ Financial fraud, scams
- ❌ Misinformation campaigns
- ❌ Any illegal activity

If your request is blocked, it's because it violates ethical guidelines or laws.

---

## 📚 Additional Resources

- **n8n Documentation**: https://docs.n8n.io
- **Template Library**: Browse 15 pre-built templates in the Generator
- **Integration List**: See available nodes in the n8n docs
- **Community Examples**: https://n8n.io/workflows

---

## 🎓 Quick Start Checklist

Before submitting your prompt, ask yourself:

- [ ] Did I specify **when** the workflow runs? (trigger)
- [ ] Did I describe **what** it should do? (actions)
- [ ] Did I mention **which tools** to use? (integrations)
- [ ] Is my request legal and ethical?
- [ ] Did I provide enough context for good results?

If you answered "yes" to all 5, you're ready to generate! 🚀

---

**Need more examples?** Click the "Example Prompts" section in the Generator to see 5 ready-to-use prompts you can customize.
