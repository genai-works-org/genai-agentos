import {
  AgentDTO,
  AgentCreate,
  AgentFlowDTO,
  AgentFlowCreate,
  AgentFlowUpdate,
  ActiveAgentsResponse,
  A2AAgent,
  MCPAgent,
} from '../types/agent';
import { apiService } from './apiService';

export const agentService = {
  async getAgents(): Promise<AgentDTO[]> {
    const response = await apiService.get<AgentDTO[]>('/api/agents');
    return response.data;
  },

  async getActiveAgents(query: Record<string, string>) {
    const response = await apiService.get<ActiveAgentsResponse>(
      '/api/agents/active',
      {
        params: query,
      },
    );
    return response.data;
  },

  async getAgent(id: string): Promise<AgentDTO> {
    const response = await apiService.get<AgentDTO>(`/api/agents/${id}`);
    return response.data;
  },

  async createAgent(agent: AgentCreate): Promise<AgentDTO> {
    const response = await apiService.post<AgentDTO>(
      '/api/agents/register',
      agent,
    );
    return response.data;
  },

  async deleteAgent(id: string): Promise<void> {
    await apiService.delete<void>(`/api/agents/${id}`);
  },

  async getAgentFlows(): Promise<AgentFlowDTO[]> {
    const response = await apiService.get<AgentFlowDTO[]>('/api/agentflows/');
    return response.data;
  },

  async getAgentFlow(id: string): Promise<AgentFlowDTO> {
    const response = await apiService.get<AgentFlowDTO>(
      `/api/agentflows/${id}`,
    );
    return response.data;
  },

  async createAgentFlow(flow: AgentFlowCreate): Promise<AgentFlowDTO> {
    const response = await apiService.post<AgentFlowDTO>(
      '/api/agentflows/register-flow',
      flow,
    );
    return response.data;
  },

  async updateAgentFlow(id: string, flow: AgentFlowUpdate): Promise<void> {
    await apiService.patch<void>(`/api/agentflows/${id}`, flow);
  },

  async deleteAgentFlow(id: string): Promise<void> {
    await apiService.delete<void>(`/api/agentflows/${id}`);
  },

  // A2A
  async getAllA2aAgents() {
    const response = await apiService.get<A2AAgent[]>('/api/a2a/agents');
    return response.data;
  },

  async getA2aAgent(id: string) {
    const response = await apiService.get<A2AAgent>(`/api/a2a/agents/${id}`);
    return response.data;
  },

  async addA2AAgent(url: string) {
    const response = await apiService.post<A2AAgent>('/api/a2a/agents', {
      server_url: url,
    });
    return response.data;
  },

  async deleteA2AAgent(id: string) {
    await apiService.delete(`/api/a2a/agents/${id}`);
  },

  // MCP
  async getAllMcpServers() {
    const response = await apiService.get<MCPAgent[]>('/api/mcp/servers');
    return response.data;
  },

  async getMcpServer(id: string) {
    const response = await apiService.get<MCPAgent>(`/api/mcp/servers/${id}`);
    return response.data;
  },

  async addMcpServer(url: string) {
    const response = await apiService.post<MCPAgent>('/api/mcp/servers', {
      server_url: url,
    });
    return response.data;
  },

  async deleteMcpServer(id: string) {
    await apiService.delete(`/api/mcp/servers/${id}`);
  },
};
