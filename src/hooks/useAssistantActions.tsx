/**
 * Assistant Actions Context - Allows AssistantWidget to communicate with pages
 */

import { createContext, useContext, useState, ReactNode } from 'react';

interface AssistantActionsContextType {
  promptToFill: string | null;
  fillPrompt: (prompt: string) => void;
  clearPromptToFill: () => void;
}

const AssistantActionsContext = createContext<AssistantActionsContextType | undefined>(undefined);

export function AssistantActionsProvider({ children }: { children: ReactNode }) {
  const [promptToFill, setPromptToFill] = useState<string | null>(null);

  const fillPrompt = (prompt: string) => {
    setPromptToFill(prompt);
  };

  const clearPromptToFill = () => {
    setPromptToFill(null);
  };

  return (
    <AssistantActionsContext.Provider value={{ promptToFill, fillPrompt, clearPromptToFill }}>
      {children}
    </AssistantActionsContext.Provider>
  );
}

export function useAssistantActions() {
  const context = useContext(AssistantActionsContext);
  if (!context) {
    throw new Error('useAssistantActions must be used within AssistantActionsProvider');
  }
  return context;
}
