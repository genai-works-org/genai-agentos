import { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import LogoIcon from '@/assets/icons/logo.svg';
import AuthLogoIcon from '@/assets/icons/auth-logo.svg';

interface LogoProps {
  isAuth?: boolean;
}

const Logo: FC<LogoProps> = ({ isAuth }) => {
  const navigate = useNavigate();

  return (
    <a onClick={() => navigate('/')} className="cursor-pointer w-fit">
      {isAuth ? <AuthLogoIcon /> : <LogoIcon />}
    </a>
  );
};

export default Logo;
