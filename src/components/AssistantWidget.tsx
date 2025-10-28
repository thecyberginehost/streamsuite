/**
 * AssistantWidget - Floating chat widget for StreamBot AI assistant
 */

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, Loader2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { assistantService, type AssistantMessage, type AssistantAction } from '@/services/assistantService';
import { useAssistantActions } from '@/hooks/useAssistantActions';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export function AssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { fillPrompt } = useAssistantActions();
  const { toast } = useToast();

  // Update assistant context when page changes
  useEffect(() => {
    assistantService.updateContext({ currentPage: location.pathname });
  }, [location.pathname]);

  // Show greeting when opened for first time
  useEffect(() => {
    if (isOpen && !hasGreeted) {
      const greeting = assistantService.getGreeting();
      const greetingMsg: AssistantMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: greeting,
        timestamp: new Date(),
      };
      setMessages([greetingMsg]);
      setHasGreeted(true);
    }
  }, [isOpen, hasGreeted]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    // Add user message to UI immediately
    const userMsg: AssistantMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      // Get response from assistant
      const response = await assistantService.sendMessage(userMessage);

      // Add assistant response to UI
      const assistantMsg: AssistantMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // Handle actions
      if (response.action) {
        handleAction(response.action);
      }
    } catch (error) {
      console.error('Failed to send message:', error);

      // Add error message with helpful context
      let errorContent = "Oops, I'm having trouble right now. Can you try again?";

      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          errorContent = "⚙️ I need an OpenAI API key to work! Please add VITE_OPENAI_API_KEY to your .env file and restart the server.";
        } else if (error.message.includes('rate limit')) {
          errorContent = "⏳ Whoa, slow down! We've hit the rate limit. Please wait a minute and try again.";
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorContent = "🌐 Can't connect right now. Check your internet connection and try again.";
        }
      }

      const errorMsg: AssistantMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: errorContent,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = (action: AssistantAction) => {
    switch (action.type) {
      case 'navigate':
        if (action.payload?.to) {
          navigate(action.payload.to);
        }
        break;

      case 'fillPrompt':
        if (action.payload?.prompt) {
          fillPrompt(action.payload.prompt);
          setIsOpen(false); // Close widget after filling prompt
        }
        break;

      case 'showTip':
        // Could show a toast or notification
        console.log('Tip:', action.payload?.tip);
        break;

      default:
        break;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleWidget = () => {
    setIsOpen(!isOpen);
  };

  const clearChat = () => {
    setMessages([]);
    assistantService.clearHistory();
    setHasGreeted(false);
  };

  /**
   * Extract workflow prompt from assistant message
   * Looks for quoted text after phrases like "here's", "prompt:", etc.
   */
  const extractPrompt = (content: string): string | null => {
    // First, check if there's a JSON action with the prompt
    try {
      const actionMatch = content.match(/\{\s*"type":\s*"fillPrompt"[^}]*"prompt":\s*"([^"]+)"/);
      if (actionMatch) {
        return actionMatch[1];
      }
    } catch (e) {
      // Continue to other methods
    }

    // Look for all quoted text in the message
    const allQuotes = content.match(/"([^"]+)"/g);
    if (allQuotes && allQuotes.length > 0) {
      // Find the longest quote that looks like a workflow description
      // (contains words like "when", "I", "want", "send", "notify", etc.)
      const workflowKeywords = /\b(when|if|want|send|notify|create|update|I|receive|get|trigger|workflow)\b/i;

      const workflowQuotes = allQuotes
        .map(q => q.replace(/^"|"$/g, '')) // Remove quotes
        .filter(q => q.length > 20 && workflowKeywords.test(q)) // Must be substantial and workflow-like
        .sort((a, b) => b.length - a.length); // Sort by length (longest first)

      if (workflowQuotes.length > 0) {
        return workflowQuotes[0];
      }

      // If no workflow-like quote found, return the longest one
      const longest = allQuotes
        .map(q => q.replace(/^"|"$/g, ''))
        .sort((a, b) => b.length - a.length)[0];

      if (longest && longest.length > 20) {
        return longest;
      }
    }

    // Look for text after "prompt:" or similar
    const promptMatch = content.match(/(?:prompt|description|workflow):\s*["']?([^"'\n]+)["']?/i);
    if (promptMatch) {
      return promptMatch[1].trim();
    }

    return null;
  };

  /**
   * Copy prompt to clipboard
   */
  const copyPrompt = async (messageId: string, content: string) => {
    const prompt = extractPrompt(content);
    if (!prompt) {
      toast({
        title: 'No prompt found',
        description: 'Could not find a workflow prompt in this message.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedId(messageId);
      setTimeout(() => setCopiedId(null), 2000);

      toast({
        title: '✅ Copied!',
        description: 'Prompt copied to clipboard.',
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: 'Copy failed',
        description: 'Could not copy to clipboard.',
        variant: 'destructive',
      });
    }
  };

  /**
   * Render message content with highlighted prompt section and embedded copy button
   */
  const renderMessageContent = (messageId: string, content: string) => {
    const prompt = extractPrompt(content);
    if (!prompt) {
      return <p className="whitespace-pre-wrap flex-1">{content}</p>;
    }

    // Find the quoted prompt in the original text
    const quotedPrompt = `"${prompt}"`;
    const parts = content.split(quotedPrompt);

    if (parts.length === 2) {
      return (
        <p className="whitespace-pre-wrap flex-1">
          {parts[0]}
          <span className="relative inline-block bg-primary/10 border border-primary/30 rounded px-3 py-2 mx-1 font-medium text-xs group">
            <span className="pr-7">{quotedPrompt}</span>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1 right-1 h-5 w-5 opacity-60 hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                copyPrompt(messageId, content);
              }}
              title="Copy prompt"
            >
              {copiedId === messageId ? (
                <Check className="h-3 w-3 text-green-600" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </span>
          {parts[1]}
        </p>
      );
    }

    return <p className="whitespace-pre-wrap flex-1">{content}</p>;
  };

  return (
    <>
      {/* Floating chat widget */}
      <div
        className={cn(
          'fixed bottom-6 right-6 z-50 transition-all duration-300',
          isOpen ? 'w-96 h-[600px]' : 'w-16 h-16'
        )}
      >
        {isOpen ? (
          /* Expanded chat window */
          <Card className="flex flex-col h-full shadow-2xl border-2 border-primary/20">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/10 to-primary/5">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Sparkles className="h-6 w-6 text-primary" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">StreamBot</h3>
                  <p className="text-xs text-muted-foreground">Your workflow assistant</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearChat}
                  className="h-8 w-8 p-0"
                  title="Clear chat"
                >
                  <span className="text-xs">🗑️</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleWidget}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      'flex gap-2',
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={cn(
                        'max-w-[80%] rounded-2xl px-4 py-2 text-sm',
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}
                    >
                      {msg.role === 'assistant' ? renderMessageContent(msg.id, msg.content) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      )}
                      <p className="text-xs opacity-60 mt-1">
                        {msg.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    {msg.role === 'user' && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-sm">👤</span>
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-2 justify-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <div className="max-w-[80%] rounded-2xl px-4 py-2 bg-muted">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Invisible element to scroll to */}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                I can help you build, convert, and debug workflows
              </p>
            </div>
          </Card>
        ) : (
          /* Collapsed floating button */
          <Button
            onClick={toggleWidget}
            size="icon"
            className="w-16 h-16 rounded-full shadow-2xl hover:scale-110 transition-transform duration-200"
          >
            <div className="relative">
              <MessageCircle className="h-7 w-7" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            </div>
          </Button>
        )}
      </div>
    </>
  );
}
