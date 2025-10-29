/**
 * Generator Page - REDESIGNED LAYOUT
 *
 * Side-by-side layout: Prompt input on left, output on right
 * No page scrolling - only output window scrolls
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { Sparkles, Wand2, AlertCircle, CheckCircle2, Download, Copy, Save, Check, Code2 } from 'lucide-react';
import { PushToN8nButton } from '@/components/workflow/PushToN8nButton';
import { cn } from '@/lib/utils';

// Services
import { generateWorkflow, generateWorkflowName, generateCustomCode } from '@/services/aiService';
import { saveWorkflow } from '@/services/workflowService';
import { validatePrompt } from '@/services/promptValidator';
import {
  hasEnoughCredits,
  deductCredits,
  getLowCreditsWarning,
  estimateGenerationCost,
  getComplexityLabel
} from '@/services/creditService';
import { getEnabledWorkflowPlatforms, getEnabledCodePlatforms } from '@/services/featureFlagService';
import { useCredits } from '@/hooks/useCredits';
import { useProfile } from '@/hooks/useProfile';
import { canAccessFeature, getUpgradeMessage } from '@/config/subscriptionPlans';
import UpgradeCTA from '@/components/UpgradeCTA';
import UpgradeDialog from '@/components/UpgradeDialog';
import { Coins } from 'lucide-react';

export default function GeneratorNew() {
  // State management
  const [activeTab, setActiveTab] = useState('workflow');
  const [prompt, setPrompt] = useState('');
  const [platform, setPlatform] = useState<'n8n' | 'make' | 'zapier'>('n8n');
  const [loading, setLoading] = useState(false);
  const [workflow, setWorkflow] = useState<any>(null);
  const [workflowName, setWorkflowName] = useState('');
  const [generationStats, setGenerationStats] = useState<{
    tokensUsed: number;
    timeTaken: number;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [estimatedCredits, setEstimatedCredits] = useState(1);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);

  // Code generator state
  const [codePrompt, setCodePrompt] = useState('');
  const [codePlatform, setCodePlatform] = useState<'n8n' | 'make' | 'zapier'>('n8n');
  const [codeLanguage, setCodeLanguage] = useState<'javascript' | 'python'>('javascript');
  const [generatedCode, setGeneratedCode] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  // Feature flags for platform availability
  const [enabledWorkflowPlatforms, setEnabledWorkflowPlatforms] = useState({
    n8n: true,
    make: false,
    zapier: false
  });
  const [enabledCodePlatforms, setEnabledCodePlatforms] = useState({
    n8n: true,
    make: false,
    zapier: false
  });

  const { toast } = useToast();
  const navigate = useNavigate();
  const { balance } = useCredits();
  const { profile } = useProfile();

  // Check if user can access code generation
  const canGenerateCode = profile ? canAccessFeature(profile.subscription_tier, 'code_generation') : false;
  const codeGenUpgradeMessage = profile ? getUpgradeMessage(profile.subscription_tier, 'code_generation') : '';

  // Handle tab changes with access control
  const handleTabChange = (newTab: string) => {
    if (newTab === 'code' && !canGenerateCode) {
      setUpgradeDialogOpen(true);
      return;
    }
    setActiveTab(newTab);
  };

  // Load feature flags on mount
  useEffect(() => {
    const loadFeatureFlags = async () => {
      try {
        const [workflowPlatforms, codePlatforms] = await Promise.all([
          getEnabledWorkflowPlatforms(),
          getEnabledCodePlatforms()
        ]);
        setEnabledWorkflowPlatforms(workflowPlatforms);
        setEnabledCodePlatforms(codePlatforms);
      } catch (error) {
        console.error('Failed to load feature flags:', error);
      }
    };
    loadFeatureFlags();
  }, []);

  // Update credit estimation when prompt changes
  useEffect(() => {
    if (prompt.trim()) {
      const estimate = estimateGenerationCost(prompt);
      setEstimatedCredits(estimate);
    } else {
      setEstimatedCredits(1);
    }
  }, [prompt]);

  /**
   * Handle workflow generation
   */
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: 'Missing prompt',
        description: 'Please describe the workflow you want to generate.',
        variant: 'destructive'
      });
      return;
    }

    // Validate prompt
    const validation = validatePrompt(prompt);
    if (!validation.isValid) {
      toast({
        title: validation.category === 'unethical' ? '🚫 Request Blocked' : '❌ Not a Workflow Request',
        description: validation.reason,
        variant: 'destructive',
        duration: 10000
      });
      return;
    }

    // Check if user has enough credits (use estimated cost)
    const hasCredits = await hasEnoughCredits(estimatedCredits);
    if (!hasCredits) {
      const isPaidUser = balance?.subscription_tier !== 'free';
      toast({
        title: '💳 Not Enough Credits',
        description: `You have ${totalCredits} credit${totalCredits !== 1 ? 's' : ''} remaining. You need 1 credit to generate a workflow. ${isPaidUser ? 'Top up to get more credits!' : 'Upgrade to get more credits!'}`,
        variant: 'destructive',
        duration: 8000,
        action: (
          <ToastAction altText={isPaidUser ? "Top Up" : "Upgrade"} onClick={() => navigate('/pricing')}>
            {isPaidUser ? "Top Up" : "Upgrade"}
          </ToastAction>
        )
      });
      return;
    }

    setLoading(true);

    try {
      const startTime = Date.now();

      // Generate workflow
      const result = await generateWorkflow({
        prompt,
        platform,
        useCache: true
      });

      const timeTaken = Date.now() - startTime;

      // Use ACTUAL credit cost from AI service (based on token usage)
      const actualCreditCost = result.creditsUsed || 1;

      // Deduct credits AFTER successful generation using actual cost
      try {
        await deductCredits({
          amount: actualCreditCost,
          operation_type: 'generation',
          description: `Generated workflow: ${prompt.substring(0, 50)}...`
        });
      } catch (creditError) {
        console.error('Failed to deduct credits:', creditError);
        // Don't block the user from seeing their workflow if credit deduction fails
        toast({
          title: '⚠️ Credit Deduction Warning',
          description: 'Your workflow was generated but credits may not have been deducted. Please contact support.',
          duration: 6000
        });
      }

      // Generate workflow name
      const name = await generateWorkflowName(prompt);

      setWorkflow(result.workflow);
      setWorkflowName(name);
      setGenerationStats({
        tokensUsed: typeof result.tokensUsed === 'object' ? result.tokensUsed.total : result.tokensUsed || 0,
        timeTaken
      });

      // Calculate new balance after deduction
      const newTotalBalance = totalCredits - actualCreditCost;

      toast({
        title: '✅ Workflow generated!',
        description: `Created in ${(timeTaken / 1000).toFixed(1)}s. You have ${newTotalBalance} credit${newTotalBalance !== 1 ? 's' : ''} remaining.`,
        duration: 5000
      });

      // Show low credits warning if applicable (only if less than 10 total credits)
      if (newTotalBalance > 0 && newTotalBalance < 10) {
        setTimeout(() => {
          toast({
            title: '⚠️ Low Credit Balance',
            description: `You have ${newTotalBalance} credit${newTotalBalance !== 1 ? 's' : ''} remaining. Consider topping up to continue generating workflows!`,
            duration: 6000,
            action: (
              <ToastAction altText="Top Up" onClick={() => navigate('/pricing')}>
                Top Up
              </ToastAction>
            )
          });
        }, 2000);
      }

    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: 'Generation failed',
        description: error instanceof Error ? error.message : 'Could not generate workflow. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Download workflow as JSON file
   */
  const downloadWorkflow = () => {
    if (!workflow) return;

    const blob = new Blob([JSON.stringify(workflow, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflowName || 'workflow'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Downloaded!',
      description: 'Workflow JSON file has been downloaded.',
      duration: 3000
    });
  };

  /**
   * Copy workflow JSON to clipboard
   */
  const copyWorkflow = async () => {
    if (!workflow) return;

    try {
      await navigator.clipboard.writeText(JSON.stringify(workflow, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      toast({
        title: 'Copied!',
        description: 'Workflow JSON copied to clipboard.',
        duration: 2000
      });
    } catch (error) {
      toast({
        title: 'Copy failed',
        description: 'Could not copy to clipboard.',
        variant: 'destructive'
      });
    }
  };

  /**
   * Save workflow to history
   */
  const handleSaveWorkflow = async () => {
    if (!workflow) return;

    // Check if user has access to save workflows
    const canSaveHistory = profile ? canAccessFeature(profile.subscription_tier, 'history') : false;
    if (!canSaveHistory) {
      toast({
        title: 'Upgrade Required',
        description: getUpgradeMessage(profile?.subscription_tier || 'free', 'history'),
        variant: 'destructive',
        action: (
          <ToastAction altText="Upgrade" onClick={() => navigate('/settings?tab=billing')}>
            Upgrade
          </ToastAction>
        )
      });
      return;
    }

    try {
      await saveWorkflow({
        name: workflowName,
        description: prompt.substring(0, 200),
        platform,
        workflowJson: workflow,
        prompt,
        creditsUsed: 1,
        tokensUsed: generationStats?.tokensUsed || 0
      });

      toast({
        title: '✅ Saved to history!',
        description: 'You can find it in your History page.',
        duration: 3000
      });
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: 'Save failed',
        description: error instanceof Error ? error.message : 'Could not save workflow. The workflows table may not exist in your database.',
        variant: 'destructive',
        duration: 5000
      });
    }
  };

  /**
   * Handle custom code generation for n8n, Make.com, and Zapier
   */
  const handleGenerateCode = async () => {
    if (!codePrompt.trim()) {
      toast({
        title: 'Missing description',
        description: 'Please describe what code you want to generate.',
        variant: 'destructive'
      });
      return;
    }

    // Check credits (code generation also costs 1 credit)
    const hasCredits = await hasEnoughCredits(1);
    if (!hasCredits) {
      const isPaidUser = balance?.subscription_tier !== 'free';
      toast({
        title: '💳 Not Enough Credits',
        description: `You have ${totalCredits} credit${totalCredits !== 1 ? 's' : ''} remaining. You need 1 credit to generate code. ${isPaidUser ? 'Top up to get more credits!' : 'Upgrade to get more credits!'}`,
        variant: 'destructive',
        duration: 8000,
        action: (
          <ToastAction altText={isPaidUser ? "Top Up" : "Upgrade"} onClick={() => navigate('/pricing')}>
            {isPaidUser ? "Top Up" : "Upgrade"}
          </ToastAction>
        )
      });
      return;
    }

    setCodeLoading(true);
    setGeneratedCode('');

    try {
      const result = await generateCustomCode({
        prompt: codePrompt,
        platform: codePlatform,
        language: codeLanguage
      });

      // Deduct 1 credit
      try {
        await deductCredits({
          amount: 1,
          operation_type: 'generation',
          description: `Generated ${codePlatform} ${codeLanguage} code: ${codePrompt.substring(0, 50)}...`
        });
      } catch (creditError) {
        console.error('Failed to deduct credits:', creditError);
      }

      setGeneratedCode(result.code);

      const platformName = codePlatform === 'n8n' ? 'n8n' : codePlatform === 'make' ? 'Make.com' : 'Zapier';
      const newTotalBalance = totalCredits - 1;
      toast({
        title: '✅ Code generated!',
        description: `Ready to paste into ${platformName}. You have ${newTotalBalance} credit${newTotalBalance !== 1 ? 's' : ''} remaining.`,
        duration: 3000
      });
    } catch (error) {
      console.error('Code generation error:', error);
      toast({
        title: 'Generation failed',
        description: error instanceof Error ? error.message : 'Could not generate code. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setCodeLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (!generatedCode) return;

    navigator.clipboard.writeText(generatedCode);
    setCodeCopied(true);

    setTimeout(() => setCodeCopied(false), 2000);

    toast({
      title: 'Copied to clipboard!',
      description: 'Paste this code into your n8n Code node.',
      duration: 2000
    });
  };

  const totalCredits = balance?.total_credits ?? 0;
  const regularCredits = balance?.credits_remaining ?? 0;
  const bonusCredits = balance?.bonus_credits ?? 0;
  const hasEnoughForGeneration = totalCredits >= estimatedCredits;

  return (
    <div className="h-full max-h-[calc(100vh-96px)] flex flex-col gap-4 overflow-hidden">
      {/* Header with Credit Balance */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            AI Generator
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Generate workflows and custom code with AI
          </p>
        </div>

        {/* Credit Balance Display */}
        <div className="flex flex-col gap-0.5 text-right">
          <div className="flex items-center justify-end gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-800/60 rounded-md border border-gray-200/80 dark:border-gray-800/50">
            <Coins className={cn(
              "h-4 w-4",
              totalCredits < 10 ? "text-amber-500" : "text-gray-600 dark:text-gray-400"
            )} />
            <div className="text-xs font-semibold text-gray-900 dark:text-gray-100">
              {totalCredits} {totalCredits === 1 ? 'credit' : 'credits'}
            </div>
          </div>
          {bonusCredits > 0 && (
            <div className="text-[10px] text-gray-500 dark:text-gray-400 px-1">
              {regularCredits} regular + {bonusCredits} bonus
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-fit mb-4">
          <TabsTrigger value="workflow" className="text-xs">
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            Workflow Generator
          </TabsTrigger>
          <TabsTrigger value="code" className="text-xs">
            <Code2 className="h-3.5 w-3.5 mr-1.5" />
            n8n Code Generator
          </TabsTrigger>
        </TabsList>

        {/* Workflow Generator Tab */}
        <TabsContent value="workflow" className="flex-1 flex gap-4 overflow-hidden mt-0">
          {/* LEFT SIDE - Input */}
          <div className="w-1/2 flex flex-col gap-4 min-h-0">

        <Card className="flex-1 p-4 flex flex-col gap-4 min-h-0 overflow-hidden border-gray-200/80 dark:border-gray-800/50 dark:bg-[#0d0d0d] shadow-none">
          {/* Platform Selector */}
          <div>
            <Label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 block">Platform</Label>
            <div className="flex gap-2">
              <Button
                variant={platform === 'n8n' ? 'default' : 'outline'}
                onClick={() => setPlatform('n8n')}
                disabled={!enabledWorkflowPlatforms.n8n}
                className={cn(
                  "flex-1 h-8 font-medium text-xs",
                  platform === 'n8n'
                    ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100"
                    : "border-gray-200/80 dark:border-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800/60"
                )}
              >
                n8n
              </Button>
              <div className="flex-1 relative">
                <Button
                  variant={platform === 'make' ? 'default' : 'outline'}
                  onClick={() => {
                    if (enabledWorkflowPlatforms.make) {
                      setPlatform('make');
                    }
                  }}
                  disabled={!enabledWorkflowPlatforms.make}
                  className={cn(
                    "w-full h-8 font-medium text-xs",
                    !enabledWorkflowPlatforms.make && "opacity-50 cursor-not-allowed",
                    platform === 'make'
                      ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100"
                      : "border-gray-200/80 dark:border-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800/60"
                  )}
                >
                  Make.com
                </Button>
                {!enabledWorkflowPlatforms.make && (
                  <Badge variant="secondary" className="absolute -top-2 -right-2 text-[8px] px-1 py-0 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800">
                    Soon
                  </Badge>
                )}
              </div>
              <div className="flex-1 relative">
                <Button
                  variant={platform === 'zapier' ? 'default' : 'outline'}
                  onClick={() => {
                    if (enabledWorkflowPlatforms.zapier) {
                      setPlatform('zapier');
                    }
                  }}
                  disabled={!enabledWorkflowPlatforms.zapier}
                  className={cn(
                    "w-full h-8 font-medium text-xs",
                    !enabledWorkflowPlatforms.zapier && "opacity-50 cursor-not-allowed",
                    platform === 'zapier'
                      ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100"
                      : "border-gray-200/80 dark:border-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800/60"
                  )}
                >
                  Zapier
                </Button>
                {!enabledWorkflowPlatforms.zapier && (
                  <Badge variant="secondary" className="absolute -top-2 -right-2 text-[8px] px-1 py-0 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800">
                    Soon
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Example Prompts */}
          {!prompt && (
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Examples</Label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => setPrompt("Send a Slack notification when a new customer signs up in Stripe")}
                  className="text-[11px] text-left px-2 py-1.5 rounded-md bg-gray-100 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700/60 transition-colors border border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                >
                  Stripe → Slack
                </button>
                <button
                  onClick={() => setPrompt("Create a workflow that reads Gmail emails, extracts invoice data, and saves it to Google Sheets")}
                  className="text-[11px] text-left px-2 py-1.5 rounded-md bg-gray-100 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700/60 transition-colors border border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                >
                  Gmail → Sheets
                </button>
                <button
                  onClick={() => setPrompt("Monitor a webhook for new leads, score them using AI, and add high-value leads to HubSpot")}
                  className="text-[11px] text-left px-2 py-1.5 rounded-md bg-gray-100 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700/60 transition-colors border border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                >
                  AI Lead Scoring
                </button>
                <button
                  onClick={() => setPrompt("Schedule a daily workflow that fetches analytics data, generates a summary using AI, and sends it via email")}
                  className="text-[11px] text-left px-2 py-1.5 rounded-md bg-gray-100 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700/60 transition-colors border border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                >
                  Daily Report
                </button>
              </div>
            </div>
          )}

          {/* Prompt Input */}
          <div className="flex-1 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Description
              </Label>
              {prompt && (
                <button
                  onClick={() => setPrompt('')}
                  className="text-[11px] text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the workflow you want to create..."
              className="min-h-[140px] resize-none text-xs border-gray-200/80 dark:border-gray-800/50 bg-white dark:bg-[#111111] focus-visible:ring-1 focus-visible:ring-gray-400 dark:focus-visible:ring-gray-600"
            />

            {/* Prompt Guidelines - Below textarea */}
            <div className="bg-gray-50 dark:bg-[#111111] border border-gray-200/80 dark:border-gray-800/50 rounded-md p-3 space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
                <div className="text-[11px] text-gray-600 dark:text-gray-400 space-y-1.5">
                  <p className="font-medium text-gray-700 dark:text-gray-300">Include these details:</p>
                  <ul className="space-y-1 ml-3 list-disc">
                    <li><strong>Trigger:</strong> What starts the workflow</li>
                    <li><strong>Source:</strong> Which app/service provides data</li>
                    <li><strong>Actions:</strong> What should happen</li>
                    <li><strong>Destination:</strong> Where results go</li>
                  </ul>
                  <p className="text-gray-500 dark:text-gray-500 pt-1 text-[10px]">
                    Example: "When payment succeeds in Stripe, send Slack message and add to Google Sheet"
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <div className="space-y-2">
            <Button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim() || !hasEnoughForGeneration}
              className={cn(
                "w-full h-8 text-xs font-medium flex items-center justify-center gap-2",
                hasEnoughForGeneration
                  ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100"
                  : "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {loading ? (
                <>
                  <Wand2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Wand2 className="h-3.5 w-3.5" />
                  <span>Generate Workflow</span>
                </>
              )}
            </Button>

            {/* Insufficient credits warning */}
            {prompt.trim() && !hasEnoughForGeneration && (
              <div className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/20 px-2 py-1.5 rounded-md border border-amber-200 dark:border-amber-800/50">
                <AlertCircle className="h-3 w-3 flex-shrink-0" />
                <span>
                  You need 1 credit to generate a workflow. You have {totalCredits}.{' '}
                  <button
                    onClick={() => navigate('/pricing')}
                    className="underline font-medium hover:text-amber-700 dark:hover:text-amber-400"
                  >
                    {balance?.subscription_tier === 'free' ? 'Upgrade' : 'Top Up'}
                  </button>
                </span>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* RIGHT SIDE - Output */}
      <div className="w-1/2 flex flex-col gap-4 min-h-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Output</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Generated workflow JSON</p>
          </div>
          {workflow && (
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveWorkflow}
                className="h-8 text-xs font-medium border-gray-200/80 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/40"
                title="Save to history"
              >
                <Save className="h-3.5 w-3.5" />
                Save
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={copyWorkflow}
                className="h-8 text-xs font-medium border-gray-200/80 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/40"
                title="Copy JSON"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-green-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                Copy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadWorkflow}
                className="h-8 text-xs font-medium border-gray-200/80 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/40"
                title="Download JSON"
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </Button>
              <PushToN8nButton
                workflowName={workflowName || 'Generated Workflow'}
                workflowJson={workflow}
                variant="outline"
                size="sm"
                className="h-8 text-xs font-medium border-gray-200/80 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/40"
              />
            </div>
          )}
        </div>

        <Card className="flex-1 p-4 flex flex-col min-h-0 overflow-hidden shadow-none border-gray-200/80 dark:border-gray-800/50">
          {!workflow && !loading && (
            <div className="flex-1 flex items-center justify-center text-center bg-gray-50 dark:bg-[#0d0d0d] rounded-md border border-dashed border-gray-200/80 dark:border-gray-800/50">
              <div className="space-y-2 px-6">
                <div className="bg-gray-100 dark:bg-gray-800/60 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
                  <Sparkles className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <div>
                  <p className="text-gray-900 dark:text-gray-100 text-xs font-medium">Ready to generate</p>
                  <p className="text-gray-500 dark:text-gray-400 text-[11px] mt-0.5">
                    Describe your workflow and click Generate
                  </p>
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex-1 flex items-center justify-center text-center bg-blue-50/50 dark:bg-blue-950/20 rounded-md border border-blue-200/80 dark:border-blue-800/50">
              <div className="space-y-2.5 px-6">
                <Wand2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin mx-auto" />
                <div>
                  <p className="text-gray-900 dark:text-gray-100 text-xs font-semibold">Generating workflow...</p>
                  <p className="text-gray-600 dark:text-gray-400 text-[11px] mt-0.5">
                    AI is analyzing your prompt and creating the workflow
                  </p>
                </div>
              </div>
            </div>
          )}

          {workflow && (
            <div className="flex-1 flex flex-col gap-3 min-h-0">
              {/* Workflow Info */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-200/80 dark:border-gray-800/50 flex-shrink-0">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{workflowName}</h3>
                  {generationStats && (
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                      <span className="inline-flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-500" />
                        Generated in {(generationStats.timeTaken / 1000).toFixed(1)}s
                      </span>
                    </p>
                  )}
                </div>
                <Badge variant="secondary" className="bg-green-50/50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200/80 dark:border-green-800/50 text-[10px] px-2 py-0.5 font-medium">
                  Ready to use
                </Badge>
              </div>

              {/* JSON Output - Scrollable */}
              <div className="flex-1 min-h-0 overflow-y-auto bg-gray-50 dark:bg-[#0d0d0d] rounded-md p-3 border border-gray-200/80 dark:border-gray-800/50">
                <pre className="text-[11px] font-mono text-gray-800 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {JSON.stringify(workflow, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </Card>
      </div>
        </TabsContent>

        {/* Code Generator Tab */}
        <TabsContent value="code" className="flex-1 flex gap-4 mt-0 overflow-hidden">
          {/* LEFT SIDE - Code Input */}
          <div className="w-1/2 flex flex-col gap-4 min-h-0">
            <Card className="flex-1 p-4 flex flex-col gap-4 min-h-0 overflow-hidden border-gray-200/80 dark:border-gray-800/50 dark:bg-[#0d0d0d] shadow-none">
              {/* Platform Selector */}
              <div>
                <Label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 block">Platform</Label>
                <div className="flex gap-2">
                  <Button
                    variant={codePlatform === 'n8n' ? 'default' : 'outline'}
                    onClick={() => {
                      setCodePlatform('n8n');
                      // n8n supports both JS and Python
                    }}
                    disabled={!enabledCodePlatforms.n8n}
                    className={cn(
                      "flex-1 h-8 font-medium text-xs relative",
                      codePlatform === 'n8n'
                        ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800"
                    )}
                  >
                    n8n
                  </Button>
                  <div className="flex-1 relative">
                    <Button
                      variant={codePlatform === 'make' ? 'default' : 'outline'}
                      onClick={() => {
                        if (enabledCodePlatforms.make) {
                          setCodePlatform('make');
                          setCodeLanguage('javascript'); // Make.com only supports JS
                        }
                      }}
                      disabled={!enabledCodePlatforms.make}
                      className={cn(
                        "w-full h-8 font-medium text-xs",
                        !enabledCodePlatforms.make && "opacity-50 cursor-not-allowed",
                        codePlatform === 'make'
                          ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100"
                          : "hover:bg-gray-50 dark:hover:bg-gray-800"
                      )}
                    >
                      Make.com
                    </Button>
                    {!enabledCodePlatforms.make && (
                      <Badge variant="secondary" className="absolute -top-2 -right-2 text-[8px] px-1 py-0 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800">
                        Soon
                      </Badge>
                    )}
                  </div>
                  <div className="flex-1 relative">
                    <Button
                      variant={codePlatform === 'zapier' ? 'default' : 'outline'}
                      onClick={() => {
                        if (enabledCodePlatforms.zapier) {
                          setCodePlatform('zapier');
                          // Zapier supports both JS and Python
                        }
                      }}
                      disabled={!enabledCodePlatforms.zapier}
                      className={cn(
                        "w-full h-8 font-medium text-xs",
                        !enabledCodePlatforms.zapier && "opacity-50 cursor-not-allowed",
                        codePlatform === 'zapier'
                          ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100"
                          : "hover:bg-gray-50 dark:hover:bg-gray-800"
                      )}
                    >
                      Zapier
                    </Button>
                    {!enabledCodePlatforms.zapier && (
                      <Badge variant="secondary" className="absolute -top-2 -right-2 text-[8px] px-1 py-0 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800">
                        Soon
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Language Selector */}
              <div>
                <Label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 block">Language</Label>
                <div className="flex gap-2">
                  <Button
                    variant={codeLanguage === 'javascript' ? 'default' : 'outline'}
                    onClick={() => setCodeLanguage('javascript')}
                    className={cn(
                      "flex-1 h-8 font-medium text-xs",
                      codeLanguage === 'javascript'
                        ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800"
                    )}
                  >
                    JavaScript
                  </Button>
                  <Button
                    variant={codeLanguage === 'python' ? 'default' : 'outline'}
                    onClick={() => setCodeLanguage('python')}
                    disabled={codePlatform === 'make'}
                    className={cn(
                      "flex-1 h-8 font-medium text-xs",
                      codeLanguage === 'python'
                        ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800",
                      codePlatform === 'make' && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    Python
                  </Button>
                  {codePlatform === 'make' && (
                    <span className="text-[10px] text-gray-400 self-center ml-1">(JS only)</span>
                  )}
                </div>
              </div>

              {/* Code Description Input */}
              <div className="flex-1 flex flex-col gap-2 min-h-0">
                <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Describe your code
                </Label>
                <Textarea
                  placeholder={
                    codePlatform === 'n8n'
                      ? `Example: "Filter items where score > 50 and add a timestamp to each item"`
                      : codePlatform === 'make'
                      ? `Example: "Fetch data from API, transform the response, and return formatted results"`
                      : `Example: "Parse input data, filter by status, and format for next step"`
                  }
                  value={codePrompt}
                  onChange={(e) => setCodePrompt(e.target.value)}
                  className="flex-1 resize-none text-xs font-mono border-gray-200/80 dark:border-gray-800/50 dark:bg-black focus:ring-1 focus:ring-gray-900 dark:focus:ring-white min-h-0"
                />
              </div>

              {/* Generate Button */}
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleGenerateCode}
                  disabled={codeLoading || !codePrompt.trim() || totalCredits < 1}
                  className={cn(
                    "w-full h-9 font-medium text-xs",
                    "bg-gray-900 dark:bg-white text-white dark:text-gray-900",
                    "hover:bg-gray-800 dark:hover:bg-gray-100",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {codeLoading ? (
                    <>
                      <Wand2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Code2 className="h-3.5 w-3.5" />
                      <span>Generate Code</span>
                    </>
                  )}
                </Button>

                {/* Info */}
                <p className="text-[10px] text-gray-500 dark:text-gray-400 text-center">
                  Costs 1 credit • Ready to paste into {
                    codePlatform === 'n8n' ? 'n8n Code node' :
                    codePlatform === 'make' ? 'Make.com custom module' :
                    'Zapier Code step'
                  }
                </p>
              </div>
            </Card>
          </div>

          {/* RIGHT SIDE - Code Output */}
          <div className="w-1/2 flex flex-col gap-4 min-h-0">
            <Card className="flex-1 p-4 flex flex-col gap-3 min-h-0 overflow-hidden border-gray-200/80 dark:border-gray-800/50 dark:bg-[#0d0d0d] shadow-none">
              {!generatedCode ? (
                <div className="flex-1 flex items-center justify-center text-center">
                  <div className="max-w-xs">
                    <Code2 className="h-12 w-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                      No code generated yet
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Describe what you want your n8n Code node to do, and we'll generate the code for you.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Code Actions */}
                  <div className="flex items-center justify-between pb-2 border-b border-gray-200/80 dark:border-gray-800/50">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px] px-2 py-0.5 font-medium">
                        {codeLanguage === 'javascript' ? 'JavaScript' : 'Python'}
                      </Badge>
                      <Badge variant="secondary" className="bg-green-50/50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200/80 dark:border-green-800/50 text-[10px] px-2 py-0.5 font-medium">
                        Ready to use
                      </Badge>
                    </div>
                    <Button
                      onClick={handleCopyCode}
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                    >
                      {codeCopied ? (
                        <>
                          <Check className="h-3 w-3 mr-1" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 mr-1" />
                          Copy Code
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Code Output - Scrollable */}
                  <div className="flex-1 min-h-0 overflow-y-auto bg-gray-50 dark:bg-[#0d0d0d] rounded-md p-3 border border-gray-200/80 dark:border-gray-800/50">
                    <pre className="text-[11px] font-mono text-gray-800 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                      {generatedCode}
                    </pre>
                  </div>
                </>
              )}
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Upgrade Dialog */}
      <UpgradeDialog
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
        feature="Custom Code Generator"
        message={codeGenUpgradeMessage}
        requiredPlan="starter"
      />
    </div>
  );
}
