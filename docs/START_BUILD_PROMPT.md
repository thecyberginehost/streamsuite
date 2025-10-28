# StreamSuite MVP - Build Session Prompt

Copy and paste this prompt into your next Claude session to start building the MVP.

---

## 📋 Prompt for Next Session

```
I need you to build the StreamSuite MVP following the comprehensive build guide in this codebase.

PROJECT CONTEXT:
StreamSuite is an AI-powered SaaS that generates n8n workflow automations from natural language. Users describe what they want in plain English, and the app generates production-ready n8n JSON they can download and import.

WHAT'S ALREADY DONE:
✅ Complete React + Vite + TypeScript setup
✅ All shadcn/ui components installed
✅ Supabase integration configured
✅ 15 production-ready n8n workflow templates
✅ Comprehensive n8n knowledge base
✅ App routing structure in src/App.tsx
✅ All documentation and build guides

WHAT NEEDS TO BE BUILT (in order of priority):

1. SERVICE LAYER (src/services/):
   - aiService.ts - Claude API integration for workflow generation
   - templateService.ts - Load and recommend n8n templates
   - workflowService.ts - Save/load workflows to Supabase

2. PAGE COMPONENTS (src/pages/):
   - Login.tsx - Authentication page with Supabase
   - Dashboard.tsx - Main layout with sidebar navigation
   - Generator.tsx - Core workflow generation interface (MOST IMPORTANT)
   - NotFound.tsx - 404 page

3. WORKFLOW COMPONENTS (src/components/workflow/):
   - WorkflowJsonViewer.tsx - Display generated JSON with syntax highlighting
   - TemplateRecommendation.tsx - Show recommended templates
   - DownloadButton.tsx - Download workflow as .json file

4. LAYOUT COMPONENTS (src/components/):
   - Sidebar.tsx - Navigation sidebar
   - TopBar.tsx - Top navigation with credits and user menu

CRITICAL REQUIREMENTS:
- Follow MVP_BUILD_GUIDE.md EXACTLY - it has complete implementation details
- The Generator page is the CORE VALUE - make it exceptional
- Use the n8n knowledge base and templates in src/lib/n8n/
- Implement proper error handling and loading states
- Make the AI generation production-quality with comprehensive system prompts
- Use existing shadcn/ui components from src/components/ui/
- Supabase database schema is in SUPABASE_SETUP.sql (already provided)

ENVIRONMENT:
- I will set up .env file separately following ENV_SETUP_CHECKLIST.md
- Assume environment variables are available: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_CLAUDE_API_KEY

KEY FILES TO REFERENCE:
1. MVP_BUILD_GUIDE.md - Complete implementation specifications
2. CLAUDE.md - Project context and architecture
3. src/lib/n8n/workflowTemplates.ts - Template system
4. src/lib/n8nKnowledgeBase.ts - n8n knowledge for AI prompts

BUILD APPROACH:
1. Start with aiService.ts (the brain of the app)
2. Build Generator.tsx next (the core UI)
3. Build Login.tsx and Dashboard.tsx for structure
4. Add workflow components for JSON display
5. Test end-to-end workflow generation

QUALITY STANDARDS:
- Production-ready code with TypeScript types
- Comprehensive error handling
- Loading states for all async operations
- Toast notifications for user feedback
- Clean, modern UI matching the brand
- Follow existing code patterns in the codebase

Please read MVP_BUILD_GUIDE.md carefully and start building the missing components. Ask me if you need any clarification on requirements.
```

---

## 📁 Files to Have Ready

Before starting the session, make sure these files are accessible:

**Critical Build Files:**
1. `MVP_BUILD_GUIDE.md` - Main build specifications
2. `CLAUDE.md` - Project context
3. `ENV_SETUP_CHECKLIST.md` - Environment setup guide
4. `SUPABASE_SETUP.sql` - Database schema

**Reference Files:**
5. `src/lib/n8n/workflowTemplates.ts`
6. `src/lib/n8nKnowledgeBase.ts`
7. `src/App.tsx` - Existing routing structure
8. `package.json` - Dependencies reference

---

## 🔧 Before Starting Build Session

**Complete these steps first:**

1. **Set up Supabase:**
   ```bash
   # Create project at supabase.com
   # Run SUPABASE_SETUP.sql in SQL Editor
   # Get URL and anon key
   ```

2. **Get Claude API key:**
   ```bash
   # Go to console.anthropic.com
   # Create new API key
   ```

3. **Create .env file:**
   ```bash
   cp .env.example .env
   # Fill in: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_CLAUDE_API_KEY
   ```

4. **Install dependencies:**
   ```bash
   npm install
   ```

5. **Install Anthropic SDK (if not installed):**
   ```bash
   npm install @anthropic-ai/sdk
   ```

---

## ✅ Session Success Criteria

The build session is successful when:

- [x] aiService.ts generates valid n8n workflows from prompts
- [x] Generator page has working UI with prompt input
- [x] Claude API integration works end-to-end
- [x] Generated workflows can be downloaded as JSON
- [x] Template recommendation system works
- [x] Login/authentication works with Supabase
- [x] Dashboard layout renders correctly
- [x] No TypeScript errors
- [x] App runs on `npm run dev`

---

## 🎯 Expected Timeline

**If Claude works efficiently:**
- Services layer: 30-45 minutes
- Page components: 45-60 minutes
- Workflow components: 20-30 minutes
- Testing and fixes: 30 minutes
- **Total: 2-3 hours**

---

## 💡 Tips for Success

1. **Read MVP_BUILD_GUIDE.md first** - Don't skip this, it has everything
2. **Build in order** - Services → Pages → Components
3. **Test as you go** - Don't wait until the end
4. **Use existing patterns** - Check how other hooks/components work
5. **Ask for clarification** - If anything is unclear in the guide

---

## 🚨 Common Issues to Avoid

1. ❌ Don't rebuild existing components (use what's in src/components/ui/)
2. ❌ Don't skip error handling
3. ❌ Don't forget loading states
4. ❌ Don't hardcode values (use environment variables)
5. ❌ Don't skip TypeScript types

---

## 📞 After Build is Complete

Run these commands to verify:

```bash
# Check for TypeScript errors
npx tsc --noEmit

# Start development server
npm run dev

# Test the app
# 1. Go to http://localhost:5173
# 2. Sign up with test account
# 3. Generate a workflow with prompt: "Send email when webhook triggered"
# 4. Download the generated JSON
# 5. Verify it's valid n8n format
```

---

## 🎉 Ready to Build!

Copy the prompt above, start a new Claude session, paste it, and let Claude build your MVP!

**Good luck! 🚀**
