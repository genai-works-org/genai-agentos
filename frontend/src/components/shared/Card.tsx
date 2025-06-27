import { FC, ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
}

const Card: FC<CardProps> = ({ children }) => {
  return (
    <div className="w-[280px] h-auto p-3 bg-primary-white rounded-2xl border border-neutral-border">
      {children}
    </div>
  );
};

export default Card;
