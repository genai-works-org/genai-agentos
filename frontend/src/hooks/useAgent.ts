import { useState, useEffect } from 'react';
import { agentService } from '../services/agentService';
import { AgentDTO, AgentCreate, AgentFlowBody } from '../types/agent';
import { useToast } from './useToast';

export const useAgent = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const getAgents = async (): Promise<AgentDTO[]> => {
    setIsLoading(true);
    try {
      const agents = await agentService.getAgents();
      return agents;
    } catch (error) {
      toast.showError('Failed to fetch agents');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getAgent = async (id: string): Promise<AgentDTO> => {
    setIsLoading(true);
    setError(null);
    try {
      const agent = await agentService.getAgent(id);
      return agent;
    } catch (err) {
      setError('Failed to load agent details');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const createAgent = async (agent: AgentCreate) => {
    setIsLoading(true);
    setError(null);
    try {
      const newAgent = await agentService.createAgent(agent);
      return newAgent;
    } catch (err) {
      setError('Failed to create agent');
      throw err;
    } finally {
      setIsLoading(false);
      await getAgents();
    }
  };

  const deleteAgent = async (id: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await agentService.deleteAgent(id);
    } catch (err) {
      setError('Failed to delete agent');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getAgentFlows = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const flows = await agentService.getAgentFlows();
      return flows;
    } catch (err) {
      setError('Failed to load agent flows');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getAgentFlow = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const flow = await agentService.getAgentFlow(id);
      return flow;
    } catch (err) {
      setError('Failed to load agent flow');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const createAgentFlow = async (flow: AgentFlowBody) => {
    setIsLoading(true);
    setError(null);
    try {
      const newFlow = await agentService.createAgentFlow(flow);
      return newFlow;
    } catch (err) {
      setError('Failed to create agent flow');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateAgentFlow = async (id: string, flow: AgentFlowBody) => {
    setIsLoading(true);
    setError(null);
    try {
      await agentService.updateAgentFlow(id, flow);
    } catch (err) {
      setError('Failed to update agent flow');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAgentFlow = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await agentService.deleteAgentFlow(id);
    } catch (err) {
      setError('Failed to delete agent flow');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

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
    getAgentFlows,
    getAgentFlow,
    createAgentFlow,
    updateAgentFlow,
    deleteAgentFlow,
  };
};
