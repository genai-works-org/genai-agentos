import { useState, MouseEvent, useEffect, memo, useRef, useMemo } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { EllipsisVertical, Pencil, Trash2 } from 'lucide-react';
import {
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  TextField,
} from '@mui/material';
import { useChat } from '@/hooks/useChat';
import { useChatHistory } from '@/contexts/ChatHistoryContext';
import ConfirmModal from '@/components/modals/ConfirmModal';

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
  };

  const handleRename = () => {
    if (activeSessionId) {
      setIgnoreBlur(true);
      setEditingSessionId(activeSessionId);
      const currentChat = chats.find(c => c.session_id === activeSessionId);
      setEditedTitle(currentChat?.title || '');
    }
    handleMenuClose();
    setActiveSessionId(null);
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
    setActiveSessionId(null);
  };

  useEffect(() => {
    if (editingSessionId && inputRef.current) {
      inputRef.current.focus();
      setIgnoreBlur(false);
    }
  }, [editingSessionId]);

  return (
    <div className="mt-[30px]">
      <p className="font-medium text-text-secondary mb-1.5 pl-2">Chats</p>

      {chats.length === 0 ? (
        <p className="px-2">No chats found</p>
      ) : (
        <ul className="p-0 pb-3">
          {sortedChats.map(chat => {
            const isEditing = editingSessionId === chat.session_id;
            const isSelected = location.pathname.includes(chat.session_id);
            return (
              <li
                key={chat.session_id}
                onClick={() => {
                  if (!isEditing) {
                    navigate(`/chat/${chat.session_id}`);
                  }
                }}
                className={`flex items-center justify-between h-9 px-2 font-medium rounded-xl cursor-pointer ${
                  isSelected ? 'bg-primary-white' : ''
                }`}
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
                    inputProps={{
                      maxLength: 20,
                    }}
                    sx={{
                      '& .MuiInputBase-root::after': {
                        borderBottomColor: '#008765',
                      },
                    }}
                  />
                ) : (
                  <ListItemText
                    primary={
                      chat.title.length >= 20
                        ? chat.title.slice(0, 17) + '...'
                        : chat.title
                    }
                    className="truncate"
                  />
                )}
                <ListItemIcon
                  onClick={e => {
                    e.stopPropagation();
                    handleMenuOpen(e, chat.session_id);
                  }}
                  sx={{
                    justifyContent: 'end',
                    minWidth: 0,
                    paddingTop: '9px',
                    paddingBottom: '9px',
                    '& .MuiTypography-root': {
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                    },
                  }}
                >
                  <EllipsisVertical size={18} className="text-text-main" />
                </ListItemIcon>
              </li>
            );
          })}

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            slotProps={{
              paper: {
                sx: {
                  width: 200,
                  borderRadius: '16px',
                },
              },
              list: {
                autoFocusItem: false,
              },
            }}
            sx={{
              '& .MuiButtonBase-root': {
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '8px 12px',
                fontWeight: 500,
                color: '#00231A',

                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                },
              },
            }}
          >
            <MenuItem onClick={handleRename}>
              <Pencil />
              Rename
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleMenuClose();
                setIsConfirmOpen(true);
              }}
              style={{ color: '#BA1A1A' }}
            >
              <Trash2 />
              Delete
            </MenuItem>
          </Menu>
        </ul>
      )}

      <ConfirmModal
        isOpen={isConfirmOpen}
        description={'Are you sure you want to delete this chat?'}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
});

export default ChatList;
