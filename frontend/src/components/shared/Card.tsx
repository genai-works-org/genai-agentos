import { FC, ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  active?: boolean;
}

const Card: FC<CardProps> = ({ children, active }) => {
  return (
    <div
      className={`w-[280px] h-auto p-3 bg-primary-white rounded-2xl border ${
        active ? 'border-primary-accent' : 'border-neutral-border'
      }`}
    >
      {children}
    </div>
  );
};

export default Card;
