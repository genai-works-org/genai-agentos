import { useCallback, useEffect, useState } from 'react';
import type { FC, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Container } from '@mui/material';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors } from '../utils/themeUtils';
import Sidebar from './Sidebar';

interface MainLayoutProps {
  children: ReactNode;
  currentPage: string;
  handleReturn?: () => void;
}

export const MainLayout: FC<MainLayoutProps> = ({
  children,
  currentPage,
  handleReturn,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  const location = useLocation();

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Get page title from current location
  const getPageTitle = () => {
    const path = location.pathname.split('/')[1];
    return path.charAt(0).toUpperCase() + path.slice(1) || 'Home';
  };

  const handleSidebarClose = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  return (
    <Container
      maxWidth={false}
      disableGutters
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflowX: 'hidden',
        overflowY: 'auto',
      }}
    >
      <div
        className={`min-h-screen flex flex-col ${theme === 'light' ? 'bg-light-bg' : 'bg-dark-bg'}`}
      >
        {/* Header */}
        <header className={`h-16 ${colors.bgAlt} shadow-sm z-10 w-full`}>
          <div className="h-full px-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className={`p-2 rounded-md hover:bg-gray-100 ${
                  theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                }`}
                aria-label="Toggle sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="flex items-center">
                <h1 className={`text-lg font-semibold ${colors.text}`}>
                  {currentPage || getPageTitle()}
                </h1>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area with Sidebar */}
        <div className="flex flex-1 relative overflow-x-hidden overflow-y-auto">
          {/* Left Sidebar - Always mounted but animated */}
          <div
            className={`absolute inset-y-0 left-0 overflow-x-hidden z-10 ${isSidebarOpen && window.innerWidth < 768 ? 'top-0 z-50' : ''}`}
          >
            {isSidebarOpen && (
              <Sidebar
                isOpen={isSidebarOpen}
                onClose={handleSidebarClose}
                handleReturn={handleReturn}
                side="left"
              />
            )}
          </div>

          {/* Page Content */}
          <main
            className={`flex-1 transition-all duration-200 ease-in-out ${
              isSidebarOpen ? 'ml-64' : 'ml-0'
            }`}
          >
            {children}
          </main>
        </div>
      </div>
    </Container>
  );
};
