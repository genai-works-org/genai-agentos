import type { FC } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Copy, Network } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import { JSONTree } from 'react-json-tree';

import { ChatMessage as IChatMessage } from '@/contexts/ChatHistoryContext';
import { extractFileName } from '@/utils/extractFileName';
import { jsonTreeTheme } from '@/constants/jsonTreeTheme';
import { Button } from '@/components/ui/button';
import FilePreviewCard from './FilePreviewCard';

type ChatMessageProps = IChatMessage;

const sanitize = (content: string) => {
  return content
    .replace(/```\w*\n/g, '')
    .replace(/```/g, '')
    .replace(/markdown/g, '');
};

const ChatMessage: FC<ChatMessageProps> = ({
  content,
  isUser,
  timestamp,
  requestId,
  agents_trace,
  files,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleViewFlow = () => {
    navigate(`/agents-trace?requestId=${requestId}`, {
      state: { traceData: agents_trace, location },
    });
  };

  const handleCopy = () => {
    if (content) {
      navigator.clipboard.writeText(content);
    }
  };

  const renderContent = () => {
    if (!content && content !== '') return <span>Something went wrong!</span>;

    try {
      // Try to parse as JSON
      const jsonContent = JSON.parse(content);
      return (
        <div className="overflow-x-auto">
          <JSONTree
            data={jsonContent}
            theme={jsonTreeTheme}
            invertTheme={false}
          />
        </div>
      );
    } catch {
      // If not JSON, render as Markdown
      return (
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <Markdown
            remarkPlugins={[remarkMath, remarkGfm]}
            rehypePlugins={[rehypeKatex, rehypeRaw]}
          >
            {sanitize(content)}
          </Markdown>
        </div>
      );
    }
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div>
        <div
          className={`${
            isUser
              ? 'px-6 py-2 bg-primary-white rounded-3xl rounded-br-none'
              : ''
          }`}
        >
          {renderContent()}
          {files && files.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {files
                .filter(file => (isUser ? !file.from_agent : file.from_agent))
                .map(
                  (file: {
                    id: string;
                    session_id: string;
                    request_id: string;
                    original_name: string;
                    mimetype: string;
                    internal_id: string;
                    internal_name: string;
                    from_agent: boolean;
                  }) => (
                    <FilePreviewCard
                      key={file.id}
                      fileData={{
                        id: file.id,
                        clientId: file.id,
                        name: extractFileName(
                          file.original_name || file.internal_name,
                        ),
                        type: file.mimetype,
                        size: 0, // Will be updated when file is loaded
                        loading: false,
                        fromAgent: file.from_agent,
                      }}
                    />
                  ),
                )}
            </div>
          )}
        </div>
        {!isUser && (
          <div className="flex items-center mt-2">
            <span className="text-xs text-text-secondary mr-4">
              {new Date(timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                hourCycle: 'h23',
              })}
            </span>
            <Button
              variant="link"
              size="icon"
              onClick={handleCopy}
              disabled={!content}
              className="mr-1"
            >
              <Copy size={16} className="text-text-secondary" />
            </Button>
            <Button variant="link" size="icon" onClick={handleViewFlow}>
              <Network
                size={16}
                className="rotate-[270deg] text-text-secondary"
              />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
