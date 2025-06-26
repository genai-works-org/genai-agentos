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
  agent_id: string;
  agent_name: string;
  agent_description: string;
  created_at: string;
  updated_at: string;
  agent_schema: AgentSchema;
  is_active?: boolean;
  agent_jwt?: string;
}

export interface AgentCreate {
  id?: string;
  name: string;
  description: string;
  input_parameters: string | Record<string, any>;
  output_parameters?: string | Record<string, any>;
}

export interface AgentCreateResponse {
  name: string;
  description: string;
  id: string;
  created_at: string;
  updated_at: string;
  alias: string;
  jwt: string;
}

export interface AgentFlowDTO {
  id: string;
  name: string;
  description: string;
  flow: {
    id: string;
    type: string;
  }[];
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface AgentFlowBody {
  name: string;
  description: string;
  flow: {
    id: string;
    type: string;
  }[];
}

export interface AgentTrace {
  name: string;
  type?: string;
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
  is_active?: boolean;
}

export interface ActiveAgentsResponse {
  count_active_connections: number;
  active_connections: ActiveConnection[];
}

export interface IAgent {
  id: string;
  name: string | null;
  description: string | null;
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
  id: string;
  name: string;
  description: string;
  mcp_server_id: string;
  inputSchema: {
    title: string;
    type: string;
    properties: Record<
      string,
      {
        type: string;
        title: string;
        default?: string;
      }
    >;
    required: string[];
  };
}

export interface A2AAgent extends IAgent {
  card_content: CardContent;
}

export interface MCPAgent extends IAgent {
  mcp_tools: McpTool[];
}
