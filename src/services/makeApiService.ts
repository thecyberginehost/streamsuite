/**
 * Make.com API Service
 *
 * Provides integration with Make.com (formerly Integromat) for scenario management,
 * execution monitoring, and usage tracking.
 *
 * Documentation: https://www.make.com/en/api-documentation
 */

import { supabase } from '@/integrations/supabase/client';

export interface MakeScenario {
  id: number;
  name: string;
  description?: string;
  teamId: number;
  organizationId: number;
  concept: boolean;
  scheduling?: {
    type: 'interval' | 'day' | 'month' | 'indefinitely';
    interval?: number;
  };
  blueprint?: any;
  createdAt: string;
  updatedAt: string;
  version: number;
  lastEdit?: string;
  isLinked: boolean;
  iswait: boolean;
}

export interface MakeUsage {
  scenarioId: number;
  startDate: string;
  endDate: string;
  operations: number;
  dataTransfer: number; // in MB
  centicredits: number;
}

export interface MakeConnectionConfig {
  apiKey: string;
  teamId?: string;
  region?: 'us1' | 'eu1' | 'eu2';
}

export interface MakeAPIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Get base URL for Make.com API based on region
 */
function getMakeBaseUrl(region: 'us1' | 'eu1' | 'eu2' = 'us1'): string {
  const regionUrls = {
    us1: 'https://us1.make.com/api/v2',
    eu1: 'https://eu1.make.com/api/v2',
    eu2: 'https://eu2.make.com/api/v2',
  };
  return regionUrls[region];
}

/**
 * Test connection to Make.com
 */
export async function testMakeConnection(
  config: MakeConnectionConfig
): Promise<MakeAPIResponse<{ connected: boolean }>> {
  try {
    const baseUrl = getMakeBaseUrl(config.region);
    const response = await fetch(`${baseUrl}/scenarios?pg[limit]=1`, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: `Connection failed: ${response.status} - ${error}`,
      };
    }

    return {
      success: true,
      data: { connected: true },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * List all scenarios
 */
export async function listMakeScenarios(
  config: MakeConnectionConfig,
  limit: number = 50
): Promise<MakeAPIResponse<MakeScenario[]>> {
  try {
    const baseUrl = getMakeBaseUrl(config.region);
    const params = new URLSearchParams({
      'pg[limit]': limit.toString(),
      ...(config.teamId && { teamId: config.teamId }),
    });

    const response = await fetch(`${baseUrl}/scenarios?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: `Failed to list scenarios: ${response.status} - ${error}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.scenarios || [],
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get single scenario details
 */
export async function getMakeScenario(
  config: MakeConnectionConfig,
  scenarioId: number
): Promise<MakeAPIResponse<MakeScenario>> {
  try {
    const baseUrl = getMakeBaseUrl(config.region);
    const response = await fetch(`${baseUrl}/scenarios/${scenarioId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: `Failed to get scenario: ${response.status} - ${error}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.scenario,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create new scenario
 */
export async function createMakeScenario(
  config: MakeConnectionConfig,
  scenario: {
    name: string;
    description?: string;
    teamId: number;
    blueprint?: any;
    scheduling?: any;
  }
): Promise<MakeAPIResponse<MakeScenario>> {
  try {
    const baseUrl = getMakeBaseUrl(config.region);
    const response = await fetch(`${baseUrl}/scenarios`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scenario),
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: `Failed to create scenario: ${response.status} - ${error}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.scenario,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update existing scenario
 */
export async function updateMakeScenario(
  config: MakeConnectionConfig,
  scenarioId: number,
  updates: {
    name?: string;
    description?: string;
    blueprint?: any;
    scheduling?: any;
  }
): Promise<MakeAPIResponse<MakeScenario>> {
  try {
    const baseUrl = getMakeBaseUrl(config.region);
    const response = await fetch(`${baseUrl}/scenarios/${scenarioId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Token ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: `Failed to update scenario: ${response.status} - ${error}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.scenario,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Delete scenario
 */
export async function deleteMakeScenario(
  config: MakeConnectionConfig,
  scenarioId: number
): Promise<MakeAPIResponse<void>> {
  try {
    const baseUrl = getMakeBaseUrl(config.region);
    const response = await fetch(`${baseUrl}/scenarios/${scenarioId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Token ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: `Failed to delete scenario: ${response.status} - ${error}`,
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Activate scenario (start)
 */
export async function activateMakeScenario(
  config: MakeConnectionConfig,
  scenarioId: number
): Promise<MakeAPIResponse<{ activated: boolean }>> {
  try {
    const baseUrl = getMakeBaseUrl(config.region);
    const response = await fetch(`${baseUrl}/scenarios/${scenarioId}/start`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: `Failed to activate scenario: ${response.status} - ${error}`,
      };
    }

    return {
      success: true,
      data: { activated: true },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Deactivate scenario (stop)
 */
export async function deactivateMakeScenario(
  config: MakeConnectionConfig,
  scenarioId: number
): Promise<MakeAPIResponse<{ deactivated: boolean }>> {
  try {
    const baseUrl = getMakeBaseUrl(config.region);
    const response = await fetch(`${baseUrl}/scenarios/${scenarioId}/stop`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: `Failed to deactivate scenario: ${response.status} - ${error}`,
      };
    }

    return {
      success: true,
      data: { deactivated: true },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Run scenario immediately (responsive mode - waits up to 40 seconds for result)
 */
export async function runMakeScenario(
  config: MakeConnectionConfig,
  scenarioId: number,
  waitForResult: boolean = false
): Promise<MakeAPIResponse<{ executionId?: string; result?: any }>> {
  try {
    const baseUrl = getMakeBaseUrl(config.region);
    const params = waitForResult ? '?responsive=true' : '';

    const response = await fetch(`${baseUrl}/scenarios/${scenarioId}/run${params}`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: `Failed to run scenario: ${response.status} - ${error}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: {
        executionId: data.executionId,
        result: waitForResult ? data : undefined,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Clone scenario
 */
export async function cloneMakeScenario(
  config: MakeConnectionConfig,
  scenarioId: number,
  targetTeamId?: number
): Promise<MakeAPIResponse<MakeScenario>> {
  try {
    const baseUrl = getMakeBaseUrl(config.region);
    const body = targetTeamId ? { teamId: targetTeamId } : {};

    const response = await fetch(`${baseUrl}/scenarios/${scenarioId}/clone`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: `Failed to clone scenario: ${response.status} - ${error}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.scenario,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get scenario blueprint (workflow definition)
 */
export async function getMakeScenarioBlueprint(
  config: MakeConnectionConfig,
  scenarioId: number
): Promise<MakeAPIResponse<any>> {
  try {
    const baseUrl = getMakeBaseUrl(config.region);
    const response = await fetch(`${baseUrl}/scenarios/${scenarioId}/blueprint`, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: `Failed to get blueprint: ${response.status} - ${error}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.blueprint,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get scenario usage statistics (last 30 days)
 */
export async function getMakeScenarioUsage(
  config: MakeConnectionConfig,
  scenarioId: number
): Promise<MakeAPIResponse<MakeUsage>> {
  try {
    const baseUrl = getMakeBaseUrl(config.region);
    const response = await fetch(`${baseUrl}/scenarios/${scenarioId}/usage`, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: `Failed to get usage: ${response.status} - ${error}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.usage,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get team usage statistics (last 30 days)
 */
export async function getMakeTeamUsage(
  config: MakeConnectionConfig,
  teamId: string
): Promise<MakeAPIResponse<MakeUsage>> {
  try {
    const baseUrl = getMakeBaseUrl(config.region);
    const response = await fetch(`${baseUrl}/teams/${teamId}/usage`, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: `Failed to get team usage: ${response.status} - ${error}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.usage,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get scenario statistics (aggregated from usage data)
 */
export async function getMakeScenarioStats(
  config: MakeConnectionConfig,
  scenarioId: number
): Promise<MakeAPIResponse<{
  operations: number;
  dataTransferMB: number;
  centicredits: number;
  period: string;
}>> {
  try {
    const usageResult = await getMakeScenarioUsage(config, scenarioId);

    if (!usageResult.success || !usageResult.data) {
      return {
        success: false,
        error: usageResult.error || 'Failed to get usage data',
      };
    }

    const usage = usageResult.data;

    return {
      success: true,
      data: {
        operations: usage.operations,
        dataTransferMB: usage.dataTransfer,
        centicredits: usage.centicredits,
        period: `${usage.startDate} to ${usage.endDate}`,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get all scenarios with their usage stats
 */
export async function getMakeScenariosWithStats(
  config: MakeConnectionConfig
): Promise<MakeAPIResponse<Array<MakeScenario & { usage?: MakeUsage }>>> {
  try {
    const scenariosResult = await listMakeScenarios(config);

    if (!scenariosResult.success || !scenariosResult.data) {
      return {
        success: false,
        error: scenariosResult.error || 'Failed to list scenarios',
      };
    }

    const scenarios = scenariosResult.data;
    const scenariosWithStats = await Promise.all(
      scenarios.map(async (scenario) => {
        const usageResult = await getMakeScenarioUsage(config, scenario.id);
        return {
          ...scenario,
          usage: usageResult.success ? usageResult.data : undefined,
        };
      })
    );

    return {
      success: true,
      data: scenariosWithStats,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * ============================================================================
 * PROXY-BASED API FUNCTIONS (CORS-safe)
 * ============================================================================
 * These functions call the Supabase Edge Function proxy instead of making
 * direct API calls to Make.com, which avoids CORS issues.
 */

/**
 * Call Make.com proxy edge function
 */
async function callMakeProxy(action: string, connectionId: string, data?: any): Promise<any> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  // Get Supabase URL from environment
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('Supabase URL not configured');
  }

  // Call edge function using fetch with explicit auth header
  const url = `${supabaseUrl}/functions/v1/make-proxy`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      action,
      connectionId,
      data,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Unknown error');
  }

  return result.data;
}

/**
 * List scenarios via proxy (CORS-safe)
 */
export async function listMakeScenariosViaProxy(
  connectionId: string
): Promise<MakeAPIResponse<MakeScenario[]>> {
  try {
    const data = await callMakeProxy('listScenarios', connectionId);
    return {
      success: true,
      data: data.scenarios || data || [],
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Toggle scenario scheduling via proxy (CORS-safe)
 * @param scheduling - Scheduling object like { type: "indefinitely" } or { type: "immediately" }
 */
export async function toggleMakeScenarioViaProxy(
  connectionId: string,
  scenarioId: number,
  scheduling: { type: string; days?: number[]; time?: string }
): Promise<MakeAPIResponse<MakeScenario>> {
  try {
    const data = await callMakeProxy('toggleScheduling', connectionId, {
      scenarioId,
      scheduling
    });
    return {
      success: true,
      data: data.scenario || data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Test connection via proxy (CORS-safe)
 */
export async function testMakeConnectionViaProxy(
  connectionId: string
): Promise<MakeAPIResponse<{ connected: boolean }>> {
  try {
    await callMakeProxy('test', connectionId);
    return {
      success: true,
      data: { connected: true },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Run scenario via proxy (CORS-safe)
 */
export async function runMakeScenarioViaProxy(
  connectionId: string,
  scenarioId: number
): Promise<MakeAPIResponse<{ executionId?: string }>> {
  try {
    const data = await callMakeProxy('runScenario', connectionId, { scenarioId });
    return {
      success: true,
      data: { executionId: data.executionId },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
