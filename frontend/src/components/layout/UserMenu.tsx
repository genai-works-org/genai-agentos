import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';

import { useChatHistory } from '@/contexts/ChatHistoryContext';
import { useAuth } from '@/contexts/AuthContext';
import UserAvatar from '@/components/layout/UserAvatar';

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
      <div
        className="flex items-center relative cursor-pointer"
        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
      >
        <UserAvatar username={user?.username || ''} />
        <span className="font-medium max-w-[150px] ml-2 truncate">
          {user?.username}
        </span>
        <button className="p-0.5 ml-1">
          {isUserMenuOpen ? (
            <ChevronUp className="h-5 w-5 text-text-main" />
          ) : (
            <ChevronDown className="h-5 w-5 text-text-main" />
          )}
        </button>

        {isUserMenuOpen && (
          <div className="absolute top-full right-0 w-[200px] py-2 bg-primary-white rounded-2xl shadow-xl z-50 overflow-hidden">
            <button
              className="w-full px-3 py-2 text-left font-medium hover:bg-gray-100"
              onClick={() => navigate('/settings')}
            >
              Settings
            </button>
            <button
              onClick={handleLogout}
              className="w-full px-3 py-2 text-left font-medium text-error-main hover:bg-gray-100"
              aria-label="Logout"
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserMenu;
