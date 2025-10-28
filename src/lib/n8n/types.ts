/**
 * Core n8n Types and Interfaces
 */

export interface N8nWorkflow {
  id?: number;
  name: string;
  active: boolean;
  nodes: N8nNode[];
  connections: N8nConnections;
  settings?: N8nWorkflowSettings;
  staticData?: Record<string, any>;
  pinData?: Record<string, any[]>;
  versionId?: string;
  meta?: {
    instanceId?: string;
    templateCredsSetupCompleted?: boolean;
  };
}

export interface N8nNode {
  id: string;
  name: string;
  type: string;
  typeVersion: number;
  position: [number, number];
  parameters: Record<string, any>;
  credentials?: Record<string, N8nCredentialReference>;
  webhookId?: string;
  disabled?: boolean;
  notes?: string;
  notesInFlow?: boolean;
  onError?: 'stopWorkflow' | 'continueRegularOutput' | 'continueErrorOutput';
  continueOnFail?: boolean;
  alwaysOutputData?: boolean;
  executeOnce?: boolean;
  retryOnFail?: boolean;
  maxTries?: number;
  waitBetweenTries?: number;
}

export interface N8nCredentialReference {
  id: string;
  name: string;
}

export interface N8nConnections {
  [sourceNodeName: string]: {
    [outputType: string]: Array<{
      node: string;
      type: string;
      index: number;
    }>;
  };
}

export interface N8nWorkflowSettings {
  executionOrder?: 'v0' | 'v1';
  saveManualExecutions?: boolean;
  callerPolicy?: string;
  errorWorkflow?: string;
  timezone?: string;
  saveExecutionProgress?: boolean;
  saveDataErrorExecution?: 'all' | 'none';
  saveDataSuccessExecution?: 'all' | 'none';
  executionTimeout?: number;
}