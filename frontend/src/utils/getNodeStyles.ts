import { AgentType } from '@/types/agent';

export const getNodeStyles = (type: string, isActive?: boolean) => {
  switch (type) {
    case AgentType.A2A:
      return {
        borderColor: isActive ? '#007AFF' : '#B8C2C2',
        background: 'linear-gradient(179.98deg, #D6EAFF 0.02%, #FFFFFF 99.98%)',
        boxShadow: '0px 0px 0px 2px #007AFF1A',
      };
    case AgentType.MCP:
      return {
        borderColor: isActive ? '#E07F0B' : '#B8C2C2',
        background: 'linear-gradient(179.98deg, #FFECD6 0.02%, #FFFFFF 99.98%)',
        boxShadow: '0px 0px 0px 2px #FFECD6',
      };
    case AgentType.GEN_AI:
      return {
        borderColor: isActive ? '#00B7BA' : '#B8C2C2',
        background: 'linear-gradient(179.98deg, #D6FFFF 0.02%, #FFFFFF 99.98%)',
        boxShadow: '0px 0px 0px 2px #D6FFFF',
      };
    default:
      return {
        borderColor: isActive ? '#008765' : '#B8C2C2',
        background: 'linear-gradient(179.98deg, #D6FFF5 0.02%, #FFFFFF 99.98%)',
        boxShadow: '0px 0px 0px 2px #D6FFF5',
      };
  }
};

export const getBatchVariant = (nodeType: string) => {
  switch (nodeType) {
    case AgentType.GEN_AI:
      return 'cyan';
    case AgentType.A2A:
      return 'blue';
    case AgentType.MCP:
      return 'brown';
    default:
      return 'green';
  }
};
