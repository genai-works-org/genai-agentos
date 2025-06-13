import { useState, useEffect, FC, ReactNode, memo } from 'react';
import { Settings, MoreVertical, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Divider } from '@mui/material';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors } from '../utils/themeUtils';
import UserAvatar from './UserAvatar';
import { useAuth } from '../contexts/AuthContext';
import PageCard from './PageCard';
import { useChatHistory } from '../contexts/ChatHistoryContext';
import ChatList from './ChatList';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  handleReturn?: () => void;
  side: 'left' | 'right';
}

interface PageLink {
  path: string;
  title: string;
  icon?: ReactNode;
  plusBtnNav?: string;
}

const pages: PageLink[] = [
  { path: '/chat/new', title: 'New Chat' },
  { path: '/agents', title: 'Agents' },
  {
    path: '/agent-flows',
    title: 'Agent Flows',
    plusBtnNav: '/agent-flows/new',
  },
  { path: '/a2a-agents', title: 'A2A Agents' },
  { path: '/mcp-agents', title: 'MCP Agents' },
];

const Sidebar: FC<SidebarProps> = memo(({ isOpen, onClose }) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { clearMessages } = useChatHistory();

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const userMenu = document.getElementById('user-menu');
      if (userMenu && !userMenu.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      className={`h-full w-64 z-30 ${
        colors.bg
      } shadow-lg flex flex-col transition-all duration-200 ease-in-out transform border-r border-gray-200 ${
        isOpen ? 'translate-x-0 opacity-100' : 'translate-x-[-100%] opacity-0'
      }`}
    >
      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {pages.map(page => (
          <PageCard
            key={page.path}
            title={page.title}
            icon={page.icon}
            isActive={location.pathname.includes(page.path)}
            plusBtnNav={page.plusBtnNav}
            onClick={() => {
              navigate(page.path);
              if (window.innerWidth < 768) onClose();
            }}
          />
        ))}
        <Divider className="!my-4" />
        <ChatList />
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-200" id="user-menu">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <UserAvatar username={user?.username || ''} />
            <span className={`text-sm font-medium ${colors.text}`}>
              {user?.username}
            </span>
          </div>
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className={`p-1 rounded-full hover:bg-gray-100 ${colors.text}`}
            >
              <MoreVertical className="h-5 w-5" />
            </button>
            {isUserMenuOpen && (
              <div
                className={`absolute bottom-full right-0 mb-2 w-48 rounded-lg shadow-lg ${
                  colors.bg
                } ring-1 ring-black ring-opacity-5`}
              >
                <div className="py-1">
                  <button
                    className={`flex items-center w-full px-4 py-2 text-sm ${colors.text} hover:bg-gray-100`}
                    onClick={() => navigate('/settings')}
                  >
                    <Settings className="h-4 w-4 mr-3" />
                    Settings
                  </button>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => {
                      logout();
                      clearMessages();
                    }}
                    className={`flex items-center w-full px-4 py-2 text-sm ${colors.text} hover:bg-gray-100`}
                    aria-label="Logout"
                  >
                    <LogOut className="h-4 w-4 mr-3" /> Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default Sidebar;
