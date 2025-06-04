import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { LogOutIcon } from 'lucide-react';
import { getThemeColors } from '../utils/themeUtils';
import { useLogout } from '../hooks/useLogout';

const Header = () => {
  const { user } = useAuth();
  const { logout } = useLogout();
  const { theme } = useTheme();
  const colors = getThemeColors(theme);

  const getInitial = (name: string) => name.charAt(0).toUpperCase();

  const getRandomColor = (name: string) => {
    const colors = [
      theme === 'light'
        ? 'bg-light-secondary-primary'
        : 'bg-dark-secondary-primary',
      theme === 'light'
        ? 'bg-light-secondary-secondary'
        : 'bg-dark-secondary-secondary',
    ];
    const index = name.length % colors.length;
    return colors[index];
  };

  return (
    <header className={`sticky top-0 left-0 right-0 ${colors.bgAlt} shadow-sm`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center">
            <span className={`text-2xl font-bold ${colors.text}`}>GENAI</span>
          </Link>
          <div className="flex items-center space-x-4">
            {/* <button
              onClick={toggleTheme}
              className={`p-2 rounded-full ${colors.text} hover:opacity-80`}
            >
              {theme === 'light' ? <MoonIcon className="h-5 w-5" /> : <SunIcon className="h-5 w-5" />}
            </button> */}
            {user ? (
              <div className="flex items-center space-x-4">
                <div
                  className={`w-8 h-8 rounded-full ${getRandomColor(user.username)} flex items-center justify-center ${colors.text} font-medium`}
                >
                  {getInitial(user.username)}
                </div>
                <button
                  onClick={logout}
                  className={`flex items-center ${colors.textSecondary} hover:${colors.text}`}
                >
                  <LogOutIcon className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="space-x-4">
                <Link
                  to="/login"
                  className={`${colors.text} hover:${colors.text}`}
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className={`${colors.buttonPrimary} px-4 py-2 rounded-md`}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
