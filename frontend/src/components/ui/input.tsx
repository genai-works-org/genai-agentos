import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';

import { cn } from '@/utils/utils';
import { Label } from './label';
import { Button } from './button';

interface InputWithIconProps extends React.ComponentProps<'input'> {
  label?: string;
  error?: string;
  showPassword?: boolean;
  setShowPassword?: React.Dispatch<React.SetStateAction<boolean>>;
  secure?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputWithIconProps>(
  (
    {
      className,
      type,
      label,
      error,
      showPassword,
      setShowPassword,
      secure,
      ...props
    },
    ref,
  ) => {
    return (
      <div className="relative w-full">
        {label && (
          <Label
            className="mb-2 block text-xs text-text-secondary"
            htmlFor={props.id}
          >
            {label}
          </Label>
        )}

        <input
          type={type}
          className={cn(
            'flex h-12 w-full rounded-xl border border-input bg-transparent px-3 py-1 pr-10 shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 focus:ring-[1.5px] focus:ring-primary-accent',
            className,
          )}
          ref={ref}
          {...props}
        />

        {secure && (
          <Button
            variant="link"
            size="icon"
            className="absolute top-9 right-4 text-text-light"
            onClick={e => {
              e.preventDefault();
              setShowPassword?.(!showPassword);
            }}
          >
            {showPassword ? <Eye size={24} /> : <EyeOff size={24} />}
          </Button>
        )}

        {error && <p className="text-xs mt-1 text-error-main">{error}</p>}
      </div>
    );
  },
);
Input.displayName = 'Input';

export { Input };
