/**
 * History Page - Workflow History with Status Tracking
 *
 * View all saved workflows with success/failure status indicators
 */

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProfile } from '@/hooks/useProfile';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Trash2,
  Star,
  StarOff,
  Eye,
  BookmarkPlus
} from 'lucide-react';
import { canAccessFeature, getUpgradeMessage } from '@/config/subscriptionPlans';
import UpgradeCTA from '@/components/UpgradeCTA';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getUserWorkflows, deleteWorkflow, updateWorkflow, type Workflow } from '@/services/workflowService';
import WorkflowJsonViewer from '@/components/workflow/WorkflowJsonViewer';

export default function History() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [templateDialog, setTemplateDialog] = useState<{ open: boolean; workflow: Workflow | null }>({ open: false, workflow: null });
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { profile } = useProfile();

  // Check if user can access history
  const canViewHistory = profile ? canAccessFeature(profile.subscription_tier, 'history') : false;
  const upgradeMessage = profile ? getUpgradeMessage(profile.subscription_tier, 'history') : '';

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      const data = await getUserWorkflows();
      setWorkflows(data);
    } catch (error) {
      console.error('Failed to load workflows:', error);
      toast({
        title: 'Failed to load workflows',
        description: 'Could not retrieve your workflow history.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (workflowId: string, newStatus: 'success' | 'failed' | 'pending') => {
    try {
      await updateWorkflow({ id: workflowId, status: newStatus });

      // Update local state
      setWorkflows(workflows.map(w =>
        w.id === workflowId ? { ...w, status: newStatus } : w
      ));

      toast({
        title: 'Status updated',
        description: `Workflow marked as ${newStatus}.`
      });
    } catch (error) {
      toast({
        title: 'Update failed',
        description: 'Could not update workflow status.',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (workflowId: string) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;

    try {
      await deleteWorkflow(workflowId);
      setWorkflows(workflows.filter(w => w.id !== workflowId));
      if (selectedWorkflow?.id === workflowId) {
        setSelectedWorkflow(null);
      }

      toast({
        title: 'Workflow deleted',
        description: 'The workflow has been removed from your history.'
      });
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: 'Could not delete the workflow.',
        variant: 'destructive'
      });
    }
  };

  const handleToggleFavorite = async (workflowId: string, isFavorite: boolean) => {
    try {
      await updateWorkflow({ id: workflowId, isFavorite: !isFavorite });

      setWorkflows(workflows.map(w =>
        w.id === workflowId ? { ...w, is_favorite: !isFavorite } : w
      ));

      toast({
        title: !isFavorite ? 'Added to favorites' : 'Removed from favorites'
      });
    } catch (error) {
      toast({
        title: 'Update failed',
        description: 'Could not update favorite status.',
        variant: 'destructive'
      });
    }
  };

  const handleDownload = (workflow: Workflow) => {
    try {
      const blob = new Blob([JSON.stringify(workflow.workflow_json, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${workflow.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Downloaded!',
        description: 'Workflow JSON has been downloaded.'
      });
    } catch (error) {
      toast({
        title: 'Download failed',
        description: 'Could not download the workflow.',
        variant: 'destructive'
      });
    }
  };

  const handleSaveAsTemplate = (workflow: Workflow) => {
    setTemplateDialog({ open: true, workflow });
    setTemplateName(workflow.name);
    setTemplateDescription(workflow.description || '');
  };

  const handleConfirmSaveTemplate = async () => {
    if (!templateDialog.workflow || !templateName.trim()) {
      toast({
        title: 'Template name required',
        description: 'Please provide a name for your template.',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      await updateWorkflow({
        id: templateDialog.workflow.id,
        isTemplate: true,
        templateName: templateName.trim(),
        templateDescription: templateDescription.trim()
      });

      // Update local state
      setWorkflows(workflows.map(w =>
        w.id === templateDialog.workflow!.id
          ? { ...w, is_template: true, template_name: templateName.trim(), template_description: templateDescription.trim() }
          : w
      ));

      toast({
        title: '✅ Template saved!',
        description: `"${templateName}" is now available in your Templates page.`
      });

      setTemplateDialog({ open: false, workflow: null });
      setTemplateName('');
      setTemplateDescription('');
    } catch (error) {
      toast({
        title: 'Save failed',
        description: 'Could not save workflow as template.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  // Show upgrade CTA if user doesn't have access
  if (profile && !canViewHistory) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3 flex items-center justify-center gap-3">
            <Clock className="h-10 w-10 text-blue-600" />
            Workflow History
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            View and manage all your generated workflows in one place.
          </p>
        </div>

        <div className="relative">
          <UpgradeCTA
            feature="Workflow History"
            message={upgradeMessage}
            requiredPlan="pro"
            variant="overlay"
          />

          {/* Blurred preview content */}
          <div className="filter blur-sm pointer-events-none select-none">
            <Card className="p-6 shadow-lg opacity-50">
              <div className="space-y-4">
                <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your workflows...</p>
        </div>
      </div>
    );
  }

  if (workflows.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="p-12 text-center">
          <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No workflows yet</h2>
          <p className="text-gray-600 mb-6">
            Workflows you save will appear here. Generate your first workflow to get started!
          </p>
          <Button onClick={() => window.location.href = '/'}>
            Generate Workflow
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Workflow History</h1>
          <p className="text-gray-600 mt-1">
            {workflows.length} workflow{workflows.length !== 1 ? 's' : ''} saved
          </p>
        </div>
      </div>

      {/* Workflow List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {workflows.map((workflow) => (
          <Card key={workflow.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg text-gray-900">{workflow.name}</h3>
                    <button
                      onClick={() => handleToggleFavorite(workflow.id, workflow.is_favorite)}
                      className="text-gray-400 hover:text-yellow-500 transition-colors"
                    >
                      {workflow.is_favorite ? (
                        <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                      ) : (
                        <StarOff className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {workflow.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{workflow.description}</p>
                  )}
                </div>
              </div>

              {/* Status Indicators */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleStatusChange(workflow.id, 'success')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                    workflow.status === 'success'
                      ? 'bg-green-100 text-green-700 border-2 border-green-500'
                      : 'bg-gray-100 text-gray-600 hover:bg-green-50 border-2 border-transparent'
                  }`}
                  title="Mark as successful"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-sm font-medium">Success</span>
                </button>

                <button
                  onClick={() => handleStatusChange(workflow.id, 'failed')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                    workflow.status === 'failed'
                      ? 'bg-red-100 text-red-700 border-2 border-red-500'
                      : 'bg-gray-100 text-gray-600 hover:bg-red-50 border-2 border-transparent'
                  }`}
                  title="Mark as failed"
                >
                  <XCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">Failed</span>
                </button>

                <button
                  onClick={() => handleStatusChange(workflow.id, 'pending')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                    workflow.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-500'
                      : 'bg-gray-100 text-gray-600 hover:bg-yellow-50 border-2 border-transparent'
                  }`}
                  title="Mark as pending"
                >
                  <Clock className="h-5 w-5" />
                  <span className="text-sm font-medium">Pending</span>
                </button>
              </div>

              {/* Metadata */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{workflow.platform}</Badge>
                {workflow.template_used && (
                  <Badge variant="outline">From Template</Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  {new Date(workflow.created_at).toLocaleDateString()}
                </Badge>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  onClick={() => setSelectedWorkflow(workflow)}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                {!workflow.is_template && (
                  <Button
                    onClick={() => handleSaveAsTemplate(workflow)}
                    variant="outline"
                    size="sm"
                    className="flex-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                  >
                    <BookmarkPlus className="h-4 w-4 mr-1" />
                    Save as Template
                  </Button>
                )}
                {workflow.is_template && (
                  <Badge variant="secondary" className="flex-1 justify-center py-1.5">
                    Template
                  </Badge>
                )}
                <Button
                  onClick={() => handleDownload(workflow)}
                  variant="outline"
                  size="sm"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => handleDelete(workflow.id)}
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Workflow Viewer Modal */}
      {selectedWorkflow && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">{selectedWorkflow.name}</h3>
              <Button onClick={() => setSelectedWorkflow(null)} variant="ghost" size="sm">
                Close
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <WorkflowJsonViewer
                workflow={selectedWorkflow.workflow_json}
                name={selectedWorkflow.name}
                platform={selectedWorkflow.platform}
              />
            </div>
          </div>
        </div>
      )}

      {/* Save as Template Dialog */}
      <Dialog open={templateDialog.open} onOpenChange={(open) => setTemplateDialog({ open, workflow: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
            <DialogDescription>
              Give your template a name and description so you can easily find and reuse it later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name *</Label>
              <Input
                id="template-name"
                placeholder="e.g., Email Marketing Automation"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-description">Description (optional)</Label>
              <Textarea
                id="template-description"
                placeholder="Describe what this workflow does and when to use it..."
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTemplateDialog({ open: false, workflow: null })}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmSaveTemplate} disabled={saving || !templateName.trim()}>
              {saving ? 'Saving...' : 'Save Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
