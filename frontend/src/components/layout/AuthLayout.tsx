import type { FC, ReactNode } from 'react';
import Logo from '@/components/shared/Logo';

interface AuthLayoutProps {
  children: ReactNode;
}

const AuthLayout: FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="h-screen flex">
      <div className="w-[50%] flex justify-center items-center">
        <div className="w-[416px] flex flex-col space-y-8">
          <Logo isAuth />
          {children}
        </div>
      </div>
      <div className="w-[50%] bg-[url(/images/auth-bg.png)] bg-cover bg-center"></div>
    </div>
  );
};

export default AuthLayout;
