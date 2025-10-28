/**
 * Workflow JSON Viewer Component
 *
 * Displays generated workflow JSON with syntax highlighting,
 * copy to clipboard, and download functionality.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Copy, Download, Check, ChevronDown, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WorkflowJsonViewerProps {
  workflow: any;
  name?: string;
  platform?: string;
}

export default function WorkflowJsonViewer({ workflow, name, platform = 'n8n' }: WorkflowJsonViewerProps) {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const { toast } = useToast();

  // Format JSON with proper indentation
  const formattedJson = JSON.stringify(workflow, null, 2);

  /**
   * Copy workflow JSON to clipboard
   */
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: 'Copied to clipboard!',
        description: 'Workflow JSON has been copied to your clipboard.'
      });
    } catch (error) {
      toast({
        title: 'Failed to copy',
        description: 'Could not copy to clipboard. Please try again.',
        variant: 'destructive'
      });
    }
  };

  /**
   * Download workflow as JSON file
   */
  const handleDownload = () => {
    try {
      const blob = new Blob([formattedJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sanitizeFileName(name || 'workflow')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Download started!',
        description: `Workflow downloaded as ${sanitizeFileName(name || 'workflow')}.json`
      });
    } catch (error) {
      toast({
        title: 'Download failed',
        description: 'Could not download workflow. Please try again.',
        variant: 'destructive'
      });
    }
  };

  /**
   * Sanitize filename for download
   */
  const sanitizeFileName = (filename: string): string => {
    return filename
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  /**
   * Get workflow stats for display
   */
  const getWorkflowStats = () => {
    if (!workflow) return null;

    let stats = {
      nodes: 0,
      connections: 0,
      triggers: 0
    };

    if (workflow.nodes && Array.isArray(workflow.nodes)) {
      stats.nodes = workflow.nodes.length;
      stats.triggers = workflow.nodes.filter((node: any) =>
        node.type?.includes('Trigger') ||
        node.type === 'n8n-nodes-base.webhook' ||
        node.type === 'n8n-nodes-base.manualTrigger'
      ).length;
    }

    if (workflow.connections && typeof workflow.connections === 'object') {
      stats.connections = Object.keys(workflow.connections).length;
    }

    return stats;
  };

  const stats = getWorkflowStats();

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="border-b bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? (
                <ChevronDown className="h-5 w-5 text-gray-600" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-600" />
              )}
            </button>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {name || 'Generated Workflow'}
              </h3>
              {stats && (
                <div className="flex gap-4 mt-1 text-sm text-gray-600">
                  <span>{stats.nodes} nodes</span>
                  <span>{stats.connections} connections</span>
                  <span>{stats.triggers} trigger(s)</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleCopy}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
            <Button
              onClick={handleDownload}
              variant="default"
              size="sm"
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Download JSON
            </Button>
          </div>
        </div>
      </div>

      {/* JSON Content */}
      {isExpanded && (
        <div className="relative">
          {/* Import Instructions */}
          <div className="bg-blue-50 border-b border-blue-100 p-3">
            <p className="text-sm text-blue-800">
              <strong>💡 How to use:</strong> Download this JSON file and import it into{' '}
              {platform === 'n8n' && 'n8n (Workflows → Import from File)'}
              {platform === 'make' && 'Make.com (Scenarios → Import Blueprint)'}
              {platform === 'zapier' && 'Zapier (Code by Zapier action)'}
            </p>
          </div>

          {/* JSON Display with Syntax Highlighting */}
          <div className="p-4 bg-gray-900 overflow-x-auto">
            <pre className="text-sm font-mono">
              <code className="text-gray-100">
                {formatJsonWithHighlighting(formattedJson)}
              </code>
            </pre>
          </div>
        </div>
      )}
    </Card>
  );
}

/**
 * Simple JSON syntax highlighting using React fragments
 */
function formatJsonWithHighlighting(json: string) {
  return json.split('\n').map((line, index) => {
    let highlightedLine = line;

    // Color keys (strings before colons)
    highlightedLine = highlightedLine.replace(
      /"([^"]+)":/g,
      '<span style="color: #7dd3fc">"$1"</span>:'
    );

    // Color string values
    highlightedLine = highlightedLine.replace(
      /: "([^"]*)"/g,
      ': <span style="color: #86efac">"$1"</span>'
    );

    // Color numbers
    highlightedLine = highlightedLine.replace(
      /: (\d+)/g,
      ': <span style="color: #fbbf24">$1</span>'
    );

    // Color booleans
    highlightedLine = highlightedLine.replace(
      /: (true|false)/g,
      ': <span style="color: #f472b6">$1</span>'
    );

    // Color null
    highlightedLine = highlightedLine.replace(
      /: null/g,
      ': <span style="color: #a78bfa">null</span>'
    );

    return (
      <div key={index} dangerouslySetInnerHTML={{ __html: highlightedLine }} />
    );
  });
}
