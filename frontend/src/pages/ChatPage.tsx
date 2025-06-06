import { Box, Container } from '@mui/material';
import ChatArea from '../components/ChatArea';
import { websocketService } from '../services/websocketService';
import { MainLayout } from '../components/MainLayout';
import { useChatHistory } from '../contexts/ChatHistoryContext';
import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const ChatPage = () => {
  const location = useLocation();
  const { clearMessages } = useChatHistory();
  const { user } = useAuth();

  useEffect(() => {
    // Only connect if user is authenticated
    if (!user) {
      websocketService.disconnect();
      return;
    }

    if (location.pathname === '/chat/new') {
      // For /chat/new route: clear messages, close old connection, and open new one
      clearMessages();
      websocketService.disconnect();
      websocketService.connect();
    } else if (location.pathname === '/chat') {
      // For /chat route: ensure connection exists
      websocketService.connect();
    }

    // Cleanup function
    return () => {
      websocketService.disconnect();
    };
  }, [location.pathname, user, clearMessages]);

  useEffect(() => {
    // Add connection state handler
    const handleConnectionState = () => {
      // Remove console.log statement
    };

    websocketService.addConnectionStateHandler(handleConnectionState);

    return () => {
      websocketService.removeConnectionStateHandler(handleConnectionState);
    };
  }, []);

  return (
    <MainLayout currentPage="Chat">
      <Container
        maxWidth="xl"
        sx={{ height: '100%', display: 'flex', flexDirection: 'column', py: 2 }}
      >
        {/* Messages area */}
        <Box sx={{ flex: 1, overflow: 'auto', mb: 1 }}>
          <ChatArea />
        </Box>
      </Container>
    </MainLayout>
  );
};

export default ChatPage;
