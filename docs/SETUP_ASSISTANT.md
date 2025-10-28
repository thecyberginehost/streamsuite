# Quick Setup Guide for StreamBot AI Assistant

## 1. Get Your OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign in or create an account
3. Navigate to API Keys: https://platform.openai.com/api-keys
4. Click **"Create new secret key"**
5. Copy the key (starts with `sk-...`)

## 2. Add API Key to Environment

Create or update `.env` file in the project root:

```bash
# Existing keys
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
VITE_CLAUDE_API_KEY=your_claude_key
VITE_STRIPE_PUBLIC_KEY=your_stripe_key

# NEW: Add this line
VITE_OPENAI_API_KEY=sk-your-openai-key-here
```

**Important**: Replace `sk-your-openai-key-here` with your actual key.

## 3. Start the Development Server

```bash
npm run dev
```

The app will run on `http://localhost:5173`

## 4. Test the Assistant

1. **Open the app** in your browser
2. **Look for the chat bubble** in the bottom-right corner (purple with a message icon)
3. **Click the bubble** to open StreamBot
4. **Type a message**: "I need a workflow"
5. **Watch StreamBot respond** and ask clarifying questions!

## 5. Try the Prompt Building Flow

### Example 1: Simple Workflow
```
You: "help me create a workflow"
Bot: "I'd love to help! What should trigger your workflow?"
You: "when someone fills a form"
Bot: "Great! What should happen after the form is submitted?"
You: "send them an email"
Bot: [Fills prompt in Generator]
```

### Example 2: Complex Workflow
```
You: "I need a Telegram bot"
Bot: "I'd love to help! What should trigger your workflow?"
You: "when someone sends a message to my bot"
Bot: "Great! What should the bot do when it receives a message?"
You: "use AI to generate a response and send it back"
Bot: [Fills detailed prompt]
```

## 6. Verify It's Working

**Check browser console** (F12 → Console tab):
- You should see: `🤖 AssistantService initialized`
- When sending messages: `💬 User message: ...`
- On responses: `🔄 Assistant context updated: ...`

**Check for errors**:
- If you see "OpenAI API key missing", check your `.env` file
- If you see "Failed to send message", check your internet connection
- If assistant doesn't appear, try hard refresh (Ctrl+Shift+R)

## 7. Features to Test

### Navigation
- Ask: "show me the templates"
- Bot should navigate you to /templates

### Prompt Filling
- Ask: "help me build a workflow"
- Answer the questions
- Check that Generator page has the prompt filled

### Context Awareness
- Generate a workflow
- Ask bot: "what have I done so far?"
- Bot should know you've generated a workflow

### Page-Specific Help
- Go to Debugger page
- Open assistant
- Bot should offer debugging help

## Troubleshooting

### "OpenAI API key is not set"
- Check `.env` file exists in project root
- Verify key starts with `sk-`
- Restart dev server: Stop (Ctrl+C), then `npm run dev`

### Assistant bubble doesn't appear
- Hard refresh browser (Ctrl+Shift+R)
- Check console for errors
- Verify build succeeded: `npm run build`

### Messages not sending
- Check OpenAI API key is valid
- Check internet connection
- Check browser console for specific error
- Verify OpenAI account has credits

### Responses are slow
- Normal: GPT-4o typically responds in 300-800ms
- If >2 seconds consistently, check internet speed
- Consider using gpt-4o-mini for faster responses (edit assistantService.ts)

### "Rate limit exceeded"
- You've hit OpenAI's rate limit (free tier: 3 requests/min)
- Wait 60 seconds and try again
- Upgrade OpenAI plan for higher limits

## Cost Monitoring

Monitor your OpenAI usage:
1. Go to [OpenAI Usage](https://platform.openai.com/usage)
2. Check daily/monthly costs
3. Set up usage limits if needed

**Expected costs**:
- Testing (100 conversations): ~$0.26
- Light usage (1000 conversations/month): ~$2.60
- Heavy usage (10,000 conversations/month): ~$26.00

## Next Steps

Once it's working:
1. Test the conversational prompt building flow
2. Try different types of workflow requests
3. Provide feedback on conversation quality
4. Suggest improvements to the system prompt

## Need Help?

If something's not working:
1. Check this guide first
2. Look at browser console errors
3. Check AI_ASSISTANT_IMPLEMENTATION.md for technical details
4. Review the code in:
   - `src/services/assistantService.ts` - Core logic
   - `src/components/AssistantWidget.tsx` - UI
   - `src/hooks/useAssistantActions.tsx` - State management

---

**Ready to test!** 🚀 Open the app and look for the purple chat bubble in the bottom-right corner.
