import { useState, useEffect, useRef, FC, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Info, ExternalLink } from 'lucide-react';

import { websocketService, AgentResponse } from '@/services/websocketService';
import { FileData, fileService } from '@/services/fileService';
import {
  ChatMessage as IChatMessage,
  useChatHistory,
} from '@/contexts/ChatHistoryContext';
import { useSettings } from '@/contexts/SettingsContext';
import { AttachedFile, ChatHistory } from '@/types/chat';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { DotsSpinner } from '../DotsSpinner/DotsSpinner';
import { Button } from '../ui/button';

interface ChatAreaProps {
  content: ChatHistory['items'];
  id?: string;
  files: FileData[];
}

const ChatArea: FC<ChatAreaProps> = ({ content, id, files }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [requestId, setRequestId] = useState<string>('');
  const { messages, addMessage, setMessages } = useChatHistory();
  const { activeModel, isModelAvailable, isModelSelected } = useSettings();
  const [uploadedFiles, setUploadedFiles] = useState<
    Record<string, { name: string; type: string; size: number }>
  >({});
  const navigate = useNavigate();

  const isChatAvailable = useMemo(() => {
    return isModelSelected && isModelAvailable;
  }, [isModelSelected, isModelAvailable]);

  const sortedMessages = useMemo(
    () =>
      [...messages].sort((a, b) => {
        const aDate = a.id.split('-').slice(1).join('-');
        const bDate = b.id.split('-').slice(1).join('-');
        return new Date(aDate).getTime() - new Date(bDate).getTime();
      }),
    [messages],
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFileUpload = async (file: File): Promise<AttachedFile> => {
    setIsUploading(true);
    try {
      const fileId = await fileService.uploadFile(file);
      // Store file metadata
      setUploadedFiles(prev => ({
        ...prev,
        [fileId]: {
          name: file.name,
          type: file.type,
          size: file.size,
        },
      }));
      // Return object with id and name
      return { id: fileId, name: file.name };
    } catch (error) {
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = async (content: string, files?: string[]) => {
    if (id === 'new') {
      await websocketService.connect();
    } else if (id) {
      await websocketService.connect(id);
    }

    // Add user message
    const newUserMessage: IChatMessage = {
      id: Date.now().toString(),
      content,
      isUser: true,
      timestamp: new Date().toString(),
      agents_trace: [],
      files: files?.map(fileId => ({
        id: fileId,
        session_id: sessionId || '',
        request_id: requestId || '',
        original_name: uploadedFiles[fileId]?.name || fileId,
        mimetype: uploadedFiles[fileId]?.type || '',
        internal_id: fileId,
        internal_name: fileId,
        from_agent: false,
      })),
    };

    const messageToSend = {
      message: content,
      llm_name: activeModel?.name,
      provider: activeModel?.provider,
      ...(files && { files: files }),
    };

    addMessage(newUserMessage);
    setIsWaitingForResponse(true);
    websocketService.sendMessage(messageToSend);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const convertMessagesWithFiles = async () => {
      if (content.length === 0) return;

      const convertedMessages = await Promise.all(
        content.map(async (item, index) => {
          const isUser = item.sender_type === 'user';
          const parsedContent = !isUser && JSON.parse(item.content);
          const text = parsedContent?.response || item.content;
          const trace = parsedContent?.agents_trace || [];

          const utcFixed = item.created_at.split('.')[0] + 'Z';
          const timestamp = new Date(utcFixed).toString();

          const requestId = item.request_id;
          const matchingFiles = files.filter(
            file => file.request_id === requestId,
          );

          let fileDetails = undefined;
          if (matchingFiles.length > 0 && isUser) {
            const fileMetadataList = await Promise.all(
              matchingFiles.map(file =>
                fileService.getFileMetadata(file.file_id),
              ),
            );
            fileDetails = fileMetadataList.map(meta => ({
              id: meta.id,
              session_id: meta.session_id,
              request_id: meta.request_id,
              original_name: meta.original_name,
              mimetype: meta.mimetype,
              internal_id: meta.internal_id,
              internal_name: meta.internal_name,
              from_agent: meta.from_agent,
              created_at: meta.created_at,
              size: meta.size,
            }));
          }

          return {
            id: `${index}-${item.created_at}`,
            content: text,
            isUser,
            timestamp,
            agents_trace: trace,
            requestId,
            files: fileDetails,
          };
        }),
      );

      setMessages(convertedMessages);
    };

    convertMessagesWithFiles();
  }, [content, files, setMessages]);

  useEffect(() => {
    const handleWebSocketMessage = (response: AgentResponse) => {
      if (response.type === 'agent_response') {
        setIsWaitingForResponse(false);
        setSessionId(response.response.session_id);
        setRequestId(response.response.request_id);
        const newMessage: IChatMessage = {
          id: response.response.request_id || Date.now().toString(),
          content: response.response.response.response,
          isUser: false,
          timestamp: new Date().toString(),
          executionTime: response.response.execution_time.toString(),
          sessionId: response.response.session_id,
          requestId: response.response.request_id,
          isError: !response.response.response.is_success,
          agents_trace: response.response.response.agents_trace,
          files: response.response.files,
        };
        addMessage(newMessage);
      }

      if (id === 'new' && response.response.session_id) {
        navigate(`/chat/${response.response.session_id}`);
      }
    };

    websocketService.addMessageHandler(handleWebSocketMessage);

    return () => {
      websocketService.removeMessageHandler(handleWebSocketMessage);
    };
  }, [messages.length, addMessage]);

  return (
    <div className="flex flex-col h-full relative">
      {/* Chat messages area */}
      <div className="flex-1 space-y-12">
        {messages.length !== 0 &&
          sortedMessages.map(message => (
            <ChatMessage
              key={message.id}
              id={message.id}
              content={message.content}
              isUser={message.isUser}
              timestamp={message.timestamp}
              sessionId={message.sessionId}
              requestId={message.requestId}
              agents_trace={message.agents_trace}
              files={message.files}
            />
          ))}
        {isWaitingForResponse && (
          <div className="flex justify-start py-4">
            <DotsSpinner />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      {/* Chat input area */}
      {!isChatAvailable && (
        <div className="h-full flex justify-center items-center">
          <div className="w-[318px] py-6 px-4 rounded-xl bg-primary-white text-center">
            <span className="flex items-center justify-center w-10 h-10 mx-auto mb-4 rounded bg-badge-brown-light">
              <Info
                size={20}
                className="rotate-180 fill-badge-brown-dark stroke-badge-brown-light"
              />
            </span>
            <p className="mb-2 text-lg font-bold">Action Required</p>
            <p className="mb-4 font-medium text-text-secondary">
              Add settings and models in Settings page in order to use AgentOS
            </p>
            <Button variant="outline" className="w-[180px]" asChild>
              <Link to="/settings">
                Go to Settings
                <ExternalLink size={16} />
              </Link>
            </Button>
          </div>
        </div>
      )}
      <div className="sticky bottom-0 pb-16 bg-neutral-light">
        {messages.length === 0 && (
          <div
            className={`text-lg font-bold text-center py-6 ${
              !isChatAvailable ? 'opacity-40' : ''
            }`}
          >
            What can I do for you today?
          </div>
        )}
        <ChatInput
          onSendMessage={handleSendMessage}
          isUploading={isUploading}
          onFileUpload={handleFileUpload}
        />
      </div>
    </div>
  );
};

export default ChatArea;
