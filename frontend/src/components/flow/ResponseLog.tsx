import type { FC } from 'react';
import { AgentTrace } from '@/types/agent';
import { Log } from '@/types/log';
import { LogCard } from './LogCard';

interface ResponseLogProps {
  logs: Log[];
  traceData: AgentTrace[] | null;
  error: Error | null;
}

export const ResponseLog: FC<ResponseLogProps> = ({
  logs,
  traceData,
  error,
}) => {
  return (
    <>
      <h3 className="font-bold mb-6">Full Response Log</h3>

      {error ? (
        <p className="text-error-main">{error.message}</p>
      ) : logs.length === 0 ? (
        <p className="text-center">No logs available for this trace</p>
      ) : (
        <div className="flex flex-col gap-6">
          {logs.map(log => {
            const agentName =
              traceData?.find(trace => trace.id === log.agent_id)?.name ||
              'Unknown Agent';
            return (
              <LogCard key={log.created_at} log={log} agentName={agentName} />
            );
          })}
        </div>
      )}
    </>
  );
};
