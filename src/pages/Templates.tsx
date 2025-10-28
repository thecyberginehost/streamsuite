/**
 * Templates Page
 *
 * Browse and load production-ready n8n workflow templates + user saved templates
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useProfile } from '@/hooks/useProfile';
import {
  Layers, Search, Download, Sparkles, FolderPlus, Folder,
  MoreVertical, Edit2, Trash2, FolderOpen, ChevronRight, ChevronDown
} from 'lucide-react';
import { N8N_WORKFLOW_TEMPLATES } from '@/lib/n8n/workflowTemplates';
import { canAccessFeature, getUpgradeMessage } from '@/config/subscriptionPlans';
import UpgradeCTA from '@/components/UpgradeCTA';
import { loadTemplateJson } from '@/services/templateService';
import { saveWorkflow, getUserTemplates, type Workflow } from '@/services/workflowService';
import {
  getTemplateFolders,
  createTemplateFolder,
  updateTemplateFolder,
  deleteTemplateFolder,
  moveTemplateToFolder,
  getTemplatesInFolder,
  getUnorganizedTemplates,
  type TemplateFolder
} from '@/services/templateFolderService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function Templates() {
  const [activeTab, setActiveTab] = useState<'default' | 'user'>('default');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();
  const { profile } = useProfile();

  // Check template access
  const canAccessAllTemplates = profile ? canAccessFeature(profile.subscription_tier, 'templates') : false;

  // User templates state
  const [userTemplates, setUserTemplates] = useState<Workflow[]>([]);
  const [folders, setFolders] = useState<TemplateFolder[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Folder dialogs
  const [createFolderDialog, setCreateFolderDialog] = useState(false);
  const [editFolderDialog, setEditFolderDialog] = useState<{ open: boolean; folder: TemplateFolder | null }>({ open: false, folder: null });
  const [folderName, setFolderName] = useState('');
  const [folderDescription, setFolderDescription] = useState('');
  const [savingFolder, setSavingFolder] = useState(false);

  // Load user templates and folders on mount
  useEffect(() => {
    if (activeTab === 'user') {
      loadUserTemplatesAndFolders();
    }
  }, [activeTab]);

  const loadUserTemplatesAndFolders = async () => {
    setLoadingTemplates(true);
    try {
      const [templatesData, foldersData] = await Promise.all([
        getUserTemplates(),
        getTemplateFolders()
      ]);
      setUserTemplates(templatesData);
      setFolders(foldersData);
    } catch (error) {
      console.error('Failed to load user templates:', error);
      toast({
        title: 'Load failed',
        description: 'Could not load your templates.',
        variant: 'destructive'
      });
    } finally {
      setLoadingTemplates(false);
    }
  };

  // Get unique categories
  const categories = ['all', ...new Set(N8N_WORKFLOW_TEMPLATES.map(t => t.category))];

  // Filter templates
  let filteredTemplates = N8N_WORKFLOW_TEMPLATES.filter(template => {
    const matchesSearch = searchQuery === '' ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // All filtered templates are displayed (free users won't reach this page)
  const displayedTemplates = filteredTemplates;

  /**
   * Load template and download
   */
  const handleLoadTemplate = async (templateId: string) => {
    setLoading(templateId);

    try {
      const templateJson = await loadTemplateJson(templateId);
      const template = N8N_WORKFLOW_TEMPLATES.find(t => t.id === templateId);

      if (!template) {
        throw new Error('Template not found');
      }

      // Download JSON file
      const blob = new Blob([JSON.stringify(templateJson, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${templateId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Template downloaded!',
        description: `${template.name} is ready to import into n8n.`
      });
    } catch (error) {
      console.error('Failed to load template:', error);
      toast({
        title: 'Download failed',
        description: 'Could not load template. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(null);
    }
  };

  /**
   * Save template to history
   */
  const handleSaveToHistory = async (templateId: string) => {
    // Check if user has access to save
    if (!canAccessAllTemplates) {
      toast({
        title: 'Upgrade Required',
        description: getUpgradeMessage(profile?.subscription_tier || 'free', 'history'),
        variant: 'destructive',
        action: {
          label: 'Upgrade',
          onClick: () => window.location.href = '/pricing'
        }
      });
      return;
    }

    setLoading(templateId);

    try {
      const templateJson = await loadTemplateJson(templateId);
      const template = N8N_WORKFLOW_TEMPLATES.find(t => t.id === templateId);

      if (!template) {
        throw new Error('Template not found');
      }

      await saveWorkflow({
        name: template.name,
        description: template.description,
        platform: 'n8n',
        workflowJson: templateJson,
        templateUsed: templateId,
        creditsUsed: 0,
        tokensUsed: 0,
        status: 'success'
      });

      toast({
        title: 'Saved to history!',
        description: 'You can find this template in your History page.'
      });
    } catch (error) {
      console.error('Failed to save template:', error);
      toast({
        title: 'Save failed',
        description: 'Could not save template. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(null);
    }
  };

  // =====================================================
  // FOLDER MANAGEMENT HANDLERS
  // =====================================================

  const handleCreateFolder = async () => {
    if (!folderName.trim()) {
      toast({
        title: 'Folder name required',
        description: 'Please provide a name for your folder.',
        variant: 'destructive'
      });
      return;
    }

    setSavingFolder(true);
    try {
      const newFolder = await createTemplateFolder({
        name: folderName.trim(),
        description: folderDescription.trim()
      });

      setFolders([newFolder, ...folders]);
      setCreateFolderDialog(false);
      setFolderName('');
      setFolderDescription('');

      toast({
        title: '✅ Folder created!',
        description: `"${newFolder.name}" is ready for organizing templates.`
      });
    } catch (error) {
      toast({
        title: 'Create failed',
        description: error instanceof Error ? error.message : 'Could not create folder.',
        variant: 'destructive'
      });
    } finally {
      setSavingFolder(false);
    }
  };

  const handleEditFolder = async () => {
    if (!editFolderDialog.folder || !folderName.trim()) {
      toast({
        title: 'Folder name required',
        description: 'Please provide a name for your folder.',
        variant: 'destructive'
      });
      return;
    }

    setSavingFolder(true);
    try {
      const updated = await updateTemplateFolder(editFolderDialog.folder.id, {
        name: folderName.trim(),
        description: folderDescription.trim()
      });

      setFolders(folders.map(f => f.id === updated.id ? updated : f));
      setEditFolderDialog({ open: false, folder: null });
      setFolderName('');
      setFolderDescription('');

      toast({
        title: '✅ Folder updated!',
        description: `"${updated.name}" has been updated.`
      });
    } catch (error) {
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Could not update folder.',
        variant: 'destructive'
      });
    } finally {
      setSavingFolder(false);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm('Are you sure you want to delete this folder? Templates inside will not be deleted.')) {
      return;
    }

    try {
      await deleteTemplateFolder(folderId);
      setFolders(folders.filter(f => f.id !== folderId));

      // Reload templates to reflect folder removal
      const templatesData = await getUserTemplates();
      setUserTemplates(templatesData);

      toast({
        title: '✅ Folder deleted',
        description: 'Templates have been moved to "Unorganized".'
      });
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: 'Could not delete folder.',
        variant: 'destructive'
      });
    }
  };

  const handleMoveTemplate = async (workflowId: string, folderId: string | null) => {
    try {
      await moveTemplateToFolder(workflowId, folderId);

      // Update local state
      setUserTemplates(userTemplates.map(t =>
        t.id === workflowId ? { ...t, folder_id: folderId } : t
      ));

      const folderName = folderId
        ? folders.find(f => f.id === folderId)?.name || 'folder'
        : 'Unorganized';

      toast({
        title: '✅ Template moved!',
        description: `Moved to "${folderName}".`
      });
    } catch (error) {
      toast({
        title: 'Move failed',
        description: 'Could not move template.',
        variant: 'destructive'
      });
    }
  };

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  // Get organized templates
  const unorganizedTemplates = userTemplates.filter(t => !t.folder_id);
  const organizedByFolder = folders.map(folder => ({
    folder,
    templates: userTemplates.filter(t => t.folder_id === folder.id)
  }));

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Workflow Templates</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Browse production-ready templates and organize your own saved workflows
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'default' | 'user')} className="space-y-4">
        <TabsList className="w-fit">
          <TabsTrigger value="default" className="text-xs">
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            Default Templates ({N8N_WORKFLOW_TEMPLATES.length})
          </TabsTrigger>
          <TabsTrigger value="user" className="text-xs">
            <FolderOpen className="h-3.5 w-3.5 mr-1.5" />
            My Templates ({userTemplates.length})
          </TabsTrigger>
        </TabsList>

        {/* DEFAULT TEMPLATES TAB */}
        <TabsContent value="default" className="space-y-4 mt-0">

      {/* Search and Filters */}
      <Card className="p-4 shadow-none border-gray-200/80 dark:border-gray-800/50">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs border-gray-200/80 dark:border-gray-800/50 bg-white dark:bg-[#111111]"
            />
          </div>

          {/* Category Filter */}
          <div className="flex gap-1.5 flex-wrap">
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={`capitalize h-8 text-xs font-medium ${
                  selectedCategory === category
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                    : 'border-gray-200/80 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/40'
                }`}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Results Count */}
      <div className="text-[11px] text-gray-500 dark:text-gray-400">
        Showing {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <Card className="p-8 text-center shadow-none border-gray-200/80 dark:border-gray-800/50">
          <Sparkles className="h-8 w-8 text-gray-400 dark:text-gray-500 mx-auto mb-2.5" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">No templates found</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Try adjusting your search or filters</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedTemplates.map(template => (
            <Card key={template.id} className="p-4 hover:border-gray-300 dark:hover:border-gray-700 transition-colors shadow-none border-gray-200/80 dark:border-gray-800/50">
              {/* Template Header */}
              <div className="mb-3">
                <div className="flex items-start justify-between mb-1.5">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex-1">
                    {template.name}
                  </h3>
                  <Badge variant="outline" className="ml-2 capitalize text-[10px] px-1.5 py-0.5 border-gray-200/80 dark:border-gray-800/50">
                    {template.category}
                  </Badge>
                </div>
                <p className="text-[11px] text-gray-600 dark:text-gray-400 line-clamp-2">
                  {template.description}
                </p>
              </div>

              {/* Difficulty & Complexity */}
              <div className="flex gap-1.5 mb-3">
                <Badge variant={
                  template.difficulty === 'beginner' ? 'default' :
                  template.difficulty === 'intermediate' ? 'secondary' :
                  'destructive'
                } className="text-[10px] px-1.5 py-0.5 capitalize">
                  {template.difficulty}
                </Badge>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 border-gray-200/80 dark:border-gray-800/50">
                  {template.complexity} complexity
                </Badge>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 mb-3">
                {template.tags.slice(0, 3).map(tag => (
                  <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800/60">
                    {tag}
                  </Badge>
                ))}
                {template.tags.length > 3 && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800/60">
                    +{template.tags.length - 3}
                  </Badge>
                )}
              </div>

              {/* Required Integrations */}
              <div className="mb-3">
                <p className="text-[10px] font-medium text-gray-600 dark:text-gray-400 mb-1">Required:</p>
                <div className="flex flex-wrap gap-1">
                  {template.requiredIntegrations.slice(0, 3).map(integration => (
                    <Badge key={integration} variant="outline" className="text-[10px] px-1.5 py-0.5 border-gray-200/80 dark:border-gray-800/50">
                      {integration}
                    </Badge>
                  ))}
                  {template.requiredIntegrations.length > 3 && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 border-gray-200/80 dark:border-gray-800/50">
                      +{template.requiredIntegrations.length - 3}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-1.5 pt-3 border-t border-gray-200/80 dark:border-gray-800/50">
                <Button
                  size="sm"
                  onClick={() => handleLoadTemplate(template.id)}
                  disabled={loading === template.id}
                  className="flex-1 h-7 text-xs font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                >
                  <Download className="h-3 w-3 mr-1" />
                  {loading === template.id ? 'Loading...' : 'Download'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSaveToHistory(template.id)}
                  disabled={loading === template.id}
                  className="flex-1 h-7 text-xs font-medium border-gray-200/80 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/40"
                >
                  Save
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Help Card */}
      <Card className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/80 dark:border-blue-800/50 shadow-none">
        <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-2">How to Use Templates</h3>
        <ol className="text-[11px] text-gray-700 dark:text-gray-400 space-y-0.5 list-decimal list-inside">
          <li>Click "Download" to get the template JSON file</li>
          <li>Open n8n and click "Workflows" → "Add Workflow"</li>
          <li>Click the "..." menu → "Import from File"</li>
          <li>Select the downloaded JSON file</li>
          <li>Configure credentials and customize as needed</li>
        </ol>
      </Card>
        </TabsContent>

        {/* USER TEMPLATES TAB */}
        <TabsContent value="user" className="space-y-4 mt-0">
          {loadingTemplates ? (
            <Card className="p-8 text-center shadow-none border-gray-200/80 dark:border-gray-800/50">
              <p className="text-sm text-gray-500">Loading your templates...</p>
            </Card>
          ) : (
            <>
              {/* Header with Create Folder button */}
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {userTemplates.length} saved template{userTemplates.length !== 1 ? 's' : ''} • {folders.length} folder{folders.length !== 1 ? 's' : ''}
                </p>
                <Button
                  size="sm"
                  onClick={() => setCreateFolderDialog(true)}
                  className="h-7 text-xs font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                >
                  <FolderPlus className="h-3 w-3 mr-1.5" />
                  New Folder
                </Button>
              </div>

              {userTemplates.length === 0 ? (
                <Card className="p-8 text-center shadow-none border-gray-200/80 dark:border-gray-800/50">
                  <FolderOpen className="h-8 w-8 text-gray-400 dark:text-gray-500 mx-auto mb-2.5" />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">No saved templates</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Save workflows as templates from the History page to organize them here.
                  </p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {/* Folders with templates */}
                  {organizedByFolder.map(({ folder, templates }) => (
                    <Card key={folder.id} className="p-4 shadow-none border-gray-200/80 dark:border-gray-800/50">
                      {/* Folder Header */}
                      <div className="flex items-center justify-between mb-3">
                        <button
                          onClick={() => toggleFolder(folder.id)}
                          className="flex items-center gap-2 flex-1 text-left hover:bg-gray-50 dark:hover:bg-gray-800/40 -m-1 p-1 rounded"
                        >
                          {expandedFolders.has(folder.id) ? (
                            <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5 text-gray-500" />
                          )}
                          <Folder className="h-3.5 w-3.5 text-gray-500" />
                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {folder.name}
                          </span>
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                            {templates.length}
                          </Badge>
                        </button>

                        {/* Folder Actions */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="text-xs">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditFolderDialog({ open: true, folder });
                                setFolderName(folder.name);
                                setFolderDescription(folder.description || '');
                              }}
                            >
                              <Edit2 className="h-3 w-3 mr-2" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteFolder(folder.id)}
                              className="text-red-600 dark:text-red-400"
                            >
                              <Trash2 className="h-3 w-3 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Folder Templates */}
                      {expandedFolders.has(folder.id) && (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3 pt-3 border-t border-gray-200/80 dark:border-gray-800/50">
                          {templates.map(template => (
                            <UserTemplateCard
                              key={template.id}
                              template={template}
                              folders={folders}
                              onMove={handleMoveTemplate}
                            />
                          ))}
                        </div>
                      )}
                    </Card>
                  ))}

                  {/* Unorganized Templates */}
                  {unorganizedTemplates.length > 0 && (
                    <Card className="p-4 shadow-none border-gray-200/80 dark:border-gray-800/50">
                      <div className="flex items-center gap-2 mb-3">
                        <FolderOpen className="h-3.5 w-3.5 text-gray-500" />
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          Unorganized
                        </span>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                          {unorganizedTemplates.length}
                        </Badge>
                      </div>

                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {unorganizedTemplates.map(template => (
                          <UserTemplateCard
                            key={template.id}
                            template={template}
                            folders={folders}
                            onMove={handleMoveTemplate}
                          />
                        ))}
                      </div>
                    </Card>
                  )}
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Folder Dialog */}
      <Dialog open={createFolderDialog} onOpenChange={setCreateFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Folder</DialogTitle>
            <DialogDescription>
              Organize your saved templates into folders.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                Folder Name
              </label>
              <Input
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="e.g., Marketing Workflows"
                className="text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                Description (optional)
              </label>
              <Input
                value={folderDescription}
                onChange={(e) => setFolderDescription(e.target.value)}
                placeholder="Brief description of this folder"
                className="text-sm"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateFolderDialog(false);
                setFolderName('');
                setFolderDescription('');
              }}
              disabled={savingFolder}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateFolder} disabled={savingFolder}>
              {savingFolder ? 'Creating...' : 'Create Folder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Folder Dialog */}
      <Dialog open={editFolderDialog.open} onOpenChange={(open) => {
        if (!open) {
          setEditFolderDialog({ open: false, folder: null });
          setFolderName('');
          setFolderDescription('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Folder</DialogTitle>
            <DialogDescription>
              Update folder name and description.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                Folder Name
              </label>
              <Input
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="e.g., Marketing Workflows"
                className="text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                Description (optional)
              </label>
              <Input
                value={folderDescription}
                onChange={(e) => setFolderDescription(e.target.value)}
                placeholder="Brief description of this folder"
                className="text-sm"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditFolderDialog({ open: false, folder: null });
                setFolderName('');
                setFolderDescription('');
              }}
              disabled={savingFolder}
            >
              Cancel
            </Button>
            <Button onClick={handleEditFolder} disabled={savingFolder}>
              {savingFolder ? 'Updating...' : 'Update Folder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// =====================================================
// USER TEMPLATE CARD COMPONENT
// =====================================================

interface UserTemplateCardProps {
  template: Workflow;
  folders: TemplateFolder[];
  onMove: (workflowId: string, folderId: string | null) => void;
}

function UserTemplateCard({ template, folders, onMove }: UserTemplateCardProps) {
  return (
    <Card className="p-3 shadow-none border-gray-200/80 dark:border-gray-800/50">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">
            {template.template_name || template.name}
          </h4>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
            {template.template_description || template.description || 'No description'}
          </p>
        </div>

        {/* Move Template Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-5 w-5 p-0 ml-2">
              <MoreVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="text-xs">
            <DropdownMenuItem onClick={() => onMove(template.id, null)}>
              Move to Unorganized
            </DropdownMenuItem>
            {folders.map(folder => (
              <DropdownMenuItem
                key={folder.id}
                onClick={() => onMove(template.id, folder.id)}
              >
                <Folder className="h-3 w-3 mr-2" />
                {folder.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-1">
        <Badge variant="outline" className="text-[9px] px-1 py-0 capitalize">
          {template.platform}
        </Badge>
        <span className="text-[9px] text-gray-400 dark:text-gray-500">
          {new Date(template.created_at).toLocaleDateString()}
        </span>
      </div>
    </Card>
  );
}
