import { useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate, Outlet, Routes, Route } from "react-router-dom";
import {
  Users,
  CreditCard,
  BarChart3,
  Settings,
  Sparkles,
  UserPlus,
  FolderKanban,
  Zap,
  Crown,
  TrendingUp,
  Shield,
  Mail,
  Coins,
  Activity,
  Building2,
  CheckCircle2,
  Clock,
  Bell,
  Home,
  FileCode,
  Bug,
  BookOpen,
  Package,
} from "lucide-react";
import Generator from "./Generator";
import Converter from "./Converter";
import Debugger from "./Debugger";
import HistoryPage from "./History";
import Templates from "./Templates";
import BatchGenerator from "./BatchGenerator";

export default function TeamDashboard() {
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [activeFeature, setActiveFeature] = useState<string | null>(null);

  // Mock data - will be replaced with real data from Supabase
  const teamStats = {
    totalMembers: 1, // Current user
    activeProjects: 0,
    creditsUsed: 0,
    creditsRemaining: profile?.credits_remaining || 750,
    batchCreditsRemaining: 50,
    workflowsGenerated: 0,
  };

  // Render individual feature components
  const renderFeatureContent = () => {
    switch (activeFeature) {
      case 'generator':
        return <Generator />;
      case 'converter':
        return <Converter />;
      case 'debugger':
        return <Debugger />;
      case 'history':
        return <HistoryPage />;
      case 'templates':
        return <Templates />;
      case 'batch':
        return <BatchGenerator />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Navigation Bar */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Brand */}
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900 dark:text-white">StreamSuite</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Agency Workspace</p>
                </div>
              </div>

              {/* Main Navigation */}
              <div className="hidden lg:flex items-center gap-1">
                <Button
                  variant={activeTab === 'overview' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => { setActiveTab('overview'); setActiveFeature(null); }}
                  className="gap-2"
                >
                  <Home className="h-4 w-4" />
                  Overview
                </Button>
                <Button
                  variant={activeTab === 'features' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => { setActiveTab('features'); setActiveFeature(null); }}
                  className="gap-2"
                >
                  <Zap className="h-4 w-4" />
                  Workflows
                </Button>
                <Button
                  variant={activeTab === 'team' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => { setActiveTab('team'); setActiveFeature(null); }}
                  className="gap-2"
                >
                  <Users className="h-4 w-4" />
                  Team
                </Button>
                <Button
                  variant={activeTab === 'analytics' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => { setActiveTab('analytics'); setActiveFeature(null); }}
                  className="gap-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                </Button>
                <Button
                  variant={activeTab === 'settings' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => { setActiveTab('settings'); setActiveFeature(null); }}
                  className="gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3">
              {/* Credits Display */}
              <div className="hidden md:flex items-center gap-4 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{teamStats.creditsRemaining}</span>
                  <span className="text-xs text-gray-500">credits</span>
                </div>
                <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{teamStats.batchCreditsRemaining}</span>
                  <span className="text-xs text-gray-500">batch</span>
                </div>
              </div>

              {/* Admin Panel Button (only visible to admins) */}
              {profile?.is_admin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/admin')}
                  className="gap-2 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/20"
                >
                  <Shield className="h-3.5 w-3.5" />
                  Admin Panel
                </Button>
              )}

              {/* User Menu */}
              <div className="flex items-center gap-2">
                <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0">
                  <Crown className="h-3 w-3 mr-1" />
                  Agency
                </Badge>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => navigate('/settings')}>
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-6 py-8">
        {activeFeature ? (
          // Render individual feature component in full view
          <div>
            <div className="mb-6">
              <Button variant="outline" size="sm" onClick={() => setActiveFeature(null)}>
                ← Back to Overview
              </Button>
            </div>
            {renderFeatureContent()}
          </div>
        ) : (
          // Render tab content
          <>
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Team Members
                        </CardTitle>
                        <Users className="h-5 w-5 text-purple-600" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-gray-900 dark:text-white">
                        {teamStats.totalMembers}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        <Badge variant="outline" className="text-xs">Invite coming Q1 2026</Badge>
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Client Projects
                        </CardTitle>
                        <FolderKanban className="h-5 w-5 text-blue-600" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-gray-900 dark:text-white">
                        {teamStats.activeProjects}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        <Badge variant="outline" className="text-xs">Coming Q1 2026</Badge>
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Workflows Generated
                        </CardTitle>
                        <Activity className="h-5 w-5 text-green-600" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-gray-900 dark:text-white">
                        {teamStats.workflowsGenerated}
                      </div>
                      <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        This month
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Credit Usage
                        </CardTitle>
                        <BarChart3 className="h-5 w-5 text-amber-600" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-gray-900 dark:text-white">
                        {((teamStats.creditsUsed / 750) * 100).toFixed(0)}%
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {teamStats.creditsUsed} / 750 used this month
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Workflow Tools Grid */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Workflow Tools</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveFeature('generator')}>
                      <CardHeader>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                            <Sparkles className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-base">Workflow Generator</CardTitle>
                            <CardDescription className="text-xs">AI-powered generation</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          Generate n8n workflows from natural language descriptions using AI
                        </p>
                        <Button size="sm" className="w-full">
                          Open Generator
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveFeature('batch')}>
                      <CardHeader>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-gradient-to-br from-orange-500 to-pink-600">
                            <Package className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-base">Batch Generator</CardTitle>
                            <CardDescription className="text-xs">Create workflow sets</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          Generate up to 10 related workflows as orchestration packages
                        </p>
                        <Button size="sm" className="w-full">
                          Open Batch Generator
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveFeature('templates')}>
                      <CardHeader>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-teal-600">
                            <BookOpen className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-base">Template Library</CardTitle>
                            <CardDescription className="text-xs">Browse & customize</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          Access 15+ production-ready workflow templates
                        </p>
                        <Button size="sm" className="w-full">
                          Browse Templates
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveFeature('debugger')}>
                      <CardHeader>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-gradient-to-br from-red-500 to-orange-600">
                            <Bug className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-base">Workflow Debugger</CardTitle>
                            <CardDescription className="text-xs">Fix errors with AI</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          Upload broken workflows and get AI-powered fixes
                        </p>
                        <Button size="sm" className="w-full">
                          Open Debugger
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveFeature('converter')}>
                      <CardHeader>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
                            <FileCode className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-base">Platform Converter</CardTitle>
                            <CardDescription className="text-xs">n8n ↔ Make ↔ Zapier</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          Convert workflows between different automation platforms
                        </p>
                        <Button size="sm" className="w-full" disabled>
                          Coming Dec 2025
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveFeature('history')}>
                      <CardHeader>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-gradient-to-br from-gray-500 to-gray-700">
                            <Clock className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-base">Workflow History</CardTitle>
                            <CardDescription className="text-xs">View past generations</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          Access all previously generated and saved workflows
                        </p>
                        <Button size="sm" className="w-full">
                          View History
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Agency Features Roadmap */}
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle>Enterprise Features Roadmap</CardTitle>
                    <CardDescription>What's coming to your Agency workspace</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="font-medium text-sm text-gray-900 dark:text-white">750 Monthly Credits + 50 Batch Credits</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Access to all workflow tools with enhanced limits</p>
                        </div>
                        <Badge className="bg-green-600 text-white border-0">Available Now</Badge>
                      </div>
                      <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                        <Clock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="font-medium text-sm text-gray-900 dark:text-white">Team Member Management</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Invite team members, assign roles (Admin, Member, Viewer), track individual usage</p>
                        </div>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Q1 2026</Badge>
                      </div>
                      <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                        <Clock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="font-medium text-sm text-gray-900 dark:text-white">Client Workspaces</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Organize workflows by client, share access, white-label exports</p>
                        </div>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Q1 2026</Badge>
                      </div>
                      <div className="flex items-start gap-3 p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                        <Clock className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="font-medium text-sm text-gray-900 dark:text-white">Advanced Analytics Dashboard</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Per-user analytics, cost breakdowns, ROI tracking, export reports</p>
                        </div>
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Q2 2026</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'features' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Workflow Tools</h2>
                  <p className="text-gray-600 dark:text-gray-400">Access all your workflow automation tools</p>
                </div>
                <div className="text-center py-12 text-gray-500">
                  <p className="text-sm">Click on a tool card in the Overview tab to get started</p>
                </div>
              </div>
            )}

            {activeTab === 'team' && (
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Team Members</CardTitle>
                      <CardDescription>Manage your agency team and permissions</CardDescription>
                    </div>
                    <Button disabled>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invite Member
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-16 text-gray-500">
                    <Users className="h-20 w-20 mx-auto mb-4 opacity-10" />
                    <p className="text-lg font-medium mb-2">Team Management Coming Soon</p>
                    <p className="text-sm max-w-md mx-auto mb-4">
                      Invite team members, assign granular roles, and track individual credit usage across your agency.
                    </p>
                    <Badge variant="outline" className="text-sm">Available Q1 2026</Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'analytics' && (
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>Usage Analytics</CardTitle>
                  <CardDescription>Track credit usage and team performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-16 text-gray-500">
                    <BarChart3 className="h-20 w-20 mx-auto mb-4 opacity-10" />
                    <p className="text-lg font-medium mb-2">Advanced Analytics Coming Soon</p>
                    <p className="text-sm max-w-md mx-auto mb-4">
                      View detailed breakdowns of credit usage by team member, client project, workflow type, and custom date ranges.
                    </p>
                    <Badge variant="outline" className="text-sm">Available Q2 2026</Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle>Subscription & Billing</CardTitle>
                    <CardDescription>Manage your agency plan</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600">
                          <Crown className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">Agency Plan</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">750 credits + 50 batch credits/month</p>
                        </div>
                      </div>
                      <Button onClick={() => navigate('/settings')}>
                        Manage Subscription
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle>Priority Support</CardTitle>
                    <CardDescription>Get help from your dedicated team</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-3 p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                      <Shield className="h-5 w-5 text-purple-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Priority Support Queue</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">2-hour response time SLA</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                      <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Dedicated Account Manager</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">agency@streamsuite.io</p>
                      </div>
                    </div>
                    <Button
                      className="w-full mt-4"
                      onClick={() => window.location.href = 'mailto:agency@streamsuite.io'}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Contact Support
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
