# StreamSuite

> AI-powered workflow generation and conversion for n8n, Make.com, and Zapier

**StreamSuite** is a SaaS platform that uses AI to generate, convert, and debug automation workflows across multiple platforms.

## 🚀 What StreamSuite Does

1. **Generate** workflows from natural language descriptions
2. **Convert** workflows between n8n, Make.com, and Zapier
3. **Debug** broken workflows with AI-powered error detection and fixes

## 🎯 Target Market

- **SMBs** migrating between automation platforms
- **Agencies** building workflows for clients
- **Operations teams** automating business processes
- **Developers** working with n8n/Make/Zapier

## 💰 Business Model

Credit-based subscription pricing:
- **Free**: 5 credits/month
- **Starter**: $19/month (50 credits)
- **Pro**: $49/month (200 credits)
- **Team**: $149/month (800 credits)
- **Enterprise**: $499/month (3,500 credits)

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: shadcn/ui + Tailwind CSS
- **Backend**: Supabase (Auth + Database)
- **AI**: Claude Sonnet 4.5 + Haiku 3.5
- **State Management**: TanStack Query
- **Routing**: React Router DOM

## 📦 Project Structure

```
construct03-main/
├── src/                      # Application source code
│   ├── components/
│   │   ├── ui/               # shadcn/ui components
│   │   └── workflow/         # workflow-specific components
│   ├── pages/
│   │   ├── Generator.tsx     # AI workflow generation (default route)
│   │   ├── Converter.tsx     # Platform conversion
│   │   ├── Debugger.tsx      # Workflow debugging
│   │   ├── History.tsx       # User workflow history
│   │   └── Settings.tsx      # User settings
│   ├── services/
│   │   ├── aiService.ts      # Claude API integration
│   │   ├── assistantService.ts # StreamBot AI assistant (GPT-4o)
│   │   ├── converterService.ts
│   │   └── validatorService.ts
│   ├── hooks/                # React hooks
│   ├── lib/                  # Utilities and n8n templates
│   └── integrations/
│       └── supabase/         # Supabase client
├── docs/                     # Project documentation
│   ├── QUICKSTART.md         # Quick setup guide
│   ├── AI_ASSISTANT_FEATURE.md
│   └── [30+ feature docs]
├── database/                 # SQL migrations and setup scripts
│   ├── SUPABASE_COMPLETE_SETUP.sql
│   ├── supabase_fix_workflows_table.sql
│   └── [database scripts]
├── examples/                 # Example workflows
│   └── ai_agent_workflow.json
├── CLAUDE.md                 # Claude Code instructions
├── README.md                 # This file
└── package.json
```

## 🚦 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🔑 Environment Variables

Create a `.env` file:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_CLAUDE_API_KEY=your_claude_api_key
```

## 🎨 Brand

- **Name**: StreamSuite
- **Domain**: streamsuite.io (primary), getstreamsuite.com (redirect)
- **Tagline**: "Build workflow automations in 30 seconds"
- **Colors**: Deep Navy (#0A1F44) primary, Electric Blue (#0EA5E9) accent

## 📈 Roadmap

### MVP (Week 1-2)
- [x] Project setup
- [ ] n8n JSON generator
- [ ] Make.com → n8n converter
- [ ] Basic UI

### Phase 2 (Week 3-4)
- [ ] User authentication
- [ ] Credit system
- [ ] Payment integration (Stripe)
- [ ] Workflow history

### Phase 3 (Week 5-8)
- [ ] Bidirectional conversion (n8n ↔ Make)
- [ ] Zapier code generation
- [ ] Advanced debugging
- [ ] Batch operations

### Phase 4 (Week 9-12)
- [ ] Enterprise features
- [ ] API access
- [ ] Template marketplace
- [ ] Analytics dashboard

## 📄 License

UNLICENSED - Proprietary software

## 🔗 Links

- **Website**: https://streamsuite.io
- **Docs**: Coming soon
- **Support**: support@streamsuite.io

---

Built with ⚡ by the StreamSuite team
