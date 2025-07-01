import { useEffect, useState } from 'react';
import type { FC, ReactNode } from 'react';

import localStorage from '@/services/localStorageService';
import { SIDEBAR_COLLAPSED } from '@/constants/localStorage';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';

interface MainLayoutProps {
  children: ReactNode;
  currentPage: string;
}

export const MainLayout: FC<MainLayoutProps> = ({ children, currentPage }) => {
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.get(SIDEBAR_COLLAPSED);
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.set(SIDEBAR_COLLAPSED, String(collapsed));
  }, [collapsed]);

  return (
    <div className="min-h-screen flex flex-col bg-neutral-accent">
      <Header currentPage={currentPage} />
      <div className="flex flex-1">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        <main className="flex-1 bg-neutral-light rounded-tl-[36px] max-h-[calc(100vh-64px)] overflow-y-scroll">
          {children}
        </main>
      </div>
    </div>
  );
};
