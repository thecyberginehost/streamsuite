/**
 * API Documentation Page
 *
 * Comprehensive documentation for StreamSuite Workflow API
 * Shows examples, authentication, endpoints, and code samples
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Code,
  Key,
  Zap,
  Lock,
  CheckCircle2,
  Copy,
  AlertCircle,
  Terminal,
  BookOpen,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function APIDocs() {
  const { toast } = useToast();
  const [activeLanguage, setActiveLanguage] = useState<'curl' | 'javascript' | 'python'>('curl');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Code copied to clipboard",
    });
  };

  const CodeBlock = ({ code, language = 'bash' }: { code: string; language?: string }) => (
    <div className="relative">
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
        <code>{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-8 w-8 text-gray-400 hover:text-white"
        onClick={() => copyToClipboard(code)}
      >
        <Copy className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600">
              <Terminal className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">API Documentation</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Programmatic access to StreamSuite Workflow Management
              </p>
            </div>
          </div>
          <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0">
            Agency Plan Required
          </Badge>
        </div>

        {/* Quick Start */}
        <Card className="mb-8 border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-600" />
              Quick Start
            </CardTitle>
            <CardDescription>Get started with the StreamSuite API in 3 steps</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 font-semibold flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Create an API Key
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Go to Agency Dashboard → API Keys → Create API Key
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 font-semibold flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Save Your Key
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Copy and save the API key securely - you won't see it again!
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 font-semibold flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Make Your First Request
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Use the API key in your requests to manage workflows
                </p>
                <CodeBlock
                  code={`curl https://api.streamsuite.io/v1/workflows \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Authentication */}
        <Card className="mb-8 border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-green-600" />
              Authentication
            </CardTitle>
            <CardDescription>All API requests require authentication</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Include your API key in the <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">Authorization</code> header:
            </p>
            <CodeBlock
              code={`Authorization: Bearer sk_live_your_api_key_here`}
            />
            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-900 dark:text-amber-200 mb-1">
                  Keep your API keys secure
                </p>
                <p className="text-amber-700 dark:text-amber-300">
                  Never expose API keys in client-side code, public repositories, or logs.
                  If compromised, deactivate the key immediately.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Endpoints */}
        <Card className="mb-8 border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              API Endpoints
            </CardTitle>
            <CardDescription>Available endpoints for workflow management</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* List Workflows */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="font-mono">GET</Badge>
                <code className="text-sm font-mono">/v1/workflows</code>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                List all workflows with optional filters
              </p>
              <Tabs value={activeLanguage} onValueChange={(v) => setActiveLanguage(v as any)}>
                <TabsList>
                  <TabsTrigger value="curl">cURL</TabsTrigger>
                  <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                  <TabsTrigger value="python">Python</TabsTrigger>
                </TabsList>
                <TabsContent value="curl">
                  <CodeBlock
                    code={`curl https://api.streamsuite.io/v1/workflows?platform=n8n&limit=10 \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
                  />
                </TabsContent>
                <TabsContent value="javascript">
                  <CodeBlock
                    code={`const response = await fetch('https://api.streamsuite.io/v1/workflows?platform=n8n&limit=10', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  }
});
const data = await response.json();`}
                    language="javascript"
                  />
                </TabsContent>
                <TabsContent value="python">
                  <CodeBlock
                    code={`import requests

response = requests.get(
    'https://api.streamsuite.io/v1/workflows',
    params={'platform': 'n8n', 'limit': 10},
    headers={'Authorization': 'Bearer YOUR_API_KEY'}
)
data = response.json()`}
                    language="python"
                  />
                </TabsContent>
              </Tabs>
            </div>

            <div className="border-t pt-6"></div>

            {/* Get Workflow */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="font-mono">GET</Badge>
                <code className="text-sm font-mono">/v1/workflows/:id</code>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get a specific workflow by ID
              </p>
              <CodeBlock
                code={`curl https://api.streamsuite.io/v1/workflows/abc123 \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
              />
            </div>

            <div className="border-t pt-6"></div>

            {/* Create Workflow */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="font-mono bg-green-50 text-green-700 border-green-300">POST</Badge>
                <code className="text-sm font-mono">/v1/workflows</code>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Create a new workflow
              </p>
              <CodeBlock
                code={`curl -X POST https://api.streamsuite.io/v1/workflows \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "My Workflow",
    "description": "Automated data processing",
    "platform": "n8n",
    "workflow_json": {
      "nodes": [...],
      "connections": {...}
    },
    "client_id": "client-uuid",
    "tags": ["automation", "data"]
  }'`}
              />
            </div>

            <div className="border-t pt-6"></div>

            {/* Update Workflow */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="font-mono bg-blue-50 text-blue-700 border-blue-300">PUT</Badge>
                <code className="text-sm font-mono">/v1/workflows/:id</code>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Update an existing workflow
              </p>
              <CodeBlock
                code={`curl -X PUT https://api.streamsuite.io/v1/workflows/abc123 \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Updated Workflow Name",
    "workflow_json": {...},
    "is_active": true
  }'`}
              />
            </div>

            <div className="border-t pt-6"></div>

            {/* Delete Workflow */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="font-mono bg-red-50 text-red-700 border-red-300">DELETE</Badge>
                <code className="text-sm font-mono">/v1/workflows/:id</code>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Delete a workflow
              </p>
              <CodeBlock
                code={`curl -X DELETE https://api.streamsuite.io/v1/workflows/abc123 \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
              />
            </div>
          </CardContent>
        </Card>

        {/* Response Format */}
        <Card className="mb-8 border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5 text-purple-600" />
              Response Format
            </CardTitle>
            <CardDescription>All responses follow a consistent JSON structure</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-2">
                Success Response
              </h3>
              <CodeBlock
                code={`{
  "success": true,
  "data": {
    "id": "abc123",
    "name": "My Workflow",
    "platform": "n8n",
    "workflow_json": {...},
    "created_at": "2025-01-30T10:00:00Z",
    "updated_at": "2025-01-30T10:00:00Z"
  },
  "message": "Workflow created successfully"
}`}
                language="json"
              />
            </div>

            <div>
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-2">
                Error Response
              </h3>
              <CodeBlock
                code={`{
  "success": false,
  "error": "Invalid API key"
}`}
                language="json"
              />
            </div>
          </CardContent>
        </Card>

        {/* Rate Limits */}
        <Card className="mb-8 border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Rate Limits
            </CardTitle>
            <CardDescription>API usage limits and best practices</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-2">
                  Default Limit
                </h3>
                <p className="text-2xl font-bold text-purple-600">60 req/min</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Configurable per API key
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-2">
                  Rate Limit Headers
                </h3>
                <code className="text-xs">X-RateLimit-Remaining</code>
                <br />
                <code className="text-xs">X-RateLimit-Reset</code>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              If you exceed the rate limit, you'll receive a <code>429 Too Many Requests</code> response.
              Contact support if you need higher limits.
            </p>
          </CardContent>
        </Card>

        {/* Permissions */}
        <Card className="mb-8 border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-blue-600" />
              API Permissions
            </CardTitle>
            <CardDescription>Granular control over API key capabilities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: 'workflow:read', desc: 'List and view workflows' },
                { name: 'workflow:create', desc: 'Create new workflows' },
                { name: 'workflow:update', desc: 'Modify existing workflows' },
                { name: 'workflow:delete', desc: 'Delete workflows' },
                { name: 'workflow:generate', desc: 'Use AI generation' },
                { name: 'client:read', desc: 'View client information' },
                { name: 'client:manage', desc: 'Manage clients' },
              ].map((perm) => (
                <div key={perm.name} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <code className="text-sm font-mono text-purple-600 dark:text-purple-400">
                      {perm.name}
                    </code>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {perm.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Need Help?
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Contact our support team or visit the developer community
                </p>
              </div>
              <Button variant="outline" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                Visit Community
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
