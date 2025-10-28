/**
 * Generator Page - CORE MVP FEATURE
 *
 * AI-powered workflow generation from natural language.
 * This is the primary value proposition of StreamSuite.
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAssistantActions } from '@/hooks/useAssistantActions';
import { Sparkles, Wand2, AlertCircle, CheckCircle2 } from 'lucide-react';

// Services
import { generateWorkflow, estimateCreditCost, generateWorkflowName } from '@/services/aiService';
import { recommendTemplates, type TemplateRecommendation } from '@/services/templateService';
import { saveWorkflow } from '@/services/workflowService';
import { validatePrompt, getPromptFeedback, getExamplePrompts } from '@/services/promptValidator';
import { assistantService } from '@/services/assistantService';

// Components
import WorkflowJsonViewer from '@/components/workflow/WorkflowJsonViewer';
import TemplateRecommendations from '@/components/workflow/TemplateRecommendation';

// Example prompts for inspiration
const EXAMPLE_PROMPTS = [
  'Send a Slack notification when a new customer signs up in Stripe',
  'Create a daily summary of GitHub issues and send via email',
  'Automatically save Gmail attachments to Google Drive',
  'Build a Telegram bot that responds to messages using OpenAI',
  'Monitor a webhook and create Notion database entries'
];

export default function Generator() {
  // State management
  const [prompt, setPrompt] = useState('');
  const [platform, setPlatform] = useState<'n8n' | 'make' | 'zapier'>('n8n');
  const [loading, setLoading] = useState(false);
  const [workflow, setWorkflow] = useState<any>(null);
  const [workflowName, setWorkflowName] = useState('');
  const [recommendations, setRecommendations] = useState<TemplateRecommendation[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>();
  const [generationStats, setGenerationStats] = useState<{
    tokensUsed: number;
    timeTaken: number;
  } | null>(null);

  const { toast } = useToast();
  const { promptToFill, clearPromptToFill } = useAssistantActions();

  // Listen for prompts from the assistant
  useEffect(() => {
    if (promptToFill) {
      setPrompt(promptToFill);
      setWorkflow(null);
      setSelectedTemplateId(undefined);
      clearPromptToFill();

      toast({
        title: '✨ Prompt filled by StreamBot',
        description: 'Your assistant has prepared a prompt for you. Click Generate when ready!',
        duration: 4000,
      });
    }
  }, [promptToFill, clearPromptToFill, toast]);

  // Notify assistant when workflow is generated
  useEffect(() => {
    if (workflow) {
      assistantService.updateContext({ hasGeneratedWorkflow: true });
    }
  }, [workflow]);

  // Get recommendations when prompt changes (debounced)
  useEffect(() => {
    if (prompt.trim().length > 20) {
      const timer = setTimeout(() => {
        const recs = recommendTemplates(prompt, 3);
        setRecommendations(recs);
        setShowRecommendations(recs.length > 0);
      }, 500);

      return () => clearTimeout(timer);
    } else {
      setRecommendations([]);
      setShowRecommendations(false);
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

    // VALIDATE PROMPT BEFORE GENERATION
    const validation = validatePrompt(prompt);

    // Only block unethical and non-workflow requests
    if (!validation.isValid) {
      toast({
        title: validation.category === 'unethical'
          ? '🚫 Request Blocked'
          : '❌ Not a Workflow Request',
        description: validation.reason,
        variant: 'destructive',
        duration: 10000
      });

      // Show suggestion if available
      if (validation.suggestion) {
        setTimeout(() => {
          toast({
            title: '💡 Suggestion',
            description: validation.suggestion,
            duration: 15000
          });
        }, 500);
      }

      return; // Stop for blocked requests
    }

    // Show warning if prompt is vague, but continue with generation
    if (validation.category === 'warning' && validation.warning) {
      toast({
        title: '⚠️ Generating with Defaults',
        description: validation.warning,
        duration: 8000
      });

      // Show suggestion in a separate toast
      if (validation.suggestion) {
        setTimeout(() => {
          toast({
            title: '💡 Tip for Next Time',
            description: validation.suggestion,
            duration: 12000
          });
        }, 1000);
      }
    }

    setLoading(true);
    const startTime = Date.now();

    try {
      // Show progress toast
      toast({
        title: 'Generating workflow...',
        description: 'This may take 10-20 seconds. Please wait.'
      });

      // Generate workflow
      const result = await generateWorkflow({
        prompt: prompt.trim(),
        platform,
        useTemplateId: selectedTemplateId
      });

      const timeTaken = (Date.now() - startTime) / 1000;

      // Set workflow and stats
      setWorkflow(result.workflow);
      setWorkflowName(generateWorkflowName(prompt));
      setGenerationStats({
        tokensUsed: result.tokensUsed.total,
        timeTaken
      });

      // Success toast
      toast({
        title: 'Workflow generated!',
        description: `Created in ${timeTaken.toFixed(1)}s using ${result.creditsUsed} credit(s).`,
        duration: 5000
      });

      // Scroll to results
      setTimeout(() => {
        document.getElementById('workflow-result')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);
    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: 'Generation failed',
        description: error instanceof Error ? error.message : 'Failed to generate workflow. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle template selection - directly load and show the template
   */
  const handleSelectTemplate = async (templateId: string) => {
    setLoading(true);

    try {
      toast({
        title: 'Loading template...',
        description: 'Preparing the template workflow for you.'
      });

      // Load the actual template JSON
      const { loadTemplateJson } = await import('@/services/templateService');
      const templateJson = await loadTemplateJson(templateId);

      // Get template metadata
      const { getTemplateById } = await import('@/lib/n8n/workflowTemplates');
      const templateMetadata = getTemplateById(templateId);

      // Set the workflow directly
      setWorkflow(templateJson);
      setWorkflowName(templateMetadata?.name || 'Template Workflow');
      setSelectedTemplateId(templateId);

      // Success toast
      toast({
        title: 'Template loaded!',
        description: `${templateMetadata?.name} is ready to download and use.`,
        duration: 5000
      });

      // Scroll to results
      setTimeout(() => {
        document.getElementById('workflow-result')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);

    } catch (error) {
      console.error('Template loading error:', error);
      toast({
        title: 'Failed to load template',
        description: error instanceof Error ? error.message : 'Could not load template. Please try generating from scratch.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle saving workflow to database
   */
  const handleSaveWorkflow = async () => {
    if (!workflow) return;

    try {
      await saveWorkflow({
        name: workflowName,
        description: prompt.substring(0, 200),
        platform,
        workflowJson: workflow,
        prompt,
        templateUsed: selectedTemplateId,
        creditsUsed: 1,
        tokensUsed: generationStats?.tokensUsed || 0
      });

      toast({
        title: 'Workflow saved!',
        description: 'You can find it in your History page.'
      });
    } catch (error) {
      toast({
        title: 'Save failed',
        description: 'Could not save workflow. Please try again.',
        variant: 'destructive'
      });
    }
  };

  /**
   * Use example prompt
   */
  const useExamplePrompt = (example: string) => {
    setPrompt(example);
    setWorkflow(null);
    setSelectedTemplateId(undefined);
  };

  /**
   * Estimate credit cost
   */
  const creditCost = estimateCreditCost(prompt, platform);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-3 flex items-center justify-center gap-3">
          <Sparkles className="h-10 w-10 text-blue-600" />
          Workflow Generator
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Describe your automation in plain English, and AI will generate production-ready workflow JSON in seconds.
        </p>
      </div>

      {/* Input Card */}
      <Card className="p-6 shadow-lg">
        <div className="space-y-6">
          {/* Platform Selector */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Target Platform</Label>
            <div className="flex gap-3">
              {(['n8n', 'make', 'zapier'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPlatform(p)}
                  disabled={loading || (p !== 'n8n')} // Only n8n for MVP
                  className={`
                    flex-1 px-4 py-3 rounded-lg border-2 transition-all font-medium
                    ${platform === p
                      ? 'border-blue-600 bg-blue-50 text-blue-900'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }
                    ${p !== 'n8n' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                  {p !== 'n8n' && <Badge variant="secondary" className="ml-2 text-xs">Soon</Badge>}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Input */}
          <div>
            <Label htmlFor="prompt" className="text-base font-semibold mb-3 block">
              Describe Your Workflow
            </Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Example: Send a Slack message when a new row is added to Google Sheets...

Or just type something simple like:
• send notifications
• automate emails
• create tasks
• sync data

The AI will fill in reasonable defaults!"
              rows={6}
              disabled={loading}
              className="text-base resize-none"
            />

            {/* Quick Add Buttons */}
            <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs font-medium text-gray-700 mb-2">💡 Quick Add (optional):</p>
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-600">Trigger:</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPrompt(p => p + (p ? ' when ' : 'When ') + 'a webhook receives data')}
                    className="text-xs h-7"
                  >
                    + Webhook
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPrompt(p => p + (p ? ' every ' : 'Every ') + 'day at 9am')}
                    className="text-xs h-7"
                  >
                    + Schedule
                  </Button>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-600">Action:</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPrompt(p => p + (p ? ', send ' : 'Send ') + 'a notification')}
                    className="text-xs h-7"
                  >
                    + Send
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPrompt(p => p + (p ? ', create ' : 'Create ') + 'a record')}
                    className="text-xs h-7"
                  >
                    + Create
                  </Button>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-600">Tools:</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPrompt(p => p + (p ? ' via Slack' : 'Via Slack'))}
                    className="text-xs h-7"
                  >
                    + Slack
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPrompt(p => p + (p ? ' to Google Sheets' : 'To Google Sheets'))}
                    className="text-xs h-7"
                  >
                    + Sheets
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPrompt(p => p + (p ? ' using Gmail' : 'Using Gmail'))}
                    className="text-xs h-7"
                  >
                    + Gmail
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-2">
              <p className="text-sm text-gray-500">
                {prompt.length} characters
                {prompt.length > 0 && prompt.length < 10 && (
                  <span className="text-orange-600 ml-2">
                    (need at least 10)
                  </span>
                )}
              </p>
              {prompt.length >= 10 && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600">Cost:</span>
                  <Badge variant="secondary" className="gap-1">
                    <Sparkles className="h-3 w-3" />
                    {creditCost} {creditCost === 1 ? 'credit' : 'credits'}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Example Prompts */}
          {!prompt && (
            <div className="border-t pt-4">
              <p className="text-sm font-medium text-gray-700 mb-3">Try an example:</p>
              <div className="flex flex-wrap gap-2">
                {EXAMPLE_PROMPTS.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => useExamplePrompt(example)}
                    className="text-sm px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim() || prompt.length < 10}
            size="lg"
            className="w-full text-lg h-14"
          >
            {loading ? (
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Generating workflow...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Wand2 className="h-5 w-5" />
                <span>Generate Workflow</span>
              </div>
            )}
          </Button>

          {/* Selected Template Info */}
          {selectedTemplateId && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <p className="text-sm text-blue-900">
                Using template as base structure
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTemplateId(undefined)}
                className="ml-auto"
              >
                Clear
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Template Recommendations */}
      {showRecommendations && recommendations.length > 0 && !workflow && (
        <TemplateRecommendations
          recommendations={recommendations}
          onSelectTemplate={handleSelectTemplate}
        />
      )}

      {/* Workflow Output */}
      {workflow && (
        <div id="workflow-result" className="space-y-4">
          {/* Success Banner */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-green-900 mb-1">
                  {selectedTemplateId ? 'Template Loaded Successfully!' : 'Workflow Generated Successfully!'}
                </h3>
                <p className="text-sm text-green-700">
                  {selectedTemplateId
                    ? 'This production-ready template is ready to download and import into n8n.'
                    : `Your workflow is ready to download. Import it into ${platform} to start using it.`}
                </p>
                {generationStats && (
                  <div className="flex gap-4 mt-2 text-xs text-green-600">
                    <span>⚡ Generated in {generationStats.timeTaken.toFixed(1)}s</span>
                    <span>🎯 {generationStats.tokensUsed.toLocaleString()} tokens used</span>
                  </div>
                )}
                {selectedTemplateId && (
                  <div className="mt-2 text-xs text-green-600">
                    📦 Loaded from template library
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Workflow Viewer */}
          <WorkflowJsonViewer
            workflow={workflow}
            name={workflowName}
            platform={platform}
          />

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center">
            <Button onClick={handleSaveWorkflow} variant="outline" size="lg">
              Save to History
            </Button>
            <Button
              onClick={() => {
                setWorkflow(null);
                setPrompt('');
                setSelectedTemplateId(undefined);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              size="lg"
            >
              Generate Another
            </Button>
          </div>
        </div>
      )}

      {/* Help Section */}
      {!workflow && (
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-3">📝 How to Write Great Prompts</h3>

                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-medium text-gray-800 mb-1">Every workflow needs 3 things:</p>
                    <ul className="text-gray-600 space-y-1 ml-4 list-disc">
                      <li><strong>Trigger:</strong> When should it run? (webhook, schedule, manual)</li>
                      <li><strong>Actions:</strong> What should it do? (send, create, update, fetch)</li>
                      <li><strong>Integrations:</strong> Which tools? (Slack, Gmail, Sheets, Notion, etc.)</li>
                    </ul>
                  </div>

                  <div className="border-t border-blue-200 pt-3">
                    <p className="font-medium text-green-700 mb-1">✅ Good Example:</p>
                    <p className="text-gray-700 italic bg-white p-2 rounded border border-green-200">
                      "When a form is submitted via webhook, send a Slack notification to #sales and add the data to Google Sheets"
                    </p>
                  </div>

                  <div>
                    <p className="font-medium text-red-700 mb-1">❌ Too Vague:</p>
                    <p className="text-gray-700 italic bg-white p-2 rounded border border-red-200">
                      "Automate my business" (missing all 3 components!)
                    </p>
                  </div>

                  <div className="border-t border-blue-200 pt-3">
                    <p className="font-medium text-gray-800 mb-1">🚫 StreamSuite ONLY generates workflows</p>
                    <p className="text-gray-600">
                      Requests for general coding help, hacking, spam, or anything unethical will be blocked.
                    </p>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open('/PROMPT_WRITING_GUIDE.md', '_blank')}
                      className="text-xs"
                    >
                      📚 Full Prompt Guide
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const examples = getExamplePrompts();
                        const randomGood = examples.good[Math.floor(Math.random() * examples.good.length)];
                        setPrompt(randomGood);
                      }}
                      className="text-xs"
                    >
                      🎲 Random Example
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
