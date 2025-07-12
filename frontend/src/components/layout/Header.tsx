import { FC, ReactNode } from 'react';
import Logo from '@/components/shared/Logo';
import UserMenu from '@/components/layout/UserMenu';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  currentPage: string;
  actionItems?: ReactNode;
}

const Header: FC<HeaderProps> = ({ currentPage, actionItems }) => {
  const navigate = useNavigate();

  return (
    <header className="h-16 w-full">
      <div className="h-full px-6 flex items-center">
        <Logo />
        <div className="w-full flex items-center justify-between ml-[74px]">
          <div className="flex items-center gap-4">
            <h1 className="text-lg">{currentPage}</h1>
            {actionItems}
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-primary-accent text-white font-medium rounded-lg hover:bg-primary-accent/90 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-accent/50"
          >
            Mila Dashboard
          </button>
          <UserMenu />
        </div>
      </div>
    </header>
  );
};

export default Header;
