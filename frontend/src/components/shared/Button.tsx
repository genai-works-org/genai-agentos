import { FC, ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  className?: string;
  variant?: 'primary' | 'outlined';
}

const Button: FC<ButtonProps> = ({
  children,
  onClick,
  type = 'button',
  disabled = false,
  className,
  variant = 'primary',
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`w-full ${
        variant === 'primary'
          ? 'bg-primary-accent text-primary-white'
          : 'bg-primary-white text-primary-accent'
      } font-medium py-2 px-4 rounded-xl hover:opacity-90 ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;
