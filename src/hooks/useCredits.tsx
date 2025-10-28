/**
 * useCredits Hook
 *
 * React hook for managing credit balance with auto-refresh
 */

import { useState, useEffect, useCallback } from 'react';
import { getCreditBalance, type CreditBalance } from '@/services/creditService';

// Create a simple event emitter for credit updates
class CreditEventEmitter {
  private listeners: Array<() => void> = [];

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  emit() {
    this.listeners.forEach(listener => listener());
  }
}

export const creditEvents = new CreditEventEmitter();

export function useCredits() {
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBalance = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCreditBalance();
      setBalance(data);
    } catch (err) {
      console.error('Failed to load credit balance:', err);
      setError(err instanceof Error ? err.message : 'Failed to load credits');
      setBalance(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load balance on mount
  useEffect(() => {
    loadBalance();
  }, [loadBalance]);

  // Subscribe to credit change events
  useEffect(() => {
    const unsubscribe = creditEvents.subscribe(() => {
      loadBalance();
    });

    return unsubscribe;
  }, [loadBalance]);

  return {
    balance,
    loading,
    error,
    refresh: loadBalance
  };
}
