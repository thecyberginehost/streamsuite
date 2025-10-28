/**
 * useBatchCredits Hook
 *
 * Manages batch credits for batch workflow generation feature.
 * Batch credits are separate from regular credits and renew monthly
 * based on subscription tier.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface BatchCreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  balance_after: number;
  operation_type: 'generation' | 'subscription_grant' | 'admin_adjustment' | 'rollover';
  workflow_count?: number;
  metadata?: any;
  created_at: string;
}

export function useBatchCredits() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get current batch credit balance
  const { data: balance = 0, isLoading } = useQuery({
    queryKey: ['batch-credits', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.log('🔍 [useBatchCredits] No user ID, returning 0');
        return 0;
      }

      console.log('🔍 [useBatchCredits] Fetching batch credits for user:', user.id);

      const { data, error } = await supabase
        .rpc('get_user_batch_credits', { p_user_id: user.id });

      if (error) {
        console.error('❌ [useBatchCredits] Error fetching batch credits:', error);
        return 0;
      }

      console.log('✅ [useBatchCredits] Batch credits fetched:', data);
      return data || 0;
    },
    enabled: !!user?.id,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Get batch credit transaction history
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ['batch-credit-transactions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('batch_credit_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching batch credit transactions:', error);
        return [];
      }

      return data as BatchCreditTransaction[];
    },
    enabled: !!user?.id,
  });

  // Deduct batch credits
  const deductBatchCredits = useMutation({
    mutationFn: async ({
      amount,
      workflowCount,
      metadata,
    }: {
      amount: number;
      workflowCount?: number;
      metadata?: any;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc('deduct_batch_credits', {
        p_user_id: user.id,
        p_amount: amount,
        p_workflow_count: workflowCount || null,
        p_metadata: metadata || null,
      });

      if (error) throw error;

      return data;
    },
    onSuccess: () => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['batch-credits', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['batch-credit-transactions', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });

  // Add batch credits (admin or subscription grant)
  const addBatchCredits = useMutation({
    mutationFn: async ({
      amount,
      operationType = 'subscription_grant',
      metadata,
    }: {
      amount: number;
      operationType?: 'subscription_grant' | 'admin_adjustment' | 'rollover';
      metadata?: any;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc('add_batch_credits', {
        p_user_id: user.id,
        p_amount: amount,
        p_operation_type: operationType,
        p_metadata: metadata || null,
      });

      if (error) throw error;

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batch-credits', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['batch-credit-transactions', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });

  return {
    balance,
    isLoading,
    transactions,
    transactionsLoading,
    deductBatchCredits: deductBatchCredits.mutate,
    deductBatchCreditsAsync: deductBatchCredits.mutateAsync,
    addBatchCredits: addBatchCredits.mutate,
    addBatchCreditsAsync: addBatchCredits.mutateAsync,
    isDeducting: deductBatchCredits.isPending,
    isAdding: addBatchCredits.isPending,
  };
}
