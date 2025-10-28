# StreamBot Natural Prompt Style

## Problem

StreamBot was creating structured, technical prompts like:
```
"Every Monday, scan Notion database for new leads, send a welcome email to each, and update lead status in Notion."
```

This is good but feels robotic and template-like.

## Solution

Updated system prompt to generate **conversational, natural language prompts** that sound like a human explaining to a friend.

---

## Changes Made

### **File Modified**
[src/services/assistantService.ts](src/services/assistantService.ts:110-128)

### **New Instructions for StreamBot**

```
# CRITICAL: Workflow Prompt Style
When building the final workflow prompt, write it like a USER would naturally describe it:
- Use conversational language: "I want to...", "When someone does X, do Y"
- Focus on the OUTCOME, not technical details
- No structured formats like "Trigger: X, Action: Y, Condition: Z"
- No bullet points or lists
- Just natural sentences describing what should happen

GOOD examples:
- "I want to send a welcome email whenever someone fills out my contact form"
- "When a customer leaves a 5-star review, post it to our Slack channel and send a thank you email"
- "Every Monday morning, scan my Notion database for new leads and send me a summary email"

BAD examples (too structured):
- "Trigger: Form submission. Action: Send email. Condition: None."
- "1. Monitor webhook 2. Filter data 3. Send to Slack"
- "Create workflow: Trigger=Schedule, Action=Database scan, Output=Email"

Write prompts as if you're explaining it to a friend, not programming a system.
```

---

## Examples Comparison

### **Before** (Structured/Technical)

❌ **Example 1**:
```
"Trigger: Notion database scan (scheduled).
Action 1: Send welcome email to each new lead.
Action 2: Update lead status field in Notion."
```

❌ **Example 2**:
```
"Workflow: Monitor form submissions, then send confirmation email, then create Slack notification."
```

❌ **Example 3**:
```
"1. Daily schedule trigger
2. Query Google Sheets for new rows
3. Send summary email with results"
```

### **After** (Natural/Conversational)

✅ **Example 1**:
```
"I want to check my Notion database every Monday for new leads, send them each a welcome email, and mark them as contacted in Notion."
```

✅ **Example 2**:
```
"When someone submits my contact form, send them a confirmation email and let my team know in Slack."
```

✅ **Example 3**:
```
"Every morning, look at my Google Sheet for any new entries added yesterday and email me a summary of what was added."
```

---

## Key Differences

### Structured Style (Old)
- Uses technical terms: "Trigger", "Action", "Condition"
- Numbered lists or bullet points
- Imperative commands: "Send email", "Update field"
- Feels like documentation

### Natural Style (New)
- Conversational starters: "I want to...", "When someone..."
- Flowing sentences, no lists
- Personal language: "my database", "let my team know"
- Feels like a conversation

---

## Why This Matters

### **Better User Experience**
- Feels less intimidating for beginners
- More relatable language
- Easier to read and understand
- Users can see themselves in the prompt

### **Better AI Generation**
- Claude/GPT understand natural language better
- More context from conversational prompts
- Can infer intent more accurately
- Produces more human-like workflows

### **More Professional**
- Sounds like a real product, not a prototype
- Users trust conversational AI more
- Fits with StreamBot's friendly personality
- Consistent with modern AI assistants

---

## Example Conversation Flow

### **User asks**: "help me automate my sales pipeline"

**StreamBot responds**:
```
What should trigger your automation? For example: new lead in CRM,
form submission, scheduled check, etc.
```

**User**: "when a new lead is added to my CRM"

**StreamBot responds**:
```
Great! What should happen when that lead is added?
```

**User**: "send them a welcome email and notify my sales team"

**StreamBot responds**:
```
Perfect! Here's your prompt:

"I want to automatically send a welcome email to new leads when
they're added to my CRM, and at the same time notify my sales team
so they can follow up."
```

Notice how the final prompt:
- Uses "I want to..." (personal)
- Says "automatically" (natural conversation)
- Includes context ("so they can follow up")
- Flows like a sentence, not a checklist

---

## Technical Implementation

### **System Prompt Section** (lines 110-128)

The assistant now has explicit instructions to:
1. ✅ Use conversational starters
2. ✅ Focus on outcomes, not mechanics
3. ✅ Avoid structured formats
4. ✅ Write like explaining to a friend
5. ❌ Don't use bullet points
6. ❌ Don't use trigger/action terminology
7. ❌ Don't make numbered lists

### **Examples Provided**

GPT-4o learns from the good/bad examples:
- 3 GOOD examples showing natural style
- 3 BAD examples showing what to avoid
- Clear distinction between styles

### **Explicit Instruction**

The phrase "Write prompts as if you're explaining it to a friend, not programming a system"
gives the model a clear mental model to follow.

---

## Testing the Changes

### **How to Test**

1. **Restart dev server**:
   ```bash
   npm run dev
   ```

2. **Open StreamBot** (chat bubble, bottom-right)

3. **Ask**: "help me build a workflow"

4. **Have a conversation** about your workflow

5. **Check the final prompt** - Should be natural and conversational!

### **What to Look For**

✅ **Good signs**:
- Starts with "I want to..." or "When someone..."
- Reads like a sentence you'd say out loud
- No bullet points or numbered lists
- Includes context and reasoning
- Personal language ("my", "our")

❌ **Bad signs**:
- Has "Trigger:", "Action:", etc.
- Numbered steps
- Technical jargon without explanation
- Feels like a specification document

---

## Conversation Examples

### **Example 1: Email Automation**

```
User: "I need to automate emails"
Bot: "What should trigger the email?"
User: "when someone signs up"
Bot: "What should the email say or do?"
User: "welcome them and send a discount code"
Bot: "Here's your prompt:

     "I want to send new users a welcome email with a discount code
     right after they sign up on my website."
```

### **Example 2: Data Sync**

```
User: "sync data between apps"
Bot: "Which apps do you want to sync?"
User: "Airtable and Google Sheets"
Bot: "What should trigger the sync?"
User: "when a new row is added to Airtable"
Bot: "Here's your prompt:

     "When a new record is added to my Airtable base, I want it to
     automatically create a matching row in my Google Sheet so
     everything stays in sync."
```

### **Example 3: Team Notifications**

```
User: "notify my team about stuff"
Bot: "What should they be notified about?"
User: "when we get a new support ticket"
Bot: "How should they be notified?"
User: "send a message to our Slack channel"
Bot: "Here's your prompt:

     "I want to post a message to our team Slack channel whenever
     we receive a new support ticket, so everyone knows to check it."
```

---

## Build Status

✅ **Build successful** (830KB bundle, 9.51s)
✅ **No errors**
✅ **Natural prompts enabled**

---

## Summary

StreamBot now generates **natural, conversational workflow prompts** instead of structured technical ones:

**Before**: "Trigger: X. Action: Y. Condition: Z."
**After**: "I want to do Y whenever X happens."

This makes StreamSuite feel more professional, user-friendly, and human. The AI will generate better workflows from these more natural prompts, and users will feel more confident using the tool.

🎉 **Ready to test!** Start a conversation with StreamBot and see the natural prompts in action.
