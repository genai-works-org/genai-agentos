export interface FlowChainNode {
  id: string;
  name: string;
  color: string;
  agent_id: string;
  type: string;
  nextId: string | null;
}
