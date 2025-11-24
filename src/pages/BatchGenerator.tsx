/**
 * Batch Generator Page - Split View with Real-Time Progress
 *
 * Left: Chat/Progress view showing generation steps
 * Right: Live code preview
 * Bottom: Generated workflow cards with download options
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Sparkles,
  Zap,
  Download,
  Copy,
  Check,
  Loader2,
  Package,
  AlertCircle,
  Coins,
  MessageSquare,
  Code,
  CheckCircle2,
  Clock,
  FileCode,
  Save,
  X,
  ArrowLeft
} from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useCredits } from '@/hooks/useCredits';
import { useBatchCredits } from '@/hooks/useBatchCredits';
import { canAccessFeature, getUpgradeMessage } from '@/config/subscriptionPlans';
import { getMonthlyBatchCredits, getMaxWorkflowsPerSet } from '@/config/subscriptionPlans';
import UpgradeDialog from '@/components/UpgradeDialog';
import { generateBatchWorkflows, type BatchWorkflowItem } from '@/services/aiService';
import { supabase } from '@/integrations/supabase/client';
import JSZip from 'jszip';
import { PushToN8nButton } from '@/components/workflow/PushToN8nButton';

interface WorkflowSetItem {
  id: string; // Unique identifier for React keys
  name: string;
  description: string;
  json: any;
  nodeCount: number;
  workflowType?: 'orchestrator' | 'child' | 'utility';
  dependsOn?: string[];
}

/**
 * Sanitize workflow JSON for n8n import
 * Ensures all required fields are present and properly formatted
 */
function sanitizeWorkflowForImport(workflow: any): any {
  const sanitized = { ...workflow };

  // Ensure top-level required fields
  if (!sanitized.name) {
    sanitized.name = 'Untitled Workflow';
  }

  if (!sanitized.nodes || !Array.isArray(sanitized.nodes)) {
    throw new Error('Invalid workflow: missing nodes array');
  }

  if (!sanitized.connections || typeof sanitized.connections !== 'object') {
    sanitized.connections = {};
  }

  // Ensure active and settings fields
  if (sanitized.active === undefined) {
    sanitized.active = false;
  }

  if (!sanitized.settings) {
    sanitized.settings = { executionOrder: 'v1' };
  } else if (!sanitized.settings.executionOrder) {
    sanitized.settings.executionOrder = 'v1';
  }

  // Ensure each node has required fields
  sanitized.nodes = sanitized.nodes.map((node: any, index: number) => {
    const sanitizedNode = { ...node };

    // Ensure node has an ID (UUID format)
    if (!sanitizedNode.id || !isValidUUID(sanitizedNode.id)) {
      sanitizedNode.id = generateUUID();
    }

    // Ensure node has a name
    if (!sanitizedNode.name) {
      sanitizedNode.name = `Node ${index + 1}`;
    }

    // Ensure node has a type
    if (!sanitizedNode.type) {
      throw new Error(`Node ${sanitizedNode.name} is missing type field`);
    }

    // Ensure node has position
    if (!sanitizedNode.position || !Array.isArray(sanitizedNode.position) || sanitizedNode.position.length !== 2) {
      sanitizedNode.position = [100 + index * 200, 300];
    }

    // Ensure node has typeVersion
    if (sanitizedNode.typeVersion === undefined) {
      sanitizedNode.typeVersion = 1;
    }

    return sanitizedNode;
  });

  // Remove fields that might cause import issues (n8n generates these)
  delete sanitized.id; // Workflow ID - n8n generates this
  delete sanitized.versionId; // Version ID - n8n generates this
  if (sanitized.meta) {
    delete sanitized.meta.instanceId; // Instance ID - n8n generates this
  }

  // Ensure pinData and tags exist
  if (!sanitized.pinData) {
    sanitized.pinData = {};
  }

  if (!sanitized.tags) {
    sanitized.tags = [];
  }

  return sanitized;
}

/**
 * Check if string is valid UUID
 */
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Generate a random UUID v4
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

interface ProgressStep {
  id: string;
  message: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  timestamp: Date;
}

export default function BatchGenerator() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [workflowSet, setWorkflowSet] = useState<WorkflowSetItem[]>([]);
  const [previewWorkflowIndex, setPreviewWorkflowIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [includeInstructions, setIncludeInstructions] = useState(true);

  // Progress tracking
  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>([]);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const progressEndRef = useRef<HTMLDivElement>(null);

  const { toast } = useToast();
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { balance } = useCredits();
  const { balance: batchCredits, deductBatchCreditsAsync, isDeducting } = useBatchCredits();

  // Check if user can access batch generation
  const canGenerateBatch = profile ? canAccessFeature(profile.subscription_tier, 'batch_operations') : false;
  const maxWorkflows = profile ? getMaxWorkflowsPerSet(profile.subscription_tier) : 0;

  // Redirect if no access
  useEffect(() => {
    if (profile && !canGenerateBatch) {
      setUpgradeDialogOpen(true);
    }
  }, [profile, canGenerateBatch]);

  // Auto-scroll progress to bottom
  useEffect(() => {
    progressEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [progressSteps]);

  const addProgressStep = (message: string, status: ProgressStep['status'] = 'in_progress') => {
    const step: ProgressStep = {
      id: Date.now().toString(),
      message,
      status,
      timestamp: new Date()
    };
    setProgressSteps(prev => [...prev, step]);
    return step.id;
  };

  const updateProgressStep = (id: string, status: ProgressStep['status'], message?: string) => {
    setProgressSteps(prev => prev.map(step =>
      step.id === id
        ? { ...step, status, message: message || step.message }
        : step
    ));
  };

  const updateProgress = (percentage: number, estimatedWorkflowCount?: number) => {
    setProgressPercentage(percentage);

    // Calculate ETA based on elapsed time
    if (startTime && estimatedWorkflowCount && percentage > 0 && percentage < 100) {
      const elapsed = Date.now() - startTime;
      const totalEstimated = (elapsed / percentage) * 100;
      const remaining = totalEstimated - elapsed;
      setEstimatedTimeRemaining(Math.ceil(remaining / 1000)); // Convert to seconds
    }

    if (percentage >= 100) {
      setEstimatedTimeRemaining(0);
    }
  };

  const formatTimeRemaining = (seconds: number | null): string => {
    if (seconds === null || seconds <= 0) return '';

    if (seconds < 60) {
      return `~${seconds}s remaining`;
    } else {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `~${mins}m ${secs}s remaining`;
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: 'Missing prompt',
        description: 'Please describe your workflow set.',
        variant: 'destructive'
      });
      return;
    }

    if (batchCredits < 1) {
      toast({
        title: 'No batch credits',
        description: 'You need at least 1 batch credit to generate a workflow set.',
        variant: 'destructive',
        action: {
          label: 'Upgrade',
          onClick: () => navigate('/pricing')
        }
      });
      return;
    }

    setLoading(true);
    setWorkflowSet([]);
    setProgressSteps([]);
    setPreviewWorkflowIndex(null);
    setProgressPercentage(0);
    setEstimatedTimeRemaining(null);
    setStartTime(Date.now());

    try {
      // Step 1: Analyzing requirements (0-10%)
      updateProgress(5);
      const step1 = addProgressStep('🔍 Analyzing your system requirements...');
      await new Promise(resolve => setTimeout(resolve, 800));
      updateProgressStep(step1, 'completed', '✅ System requirements analyzed');
      updateProgress(10);

      // Step 2: AI Planning Phase (10-25%)
      const step2 = addProgressStep('🏗️ Phase 1: AI analyzing requirements and planning architecture...');

      // Call AI service to generate batch workflows (now includes planning phase)
      const response = await generateBatchWorkflows({
        prompt: prompt,
        platform: 'n8n',
        maxWorkflows: maxWorkflows
      });

      updateProgressStep(step2, 'completed', `✅ Architecture planned: ${response.plan.workflowCount} workflows`);
      updateProgress(25, response.plan.workflowCount);

      // Show the AI's reasoning
      addProgressStep(`💡 ${response.plan.reasoning}`, 'completed');

      // Step 3: Show planned workflows (25-30%)
      addProgressStep(`📋 Planned ${response.plan.workflowCount} workflows:`, 'completed');
      response.plan.workflows.forEach((planItem, index) => {
        const icon = planItem.type === 'orchestrator' ? '🎯' : planItem.type === 'child' ? '⚙️' : '🔧';
        addProgressStep(`  ${icon} ${planItem.name} - ${planItem.purpose}`, 'completed');
      });
      updateProgress(30, response.plan.workflowCount);

      // Step 4: Generating workflows (30-80%)
      const step4 = addProgressStep('⚡ Phase 2: Generating workflows with Sonnet 4.5...');
      await new Promise(resolve => setTimeout(resolve, 300)); // Brief pause to show progress
      updateProgressStep(step4, 'completed', `✅ Generated ${response.workflows.length} complete workflows`);
      updateProgress(80, response.plan.workflowCount);

      // Step 5: Processing workflows (80-95%)
      const step5 = addProgressStep('🔧 Validating and processing workflow JSON...');
      await new Promise(resolve => setTimeout(resolve, 400));

      // Convert BatchWorkflowItem[] to WorkflowSetItem[]
      const generatedWorkflows: WorkflowSetItem[] = response.workflows.map((item, index) => {
        return {
          id: `workflow-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`, // Unique ID
          name: item.name,
          description: item.description,
          json: item.workflow,
          nodeCount: item.nodeCount,
          workflowType: item.workflowType,
          dependsOn: item.dependsOn
        };
      });

      updateProgressStep(step5, 'completed', '✅ All workflows validated');
      updateProgress(95, response.plan.workflowCount);

      // Step 6: Complete (95-100%)
      addProgressStep(`🎉 Batch generation complete! Created ${generatedWorkflows.length} workflows using ${response.tokensUsed.total.toLocaleString()} tokens.`, 'completed');
      updateProgress(100, response.plan.workflowCount);

      setWorkflowSet(generatedWorkflows);
      setPreviewWorkflowIndex(0); // Preview first workflow

      // Deduct 1 batch credit from database
      try {
        await deductBatchCreditsAsync({
          amount: 1,
          workflowCount: generatedWorkflows.length,
          metadata: {
            prompt: prompt.substring(0, 200), // First 200 chars of prompt
            tokensUsed: response.tokensUsed.total,
            workflowNames: generatedWorkflows.map(w => w.name),
          },
        });
        console.log('✅ Batch credit deducted successfully');
      } catch (creditError: any) {
        console.error('❌ Failed to deduct batch credit:', creditError);
        toast({
          title: 'Warning',
          description: 'Workflows generated but failed to deduct batch credit. Please contact support.',
          variant: 'destructive',
        });
      }

      // Show save dialog after 1 second
      setTimeout(() => {
        setSaveDialogOpen(true);
      }, 1000);

    } catch (error: any) {
      console.error('❌ Batch generation error:', error);

      addProgressStep(`❌ Error: ${error.message}`, 'error');

      toast({
        title: 'Generation failed',
        description: error.message || 'Failed to generate workflow set.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToHistory = async (shouldSave: boolean) => {
    setSaveDialogOpen(false);

    if (shouldSave) {
      console.log('💾 Saving to history...');

      try {
        const { user } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // Save all workflows from the batch to the database
        const workflowInserts = workflowSet.map((workflow) => ({
          user_id: user.user?.id,
          name: workflow.name,
          description: workflow.description || `Part of batch generation: ${prompt.substring(0, 100)}`,
          platform: 'n8n',
          workflow_json: workflow.json,
          prompt: prompt,
          credits_used: 0, // Batch credit was already deducted, don't count again
          tokens_used: 0,
          tags: ['batch-generation', workflow.workflowType || 'workflow'],
          status: 'success'
        }));

        const { error } = await supabase
          .from('workflows')
          .insert(workflowInserts);

        if (error) throw error;

        toast({
          title: 'Saved to history',
          description: `${workflowSet.length} workflows have been saved to your history.`,
        });
      } catch (error: any) {
        console.error('Failed to save to history:', error);
        toast({
          title: 'Save failed',
          description: error.message || 'Failed to save workflows to history.',
          variant: 'destructive',
        });
      }
    } else {
      toast({
        title: 'Not saved',
        description: 'Workflow set was not saved to history.',
      });
    }
  };

  const handleCopyWorkflow = (index: number, workflow: WorkflowSetItem) => {
    navigator.clipboard.writeText(JSON.stringify(workflow.json, null, 2));
    setCopied(index);
    setTimeout(() => setCopied(null), 2000);

    toast({
      title: 'Copied to clipboard',
      description: `${workflow.name} JSON copied.`
    });
  };

  const handleDownloadWorkflow = (workflow: WorkflowSetItem) => {
    try {
      // Sanitize workflow before download
      const sanitizedWorkflow = sanitizeWorkflowForImport(workflow.json);

      const blob = new Blob([JSON.stringify(sanitizedWorkflow, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${workflow.name.replace(/\s+/g, '_')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Downloaded',
        description: `${workflow.name} saved to your device.`
      });
    } catch (error: any) {
      toast({
        title: 'Download failed',
        description: error.message || 'Failed to prepare workflow for download.',
        variant: 'destructive'
      });
    }
  };

  const handleDownloadAll = async () => {
    try {
      const zip = new JSZip();

      // Add each workflow as a separate JSON file (sanitized for n8n import)
      workflowSet.forEach((workflow, index) => {
        try {
          const sanitizedWorkflow = sanitizeWorkflowForImport(workflow.json);
          const fileName = `${index + 1}_${workflow.name.replace(/\s+/g, '_')}.json`;
          const workflowJson = JSON.stringify(sanitizedWorkflow, null, 2);
          zip.file(fileName, workflowJson);
        } catch (err) {
          console.error(`Failed to sanitize workflow ${workflow.name}:`, err);
          // Still add the workflow, but with a warning note
          const fileName = `${index + 1}_${workflow.name.replace(/\s+/g, '_')}_WARNING.json`;
          const workflowJson = JSON.stringify(workflow.json, null, 2);
          zip.file(fileName, workflowJson);
        }
      });

      // Add a README file with generation details
      const readme = `# Workflow Set Package

Generated: ${new Date().toISOString()}
Platform: n8n
Total Workflows: ${workflowSet.length}

## Prompt Used:
${prompt}

## Workflows Included:
${workflowSet.map((w, i) => `${i + 1}. ${w.name} (${w.nodeCount} nodes)${w.workflowType ? ` - ${w.workflowType}` : ''}`).join('\n')}

## Import Instructions:
1. Extract this ZIP file
2. Open n8n
3. Go to Workflows > Import from File
4. Import each .json file individually
${workflowSet.some(w => w.dependsOn && w.dependsOn.length > 0) ? '\n⚠️ Note: Some workflows have dependencies. Import orchestrator workflows first, then child workflows.' : ''}
`;
      zip.file('README.txt', readme);

      // Generate ZIP file
      const blob = await zip.generateAsync({ type: 'blob' });

      // Download ZIP file
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `workflow_set_${new Date().getTime()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'ZIP package downloaded',
        description: `All ${workflowSet.length} workflows saved to ZIP file.`
      });
    } catch (error) {
      console.error('Error creating ZIP:', error);
      toast({
        title: 'Download failed',
        description: 'Failed to create ZIP file. Please try again.',
        variant: 'destructive'
      });
    }
  };

  if (!canGenerateBatch) {
    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <div className="max-w-md text-center">
            <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h1 className="text-2xl font-bold mb-2">Batch Generation</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Generate complete workflow sets with up to {maxWorkflows || 10} interconnected workflows.
              Available for Growth and Agency tiers.
            </p>
            <Button onClick={() => navigate('/pricing')} size="lg">
              Upgrade to Growth
              <Zap className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        <UpgradeDialog
          open={upgradeDialogOpen}
          onOpenChange={setUpgradeDialogOpen}
          feature="Batch Workflow Generation"
          message={getUpgradeMessage(profile?.subscription_tier || 'free', 'batch_operations')}
          requiredPlan="growth"
        />
      </>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex-none border-b bg-white dark:bg-gray-800 px-6 py-4">
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
                Back
              </Button>
            )}
            <div>
              <h1 className="text-2xl font-bold">Batch Workflow Generation</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Generate up to {maxWorkflows} interconnected workflows as a system
              </p>
            </div>
          </div>
          <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
            <Coins className="h-3 w-3 mr-1" />
            {batchCredits} batch credits
          </Badge>
        </div>
      </div>

      {/* Main Content - Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Chat/Progress */}
        <div className="w-1/2 border-r flex flex-col bg-white dark:bg-gray-800">
          {/* Input Section */}
          <div className="flex-none p-6 border-b">
            <Label htmlFor="prompt" className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4" />
              Describe Your Workflow System
            </Label>
            <Textarea
              id="prompt"
              placeholder="Example: E-commerce order processing system with inventory check, payment processing, and shipping notifications (3-4 workflows)"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-32 resize-none"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              💡 AI will analyze your request and generate up to 5 optimized workflows. Complex systems may need multiple batches.
            </p>

            {/* Include Instructions Checkbox */}
            <div className="flex items-center space-x-2 mt-4">
              <Checkbox
                id="include-instructions"
                checked={includeInstructions}
                onCheckedChange={(checked) => setIncludeInstructions(checked as boolean)}
              />
              <label
                htmlFor="include-instructions"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Include setup instructions in workflows
              </label>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
              Adds visual sticky note instructions in each workflow explaining what needs to be configured
            </p>

            <div className="flex items-center justify-between mt-4">
              <div className="text-xs text-gray-600 dark:text-gray-400">
                <AlertCircle className="h-3 w-3 inline mr-1" />
                1 batch credit • AI determines optimal workflow count (max 5)
              </div>
              <Button
                onClick={handleGenerate}
                disabled={loading || !prompt.trim() || batchCredits < 1}
                size="default"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Workflows
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Progress Bar (shown when loading) */}
          {loading && (
            <div className="flex-none px-6 py-4 border-b bg-gray-50 dark:bg-gray-900">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Generation Progress
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-600 dark:text-gray-400">
                      {formatTimeRemaining(estimatedTimeRemaining)}
                    </span>
                    <span className="font-semibold text-purple-600 dark:text-purple-400">
                      {progressPercentage}%
                    </span>
                  </div>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>
            </div>
          )}

          {/* Progress Feed */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {progressSteps.length === 0 && !loading && (
              <div className="text-center py-12 text-gray-400">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Describe your system and click Generate to start</p>
              </div>
            )}

            {progressSteps.map((step) => (
              <div key={step.id} className="flex items-start gap-3">
                <div className="flex-none mt-0.5">
                  {step.status === 'in_progress' && (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  )}
                  {step.status === 'completed' && (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  )}
                  {step.status === 'error' && (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  {step.status === 'pending' && (
                    <Clock className="h-4 w-4 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className={`text-sm ${
                    step.status === 'error' ? 'text-red-600 dark:text-red-400' :
                    step.status === 'completed' ? 'text-gray-700 dark:text-gray-300' :
                    'text-gray-600 dark:text-gray-400'
                  }`}>
                    {step.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {step.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            <div ref={progressEndRef} />
          </div>
        </div>

        {/* Right Panel - Code Preview */}
        <div className="w-1/2 flex flex-col bg-gray-900 overflow-hidden">
          {/* Preview Header */}
          <div className="flex-none bg-gray-800 px-6 py-3 border-b border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-300">
                {previewWorkflowIndex !== null && workflowSet[previewWorkflowIndex]
                  ? workflowSet[previewWorkflowIndex].name
                  : 'Workflow Preview'}
              </span>
            </div>
            {previewWorkflowIndex !== null && workflowSet[previewWorkflowIndex] && (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopyWorkflow(previewWorkflowIndex, workflowSet[previewWorkflowIndex])}
                  className="text-gray-400 hover:text-gray-200"
                >
                  {copied === previewWorkflowIndex ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownloadWorkflow(workflowSet[previewWorkflowIndex])}
                  className="text-gray-400 hover:text-gray-200"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Preview Content - with proper scrolling constraint */}
          <div className="flex-1 overflow-y-auto overflow-x-auto min-h-0">
            {previewWorkflowIndex === null || !workflowSet[previewWorkflowIndex] ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <FileCode className="h-16 w-16 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Workflow JSON will appear here</p>
                </div>
              </div>
            ) : (
              <pre className="p-6 text-xs text-gray-300 font-mono leading-relaxed whitespace-pre">
                {(() => {
                  try {
                    const sanitized = sanitizeWorkflowForImport(workflowSet[previewWorkflowIndex].json);
                    return JSON.stringify(sanitized, null, 2);
                  } catch (err) {
                    return JSON.stringify(workflowSet[previewWorkflowIndex].json, null, 2);
                  }
                })()}
              </pre>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Panel - Generated Workflows */}
      {workflowSet.length > 0 && (
        <div className="flex-none border-t bg-white dark:bg-gray-800 p-6 max-h-64 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Package className="h-4 w-4" />
              Generated Workflows ({workflowSet.length})
            </h3>
            <Button onClick={handleDownloadAll} variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Download All
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {workflowSet.map((workflow, index) => (
              <Card
                key={workflow.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  previewWorkflowIndex === index ? 'ring-2 ring-purple-500' : ''
                }`}
                onClick={() => setPreviewWorkflowIndex(index)}
              >
                <CardHeader className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm truncate">{workflow.name}</CardTitle>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {workflow.nodeCount} nodes
                        </Badge>
                        {workflow.workflowType === 'orchestrator' && (
                          <Badge className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                            Orchestrator
                          </Badge>
                        )}
                        {workflow.workflowType === 'child' && (
                          <Badge variant="outline" className="text-xs">
                            Child
                          </Badge>
                        )}
                      </div>
                      {/* Action buttons */}
                      <div className="flex gap-1 mt-3" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyWorkflow(index, workflow)}
                          className="h-7 px-2"
                        >
                          {copied === index ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadWorkflow(workflow)}
                          className="h-7 px-2"
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                        <PushToN8nButton
                          workflowName={workflow.name}
                          workflowJson={workflow.json}
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2"
                        />
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Save to History Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Save className="h-5 w-5" />
              Save to History?
            </DialogTitle>
            <DialogDescription>
              Would you like to save this workflow set to your history? You can access it later from the History page.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Workflows generated:</span>
                <span className="font-semibold">{workflowSet.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Total nodes:</span>
                <span className="font-semibold">
                  {workflowSet.reduce((sum, w) => sum + w.nodeCount, 0)}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleSaveToHistory(false)}>
              <X className="mr-2 h-4 w-4" />
              No, Don't Save
            </Button>
            <Button onClick={() => handleSaveToHistory(true)}>
              <Save className="mr-2 h-4 w-4" />
              Yes, Save to History
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upgrade Dialog */}
      <UpgradeDialog
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
        feature="Batch Workflow Generation"
        message={getUpgradeMessage(profile?.subscription_tier || 'free', 'batch_operations')}
        requiredPlan="growth"
      />
    </div>
  );
}
