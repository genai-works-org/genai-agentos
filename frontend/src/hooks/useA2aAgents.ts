import { useState, useEffect, useCallback } from 'react';
import { agentService } from '../services/agentService';
import { useToast } from './useToast';

export const useA2aAgents = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const getAgents = useCallback(async () => {
    setIsLoading(true);
    try {
      const agents = await agentService.getAllA2aAgents();
      return agents;
    } catch (error) {
      toast.showError('Failed to fetch agents');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getAgent = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const agent = await agentService.getA2aAgent(id);
      return agent;
    } catch (err) {
      setError('Failed to load agent details');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createAgent = useCallback(async (url: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const newAgent = await agentService.addA2AAgent(url);
      return newAgent;
    } catch (err) {
      setError('Failed to create agent');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteAgent = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await agentService.deleteA2AAgent(id);
    } catch (err) {
      setError('Failed to delete agent');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Cleanup function to cancel any pending requests
  useEffect(() => {
    return () => {
      setIsLoading(false);
    };
  }, []);

  return {
    isLoading,
    error,
    getAgents,
    getAgent,
    createAgent,
    deleteAgent,
  };
};
