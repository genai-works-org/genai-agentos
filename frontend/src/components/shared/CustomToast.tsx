import { FC } from 'react';

interface CustomToastProps {
  title: string;
  desc: string;
}

const CustomToast: FC<CustomToastProps> = ({ title, desc }) => {
  return (
    <div>
      <div className="font-bold text-text-main">{title}</div>
      {desc && <div className="text-sm text-text-secondary">{desc}</div>}
    </div>
  );
};

export default CustomToast;
