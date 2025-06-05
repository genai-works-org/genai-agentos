export interface AgentSchema {
  type: string;
  function: {
    name: string;
    description: string | null;
    parameters: {
      type: string;
      properties: Record<
        string,
        {
          type: string;
          description: string;
        }
      >;
      required: string[];
    };
  };
}

export interface AgentDTO {
  id: string;
  name: string;
  type: string;
  created_at: string;
  updated_at: string;
  url?: string | null;
  agent_schema: AgentSchema;
  is_active?: boolean;
}

export interface AgentCreate {
  id: string;
  name: string;
  description: string;
  input_parameters: string | Record<string, any>;
  output_parameters?: string | Record<string, any>;
}

export interface Flow {
  agent_id: string;
}

export interface AgentFlowDTO {
  id: string;
  name: string;
  description: string;
  flow: Flow[];
  created_at: string;
  updated_at: string;
}

export interface AgentFlowCreate {
  name: string;
  description: string;
  flow: Flow[];
}

export interface AgentFlowUpdate {
  name: string;
  description: string;
  flow: Flow[];
}

export interface AgentTrace {
  name: string;
  input: {
    content: string;
    [key: string]: any;
  };
  output: {
    content: string;
    additional_kwargs?: {
      tool_calls?: Array<{
        id: string;
        function: {
          arguments: string;
          name: string;
        };
        type: string;
      }>;
    };
    [key: string]: any;
  };
  is_success: boolean;
  id?: string;
  execution_time?: number;
  flow?: Array<{
    id?: string;
    name: string;
    input: any;
    output: any;
    execution_time?: number;
    is_success: boolean;
  }>;
}

export enum AgentType {
  A2A = 'a2a',
  MCP = 'mcp',
  GEN_AI = 'genai',
  ALL = 'all',
  FLOW = 'flow',
}

export interface ActiveConnection {
  id: string;
  name: string;
  type: string;
  url: string;
  agent_schema: {
    title: string;
    description: string;
    type: string;
    properties: Record<
      string,
      {
        type: string;
        title?: string;
        description?: string;
      }
    >;
    required: string[];
  };
  created_at: string;
  updated_at: string;
}

export interface ActiveAgentsResponse {
  count_active_connections: number;
  active_connections: ActiveConnection[];
}

export interface IAgent {
  id: string;
  name: string;
  description: string;
  server_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  creator_id: string;
}

export interface AgentSkill {
  id: string;
  name: string;
  description: string;
  tags: string[];
  examples: string[];
}

export interface CardContent {
  capabilities: Record<string, boolean | null>;
  defaultInputModes: string[];
  defaultOutputModes: string[];
  skills: AgentSkill[];
  version: string;
}

export interface McpTool {
  title: string;
  description: string;
}

export interface A2AAgent extends IAgent {
  card_content: CardContent;
}

export interface MCPAgent extends IAgent {
  mcp_tools: McpTool[];
}
