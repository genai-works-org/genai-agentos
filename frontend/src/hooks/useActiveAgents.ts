import { useState, useEffect, useCallback } from 'react';
import { AgentType, ActiveConnection } from '../types/agent';
import { agentService } from '../services/agentService';

interface UseActiveAgentsOptions {
  type: AgentType;
  initialLimit?: number;
  onError?: (error: Error) => void;
}

export const useActiveAgents = ({
  type,
  initialLimit = 100,
  onError,
}: UseActiveAgentsOptions) => {
  const [agents, setAgents] = useState<ActiveConnection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const fetchAgents = useCallback(
    async (currentOffset: number, limit: number) => {
      try {
        setLoading(true);
        const response = await agentService.getActiveAgents({
          offset: currentOffset.toString(),
          limit: limit.toString(),
          agent_type: type,
        });

        const activeConnections = response.active_connections;
        setAgents(prev =>
          currentOffset === 0
            ? activeConnections
            : [...prev, ...activeConnections],
        );
        setHasMore(activeConnections.length === limit);
        setError(null);
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error('Failed to fetch agents');
        setError(error);
        onError?.(error);
      } finally {
        setLoading(false);
      }
    },
    [onError],
  );

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      const newOffset = offset + initialLimit;
      setOffset(newOffset);
      fetchAgents(newOffset, initialLimit);
    }
  }, [loading, hasMore, offset, initialLimit, fetchAgents]);

  const refresh = useCallback(() => {
    setOffset(0);
    fetchAgents(0, initialLimit);
  }, [fetchAgents, initialLimit]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    agents,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
  };
};
