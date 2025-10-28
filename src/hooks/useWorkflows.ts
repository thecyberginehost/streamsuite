import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Workflow {
  id: string;
  name: string;
  description?: string;
  steps: any;
  status: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  tenant_id: string;
}

export const useWorkflows = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      const { data, error } = await supabase
        .from('workflows')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setWorkflows(data || []);
    } catch (error) {
      console.error('Error loading workflows:', error);
      toast({
        title: "Error",
        description: "Failed to load workflows",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveWorkflow = async (workflowData: {
    name: string;
    description?: string;
    steps: any;
    status?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('workflows')
        .insert({
          ...workflowData,
          tenant_id: crypto.randomUUID(), // Temporary - should use actual tenant ID
          status: workflowData.status || 'draft'
        })
        .select()
        .single();

      if (error) throw error;

      setWorkflows(prev => [data, ...prev]);
      toast({
        title: "Success",
        description: "Workflow saved successfully",
      });

      return data;
    } catch (error) {
      console.error('Error saving workflow:', error);
      toast({
        title: "Error",
        description: "Failed to save workflow",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateWorkflow = async (id: string, updates: Partial<Workflow>) => {
    try {
      const { data, error } = await supabase
        .from('workflows')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setWorkflows(prev => prev.map(w => w.id === id ? data : w));
      toast({
        title: "Success",
        description: "Workflow updated successfully",
      });

      return data;
    } catch (error) {
      console.error('Error updating workflow:', error);
      toast({
        title: "Error",
        description: "Failed to update workflow",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteWorkflow = async (id: string) => {
    try {
      const { error } = await supabase
        .from('workflows')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setWorkflows(prev => prev.filter(w => w.id !== id));
      toast({
        title: "Success",
        description: "Workflow deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting workflow:', error);
      toast({
        title: "Error",
        description: "Failed to delete workflow",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    workflows,
    loading,
    saveWorkflow,
    updateWorkflow,
    deleteWorkflow,
    refreshWorkflows: loadWorkflows
  };
};