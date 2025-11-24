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
import { Sparkles, Wand2, AlertCircle, CheckCircle2, Download, Copy, Save, Check, Code2, ArrowLeft } from 'lucide-react';
import { PushToN8nButton } from '@/components/workflow/PushToN8nButton';
import { cn } from '@/lib/utils';

// Services
import { generateWorkflow, generateWorkflowName, generateCustomCode } from '@/services/aiService';
import { saveWorkflow, autoSaveWorkflow, manuallySaveWorkflow } from '@/services/workflowService';
import { validatePrompt } from '@/services/promptValidator';
import { validateCodePrompt, getSecurityThreatLevel } from '@/services/codePromptValidator';
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
import { canAccessFeature, getUpgradeMessage, hasAutoSaveHistory } from '@/config/subscriptionPlans';
import UpgradeCTA from '@/components/UpgradeCTA';
import UpgradeDialog from '@/components/UpgradeDialog';
import { Coins } from 'lucide-react';
import { logSuccess, logFailure, logBlocked } from '@/services/auditService';

export default function GeneratorNew() {
  // Helper function to load saved state from localStorage
  const loadSavedState = () => {
    try {
      const saved = localStorage.getItem('generatorState');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Only restore if saved within last 24 hours
        if (parsed.timestamp && Date.now() - parsed.timestamp < 86400000) {
          console.log('✅ [Generator] Restored state from localStorage:', {
            hasPrompt: !!parsed.prompt,
            hasWorkflow: !!parsed.workflow,
            hasCodePrompt: !!parsed.codePrompt,
            hasGeneratedCode: !!parsed.generatedCode,
            activeTab: parsed.activeTab,
            ageMinutes: Math.round((Date.now() - parsed.timestamp) / 60000)
          });
          return parsed;
        } else {
          console.log('⏰ [Generator] Saved state expired (older than 24 hours)');
        }
      } else {
        console.log('📝 [Generator] No saved state found in localStorage');
      }
    } catch (e) {
      console.error('❌ [Generator] Failed to parse saved generator state:', e);
    }
    return null;
  };

  const savedState = loadSavedState();

  // State management with localStorage persistence
  const [activeTab, setActiveTab] = useState(savedState?.activeTab || 'workflow');
  const [prompt, setPrompt] = useState(savedState?.prompt || '');
  const [platform, setPlatform] = useState<'n8n' | 'make' | 'zapier'>(savedState?.platform || 'n8n');
  const [loading, setLoading] = useState(false);
  const [workflow, setWorkflow] = useState<any>(savedState?.workflow || null);
  const [workflowName, setWorkflowName] = useState(savedState?.workflowName || '');
  const [generationStats, setGenerationStats] = useState<{
    tokensUsed: number;
    timeTaken: number;
  } | null>(savedState?.generationStats || null);
  const [copied, setCopied] = useState(false);
  const [estimatedCredits, setEstimatedCredits] = useState(1);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [showManualSaveButton, setShowManualSaveButton] = useState(false); // For Free/Starter tiers

  // Copy/paste detection state
  const [promptInputMethod, setPromptInputMethod] = useState<'typed' | 'pasted' | 'mixed'>('typed');
  const [promptPasteCount, setPromptPasteCount] = useState(0);
  const [codePromptInputMethod, setCodePromptInputMethod] = useState<'typed' | 'pasted' | 'mixed'>('typed');
  const [codePromptPasteCount, setCodePromptPasteCount] = useState(0);

  // Code generator state with localStorage persistence
  const [codePrompt, setCodePrompt] = useState(savedState?.codePrompt || '');
  const [codePlatform, setCodePlatform] = useState<'n8n' | 'make' | 'zapier'>(savedState?.codePlatform || 'n8n');
  const [codeLanguage, setCodeLanguage] = useState<'javascript' | 'python'>(savedState?.codeLanguage || 'javascript');
  const [generatedCode, setGeneratedCode] = useState(savedState?.generatedCode || '');
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

  // Save state to localStorage whenever key values change
  useEffect(() => {
    const stateToSave = {
      activeTab,
      prompt,
      platform,
      workflow,
      workflowName,
      generationStats,
      codePrompt,
      codePlatform,
      codeLanguage,
      generatedCode,
      timestamp: Date.now()
    };
    localStorage.setItem('generatorState', JSON.stringify(stateToSave));
    console.log('💾 [Generator] Saved state to localStorage:', {
      hasPrompt: !!prompt,
      hasWorkflow: !!workflow,
      hasCodePrompt: !!codePrompt,
      hasGeneratedCode: !!generatedCode
    });
  }, [activeTab, prompt, platform, workflow, workflowName, generationStats, codePrompt, codePlatform, codeLanguage, generatedCode]);

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
      // 🚨 LOG BLOCKED ATTEMPT: Security threat or unethical request
      const isSecurityThreat = validation.reason?.includes('XSS') ||
                               validation.reason?.includes('injection') ||
                               validation.reason?.includes('🚨');

      if (isSecurityThreat) {
        await logBlocked('workflow_generation', {
          type: validation.reason?.includes('XSS') ? 'xss' : 'injection',
          severity: 'critical'
        }, {
          platform,
          prompt: prompt.substring(0, 100),
          full_prompt: prompt,
          validation_reason: validation.reason
        });

        // Show security incident warning
        toast({
          title: '🚨 Security Incident Reported',
          description: 'Your action has been reported to the Cyber Incident Response Team for immediate review. Your IP address, location, and full request details have been logged.',
          variant: 'destructive',
          duration: 15000
        });

        // Show technical error after delay
        setTimeout(() => {
          toast({
            title: validation.category === 'unethical' ? '🚫 Request Blocked' : '❌ Security Threat Detected',
            description: validation.reason + '\n\nRepeated malicious attempts may result in account suspension.',
            variant: 'destructive',
            duration: 10000
          });
        }, 1500);
      } else {
        toast({
          title: validation.category === 'unethical' ? '🚫 Request Blocked' : '❌ Not a Workflow Request',
          description: validation.reason,
          variant: 'destructive',
          duration: 10000
        });
      }
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

      // 📊 LOG SUCCESS: Workflow generation succeeded
      await logSuccess('workflow_generation', {
        platform,
        prompt: prompt.substring(0, 100),
        workflow_name: name,
        credits_used: actualCreditCost,
        tokens_used: typeof result.tokensUsed === 'object' ? result.tokensUsed.total : result.tokensUsed || 0,
        time_taken_ms: timeTaken,
        node_count: result.workflow?.nodes?.length || 0
      });

      // ✨ AUTO-SAVE LOGIC: Pro/Growth/Agency get auto-save, Free/Starter get manual save button
      const userTier = profile?.subscription_tier || 'free';
      const shouldAutoSave = hasAutoSaveHistory(userTier);

      if (shouldAutoSave) {
        // Auto-save for Pro/Growth/Agency
        try {
          await autoSaveWorkflow({
            name,
            description: prompt.substring(0, 200),
            platform,
            workflowJson: result.workflow,
            prompt,
            creditsUsed: actualCreditCost,
            tokensUsed: typeof result.tokensUsed === 'object' ? result.tokensUsed.total : result.tokensUsed || 0,
            status: 'success'
          });

          toast({
            title: '✅ Workflow generated and saved!',
            description: `Created in ${(timeTaken / 1000).toFixed(1)}s. Auto-saved to History. You have ${newTotalBalance} credit${newTotalBalance !== 1 ? 's' : ''} remaining.`,
            duration: 5000
          });

          setShowManualSaveButton(false); // Hide manual save button
        } catch (saveError) {
          console.error('Auto-save failed:', saveError);
          // Show success for generation, but warn about save failure
          toast({
            title: '✅ Workflow generated!',
            description: `Created in ${(timeTaken / 1000).toFixed(1)}s. You have ${newTotalBalance} credit${newTotalBalance !== 1 ? 's' : ''} remaining. (Auto-save failed - click "Save to History" to retry)`,
            duration: 5000
          });
          setShowManualSaveButton(true); // Show manual save button as fallback
        }
      } else {
        // Show manual save button for Free/Starter
        toast({
          title: '✅ Workflow generated!',
          description: `Created in ${(timeTaken / 1000).toFixed(1)}s. Click "Save to History" to keep it. You have ${newTotalBalance} credit${newTotalBalance !== 1 ? 's' : ''} remaining.`,
          duration: 6000
        });
        setShowManualSaveButton(true);
      }

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

      // 📊 LOG FAILURE: Workflow generation failed
      await logFailure('workflow_generation', error instanceof Error ? error.message : 'Unknown error', {
        platform,
        prompt: prompt.substring(0, 100)
      });

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
   * Save workflow to history (Manual save for Free/Starter tiers)
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
      // Use manuallySaveWorkflow to mark as manually saved
      await manuallySaveWorkflow({
        name: workflowName,
        description: prompt.substring(0, 200),
        platform,
        workflowJson: workflow,
        prompt,
        creditsUsed: estimatedCredits || 1,
        tokensUsed: generationStats?.tokensUsed || 0,
        status: 'success'
      });

      toast({
        title: '✅ Saved to history!',
        description: 'You can find it in your History page.',
        duration: 3000
      });

      // Hide the save button after successful manual save
      setShowManualSaveButton(false);
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

    // Validate code prompt (security, language mismatch, workflow attempt)
    const validation = validateCodePrompt(codePrompt, codeLanguage, codePlatform);
    if (!validation.isValid) {
      // Log blocked attempt
      const threatLevel = getSecurityThreatLevel(codePrompt);
      await logBlocked('workflow_generation', {
        type: validation.category === 'security_threat' ? 'injection' : 'suspicious',
        severity: threatLevel === 'high' ? 'high' : threatLevel === 'medium' ? 'medium' : 'low',
        details: validation.reason || 'Invalid code generation request'
      }, {
        type: 'code_generation',
        category: validation.category,
        platform: codePlatform,
        language: codeLanguage,
        prompt: codePrompt.substring(0, 100),
        threat_level: threatLevel,
        input_method: codePromptInputMethod,
        paste_count: codePromptPasteCount
      });

      toast({
        title: validation.category === 'security_threat' ? '🚨 Security Alert' : '❌ Invalid Request',
        description: validation.reason,
        variant: 'destructive',
        duration: 10000,
      });

      // Show suggestion in a separate toast if available
      if (validation.suggestion) {
        setTimeout(() => {
          toast({
            title: '💡 Suggestion',
            description: validation.suggestion,
            duration: 8000,
          });
        }, 500);
      }

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

      // 📊 LOG SUCCESS: Code generation succeeded
      await logSuccess('workflow_generation', {
        type: 'code_generation',
        platform: codePlatform,
        language: codeLanguage,
        prompt: codePrompt.substring(0, 100),
        credits_used: 1,
        code_length: result.code.length
      });

      const platformName = codePlatform === 'n8n' ? 'n8n' : codePlatform === 'make' ? 'Make.com' : 'Zapier';
      const newTotalBalance = totalCredits - 1;
      toast({
        title: '✅ Code generated!',
        description: `Ready to paste into ${platformName}. You have ${newTotalBalance} credit${newTotalBalance !== 1 ? 's' : ''} remaining.`,
        duration: 3000
      });
    } catch (error) {
      console.error('Code generation error:', error);

      // 📊 LOG FAILURE: Code generation failed
      await logFailure('workflow_generation', error instanceof Error ? error.message : 'Unknown error', {
        type: 'code_generation',
        platform: codePlatform,
        language: codeLanguage,
        prompt: codePrompt.substring(0, 100)
      });

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
        <div className="flex items-center gap-3">
          {profile?.subscription_tier === 'agency' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/agency')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Agency Dashboard
            </Button>
          )}
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              AI Generator
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Generate workflows and custom code with AI
            </p>
          </div>
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

      {/* Auto-Save Status Indicator */}
      {profile && (
        <div className={cn(
          "flex items-center justify-between px-4 py-2.5 rounded-lg border",
          hasAutoSaveHistory(profile.subscription_tier)
            ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800/50"
            : "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/50"
        )}>
          <div className="flex items-center gap-2">
            {hasAutoSaveHistory(profile.subscription_tier) ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <div>
                  <p className="text-sm font-semibold text-green-900 dark:text-green-100">
                    Auto-Save Activated
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300">
                    All generated workflows are automatically saved to your History
                  </p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <div>
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                    Auto-Save Deactivated
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    You'll need to manually click "Save to History" after generating workflows
                  </p>
                </div>
              </>
            )}
          </div>
          {!hasAutoSaveHistory(profile.subscription_tier) && (
            <Button
              size="sm"
              onClick={() => navigate('/pricing')}
              className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white"
            >
              Upgrade for Auto-Save
            </Button>
          )}
        </div>
      )}

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
        <Card className="flex-1 p-4 flex flex-col min-h-0 overflow-hidden shadow-none border-gray-200/80 dark:border-gray-800/50 dark:bg-[#0d0d0d]">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Output</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Generated workflow JSON</p>
            </div>
            {workflow && (
              <div className="flex gap-1.5">
                {/* Manual Save Button - Only show for Free/Starter or if auto-save failed */}
                {showManualSaveButton && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSaveWorkflow}
                    className="h-8 text-xs font-medium border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                    title="Save to history"
                  >
                    <Save className="h-3.5 w-3.5" />
                    Save to History
                  </Button>
                )}
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
