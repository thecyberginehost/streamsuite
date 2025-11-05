/**
 * Agency Documentation Page
 *
 * Complete walkthrough and documentation for Agency Dashboard features
 * Includes sidebar navigation for easy section access
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Users,
  Key,
  Zap,
  Activity,
  Settings,
  FolderKanban,
  BarChart3,
  Building2,
  CheckCircle2,
  ArrowRight,
  Link2,
  Upload,
  Download,
  Shield,
  Crown,
} from "lucide-react";

interface DocSection {
  id: string;
  title: string;
  icon: any;
  content: JSX.Element;
}

export default function AgencyDocs() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("overview");

  const sections: DocSection[] = [
    {
      id: "overview",
      title: "Overview",
      icon: BookOpen,
      content: (
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Agency Dashboard Overview
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
              Welcome to the StreamSuite Agency Dashboard - your complete solution for managing multiple clients,
              workflows, and automation projects at scale.
            </p>
          </div>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex-shrink-0">
                  <Crown className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    What is the Agency Plan?
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    The Agency Plan is designed for agencies, freelancers, and teams managing workflows for multiple
                    clients. It includes all features from lower tiers plus powerful client management, programmatic
                    API access, and advanced workflow organization tools.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Key Features
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { icon: Users, title: "Client Management", desc: "Organize work by client with detailed profiles" },
                { icon: Key, title: "API Access", desc: "Programmatic workflow management via REST API" },
                { icon: FolderKanban, title: "Project Organization", desc: "Group workflows into client projects" },
                { icon: Link2, title: "Platform Connections", desc: "Store n8n, Make, and Zapier credentials per client" },
                { icon: Zap, title: "All Workflow Tools", desc: "Generate, debug, batch, and convert workflows" },
                { icon: BarChart3, title: "Analytics", desc: "Track workflow performance across all clients" },
              ].map((feature) => (
                <Card key={feature.title} className="border-0 shadow-sm">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <feature.icon className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                          {feature.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {feature.desc}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "clients",
      title: "Client Management",
      icon: Users,
      content: (
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Managing Clients
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The Clients tab is the heart of your agency dashboard. Organize all your client work,
              store their credentials, and track their workflows in one place.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 font-semibold flex-shrink-0">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Add a New Client
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Navigate to the Clients tab and click "Add Client". Fill in basic information like name,
                  company, email, and notes.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/agency')}
                  className="gap-2"
                >
                  Go to Clients
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 font-semibold flex-shrink-0">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Access Client Profile
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Click any client card to open their full profile. Here you can:
                </p>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    View and edit all client details (logo, contact info, billing)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Manage platform connections (n8n, Make, Zapier credentials)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    View all workflows created for this client
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Track analytics and performance metrics
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 font-semibold flex-shrink-0">
                3
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Search and Filter
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Use the search bar to quickly find clients by name, company, or email.
                  Client cards show workflow count and connection status at a glance.
                </p>
              </div>
            </div>
          </div>

          <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
                    Data Isolation
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Each client's workflows and credentials are completely isolated. You can only see
                    and manage clients you've created.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ),
    },
    {
      id: "connections",
      title: "Platform Connections",
      icon: Link2,
      content: (
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Platform Connections
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Store your clients' automation platform credentials securely. This allows you to deploy
              workflows directly to their environments.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Supported Platforms
            </h3>
            <div className="space-y-4">
              <Card className="border-0 shadow-sm">
                <CardContent className="pt-6">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">n8n</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Connect to self-hosted or cloud n8n instances.
                  </p>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p><strong>Required:</strong> Instance URL (e.g., https://n8n.client.com)</p>
                    <p><strong>Required:</strong> API Key from n8n Settings → API</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardContent className="pt-6">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Make.com</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Connect to Make.com accounts for blueprint deployment.
                  </p>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p><strong>Required:</strong> API Key from Make.com Profile</p>
                    <p><strong>Optional:</strong> Team ID (for team accounts)</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardContent className="pt-6">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Zapier</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Connect to Zapier for custom code deployment.
                  </p>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p><strong>Required:</strong> API Key from Zapier Settings</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              How to Add a Connection
            </h3>
            <ol className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex gap-3">
                <span className="font-semibold text-gray-900 dark:text-white">1.</span>
                <span>Go to a client's profile page (click client card)</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-gray-900 dark:text-white">2.</span>
                <span>Navigate to the "Connections" tab</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-gray-900 dark:text-white">3.</span>
                <span>Click "Add Connection" and select the platform</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-gray-900 dark:text-white">4.</span>
                <span>Fill in the required credentials and click "Test Connection"</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-gray-900 dark:text-white">5.</span>
                <span>Once verified, save the connection</span>
              </li>
            </ol>
          </div>
        </div>
      ),
    },
    {
      id: "workflows",
      title: "Workflow Tools",
      icon: Zap,
      content: (
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Workflow Tools
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The Agency Dashboard includes all workflow tools with client-specific context.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-purple-600" />
                  <div>
                    <CardTitle>Generator</CardTitle>
                    <CardDescription>Create workflows from natural language prompts</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Generate n8n, Make.com, or Zapier workflows using AI. Select a client to automatically
                  associate the workflow with them.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/agency/generator')}
                  className="gap-2"
                >
                  Open Generator
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-green-600" />
                  <div>
                    <CardTitle>Debugger</CardTitle>
                    <CardDescription>Fix and optimize broken workflows</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Upload a workflow JSON and error logs to get AI-powered debugging suggestions and fixes.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/agency/debugger')}
                  className="gap-2"
                >
                  Open Debugger
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <FolderKanban className="h-5 w-5 text-blue-600" />
                  <div>
                    <CardTitle>Batch Generator</CardTitle>
                    <CardDescription>Create multiple workflows at once</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Generate multiple workflows from a list of prompts. Perfect for agencies onboarding
                  new clients with standard automation templates.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/agency/batch')}
                  className="gap-2"
                >
                  Open Batch Generator
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      ),
    },
    {
      id: "api",
      title: "API Access",
      icon: Key,
      content: (
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              API Access
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Manage workflows programmatically using the StreamSuite REST API. Perfect for integrating
              with your own systems or building custom automation pipelines.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Getting Started with the API
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 font-semibold flex-shrink-0">
                  1
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Create an API Key
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Go to the API Keys tab and click "Create API Key". Give it a descriptive name
                    and save the key securely - you won't see it again!
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/agency')}
                    className="gap-2"
                  >
                    Create API Key
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 font-semibold flex-shrink-0">
                  2
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Read the API Documentation
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    View complete API documentation with code examples in cURL, JavaScript, and Python.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/agency/api-docs')}
                    className="gap-2"
                  >
                    View API Docs
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 font-semibold flex-shrink-0">
                  3
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Start Making Requests
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Use your API key to create, read, update, and delete workflows programmatically.
                    All operations support client filtering for multi-tenant management.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-200 mb-1">
                    API Key Security
                  </p>
                  <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
                    <li>• Never expose API keys in client-side code or public repositories</li>
                    <li>• Use environment variables to store keys in your applications</li>
                    <li>• Rotate keys periodically for enhanced security</li>
                    <li>• Deactivate compromised keys immediately from the dashboard</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ),
    },
    {
      id: "analytics",
      title: "Analytics",
      icon: BarChart3,
      content: (
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Analytics & Reporting
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Track workflow performance, client activity, and system health across your entire agency.
            </p>
          </div>

          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6 text-center py-12">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                Advanced analytics and reporting features coming soon
              </p>
              <Badge variant="outline">Available Q2 2026</Badge>
            </CardContent>
          </Card>

          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Planned Features
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                "Workflow execution tracking",
                "Success/failure rates per client",
                "Credit usage breakdown",
                "Performance bottleneck detection",
                "Client health scores",
                "Automated alerting for failures",
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircle2 className="h-4 w-4 text-purple-600" />
                  {feature}
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
    },
  ];

  const activeContent = sections.find(s => s.id === activeSection);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Agency Documentation</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Complete guide to the Agency Dashboard</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('/agency')}
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>

      {/* Layout */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-64 flex-shrink-0">
            <div className="sticky top-24">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sm">Table of Contents</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[calc(100vh-220px)]">
                    <nav className="space-y-1 p-4">
                      {sections.map((section) => {
                        const Icon = section.icon;
                        const isActive = activeSection === section.id;
                        return (
                          <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                              isActive
                                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-medium'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                            {section.title}
                          </button>
                        );
                      })}
                    </nav>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-8">
                {activeContent?.content}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
}
