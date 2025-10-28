import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface GenerationState {
  isGenerating: boolean;
  type: 'enterprise' | 'batch' | 'simple' | null;
  progress: number;
  message: string;
  startTime: number;
  estimatedCredits: number;
  canCancel: boolean;
  result?: any;
  error?: string;
}

interface GenerationContextType {
  state: GenerationState;
  startGeneration: (type: 'enterprise' | 'batch' | 'simple', estimatedCredits: number) => void;
  updateProgress: (progress: number, message: string) => void;
  completeGeneration: (result: any) => void;
  failGeneration: (error: string) => void;
  cancelGeneration: () => Promise<number>; // Returns credits to refund
  clearGeneration: () => void;
}

const GenerationContext = createContext<GenerationContextType | undefined>(undefined);

const INITIAL_STATE: GenerationState = {
  isGenerating: false,
  type: null,
  progress: 0,
  message: '',
  startTime: 0,
  estimatedCredits: 0,
  canCancel: true
};

export function GenerationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GenerationState>(() => {
    // Try to restore from localStorage on mount
    const saved = localStorage.getItem('generationState');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Only restore if it's a recent generation (within last hour)
        if (parsed.startTime && Date.now() - parsed.startTime < 3600000) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse saved generation state:', e);
      }
    }
    return INITIAL_STATE;
  });

  // Persist state to localStorage whenever it changes
  useEffect(() => {
    if (state.isGenerating) {
      localStorage.setItem('generationState', JSON.stringify(state));
    } else {
      localStorage.removeItem('generationState');
    }
  }, [state]);

  const startGeneration = (type: 'enterprise' | 'batch' | 'simple', estimatedCredits: number) => {
    setState({
      isGenerating: true,
      type,
      progress: 0,
      message: 'Starting generation...',
      startTime: Date.now(),
      estimatedCredits,
      canCancel: true
    });
  };

  const updateProgress = (progress: number, message: string) => {
    setState(prev => ({
      ...prev,
      progress,
      message
    }));
  };

  const completeGeneration = (result: any) => {
    setState(prev => ({
      ...prev,
      isGenerating: false,
      progress: 100,
      message: 'Generation complete!',
      result
    }));
  };

  const failGeneration = (error: string) => {
    setState(prev => ({
      ...prev,
      isGenerating: false,
      error
    }));
  };

  const cancelGeneration = async (): Promise<number> => {
    const { progress, estimatedCredits } = state;

    // Calculate credit refund based on progress
    let refundPercentage = 0;
    if (progress < 20) {
      refundPercentage = 0.75; // 75% refund if less than 20% done
    } else if (progress < 70) {
      refundPercentage = 0.50; // 50% refund if less than 70% done
    } else if (progress < 90) {
      refundPercentage = 0.25; // 25% refund if less than 90% done
    }
    // No refund if 90%+ complete

    const refundAmount = Math.floor(estimatedCredits * refundPercentage);

    setState(prev => ({
      ...prev,
      isGenerating: false,
      message: `Generation cancelled. ${refundAmount} credits refunded.`,
      canCancel: false
    }));

    return refundAmount;
  };

  const clearGeneration = () => {
    setState(INITIAL_STATE);
  };

  return (
    <GenerationContext.Provider
      value={{
        state,
        startGeneration,
        updateProgress,
        completeGeneration,
        failGeneration,
        cancelGeneration,
        clearGeneration
      }}
    >
      {children}
    </GenerationContext.Provider>
  );
}

export function useGeneration() {
  const context = useContext(GenerationContext);
  if (!context) {
    throw new Error('useGeneration must be used within GenerationProvider');
  }
  return context;
}
