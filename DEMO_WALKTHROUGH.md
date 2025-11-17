# StreamSuite Investor Demo Walkthrough

**Duration**: 15-20 minutes
**Goal**: Showcase core AI workflow generation capabilities, subscription tier differentiation, and n8n integration

---

## Pre-Demo Setup

### Account Configuration
1. **Pro Plan Account** (primary demo) - Shows auto-save, n8n push, template access
2. **Free/Starter Account** (optional) - Shows manual save button, upgrade prompts
3. **n8n Instance Connected** - Required for push/activate/monitor features

### Environment Check
- Ensure sufficient credits (10+ for demo)
- n8n instance is running and accessible
- Dark mode OFF (better for presentations)

---

## Demo Script

### PART 1: The Problem (30 seconds)

**Talking Points:**
> "Building workflow automations today requires deep platform knowledge. Teams spend hours learning n8n syntax, debugging JSON structures, and converting between platforms. StreamSuite solves this with AI that generates production-ready workflows in seconds."

---

### PART 2: AI Workflow Generation (4-5 minutes)

#### Demo 2.1: Simple Workflow

**Navigate to**: Generator page (default route)

**Show these elements:**
- Credit balance in top bar (e.g., "87 Credits")
- Platform selector (n8n selected)
- Auto-Save Status indicator (green badge: "Auto-Save Activated")

**Prompt to use:**
```
Create a workflow that monitors a Google Sheet for new rows,
extracts the email and name columns, then sends a personalized
welcome email via Gmail
```

**Highlight during generation:**
- Real-time generation (streaming if implemented)
- Credit cost estimation before clicking Generate
- Token usage and generation stats

**After generation:**
- Show the JSON viewer with syntax highlighting
- Point out: "Generated in seconds, not hours"
- Note: "Auto-saved to History" toast notification (Pro feature)

---

#### Demo 2.2: Complex Workflow with Custom Code Node

**This is the KEY demo** - Shows AI generating custom JavaScript/Python code

**Prompt to use:**
```
Build a workflow that:
1. Receives a webhook with customer order data (JSON payload)
2. Uses a Code node to calculate:
   - Total order value with 8% tax
   - Shipping cost based on weight (free over $100)
   - Loyalty points (1 point per $10 spent)
3. Enriches the data by calling a REST API to get customer tier
4. Routes to different Slack channels based on order value:
   - Under $50: #small-orders
   - $50-200: #medium-orders
   - Over $200: #vip-orders (tag @sales-team)
5. Logs everything to a Google Sheet
```

**Why this prompt works:**
- Forces AI to generate a **Code node** with actual JavaScript
- Shows complex business logic (tax calculation, conditional routing)
- Demonstrates multi-service integration (Webhook, HTTP Request, Slack, Google Sheets)
- Proves AI understands n8n's node types and parameters

**Key points to highlight:**
1. **Code Node Generation**: Expand the Code node in the JSON viewer
   ```javascript
   // AI-generated code for tax + shipping + loyalty calculation
   const orderValue = $input.item.json.amount;
   const weight = $input.item.json.weight;
   const tax = orderValue * 0.08;
   const shipping = orderValue > 100 ? 0 : weight * 2.5;
   const loyaltyPoints = Math.floor(orderValue / 10);

   return {
     subtotal: orderValue,
     tax: tax,
     shipping: shipping,
     total: orderValue + tax + shipping,
     loyaltyPoints: loyaltyPoints
   };
   ```

2. **Switch/Router Node**: Show the conditional routing logic
3. **Complete JSON Structure**: Valid n8n format ready to import
4. **Node Connections**: Properly connected workflow graph

**Talking Point:**
> "This workflow would take a developer 30-60 minutes to build manually. StreamSuite generated it in under 30 seconds, including the custom JavaScript code. That's the power of AI that truly understands automation platforms."

---

### PART 3: n8n Integration (4-5 minutes)

#### Demo 3.1: Push to n8n

**Prerequisites**: Must have n8n connection configured in Settings

**Steps:**
1. After generating a workflow, click **"Push to n8n"** button
2. Show the dialog:
   - Connection selection dropdown
   - Workflow name customization
   - Note: "Workflow will be created as inactive"
3. Click **"Push Workflow"**
4. Wait for success toast: "Workflow pushed successfully!"

**Talking Point:**
> "No more copy-paste. One click deploys your AI-generated workflow directly to your n8n instance. It's created as inactive so you can review before activating."

---

#### Demo 3.2: View & Activate Workflows

**Navigate to**: Settings → n8n Connections → View Workflows

**Show:**
1. Connection status (Active, last tested)
2. Click **"View Workflows"** button
3. In the dialog:
   - **All Workflows** tab: Shows every workflow in n8n instance
   - **Pushed from StreamSuite** tab: Shows only StreamSuite-pushed workflows
4. Find the workflow you just pushed
5. Click the **Activate/Deactivate toggle**
6. Show toast: "Workflow activated successfully"

**Talking Point:**
> "Full control over your n8n instance directly from StreamSuite. Activate workflows when ready, pause them for maintenance - all without leaving the platform."

---

### PART 4: Auto-Save & History Management (2-3 minutes)

#### Demo 4.1: Auto-Save Feature

**Show on Generator page:**
1. Point to the **Auto-Save Status indicator** at the top
   - Green badge: "Auto-Save Activated - All workflows automatically saved"
2. Generate any simple workflow
3. Show toast: "Workflow generated and saved!"
4. Navigate to **History** page immediately
5. Show the workflow appears instantly - no manual action needed

**Talking Point:**
> "Pro users get auto-save. Every workflow generated is automatically preserved in your history. No lost work, complete audit trail of everything you've built."

---

#### Demo 4.2: History Page Features

**Navigate to**: History page

**Show:**
1. List of all generated workflows with metadata:
   - Workflow name and platform
   - Creation date/time
   - Credits used
   - Status (success/failed)
2. **Search functionality**: Type to filter workflows
3. **Actions** for each workflow:
   - **View**: See full JSON
   - **Copy**: Copy JSON to clipboard
   - **Download**: Export as .json file
   - **Delete**: Remove from history
4. **Save as Template** option (if available)

**Talking Point:**
> "Complete history of every workflow you've generated. Search, export, reuse. Never recreate the same workflow twice."

---

### PART 5: Monitoring & Execution Tracking (2-3 minutes)

**Navigate to**: Monitoring page (Growth plan feature)

**Show:**
1. All connected n8n instances
2. Click on a connection to see:
   - All workflows in that instance
   - Active/Inactive status
   - Execution history (last 20 executions)
3. For a workflow with executions:
   - Show execution status (Success/Failed/Running)
   - Execution timestamps
   - **Retry Failed** button for failed executions

**Talking Point:**
> "Real-time monitoring of your n8n workflows. See execution history, retry failed runs, all from one dashboard. This is operational visibility that teams need."

---

### PART 6: Prompt Guide (1-2 minutes)

**Navigate to**: Prompt Guide page

**Show:**
1. Categories of prompts:
   - Data Integration
   - Marketing Automation
   - CRM & Sales
   - DevOps
   - E-commerce
2. Click on a category to see example prompts
3. Each prompt shows:
   - Use case description
   - Expected complexity
   - Sample prompt text
4. "Use This Prompt" button to auto-fill in Generator

**Talking Point:**
> "Not sure how to describe what you need? The Prompt Guide gives you proven templates. Click and generate - lowering the barrier for non-technical users."

---

### PART 7: Subscription Tiers & Business Model (2-3 minutes)

**Navigate to**: Settings page

**Show:**
1. Current subscription plan card:
   - Plan name and badge
   - Monthly credits included
   - Included features list
2. Click **"View Plans"** button
3. Show the **Plans Dialog** (popup - doesn't leave page):
   - Side-by-side comparison of all plans
   - Pricing: Free → $19 → $49 → $99 → $499
   - Feature progression (Free: 5 credits, Pro: 100 credits + n8n push)
   - "Current Plan" badge on user's plan
   - Upgrade buttons

**Key Differentiators to Highlight:**
- **Free**: 5 credits, basic generation
- **Starter ($19)**: 25 credits, templates access (3), manual history save
- **Pro ($49)**: 100 credits, auto-save history, n8n push (1 connection)
- **Growth ($99)**: 250 credits, batch generation, n8n monitoring (3 connections)
- **Agency ($499)**: 750 credits, unlimited n8n connections, team features

**Talking Point:**
> "Clear subscription tiers with predictable pricing. Users start free, upgrade as they see value. Our margins are 80-90% - sustainable unit economics from day one."

---

### PART 8: Batch Generation (Optional - Growth+ Feature)

**Navigate to**: Batch Generator page

**Show:**
1. Batch credit counter
2. Single prompt generates multiple related workflows
3. Example prompt:
   ```
   Create a complete e-commerce automation suite:
   - Order confirmation emails
   - Inventory low stock alerts
   - Customer review requests (7 days post-purchase)
   - Abandoned cart recovery
   - VIP customer detection
   ```
4. Show all generated workflows as a set
5. Download entire package or individual workflows

**Talking Point:**
> "Batch generation creates entire workflow suites from a single prompt. One batch credit generates up to 10 related workflows. Perfect for agencies deploying comprehensive automation solutions."

---

## Closing (1 minute)

**Key Metrics to Mention:**
- Generation time: <30 seconds (vs 30-60 minutes manual)
- Accuracy: 95%+ valid n8n JSON output
- Cost per generation: ~$0.05 (AI costs)
- User margins: 80-90% per credit
- TAM: $10B+ workflow automation market

**Call to Action:**
> "StreamSuite transforms how businesses build automation. We're seeking $X funding to scale AI model training, expand platform support (Make.com, Zapier), and accelerate go-to-market. Let's discuss how we can revolutionize workflow automation together."

---

## Backup Demos (If Time Permits)

### Debugger
- Paste a broken workflow JSON
- AI identifies issues and suggests fixes
- One-click to apply suggested repairs

### Templates Page
- Show pre-built workflow templates
- Starter users see 3 templates (tier restriction)
- Pro+ users see all templates
- Click to use and customize

### Connection Limits
- Show Settings with connection count (e.g., "1/1 connections used" for Pro)
- Demonstrate limit enforcement
- Show upgrade prompt when hitting limit

---

## Demo Troubleshooting

### If AI generation fails:
- Check credits balance
- Verify Supabase Edge Function is deployed
- Fallback: Show pre-generated workflow JSON

### If n8n push fails:
- Test connection first in Settings
- Check n8n instance is accessible
- Verify API key permissions (create workflow scope)

### If monitoring doesn't show data:
- Ensure workflows have been executed in n8n
- Check Edge Function logs for proxy errors
- Fallback: Show the monitoring UI with explanation

---

## Post-Demo Artifacts

### Things to Have Ready:
1. Screenshots of generated workflows imported in n8n
2. Video recording of successful push and activation
3. Credit usage reports showing AI cost efficiency
4. Competitive analysis (Activepieces, n8n Cloud, etc.)
5. Product roadmap (Make.com support Dec 2025, Zapier Jan 2026)

### Follow-up Materials:
- Technical architecture diagram
- Database schema overview
- Security documentation (RLS, API key handling)
- Financial projections with unit economics

---

**Remember**: The demo should feel effortless. Each feature flows naturally into the next. Practice the transitions and have backup prompts ready. The goal is to show investors that StreamSuite isn't just an idea - it's a working product with real differentiation.

**Good luck with your demo!** 🚀
