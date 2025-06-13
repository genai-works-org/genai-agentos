import { useState, MouseEvent, useEffect, memo, useRef, useMemo } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { EllipsisVertical } from 'lucide-react';
import {
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Box,
  Typography,
  TextField,
} from '@mui/material';
import { useChat } from '../hooks/useChat';
import { useChatHistory } from '../contexts/ChatHistoryContext';
import ConfirmModal from './ConfirmModal';

const ChatList = memo(() => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [ignoreBlur, setIgnoreBlur] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { getChatsList, updateChat, deleteChat } = useChat();
  const { chats, setChats } = useChatHistory();

  const sortedChats = useMemo(
    () =>
      chats.sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      ),
    [chats],
  );

  const handleMenuOpen = (
    event: MouseEvent<HTMLElement>,
    sessionId: string,
  ) => {
    setAnchorEl(event.currentTarget);
    setActiveSessionId(sessionId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setActiveSessionId(null);
  };

  const handleRename = () => {
    if (activeSessionId) {
      setIgnoreBlur(true);
      setEditingSessionId(activeSessionId);
      const currentChat = chats.find(c => c.session_id === activeSessionId);
      setEditedTitle(currentChat?.title || '');
    }
    handleMenuClose();
  };

  const handleRenameChange = async () => {
    if (ignoreBlur) return;

    if (editingSessionId && editedTitle.trim()) {
      await updateChat(editingSessionId, editedTitle.trim());
      const res = await getChatsList();
      setChats(res.chats);
    }
    setEditingSessionId(null);
  };

  const handleDelete = async () => {
    if (activeSessionId) {
      await deleteChat(activeSessionId);
      const res = await getChatsList();
      setChats(res.chats);
      setIsConfirmOpen(false);
    }
    if (id === activeSessionId) {
      navigate('/chat/new');
    }
    handleMenuClose();
  };

  useEffect(() => {
    if (editingSessionId && inputRef.current) {
      inputRef.current.focus();
      setIgnoreBlur(false);
    }
  }, [editingSessionId]);

  return (
    <Box sx={{ maxHeight: 'calc(100% - 315px)', overflowY: 'auto' }}>
      <Typography
        variant="h6"
        gutterBottom
        position="sticky"
        top={0}
        bgcolor="#fff"
        zIndex={1}
      >
        Chats
      </Typography>

      {chats.length === 0 ? (
        <Typography variant="body1" align="center" mt={2}>
          No chats found
        </Typography>
      ) : (
        <List dense disablePadding>
          {sortedChats.map(chat => {
            const isEditing = editingSessionId === chat.session_id;
            return (
              <ListItemButton
                key={chat.session_id}
                selected={location.pathname.includes(chat.session_id)}
                onClick={() => {
                  if (!isEditing) {
                    navigate(`/chat/${chat.session_id}`);
                  }
                }}
              >
                {isEditing ? (
                  <TextField
                    inputRef={inputRef}
                    value={editedTitle}
                    onChange={e => setEditedTitle(e.target.value)}
                    onBlur={handleRenameChange}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        handleRenameChange();
                      } else if (e.key === 'Escape') {
                        setEditingSessionId(null);
                      }
                    }}
                    size="small"
                    autoFocus
                    fullWidth
                    variant="standard"
                  />
                ) : (
                  <ListItemText primary={chat.title} />
                )}
                <ListItemIcon
                  onClick={e => {
                    e.stopPropagation();
                    handleMenuOpen(e, chat.session_id);
                  }}
                  sx={{
                    justifyContent: 'end',
                    minWidth: 0,
                    '& .MuiTypography-root': {
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                    },
                  }}
                >
                  <EllipsisVertical size={18} />
                </ListItemIcon>
              </ListItemButton>
            );
          })}

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleRename}>Rename</MenuItem>
            <MenuItem onClick={() => setIsConfirmOpen(true)}>Delete</MenuItem>
          </Menu>
        </List>
      )}

      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Delete Chat"
        text={'Are you sure you want to delete this chat?'}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
      />
    </Box>
  );
});

export default ChatList;
