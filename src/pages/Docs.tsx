/**
 * Documentation Page
 *
 * User-facing guide on how to write effective workflow prompts
 * Organized by generator type (Regular, Batch, Enterprise)
 */

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, XCircle, BookOpen, Lightbulb, Shield, Sparkles, Package, Building2 } from 'lucide-react';
import { isFeatureEnabled } from '@/services/featureFlagService';
import { isAdmin } from '@/services/adminService';

export default function Docs() {
  const [showEnterpriseTab, setShowEnterpriseTab] = useState(false);

  useEffect(() => {
    checkEnterpriseBuilderAccess();
  }, []);

  const checkEnterpriseBuilderAccess = async () => {
    try {
      const flagEnabled = await isFeatureEnabled('enterprise_builder');
      const adminStatus = await isAdmin();
      // Show if flag is enabled OR if user is admin
      setShowEnterpriseTab(flagEnabled || adminStatus);
    } catch (error) {
      console.error('Error checking enterprise builder access:', error);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-3">
          <BookOpen className="h-10 w-10 text-blue-600" />
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">Prompt Writing Guide</h1>
        </div>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          Learn how to write effective prompts for each type of workflow generator
        </p>
      </div>

      {/* Generator Type Tabs */}
      <Tabs defaultValue="regular" className="w-full">
        <TabsList className={`grid w-full max-w-2xl mx-auto ${showEnterpriseTab ? 'grid-cols-3' : 'grid-cols-2'}`}>
          <TabsTrigger value="regular" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Regular</span>
          </TabsTrigger>
          <TabsTrigger value="batch" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Batch</span>
          </TabsTrigger>
          {showEnterpriseTab && (
            <TabsTrigger value="enterprise" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Enterprise</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* Regular Generator Tab */}
        <TabsContent value="regular" className="mt-8 space-y-6">
          <RegularGeneratorGuide />
        </TabsContent>

        {/* Batch Generator Tab */}
        <TabsContent value="batch" className="mt-8 space-y-6">
          <BatchGeneratorGuide />
        </TabsContent>

        {/* Enterprise Builder Tab - Only show if feature is enabled or user is admin */}
        {showEnterpriseTab && (
          <TabsContent value="enterprise" className="mt-8 space-y-6">
            <EnterpriseBuilderGuide />
          </TabsContent>
        )}
      </Tabs>

      {/* Universal Ethical Guidelines */}
      <Card className="p-6 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Shield className="h-6 w-6 text-yellow-600" />
          🚫 What StreamSuite Won't Do
        </h2>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          StreamSuite is designed for <strong>ethical, legal workflow automation only</strong>. All generators will reject:
        </p>
        <div className="grid md:grid-cols-2 gap-3 text-sm">
          <div className="bg-white dark:bg-gray-800 p-3 rounded border border-yellow-200 dark:border-yellow-800">
            <p className="text-red-700 dark:text-red-400 font-medium mb-1">❌ Hacking & Exploits</p>
            <p className="text-gray-600 dark:text-gray-400 text-xs">Unauthorized access, security bypasses</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded border border-yellow-200 dark:border-yellow-800">
            <p className="text-red-700 dark:text-red-400 font-medium mb-1">❌ Spam & Mass Messaging</p>
            <p className="text-gray-600 dark:text-gray-400 text-xs">Unsolicited emails, bot farms</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded border border-yellow-200 dark:border-yellow-800">
            <p className="text-red-700 dark:text-red-400 font-medium mb-1">❌ Data Scraping</p>
            <p className="text-gray-600 dark:text-gray-400 text-xs">Scraping personal data without consent</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded border border-yellow-200 dark:border-yellow-800">
            <p className="text-red-700 dark:text-red-400 font-medium mb-1">❌ Privacy Violations</p>
            <p className="text-gray-600 dark:text-gray-400 text-xs">GDPR/CCPA violations</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Regular Generator Guide Component
function RegularGeneratorGuide() {
  return (
    <>
      {/* Overview */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-blue-600 flex-shrink-0">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Regular Generator</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-3">
              Perfect for simple, single-purpose workflows with straightforward logic.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                1-20 nodes
              </Badge>
              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                1-2 credits
              </Badge>
              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                30-60 seconds
              </Badge>
              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                All plans
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* 3-Component Formula */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Lightbulb className="h-6 w-6 text-blue-600" />
          The 3-Component Formula
        </h2>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          Every great workflow prompt has exactly <strong>3 components</strong>:
        </p>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">1. Trigger</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">When does it run?</p>
            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Webhook</li>
              <li>• Schedule</li>
              <li>• Manual</li>
            </ul>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">2. Actions</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">What does it do?</p>
            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Send</li>
              <li>• Create</li>
              <li>• Update</li>
              <li>• Fetch</li>
            </ul>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">3. Integrations</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Which tools?</p>
            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Slack</li>
              <li>• Gmail</li>
              <li>• Sheets</li>
              <li>• Notion</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Good vs Bad Examples */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            ✅ Good Examples
          </h2>
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded border border-green-200 dark:border-green-800">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Form Submission Handler</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                "When a form is submitted via webhook, validate the email address, save to Google Sheets,
                and send a confirmation email via Gmail."
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded border border-green-200 dark:border-green-800">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Daily Summary Report</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                "Every morning at 8am, fetch yesterday's sales from Stripe, calculate total revenue,
                and send a summary to #sales Slack channel."
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded border border-green-200 dark:border-green-800">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">AI Content Moderator</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                "When a new post is created via webhook, use OpenAI to check for inappropriate content.
                If flagged, send alert to moderators on Slack. If clean, approve automatically."
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600" />
            ❌ Bad Examples
          </h2>
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded border border-red-200 dark:border-red-800">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Too Generic</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 italic mb-2">"Automate my business"</p>
              <p className="text-xs text-red-700 dark:text-red-400 mt-2">
                ❌ Missing trigger, actions, and integrations
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded border border-red-200 dark:border-red-800">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Missing Trigger</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 italic mb-2">"Send emails to customers"</p>
              <p className="text-xs text-red-700 dark:text-red-400 mt-2">
                ❌ When? Which customers? What content?
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded border border-red-200 dark:border-red-800">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Missing Integrations</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 italic mb-2">"Create a notification system"</p>
              <p className="text-xs text-red-700 dark:text-red-400 mt-2">
                ❌ Notify via what? Slack? Email? SMS?
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Pro Tips */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">💡 Pro Tips</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex gap-3">
              <span className="text-green-600 font-bold">✓</span>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">Specify Data Flow</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">"Fetch HubSpot contacts and upsert to PostgreSQL"</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-green-600 font-bold">✓</span>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">Mention Conditions</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">"If order total {'>'} $100, apply discount"</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex gap-3">
              <span className="text-green-600 font-bold">✓</span>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">Be Explicit About Tools</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">"Send to #general on Slack" (not just "send message")</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-green-600 font-bold">✓</span>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">Include Error Handling</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">"If API fails, retry 3 times then alert"</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </>
  );
}

// Batch Generator Guide Component
function BatchGeneratorGuide() {
  return (
    <>
      {/* Overview */}
      <Card className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-amber-600 flex-shrink-0">
            <Package className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Batch Generator</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-3">
              Generate multiple related workflows that work together as an orchestrated system.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800">
                3-10 workflows
              </Badge>
              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800">
                1 batch credit
              </Badge>
              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800">
                1-2 minutes
              </Badge>
              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800">
                Growth+ plans
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* When to Use Batch */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">🎯 When to Use Batch Generator</h2>
        <div className="space-y-4">
          <div className="flex gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">Multiple workflows with shared context</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Example: Complete customer journey (signup → day 3 email → day 7 survey → day 14 reminder)
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">Multi-platform orchestration</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Example: Social media automation (LinkedIn + Twitter + Instagram + Facebook)
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">Department-specific workflow sets</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Example: Sales team automation (lead capture + qualification + nurture + reporting)
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Batch Examples */}
      <Card className="p-6 border-amber-200 dark:border-amber-800">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">✅ Great Batch Examples</h2>
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Complete Customer Journey</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 italic mb-2">
              "Create a complete customer journey automation:<br/>
              1) New signup workflow (webhook → welcome email → HubSpot contact)<br/>
              2) Day 3 follow-up (scheduled email with tips)<br/>
              3) Day 7 survey (feedback request via email)<br/>
              4) Inactive user reminder (day 14 re-engagement)<br/>
              5) Success metrics dashboard (weekly report to Slack)"
            </p>
            <Badge variant="outline" className="text-xs">5 workflows • 1 batch credit</Badge>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Multi-Channel Social Media</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 italic mb-2">
              "Generate social media posting workflows:<br/>
              1) LinkedIn post scheduler with approval<br/>
              2) Twitter thread creator from blog posts<br/>
              3) Instagram caption generator<br/>
              4) Content calendar sync to Notion<br/>
              5) Engagement tracker to Google Sheets"
            </p>
            <Badge variant="outline" className="text-xs">5 workflows • 1 batch credit</Badge>
          </div>
        </div>
      </Card>

      {/* Best Practices */}
      <Card className="p-6 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">💡 Batch Best Practices</h2>
        <div className="space-y-3">
          <div className="flex gap-2">
            <span className="text-amber-600 font-bold">•</span>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Number your workflows</strong> - Makes it clear how many you need (e.g., "1) Signup flow 2) Follow-up 3) Survey")
            </p>
          </div>
          <div className="flex gap-2">
            <span className="text-amber-600 font-bold">•</span>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Describe relationships</strong> - Explain how workflows connect (e.g., "After signup flow completes, trigger follow-up")
            </p>
          </div>
          <div className="flex gap-2">
            <span className="text-amber-600 font-bold">•</span>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Include timing</strong> - Specify schedules (e.g., "Day 3 email", "Weekly report on Fridays")
            </p>
          </div>
          <div className="flex gap-2">
            <span className="text-amber-600 font-bold">•</span>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Limit to 10 workflows max</strong> - More than 10? Consider Enterprise Builder instead
            </p>
          </div>
        </div>
      </Card>
    </>
  );
}

// Enterprise Builder Guide Component
function EnterpriseBuilderGuide() {
  return (
    <>
      {/* Overview */}
      <Card className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200 dark:border-purple-800">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-purple-600 flex-shrink-0">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Enterprise Workflow Builder</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-3">
              Generate massive, complex single workflows with advanced multi-agent AI orchestration.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                20-100+ nodes
              </Badge>
              <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                12-18 credits
              </Badge>
              <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                2-4 minutes
              </Badge>
              <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                Growth+ only
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* When to Use Enterprise */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">🎯 When to Use Enterprise Builder</h2>
        <div className="space-y-4">
          <div className="flex gap-3">
            <CheckCircle2 className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">Complex multi-step business processes</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Example: Complete order fulfillment (payment → inventory → shipping → notifications → reporting)
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <CheckCircle2 className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">Multi-department workflows</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Example: Customer onboarding spanning Sales, Success, Support, and Engineering teams
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <CheckCircle2 className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">Advanced error handling and branching</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Example: Lead qualification with multiple enrichment sources and intelligent routing
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Enterprise Examples */}
      <Card className="p-6 border-purple-200 dark:border-purple-800">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">✅ Enterprise Examples</h2>
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Complete Customer Onboarding System</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 italic mb-2">
              "I need a complete customer onboarding workflow for our SaaS product. When a user signs up:<br/>
              1) Send welcome email series (Day 1, 3, 7 with different content)<br/>
              2) Create onboarding tasks in Asana for our success team<br/>
              3) Add customer to HubSpot with proper segmentation<br/>
              4) Schedule automated follow-up emails based on product usage<br/>
              5) Send Slack notifications to sales team with customer details<br/>
              6) Track onboarding progress and update HubSpot properties<br/>
              7) Generate weekly reports on onboarding completion rates<br/>
              8) If customer doesn't complete onboarding in 14 days, escalate"
            </p>
            <Badge variant="outline" className="text-xs">~60 nodes • 15 credits • 3 minutes</Badge>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">E-commerce Order Fulfillment Pipeline</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 italic mb-2">
              "Build a complete e-commerce order processing workflow:<br/>
              • When Shopify order is placed, validate payment via Stripe<br/>
              • Check inventory levels in our database (PostgreSQL)<br/>
              • If in stock: Create shipping label, update inventory, send confirmation<br/>
              • If low stock: Trigger reorder workflow, notify warehouse<br/>
              • Add order to Airtable for tracking<br/>
              • If order {'>'} $500, add to VIP customer list in HubSpot<br/>
              • Generate daily fulfillment reports to ops team on Slack<br/>
              • If order fails at any step, create Zendesk ticket and alert team"
            </p>
            <Badge variant="outline" className="text-xs">~70 nodes • 16 credits • 4 minutes</Badge>
          </div>
        </div>
      </Card>

      {/* How to Use the Form */}
      <Card className="p-6 bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">📝 How to Fill Out the Form</h2>
        <div className="space-y-4">
          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
              1. What are you trying to achieve? (Required)
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300 ml-4">
              Describe your goal in 20+ characters. Be clear and specific.<br/>
              ✅ "Automate customer onboarding from signup to first product use"<br/>
              ❌ "Onboarding" (too vague)
            </p>
          </div>

          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
              2. How should your workflow start? (Required)
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300 ml-4">
              Select the trigger type from the dropdown:<br/>
              • Webhook - API calls from other services<br/>
              • Schedule - Run at specific times (cron/interval)<br/>
              • User action - Signups, purchases, etc.<br/>
              • Email, Form submission, Database events, File uploads, Manual
            </p>
          </div>

          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
              3. Which tools/platforms will you use? (Optional)
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300 ml-4">
              Select the main services your workflow needs (Salesforce, HubSpot, Slack, Gmail, etc.)<br/>
              Click the badges to remove any. Choose "Other" if your tool isn't listed.
            </p>
          </div>

          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
              4. Additional Details (Optional - Click to Expand)
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300 ml-4">
              Click the "Add Additional Details" button to specify business rules, constraints, or requirements.<br/>
              Example: "Must handle 1000+ concurrent users, need GDPR compliance, data validation required"
            </p>
          </div>
        </div>
      </Card>

      {/* Writing Tips */}
      <Card className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200 dark:border-purple-800">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">💡 Pro Tips</h2>
        <div className="space-y-3">
          <div className="flex gap-2">
            <span className="text-purple-600 font-bold">•</span>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Only 2 required fields!</strong> - Just describe your goal and pick a trigger. Everything else is optional.
            </p>
          </div>
          <div className="flex gap-2">
            <span className="text-purple-600 font-bold">•</span>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>List all integrations</strong> - Specify every tool/service involved (HubSpot, Slack, SendGrid, PostgreSQL, etc.)
            </p>
          </div>
          <div className="flex gap-2">
            <span className="text-purple-600 font-bold">•</span>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Include error scenarios</strong> - "If payment fails...", "If API times out...", "If user doesn't respond..."
            </p>
          </div>
          <div className="flex gap-2">
            <span className="text-purple-600 font-bold">•</span>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Mention data flow</strong> - Explain how data moves between systems (e.g., "Sync customer data from Shopify to HubSpot daily")
            </p>
          </div>
          <div className="flex gap-2">
            <span className="text-purple-600 font-bold">•</span>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Specify timing</strong> - Include schedules, delays, and timing constraints (e.g., "Wait 3 days before sending follow-up")
            </p>
          </div>
        </div>
      </Card>

      {/* Multi-Agent Advantage */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">🤖 How Multi-Agent AI Works</h2>
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
          Enterprise Builder uses 3 specialized AI agents working together:
        </p>
        <div className="space-y-3">
          <div className="flex gap-3 items-start">
            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800">1</Badge>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Workflow Architect</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Analyzes your requirements and creates a modular blueprint</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800">2</Badge>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Module Generators</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Build each module independently (10-30 nodes per module)</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800">3</Badge>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Integration Assembler</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Combines all modules into one cohesive workflow</p>
            </div>
          </div>
        </div>
        <p className="text-xs text-purple-700 dark:text-purple-300 mt-4 font-medium">
          ✨ Result: 100+ node workflows generated without token truncation or quality loss
        </p>
      </Card>
    </>
  );
}
