import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CircularProgress } from '@mui/material';

import { websocketService } from '@/services/websocketService';
import { FileData, fileService } from '@/services/fileService';
import { useChatHistory } from '@/contexts/ChatHistoryContext';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/hooks/useChat';
import { ChatHistory } from '@/types/chat';
import ChatArea from '@/components/chat/ChatArea';
import { MainLayout } from '@/components/layout/MainLayout';

const ChatPage = () => {
  const [messages, setMessages] = useState<ChatHistory['items']>([]);
  const [files, setFiles] = useState<FileData[]>([]);
  const { id } = useParams();
  const { clearMessages, setChats } = useChatHistory();
  const { user } = useAuth();
  const { getChatHistory, isLoading, getChatsList } = useChat();

  useEffect(() => {
    // Only connect if user is authenticated
    if (!user) {
      websocketService.disconnect();
      return;
    }

    if (id && id !== 'new') {
      getChatHistory(id)
        .then(res => {
          setMessages(res.items);
        })
        .catch(() => {
          setMessages([]);
        });

      fileService
        .getFilesByRequestId(id)
        .then(res => {
          setFiles(res);
        })
        .catch(() => {
          setFiles([]);
        });
    }

    // Cleanup function
    return () => {
      websocketService.disconnect();
      clearMessages();
      setMessages([]);
      if (id === 'new') {
        getChatsList().then(res => {
          setChats(res.chats);
        });
      }
    };
  }, [user, clearMessages, id]);

  return (
    <MainLayout currentPage="AgentOS Chat">
      <div className="h-full p-16 pb-0">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[500px]">
            <CircularProgress />
          </div>
        ) : (
          <ChatArea content={messages} id={id} files={files} />
        )}
      </div>
    </MainLayout>
  );
};

export default ChatPage;
