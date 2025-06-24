import { useNavigate } from 'react-router-dom';
import LogoIcon from '../../assets/logo.svg';

const Logo = () => {
  const navigate = useNavigate();

  return (
    <a onClick={() => navigate('/')} className="cursor-pointer">
      <LogoIcon />
    </a>
  );
};

export default Logo;
