/**
 * Debugger Page - AI-Powered Workflow Debugging
 *
 * Upload broken workflows and get AI-powered fixes
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Bug, Upload, Wand2, AlertCircle, CheckCircle2, FileJson, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useProfile } from '@/hooks/useProfile';
import WorkflowJsonViewer from '@/components/workflow/WorkflowJsonViewer';
import { debugWorkflow, type DebugWorkflowResponse } from '@/services/aiService';
import { assistantService } from '@/services/assistantService';
import {
  getDebugCost,
  hasEnoughCredits,
  deductCredits,
  getLowCreditsWarning
} from '@/services/creditService';
import { canAccessFeature, getUpgradeMessage } from '@/config/subscriptionPlans';
import UpgradeCTA from '@/components/UpgradeCTA';

export default function Debugger() {
  const [workflowJson, setWorkflowJson] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [debugResult, setDebugResult] = useState<DebugWorkflowResponse | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { profile } = useProfile();

  // Check if user can access debugging
  const canDebug = profile ? canAccessFeature(profile.subscription_tier, 'workflow_debugging') : false;
  const upgradeMessage = profile ? getUpgradeMessage(profile.subscription_tier, 'workflow_debugging') : '';

  // Notify assistant when debugging is used
  useEffect(() => {
    if (debugResult) {
      assistantService.updateContext({ hasDebugged: true });
    }
  }, [debugResult]);

  /**
   * Handle file upload
   */
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a .json file',
        variant: 'destructive'
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        // Validate JSON
        JSON.parse(content);
        setWorkflowJson(content);
        toast({
          title: 'File loaded!',
          description: 'Workflow JSON has been loaded successfully.'
        });
      } catch (error) {
        toast({
          title: 'Invalid JSON',
          description: 'The file contains invalid JSON. Please check the format.',
          variant: 'destructive'
        });
      }
    };
    reader.readAsText(file);
  };

  /**
   * Handle debug workflow (analyze only)
   */
  const handleDebug = async (regenerate: boolean = false) => {
    if (!workflowJson.trim()) {
      toast({
        title: 'Missing workflow',
        description: 'Please paste or upload a workflow JSON to debug.',
        variant: 'destructive'
      });
      return;
    }

    // Validate JSON
    let parsedWorkflow;
    try {
      parsedWorkflow = JSON.parse(workflowJson);
    } catch (error) {
      toast({
        title: 'Invalid JSON',
        description: 'The workflow JSON is not valid. Please check the syntax.',
        variant: 'destructive'
      });
      return;
    }

    // Check credits before debugging
    const creditCost = getDebugCost();
    const hasCredits = await hasEnoughCredits(creditCost);
    if (!hasCredits) {
      toast({
        title: '💳 Insufficient Credits',
        description: `You need ${creditCost} credit${creditCost > 1 ? 's' : ''} to debug this workflow.`,
        variant: 'destructive',
        duration: 8000,
        action: {
          label: 'Upgrade',
          onClick: () => navigate('/pricing')
        }
      });
      return;
    }

    setLoading(true);

    try {
      if (regenerate) {
        // AI-powered regeneration with fixes
        toast({
          title: '🔧 Regenerating workflow...',
          description: 'AI is analyzing issues and creating a fixed version.'
        });

        const result = await debugWorkflow({
          workflowJson: workflowJson,
          errorMessage: errorMessage,
          platform: 'n8n'
        });

        // Deduct credits AFTER successful debug
        try {
          await deductCredits({
            amount: creditCost,
            operation_type: 'debug',
            description: `Debugged workflow: ${parsedWorkflow.name || 'Unnamed workflow'}`
          });
        } catch (creditError) {
          console.error('Failed to deduct credits:', creditError);
          toast({
            title: '⚠️ Credit Deduction Warning',
            description: 'Your workflow was debugged but credits may not have been deducted. Please contact support.',
            duration: 6000
          });
        }

        setDebugResult(result);

        toast({
          title: '✅ Workflow regenerated!',
          description: `Applied ${result.fixesApplied.length} fix${result.fixesApplied.length !== 1 ? 'es' : ''}. Found ${result.issuesFound.length} issue${result.issuesFound.length !== 1 ? 's' : ''}. ${creditCost} credit${creditCost > 1 ? 's' : ''} deducted.`,
          duration: 5000
        });

        // Show low credits warning if applicable
        const warning = await getLowCreditsWarning();
        if (warning) {
          setTimeout(() => {
            toast({
              title: 'Credit Balance',
              description: warning,
              duration: 6000
            });
          }, 2000);
        }

      } else {
        // Quick analysis without regeneration
        toast({
          title: 'Analyzing workflow...',
          description: 'Checking for common issues.'
        });

        const issues = analyzeWorkflow(parsedWorkflow, errorMessage);

        setDebugResult({
          originalWorkflow: parsedWorkflow,
          fixedWorkflow: null, // No fixed version yet
          issuesFound: issues,
          fixesApplied: [],
          creditsUsed: 0,
          tokensUsed: { input: 0, output: 0, total: 0 }
        });

        toast({
          title: 'Analysis complete!',
          description: `Found ${issues.length} potential issue${issues.length !== 1 ? 's' : ''}. Click "Regenerate with Fixes" to create a fixed version.`,
          duration: 5000
        });
      }

    } catch (error) {
      console.error('Debug error:', error);
      toast({
        title: 'Debug failed',
        description: error instanceof Error ? error.message : 'Could not analyze the workflow. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Analyze workflow for common issues
   */
  const analyzeWorkflow = (workflow: any, userError: string): string[] => {
    const issues: string[] = [];

    // Check for missing required fields
    if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
      issues.push('Missing or invalid "nodes" array');
    }

    if (!workflow.connections || typeof workflow.connections !== 'object') {
      issues.push('Missing or invalid "connections" object');
    }

    // Check for trigger node
    if (workflow.nodes) {
      const hasTrigger = workflow.nodes.some((node: any) =>
        node.type?.includes('Trigger') ||
        node.type === 'n8n-nodes-base.webhook' ||
        node.type === 'n8n-nodes-base.manualTrigger'
      );

      if (!hasTrigger) {
        issues.push('No trigger node found - workflows must start with a trigger');
      }

      // Check for disconnected nodes
      const connectedNodes = new Set<string>();
      Object.values(workflow.connections || {}).forEach((connections: any) => {
        if (connections.main) {
          connections.main.forEach((targets: any[]) => {
            targets.forEach((target: any) => {
              if (target.node) connectedNodes.add(target.node);
            });
          });
        }
      });

      workflow.nodes.forEach((node: any) => {
        if (!connectedNodes.has(node.name) && workflow.nodes.length > 1) {
          const isTrigger = node.type?.includes('Trigger');
          if (!isTrigger) {
            issues.push(`Node "${node.name}" appears to be disconnected`);
          }
        }
      });

      // Check for missing parameters
      workflow.nodes.forEach((node: any) => {
        if (!node.parameters || Object.keys(node.parameters).length === 0) {
          issues.push(`Node "${node.name}" has no parameters configured`);
        }
      });
    }

    // Add user-provided error if specified
    if (userError && userError.trim()) {
      issues.push(`User reported error: ${userError.trim()}`);
    }

    return issues;
  };

  /**
   * Download fixed workflow as JSON file
   */
  const downloadFixedWorkflow = () => {
    if (!debugResult?.fixedWorkflow) return;

    const blob = new Blob([JSON.stringify(debugResult.fixedWorkflow, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${debugResult.fixedWorkflow.name || 'fixed-workflow'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Downloaded!',
      description: 'Fixed workflow has been downloaded.',
      duration: 3000
    });
  };

  // Show upgrade CTA if user doesn't have access
  if (profile && !canDebug) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3 flex items-center justify-center gap-3">
            <Bug className="h-10 w-10 text-red-600" />
            Workflow Debugger
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Upload or paste a broken workflow JSON and get AI-powered analysis and suggestions for fixes.
          </p>
        </div>

        <div className="relative">
          <UpgradeCTA
            feature="Workflow Debugger"
            message={upgradeMessage}
            requiredPlan="pro"
            variant="overlay"
          />

          {/* Blurred preview content */}
          <div className="filter blur-sm pointer-events-none select-none">
            <Card className="p-6 shadow-lg opacity-50">
              <div className="space-y-6">
                <div>
                  <Label className="text-base font-semibold mb-3 block">Upload Workflow JSON</Label>
                  <Input type="file" disabled className="flex-1" />
                </div>
                <div>
                  <Label className="text-base font-semibold mb-3 block">Or Paste Workflow JSON</Label>
                  <Textarea rows={12} disabled className="font-mono text-sm" />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3 flex items-center justify-center gap-3">
          <Bug className="h-10 w-10 text-red-600" />
          Workflow Debugger
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Upload or paste a broken workflow JSON and get AI-powered analysis and suggestions for fixes.
        </p>
      </div>

      {/* Input Card */}
      <Card className="p-6 shadow-lg">
        <div className="space-y-6">
          {/* File Upload */}
          <div>
            <Label className="text-base font-semibold mb-3 block">
              Upload Workflow JSON
            </Label>
            <div className="flex items-center gap-4">
              <Input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                disabled={loading}
                className="flex-1"
              />
              <Button
                onClick={() => {
                  setWorkflowJson('');
                  setErrorMessage('');
                  setDebugResult(null);
                }}
                variant="outline"
                disabled={loading}
              >
                Clear
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Upload a .json file or paste the JSON below
            </p>
          </div>

          {/* JSON Textarea */}
          <div>
            <Label htmlFor="workflow-json" className="text-base font-semibold mb-3 block">
              Or Paste Workflow JSON
            </Label>
            <Textarea
              id="workflow-json"
              value={workflowJson}
              onChange={(e) => setWorkflowJson(e.target.value)}
              placeholder='{"name": "My Workflow", "nodes": [...], "connections": {...}}'
              rows={12}
              disabled={loading}
              className="font-mono text-sm resize-none"
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-sm text-gray-500">
                {workflowJson.length} characters
              </p>
              {workflowJson && (
                <Badge variant="secondary" className="gap-1">
                  <FileJson className="h-3 w-3" />
                  JSON detected
                </Badge>
              )}
            </div>
          </div>

          {/* Error Message Input */}
          <div>
            <Label htmlFor="error-message" className="text-base font-semibold mb-3 block">
              Error Message <span className="text-sm font-normal text-gray-500">(optional)</span>
            </Label>
            <Input
              id="error-message"
              value={errorMessage}
              onChange={(e) => setErrorMessage(e.target.value)}
              placeholder="If you have an error code or message, paste it here (if blank, Debug will figure it out)"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-2">
              💡 If you don't know the error code, just leave blank. Debug will analyze the workflow structure.
            </p>
          </div>

          {/* Debug Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={() => handleDebug(false)}
              disabled={loading || !workflowJson.trim()}
              size="lg"
              variant="outline"
              className="flex-1 text-lg h-14"
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
                  <span>Analyzing...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  <span>Quick Analysis</span>
                </div>
              )}
            </Button>

            <Button
              onClick={() => handleDebug(true)}
              disabled={loading || !workflowJson.trim()}
              size="lg"
              className="flex-1 text-lg h-14"
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Regenerating...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Wand2 className="h-5 w-5" />
                  <span>Regenerate with Fixes</span>
                </div>
              )}
            </Button>
          </div>

          <p className="text-sm text-gray-600 text-center -mt-2">
            <strong>Quick Analysis</strong> = Free instant check | <strong>Regenerate</strong> = AI-powered fix (1 credit)
          </p>
        </div>
      </Card>

      {/* Debug Results */}
      {debugResult && (
        <div className="space-y-4">
          {/* Results Banner */}
          <div className={`${debugResult.issuesFound.length > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'} border rounded-lg p-4`}>
            <div className="flex items-start gap-3">
              {debugResult.issuesFound.length > 0 ? (
                <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <h3 className={`font-semibold ${debugResult.issuesFound.length > 0 ? 'text-yellow-900' : 'text-green-900'} mb-1`}>
                  {debugResult.issuesFound.length > 0 ? 'Issues Found' : 'No Issues Found!'}
                </h3>
                <p className={`text-sm ${debugResult.issuesFound.length > 0 ? 'text-yellow-700' : 'text-green-700'}`}>
                  {debugResult.issuesFound.length > 0
                    ? `Found ${debugResult.issuesFound.length} potential issue${debugResult.issuesFound.length !== 1 ? 's' : ''} that may be causing problems.`
                    : 'The workflow structure appears to be valid. Issues may be with runtime configuration.'}
                </p>
                {debugResult.fixedWorkflow && (
                  <p className="text-sm text-green-700 font-semibold mt-2">
                    ✅ AI has regenerated a fixed version below!
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Issues List */}
          {debugResult.issuesFound.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                Issues Detected
              </h3>
              <ul className="space-y-2">
                {debugResult.issuesFound.map((issue: string, index: number) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-red-600 font-bold">•</span>
                    {issue}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Fixes Applied (if regenerated) */}
          {debugResult.fixedWorkflow && debugResult.fixesApplied.length > 0 && (
            <Card className="p-6 bg-green-50 border-green-200">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Fixes Applied by AI
                </h3>
                <Button
                  onClick={downloadFixedWorkflow}
                  size="sm"
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Fixed Workflow
                </Button>
              </div>
              <ul className="space-y-2">
                {debugResult.fixesApplied.map((fix: string, index: number) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-green-600 font-bold">✓</span>
                    {fix}
                  </li>
                ))}
              </ul>
              <div className="mt-4 pt-4 border-t border-green-300 flex items-center justify-end text-xs text-gray-600">
                <span className="font-semibold">Credits used: {debugResult.creditsUsed}</span>
              </div>
            </Card>
          )}

          {/* Fixed Workflow Viewer */}
          {debugResult.fixedWorkflow && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Fixed Workflow (Ready to Use)</h3>
                <Badge className="bg-green-600">Fixed by AI</Badge>
              </div>
              <WorkflowJsonViewer
                workflow={debugResult.fixedWorkflow}
                name={debugResult.fixedWorkflow.name || "Fixed Workflow"}
                platform="n8n"
              />
            </div>
          )}

          {/* Original Workflow (if not regenerated yet) */}
          {!debugResult.fixedWorkflow && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Original Workflow</h3>
                <Button
                  onClick={() => handleDebug(true)}
                  disabled={loading}
                  className="gap-2"
                >
                  <Wand2 className="h-4 w-4" />
                  Regenerate with AI Fixes (1 credit)
                </Button>
              </div>
              <WorkflowJsonViewer
                workflow={debugResult.originalWorkflow}
                name="Original Workflow"
                platform="n8n"
              />
            </div>
          )}
        </div>
      )}

      {/* Help Section */}
      {!debugResult && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">How to use the Debugger:</h3>
              <ul className="text-sm text-blue-800 space-y-1.5 list-disc list-inside">
                <li>Upload a workflow JSON file or paste the JSON directly</li>
                <li>Optionally provide an error message you're experiencing</li>
                <li><strong>Quick Analysis</strong> (free) - Instant structural validation check</li>
                <li><strong>Regenerate with Fixes</strong> (1 credit) - AI creates a fixed workflow for you</li>
                <li>Download the fixed workflow and import into n8n</li>
              </ul>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
