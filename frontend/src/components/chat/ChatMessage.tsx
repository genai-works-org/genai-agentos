import type { FC } from 'react';
import { UserIcon, GitBranch, ClipboardIcon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { ChatMessage as IChatMessage } from '../../contexts/ChatHistoryContext';
import { getThemeColors } from '../../utils/themeUtils';
import FilePreviewCard from './FilePreviewCard';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import 'katex/dist/katex.min.css';
import { JSONTree } from 'react-json-tree';
import { jsonTreeTheme } from '../../constants/jsonTreeTheme';
import { extractFileName } from '../../utils/extractFileName';

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
  executionTime,
  requestId,
  agents_trace,
  isError,
  files,
}) => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const colors = getThemeColors(theme);

  const handleViewFlow = () => {
    navigate(`/agents-trace?requestId=${requestId}`, {
      state: { traceData: agents_trace },
    });
  };

  const handleCopy = () => {
    if (content) {
      navigator.clipboard.writeText(content);
    }
  };

  const renderContent = () => {
    if (!content && content !== '')
      return (
        <span className={`${colors.textSecondary}`}>Ops, you broke it!</span>
      );

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
    <div
      className={`flex w-full py-4 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`flex max-w-3xl ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      >
        <div
          className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
            isUser
              ? theme === 'light'
                ? 'ml-4 bg-light-secondary-primary text-light-bg'
                : 'ml-4 bg-dark-secondary-primary text-dark-bg'
              : theme === 'light'
              ? 'mr-4 bg-light-secondary-secondary text-light-text'
              : 'mr-4 bg-dark-secondary-secondary text-dark-text'
          }`}
        >
          {isUser ? (
            <UserIcon className="h-5 w-5" />
          ) : (
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2L2 7L12 12L22 7L12 2Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 17L12 22L22 17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 12L12 17L22 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
        <div className="wrap-break-word">
          <div
            className={`inline-block ${
              theme === 'light'
                ? isError
                  ? 'bg-red-100 text-red-800'
                  : 'bg-light-bg text-light-text'
                : isError
                ? 'bg-red-900 text-red-100'
                : 'bg-dark-bg text-dark-text'
            } rounded-lg px-4 py-2 shadow-sm`}
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
          <div className="flex items-center justify-between space-x-2 mt-1">
            <span
              className={`text-xs ${
                theme === 'light'
                  ? 'text-light-secondary-secondary'
                  : 'text-dark-secondary-secondary'
              }`}
            >
              {new Date(timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            <div className="flex items-center justify-between">
              {!isUser && executionTime && (
                <span className="mx-2">⏱️ {executionTime}</span>
              )}
              {!isUser && (
                <>
                  <button
                    onClick={handleViewFlow}
                    className={`mx-1 p-1 rounded-full ${
                      theme === 'light'
                        ? 'bg-light-secondary-primary text-light-bg hover:bg-light-secondary-secondary'
                        : 'bg-dark-secondary-primary text-dark-bg hover:bg-dark-secondary-secondary'
                    }`}
                    title="View Agent Trace"
                  >
                    <GitBranch className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleCopy}
                    className={`mx-1 p-1 rounded-full ${
                      theme === 'light'
                        ? 'bg-light-secondary-primary text-light-bg hover:bg-light-secondary-secondary'
                        : 'bg-dark-secondary-primary text-dark-bg hover:bg-dark-secondary-secondary'
                    }`}
                    title="Copy Message"
                    disabled={!content}
                  >
                    <ClipboardIcon className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
