/**
 * Enterprise Workflow Builder Page
 *
 * Advanced workflow generation for complex multi-module automations (20-100+ nodes)
 * Features:
 * - Complex Workflow mode: Single large workflow
 * - Workflow Sets mode: Multiple related workflows (batch)
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useCredits } from '@/hooks/useCredits';
import { useProfile } from '@/hooks/useProfile';
import { useGeneration } from '@/contexts/GenerationContext';
import { canAccessFeature } from '@/config/subscriptionPlans';
import { deductCredits } from '@/services/creditService';
import { creditEvents } from '@/hooks/useCredits';
import { Building2, Zap, Package, Loader2, Download, Copy, CheckCircle2, Lock, Plus, X } from 'lucide-react';
import { generateEnterpriseWorkflow, type EnterpriseWorkflowRequest } from '@/services/enterpriseWorkflowService';
import { Progress } from '@/components/ui/progress';
import { selectRandomGame, type Game } from '@/components/games';

export default function EnterpriseBuilder() {
  const { toast } = useToast();
  const { balance } = useCredits();
  const { profile, loading: profileLoading } = useProfile();
  const { startGeneration, updateProgress, completeGeneration, failGeneration } = useGeneration();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'complex' | 'sets'>('complex');

  // Complex Workflow State - Simplified
  const [workflowGoal, setWorkflowGoal] = useState(''); // What are you trying to achieve?
  const [triggerType, setTriggerType] = useState(''); // How does it start?
  const [integrations, setIntegrations] = useState<string[]>([]); // All integrations
  const [showAdvanced, setShowAdvanced] = useState(false); // Progressive disclosure
  const [additionalDetails, setAdditionalDetails] = useState(''); // Optional extra context (advanced)
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [result, setResult] = useState<any>(null);
  const [estimatedCredits, setEstimatedCredits] = useState(15);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  // Check tier access
  const hasAccess = profile ? canAccessFeature(profile.subscription_tier, 'batch_operations') : false;

  // If loading, show loading state
  if (profileLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // If no access, show upgrade prompt
  if (!hasAccess) {
    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Enterprise Workflow Builder
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Advanced workflow generation for complex automation (20-100+ nodes)
              </p>
            </div>
          </div>
        </div>

        <Card className="border-purple-200 dark:border-purple-800">
          <CardContent className="pt-12 pb-12">
            <div className="text-center max-w-md mx-auto">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-4">
                <Lock className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Growth or Agency Plan Required
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                The Enterprise Workflow Builder is available on Growth ($99/mo) and Agency ($499/mo) plans.
                Generate complex workflows with 20-100+ nodes using multi-agent AI orchestration.
              </p>
              <div className="space-y-3">
                <Button
                  onClick={() => navigate('/pricing')}
                  className="w-full"
                >
                  View Pricing Plans
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="w-full"
                >
                  Back to Generator
                </Button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-6">
                Current plan: <strong>{profile?.subscription_tier || 'Free'}</strong>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleGenerateComplex = async () => {
    // Validate required fields
    if (!workflowGoal || workflowGoal.length < 20) {
      toast({
        title: 'Goal required',
        description: 'Please describe what you want to achieve (at least 20 characters).',
        variant: 'destructive',
      });
      return;
    }

    if (!triggerType) {
      toast({
        title: 'Trigger required',
        description: 'Please select how your workflow should start.',
        variant: 'destructive',
      });
      return;
    }

    if (!balance || balance.credits_remaining < estimatedCredits) {
      toast({
        title: 'Insufficient credits',
        description: `You need ${estimatedCredits} credits for this operation. You have ${balance?.credits_remaining || 0}.`,
        variant: 'destructive',
      });
      return;
    }

    // Build comprehensive description from guided inputs
    const descriptionParts = [];

    descriptionParts.push(`**Goal**: ${workflowGoal}`);
    descriptionParts.push(`**Trigger**: ${triggerType}`);

    if (integrations.length > 0) {
      descriptionParts.push(`**Integrations**: ${integrations.join(', ')}`);
    }

    if (additionalDetails) {
      descriptionParts.push(`**Additional Details**: ${additionalDetails}`);
    }

    const finalDescription = descriptionParts.join('\n\n');

    setGenerating(true);
    setProgress(0);
    setProgressMessage('Initializing Enterprise Workflow Builder...');

    // Select a random game for the user to play while waiting
    setSelectedGame(selectRandomGame());

    // Register with GenerationContext for background tracking
    startGeneration('enterprise', estimatedCredits);

    try {
      const request: EnterpriseWorkflowRequest = {
        description: finalDescription,
        integrations: integrations.length > 0 ? integrations : undefined,
      };

      const workflowResult = await generateEnterpriseWorkflow(
        request,
        (stage, message, progressValue) => {
          setProgress(progressValue);
          setProgressMessage(message);
          updateProgress(progressValue, message); // Also update context
        }
      );

      // Deduct credits
      await deductCredits(workflowResult.creditsUsed, 'enterprise_workflow');

      // Trigger credit balance refresh
      creditEvents.emit();

      setResult(workflowResult);

      // Mark as complete in context
      completeGeneration(workflowResult);

      toast({
        title: 'Enterprise workflow generated!',
        description: `Successfully created ${workflowResult.blueprint.title} with ${workflowResult.modules.length} modules.`,
      });

    } catch (error: any) {
      console.error('Generation error:', error);

      // Mark as failed in context
      failGeneration(error.message || 'Failed to generate enterprise workflow');

      toast({
        title: 'Generation failed',
        description: error.message || 'Failed to generate enterprise workflow. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
      setSelectedGame(null);
    }
  };

  const downloadWorkflow = () => {
    if (!result) return;

    const dataStr = JSON.stringify(result.finalWorkflow, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `${result.blueprint.title.replace(/\s+/g, '-').toLowerCase()}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    toast({
      title: 'Download started',
      description: 'Workflow JSON file is downloading...',
    });
  };

  const copyToClipboard = () => {
    if (!result) return;

    navigator.clipboard.writeText(JSON.stringify(result.finalWorkflow, null, 2));
    toast({
      title: 'Copied to clipboard',
      description: 'Workflow JSON copied successfully',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Enterprise Workflow Builder
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Advanced workflow generation for complex automation (20-100+ nodes)
            </p>
          </div>
        </div>
        <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800">
          Growth & Agency Plans Only
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="complex" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Complex Workflow
          </TabsTrigger>
          <TabsTrigger value="sets" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Workflow Sets
          </TabsTrigger>
        </TabsList>

        {/* Complex Workflow Tab */}
        <TabsContent value="complex" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Generate Complex Workflow</CardTitle>
              <CardDescription>
                Create a single large workflow with 20-100+ nodes, advanced logic, and multi-step processes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Cost Estimate */}
              <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <div>
                  <p className="text-sm font-medium text-purple-900 dark:text-purple-100">Estimated Cost</p>
                  <p className="text-xs text-purple-700 dark:text-purple-300">Actual cost may vary (12-18 credits)</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{estimatedCredits}</p>
                  <p className="text-xs text-purple-700 dark:text-purple-300">credits</p>
                </div>
              </div>

              {/* Step 1: What are you trying to achieve? */}
              <div className="space-y-2">
                <Label htmlFor="workflow-goal" className="text-base">
                  What are you trying to achieve? *
                </Label>
                <Textarea
                  id="workflow-goal"
                  placeholder="Example: Automate customer onboarding from signup to first product use"
                  rows={3}
                  value={workflowGoal}
                  onChange={(e) => setWorkflowGoal(e.target.value)}
                  className="resize-none"
                />
                <p className="text-xs text-gray-500">{workflowGoal.length} characters (min 20)</p>
              </div>

              {/* Step 2: How should it start? */}
              <div className="space-y-2">
                <Label htmlFor="trigger-type" className="text-base">How should your workflow start? *</Label>
                <Select value={triggerType} onValueChange={setTriggerType}>
                  <SelectTrigger id="trigger-type">
                    <SelectValue placeholder="Choose a trigger..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="webhook">Webhook (API call)</SelectItem>
                    <SelectItem value="schedule">Schedule (cron/interval)</SelectItem>
                    <SelectItem value="email">Email received</SelectItem>
                    <SelectItem value="form_submission">Form submission</SelectItem>
                    <SelectItem value="database_event">Database event</SelectItem>
                    <SelectItem value="file_upload">File upload</SelectItem>
                    <SelectItem value="user_action">User action (signup, purchase)</SelectItem>
                    <SelectItem value="manual">Manual trigger</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Step 3: Which tools/platforms? (Optional, but recommended) */}
              <div className="space-y-2">
                <Label className="text-base">Which tools/platforms will you use? (Optional)</Label>
                <p className="text-xs text-gray-500 mb-2">Select the main services your workflow needs</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {integrations.map((integration, index) => (
                    <Badge key={index} variant="secondary" className="pl-2 pr-1 py-1">
                      {integration}
                      <button
                        onClick={() => {
                          setIntegrations(prev => prev.filter((_, i) => i !== index));
                        }}
                        className="ml-1 hover:bg-gray-300 rounded p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <Select
                  value=""
                  onValueChange={(value) => {
                    if (value && !integrations.includes(value)) {
                      setIntegrations(prev => [...prev, value]);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Add a tool/platform..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[240px]">
                    <SelectItem value="Salesforce">Salesforce</SelectItem>
                    <SelectItem value="HubSpot">HubSpot</SelectItem>
                    <SelectItem value="Slack">Slack</SelectItem>
                    <SelectItem value="Gmail">Gmail</SelectItem>
                    <SelectItem value="Google Sheets">Google Sheets</SelectItem>
                    <SelectItem value="Airtable">Airtable</SelectItem>
                    <SelectItem value="Stripe">Stripe</SelectItem>
                    <SelectItem value="Shopify">Shopify</SelectItem>
                    <SelectItem value="Asana">Asana</SelectItem>
                    <SelectItem value="Notion">Notion</SelectItem>
                    <SelectItem value="PostgreSQL">PostgreSQL</SelectItem>
                    <SelectItem value="OpenAI">OpenAI</SelectItem>
                    <SelectItem value="Other">Other (specify in details below)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Advanced Options (Collapsible) */}
              <div className="border-t pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="mb-3"
                >
                  <Plus className={`h-4 w-4 mr-2 transition-transform ${showAdvanced ? 'rotate-45' : ''}`} />
                  {showAdvanced ? 'Hide' : 'Add'} Additional Details (Optional)
                </Button>

                {showAdvanced && (
                  <div className="space-y-2">
                    <Label htmlFor="additional-details" className="text-sm text-gray-600">
                      Any specific requirements, business rules, or constraints?
                    </Label>
                    <Textarea
                      id="additional-details"
                      placeholder="Example: Must handle 1000+ concurrent users, need data validation, compliance with GDPR..."
                      rows={4}
                      value={additionalDetails}
                      onChange={(e) => setAdditionalDetails(e.target.value)}
                      className="resize-none"
                    />
                  </div>
                )}
              </div>

              {/* Info Cards */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Generation Time</p>
                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">Typically 2-4 minutes</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-green-900 dark:text-green-100">Production-Ready</p>
                        <p className="text-xs text-green-700 dark:text-green-300 mt-1">Based on proven patterns</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerateComplex}
                disabled={generating || !workflowGoal || workflowGoal.length < 20 || !triggerType}
                className="w-full"
                size="lg"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Generate Complex Workflow ({estimatedCredits} credits)
                  </>
                )}
              </Button>

              {/* Progress */}
              {generating && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">{progressMessage}</span>
                      <span className="font-medium">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  {/* Mini-game while waiting */}
                  {selectedGame && (
                    <div className="mt-6">
                      <div className="mb-3 text-center">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                          While you wait...
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Play {selectedGame.name} while we build your workflow!
                        </p>
                      </div>
                      <selectedGame.component
                        onSwitchGame={() => {
                          // Select a new random game
                          setSelectedGame(selectRandomGame());
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Result */}
              {result && !generating && (
                <Card className="border-green-200 dark:border-green-800">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-green-900 dark:text-green-100">
                          {result.blueprint.title}
                        </CardTitle>
                        <CardDescription>
                          {result.modules.length} modules • {result.blueprint.estimatedTotalNodes} nodes • {result.creditsUsed} credits used
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={copyToClipboard}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy JSON
                        </Button>
                        <Button size="sm" onClick={downloadWorkflow}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Modules Generated:</h4>
                      <div className="space-y-2">
                        {result.modules.map((module: any, i: number) => (
                          <div key={i} className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <Badge variant="outline" className="mt-0.5">{i + 1}</Badge>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{module.name}</p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">{module.description}</p>
                              <div className="flex gap-2 mt-1">
                                <Badge variant="secondary" className="text-xs">{module.estimatedNodes} nodes</Badge>
                                {module.integrations.map((int: string) => (
                                  <Badge key={int} variant="outline" className="text-xs">{int}</Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Setup Instructions:</h4>
                      <pre className="text-xs bg-gray-50 dark:bg-gray-800 p-4 rounded-lg overflow-auto max-h-64">
                        {result.setupInstructions}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workflow Sets Tab */}
        <TabsContent value="sets" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Generate Workflow Sets (Batch)</CardTitle>
              <CardDescription>
                Generate up to 10 related workflows that work together as an orchestrated system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Workflow Sets Coming Soon
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                  This feature uses your existing Batch Generator. Access it from the main dashboard
                  or through the Team Dashboard if you're on the Agency plan.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => window.location.href = '/batch'}
                >
                  Go to Batch Generator
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
