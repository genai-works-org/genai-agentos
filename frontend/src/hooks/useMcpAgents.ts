import { useState, useEffect, useCallback } from 'react';
import { agentService } from '../services/agentService';
import { useToast } from './useToast';

export const useMcpAgents = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const getServers = useCallback(async () => {
    setIsLoading(true);
    try {
      const servers = await agentService.getAllMcpServers();
      return servers;
    } catch (error) {
      toast.showError('Failed to fetch servers');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getServer = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const server = await agentService.getMcpServer(id);
      return server;
    } catch (err) {
      setError('Failed to load server details');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createServer = useCallback(async (url: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const newServer = await agentService.addMcpServer(url);
      return newServer;
    } catch (err) {
      setError('Failed to create server');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteServer = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await agentService.deleteMcpServer(id);
    } catch (err) {
      setError('Failed to delete server');
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
    getServers,
    getServer,
    createServer,
    deleteServer,
  };
};
