import { FC } from 'react';
import Logo from '@/components/shared/Logo';
import UserMenu from '@/components/layout/UserMenu';

interface HeaderProps {
  currentPage: string;
}

const Header: FC<HeaderProps> = ({ currentPage }) => {
  return (
    <header className="h-16 w-full">
      <div className="h-full px-6 flex items-center">
        <Logo />
        <div className="w-full flex items-center justify-between ml-[74px]">
          <h1 className="text-lg">{currentPage}</h1>
          <UserMenu />
        </div>
      </div>
    </header>
  );
};

export default Header;
