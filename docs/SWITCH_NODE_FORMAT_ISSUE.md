# Switch Node Format Issue - Visual Connections Missing

## Problem

The debugger "fixed" the workflow by adding connections in the JSON, but **n8n doesn't render the Switch output connections visually**. Looking at the screenshot, the Switch node "Route Based on AI Decision" has no visible output lines to the 4 action nodes.

## Root Cause

The Switch node is using **typeVersion 3** but has **incorrect parameter structure**.

### Generated (BROKEN) Format:
```json
{
  "type": "n8n-nodes-base.switch",
  "typeVersion": 3,  // ← Version 3
  "parameters": {
    "conditions": {   // ← OLD FORMAT (v1/v2)
      "options": { ... },
      "conditions": [ ... ],
      "combinator": "or"
    },
    "fallbackOutput": 3
  }
}
```

### Correct Format for typeVersion 3:
```json
{
  "type": "n8n-nodes-base.switch",
  "typeVersion": 3,
  "parameters": {
    "rules": {     // ← NEW FORMAT (v3+)
      "values": [  // ← Array of rules
        {
          "conditions": {
            "options": { ... },
            "combinator": "and",
            "conditions": [ ... ]
          },
          "renameOutput": true,
          "outputKey": "email"  // ← Named output
        },
        {
          "conditions": { ... },
          "renameOutput": true,
          "outputKey": "data"
        },
        {
          "conditions": { ... },
          "renameOutput": true,
          "outputKey": "notification"
        }
      ]
    },
    "options": {
      "fallbackOutput": "extra"  // ← String, not number
    }
  }
}
```

## Key Differences

### Parameter Structure:
- ❌ **OLD (v1/v2)**: `conditions` object with array inside
- ✅ **NEW (v3)**: `rules.values` array where each rule has its own `conditions`

### Fallback Output:
- ❌ **OLD**: `fallbackOutput: 3` (number)
- ✅ **NEW**: `options.fallbackOutput: "extra"` (string)

### Output Naming:
- ❌ **OLD**: No output naming
- ✅ **NEW**: Each rule has `renameOutput: true` and `outputKey: "name"`

## Working Example from Template

From `/src/lib/n8n/raw-templates/appointment-scheduling-with-cal-twilio.json`:

```json
{
  "name": "Check For Command Words",
  "type": "n8n-nodes-base.switch",
  "typeVersion": 3.2,
  "parameters": {
    "rules": {
      "values": [
        {
          "conditions": {
            "options": {
              "leftValue": "",
              "caseSensitive": true,
              "typeValidation": "strict"
            },
            "combinator": "and",
            "conditions": [
              {
                "operator": {
                  "type": "string",
                  "operation": "contains"
                },
                "leftValue": "={{ $json.Body }}",
                "rightValue": "STOP"
              }
            ]
          },
          "renameOutput": true,
          "outputKey": "STOP"
        }
      ]
    },
    "options": {
      "fallbackOutput": "extra"
    }
  }
}
```

**Connections:**
```json
"Check For Command Words": {
  "main": [
    [{ "node": "User Request STOP", ... }],  // Output 0: STOP rule
    [{ "node": "Get Existing Chat Session", ... }]  // Output 1: fallback (extra)
  ]
}
```

## Correct 4-Route Switch Structure

For the AI Agent routing workflow:

```json
{
  "name": "Route Based on AI Decision",
  "type": "n8n-nodes-base.switch",
  "typeVersion": 3,
  "parameters": {
    "rules": {
      "values": [
        {
          "conditions": {
            "options": {
              "leftValue": "",
              "caseSensitive": true,
              "typeValidation": "strict"
            },
            "combinator": "and",
            "conditions": [
              {
                "operator": {
                  "type": "string",
                  "operation": "contains"
                },
                "leftValue": "={{ $json.output }}",
                "rightValue": "email"
              }
            ]
          },
          "renameOutput": true,
          "outputKey": "email"
        },
        {
          "conditions": {
            "options": {
              "leftValue": "",
              "caseSensitive": true,
              "typeValidation": "strict"
            },
            "combinator": "and",
            "conditions": [
              {
                "operator": {
                  "type": "string",
                  "operation": "contains"
                },
                "leftValue": "={{ $json.output }}",
                "rightValue": "data"
              }
            ]
          },
          "renameOutput": true,
          "outputKey": "data"
        },
        {
          "conditions": {
            "options": {
              "leftValue": "",
              "caseSensitive": true,
              "typeValidation": "strict"
            },
            "combinator": "and",
            "conditions": [
              {
                "operator": {
                  "type": "string",
                  "operation": "contains"
                },
                "leftValue": "={{ $json.output }}",
                "rightValue": "notification"
              }
            ]
          },
          "renameOutput": true,
          "outputKey": "notification"
        }
      ]
    },
    "options": {
      "fallbackOutput": "extra"
    }
  }
}
```

**Connections:**
```json
"Route Based on AI Decision": {
  "main": [
    [{ "node": "Send Email", "type": "main", "index": 0 }],              // Output 0: email
    [{ "node": "Log to Google Sheets", "type": "main", "index": 0 }],    // Output 1: data
    [{ "node": "Send Slack Notification", "type": "main", "index": 0 }], // Output 2: notification
    [{ "node": "General Response", "type": "main", "index": 0 }]          // Output 3: fallback (extra)
  ]
}
```

## Why This Matters

When n8n loads a Switch node with typeVersion 3 but finds old v1/v2 parameter structure, it might:
1. Not render the output connections visually
2. Not execute the Switch logic properly
3. Show warnings in the console
4. Fail to save/load correctly

The connections exist in the JSON but n8n doesn't recognize them because the **parameter structure doesn't match the typeVersion**.

## Fix Required

Update `DEBUG_SYSTEM_PROMPT` and `N8N_SYSTEM_PROMPT` with correct Switch node v3 format:

```typescript
const SWITCH_NODE_V3_FORMAT = `
**Switch Node (n8n-nodes-base.switch) typeVersion 3+:**

{
  "type": "n8n-nodes-base.switch",
  "typeVersion": 3,
  "parameters": {
    "rules": {
      "values": [
        {
          "conditions": {
            "options": { "leftValue": "", "caseSensitive": true, "typeValidation": "strict" },
            "combinator": "and",
            "conditions": [
              {
                "operator": { "type": "string", "operation": "contains" },
                "leftValue": "={{ $json.field }}",
                "rightValue": "value"
              }
            ]
          },
          "renameOutput": true,
          "outputKey": "route1"
        }
      ]
    },
    "options": {
      "fallbackOutput": "extra"  // String, not number!
    }
  }
}
`;
```

## Next Steps

1. Update system prompts with correct Switch v3 format
2. Add IF node v2 format (also changed)
3. Test regeneration with fixed format
4. Verify n8n renders connections visually
