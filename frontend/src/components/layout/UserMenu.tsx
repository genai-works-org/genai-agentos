import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, ChevronDown, LogOut } from 'lucide-react';
import { useChatHistory } from '../../contexts/ChatHistoryContext';
import { useAuth } from '../../contexts/AuthContext';
import UserAvatar from './UserAvatar';

const UserMenu = () => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { clearMessages } = useChatHistory();

  const handleLogout = () => {
    logout();
    clearMessages();
  };

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
    <div id="user-menu">
      <div className="flex items-center relative">
        <UserAvatar username={user?.username || ''} />
        <span className="font-medium max-w-[150px] ml-2 truncate">
          {user?.username}
        </span>
        <button
          onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          className="p-0.5 ml-1"
        >
          <ChevronDown className="h-5 w-5 text-text-main " />
        </button>

        {isUserMenuOpen && (
          <div className="absolute top-full right-0 mb-2 w-48 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5">
            <div className="py-1">
              <button
                className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100"
                onClick={() => navigate('/settings')}
              >
                <Settings className="h-4 w-4 mr-3" />
                Settings
              </button>
            </div>
            <div className="py-1">
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100"
                aria-label="Logout"
              >
                <LogOut className="h-4 w-4 mr-3" /> Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserMenu;
