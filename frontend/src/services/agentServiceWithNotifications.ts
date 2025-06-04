import { agentService } from './agentService';
import {
  AgentDTO,
  AgentCreate,
  AgentFlowDTO,
  AgentFlowCreate,
  AgentFlowUpdate,
} from '../types/agent';
import { useNotification } from '../contexts/NotificationContext';

export const createAgentServiceWithNotifications = () => {
  const { addNotification } = useNotification();

  const handleError = (error: unknown, action: string) => {
    addNotification(
      `Failed to ${action}`,
      'error',
      error instanceof Error ? error.message : 'Unknown error occurred',
    );
  };

  const handleSuccess = (action: string) => {
    addNotification(`${action} successful`, 'success');
  };

  return {
    async getAgents(): Promise<AgentDTO[]> {
      try {
        const data = await agentService.getAgents();
        return data;
      } catch (error) {
        handleError(error, 'fetch agents');
        throw error;
      }
    },

    async getAgent(id: string): Promise<AgentDTO> {
      try {
        const data = await agentService.getAgent(id);
        return data;
      } catch (error) {
        handleError(error, 'fetch agent');
        throw error;
      }
    },

    async createAgent(agent: AgentCreate): Promise<AgentDTO> {
      try {
        const data = await agentService.createAgent(agent);
        handleSuccess('create agent');
        return data;
      } catch (error) {
        handleError(error, 'create agent');
        throw error;
      }
    },

    // async updateAgent(id: string, agent: any): Promise<void> {
    //   try {
    //     await agentService.updateAgent(id, agent);
    //     handleSuccess('update agent');
    //   } catch (error) {
    //     handleError(error, 'update agent');
    //     throw error;
    //   }
    // },

    async deleteAgent(id: string): Promise<void> {
      try {
        await agentService.deleteAgent(id);
        handleSuccess('delete agent');
      } catch (error) {
        handleError(error, 'delete agent');
        throw error;
      }
    },

    async getAgentFlows(): Promise<AgentFlowDTO[]> {
      try {
        const data = await agentService.getAgentFlows();
        return data;
      } catch (error) {
        handleError(error, 'fetch agent flows');
        throw error;
      }
    },

    async getAgentFlow(id: string): Promise<AgentFlowDTO> {
      try {
        const data = await agentService.getAgentFlow(id);
        return data;
      } catch (error) {
        handleError(error, 'fetch agent flow');
        throw error;
      }
    },

    async createAgentFlow(flow: AgentFlowCreate): Promise<AgentFlowDTO> {
      try {
        const data = await agentService.createAgentFlow(flow);
        handleSuccess('create agent flow');
        return data;
      } catch (error) {
        handleError(error, 'create agent flow');
        throw error;
      }
    },

    async updateAgentFlow(id: string, flow: AgentFlowUpdate): Promise<void> {
      try {
        await agentService.updateAgentFlow(id, flow);
        handleSuccess('update agent flow');
      } catch (error) {
        handleError(error, 'update agent flow');
        throw error;
      }
    },

    async deleteAgentFlow(id: string): Promise<void> {
      try {
        await agentService.deleteAgentFlow(id);
        handleSuccess('delete agent flow');
      } catch (error) {
        handleError(error, 'delete agent flow');
        throw error;
      }
    },
  };
};
