/**
 * Zapier Embed Browser Component
 *
 * Opens Zapier dashboard in a large modal iframe, allowing users to manage
 * their client's Zaps directly within StreamSuite without leaving the app.
 *
 * Fallback: If iframe is blocked, opens in a new tab with instructions.
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ExternalLink,
  RefreshCw,
  Maximize2,
  Minimize2,
  AlertCircle,
  X,
  Zap,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ZapierEmbedBrowserProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zapierUrl?: string;
  clientName?: string;
}

export default function ZapierEmbedBrowser({
  open,
  onOpenChange,
  zapierUrl = 'https://zapier.com/app/dashboard',
  clientName = 'Client',
}: ZapierEmbedBrowserProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeBlocked, setIframeBlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Reset states when dialog opens/closes
  useEffect(() => {
    if (open) {
      setIsLoading(true);
      setIframeBlocked(false);
    }
  }, [open]);

  // Handle iframe load
  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  // Handle iframe error (blocked by X-Frame-Options)
  const handleIframeError = () => {
    setIsLoading(false);
    setIframeBlocked(true);
    toast({
      title: 'Iframe Blocked',
      description: 'Zapier prevents embedding. Opening in new tab instead.',
      variant: 'destructive',
    });
  };

  // Open in new tab as fallback
  const openInNewTab = () => {
    window.open(zapierUrl, '_blank', 'noopener,noreferrer');
    toast({
      title: 'Opened in New Tab',
      description: 'Zapier dashboard opened in a new browser tab.',
    });
  };

  // Refresh iframe
  const refreshIframe = () => {
    setIsLoading(true);
    const iframe = document.getElementById('zapier-embed-iframe') as HTMLIFrameElement;
    if (iframe) {
      iframe.src = iframe.src;
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`${
          isFullscreen
            ? 'max-w-[98vw] max-h-[98vh] w-[98vw] h-[98vh]'
            : 'max-w-[90vw] max-h-[90vh] w-[90vw] h-[90vh]'
        } p-0 gap-0 flex flex-col transition-all duration-200`}
      >
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b bg-gray-50 dark:bg-gray-800 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Zap className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <DialogTitle className="text-lg">Zapier Dashboard - {clientName}</DialogTitle>
                <DialogDescription className="text-xs mt-1">
                  Manage Zaps directly from StreamSuite. Changes are saved automatically.
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Refresh Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshIframe}
                disabled={iframeBlocked}
                title="Refresh"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>

              {/* Fullscreen Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>

              {/* Open in New Tab */}
              <Button variant="ghost" size="sm" onClick={openInNewTab} title="Open in New Tab">
                <ExternalLink className="h-4 w-4" />
              </Button>

              {/* Close Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                title="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Browser Area */}
        <div className="flex-1 relative overflow-hidden bg-white dark:bg-gray-900">
          {/* Loading State */}
          {isLoading && !iframeBlocked && (
            <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-900 z-10">
              <div className="text-center space-y-4">
                <RefreshCw className="h-8 w-8 animate-spin text-purple-600 mx-auto" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Loading Zapier...</p>
              </div>
            </div>
          )}

          {/* Iframe Blocked Warning */}
          {iframeBlocked ? (
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <Alert className="max-w-2xl">
                <AlertCircle className="h-5 w-5" />
                <AlertDescription className="mt-2 space-y-4">
                  <p className="font-semibold">Zapier Blocks Iframe Embedding</p>
                  <p className="text-sm">
                    For security reasons, Zapier prevents their dashboard from being embedded in
                    other websites. This is a security feature called X-Frame-Options.
                  </p>
                  <p className="text-sm">
                    <strong>Workaround:</strong> Click the button below to open Zapier in a new
                    browser tab. You can manage Zaps there and return to StreamSuite when done.
                  </p>
                  <div className="flex gap-2 pt-2">
                    <Button onClick={openInNewTab} className="gap-2">
                      <ExternalLink className="h-4 w-4" />
                      Open Zapier in New Tab
                    </Button>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                      Close
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <>
              {/* Iframe */}
              <iframe
                id="zapier-embed-iframe"
                src={zapierUrl}
                className="w-full h-full border-0"
                title="Zapier Dashboard"
                onLoad={handleIframeLoad}
                onError={handleIframeError}
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
                allow="clipboard-read; clipboard-write"
              />

              {/* Helpful Tips Overlay (bottom) */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
                <Alert className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm shadow-lg max-w-md">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    <strong>Tip:</strong> You may need to log in to Zapier. All changes are saved
                    automatically to your Zapier account.
                  </AlertDescription>
                </Alert>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t bg-gray-50 dark:bg-gray-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Connected to Zapier</span>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400">
            {zapierUrl.replace('https://', '')}
          </div>

          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
