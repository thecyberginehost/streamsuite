import { useGeneration } from '@/contexts/GenerationContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function GenerationBanner() {
  const { state, cancelGeneration } = useGeneration();
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  if (!state.isGenerating && !state.result && !state.error) {
    return null;
  }

  const handleCancel = async () => {
    const refundAmount = await cancelGeneration();
    setShowCancelDialog(false);
  };

  const getStatusColor = () => {
    if (state.error) return 'bg-red-500';
    if (state.result) return 'bg-green-500';
    return 'bg-purple-500';
  };

  const getStatusIcon = () => {
    if (state.error) return <AlertCircle className="h-5 w-5" />;
    if (state.result) return <CheckCircle2 className="h-5 w-5" />;
    return <Loader2 className="h-5 w-5 animate-spin" />;
  };

  const getTypeLabel = () => {
    switch (state.type) {
      case 'enterprise':
        return 'Enterprise Workflow';
      case 'batch':
        return 'Batch Generation';
      case 'simple':
        return 'Workflow';
      default:
        return 'Generation';
    }
  };

  return (
    <>
      <div className={`${getStatusColor()} text-white shadow-lg`}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              {getStatusIcon()}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {state.error ? 'Generation Failed' : state.result ? 'Generation Complete' : `Generating ${getTypeLabel()}`}
                  </span>
                  {state.isGenerating && (
                    <span className="text-sm opacity-90">
                      {Math.round(state.progress)}%
                    </span>
                  )}
                </div>
                <p className="text-sm opacity-90">{state.message}</p>
                {state.isGenerating && (
                  <Progress value={state.progress} className="h-1.5 mt-2 bg-white/20" />
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {state.isGenerating && state.canCancel && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCancelDialog(true)}
                  className="text-white hover:bg-white/20"
                >
                  Cancel
                </Button>
              )}
              {!state.isGenerating && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // This would be handled by clearing the generation state
                  }}
                  className="text-white hover:bg-white/20"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Generation?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this generation? You will receive a partial credit refund based on progress:
              <ul className="mt-3 space-y-1 text-sm">
                <li>• 0-20% complete: 75% refund ({Math.floor(state.estimatedCredits * 0.75)} credits)</li>
                <li>• 20-70% complete: 50% refund ({Math.floor(state.estimatedCredits * 0.50)} credits)</li>
                <li>• 70-90% complete: 25% refund ({Math.floor(state.estimatedCredits * 0.25)} credits)</li>
                <li>• 90-100% complete: No refund</li>
              </ul>
              <p className="mt-3 font-medium">
                Current progress: {Math.round(state.progress)}%
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Generation</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} className="bg-red-500 hover:bg-red-600">
              Cancel Generation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
