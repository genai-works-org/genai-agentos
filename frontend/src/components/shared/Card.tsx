import { CSSProperties, FC, ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  active?: boolean;
  className?: string;
  style?: CSSProperties;
}

const Card: FC<CardProps> = ({ children, active, className, style }) => {
  return (
    <div
      className={`w-[280px] h-auto p-3 bg-primary-white rounded-2xl border ${
        active ? 'border-primary-accent' : 'border-neutral-border'
      } ${className}`}
      style={style}
    >
      {children}
    </div>
  );
};

export default Card;
