import type { FC, ReactNode } from 'react';
import { Container } from '@mui/material';
import { useTheme } from '../contexts/ThemeContext';
import Header from './Header';

interface LayoutProps {
  children: ReactNode;
}

const Layout: FC<LayoutProps> = ({ children }) => {
  const { theme } = useTheme();

  return (
    <Container
      maxWidth={false}
      sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}
      disableGutters
    >
      <div
        className={`min-h-screen flex flex-col ${theme === 'light' ? 'bg-light-bg' : 'bg-dark-bg'}`}
      >
        <Header />
        <main className="flex-1 flex items-center justify-center">
          {children}
        </main>
      </div>
    </Container>
  );
};

export default Layout;
