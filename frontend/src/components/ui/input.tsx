import * as React from 'react';
import { Eye, EyeOff, Info } from 'lucide-react';

import { cn } from '@/utils/utils';
import { Label } from './label';
import { Button } from './button';
import Tooltip from '../shared/Tooltip';

interface InputWithIconProps extends React.ComponentProps<'input'> {
  label?: string;
  error?: string;
  showPassword?: boolean;
  setShowPassword?: React.Dispatch<React.SetStateAction<boolean>>;
  secure?: boolean;
  withAsterisk?: boolean;
  hint?: string;
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
      withAsterisk,
      hint,
      ...props
    },
    ref,
  ) => {
    return (
      <div className="relative w-full">
        {label && (
          <Label
            className="flex items-center justify-between mb-2 text-xs text-text-secondary"
            htmlFor={props.id}
          >
            <span
              className={
                withAsterisk
                  ? 'after:content-["*"] after:text-error-main after:ml-1'
                  : ''
              }
            >
              {label}
            </span>
            {hint && (
              <Tooltip message={hint}>
                <Info size={16} />
              </Tooltip>
            )}
          </Label>
        )}

        <input
          type={type}
          className={cn(
            `flex h-12 w-full rounded-xl border border-input bg-primary-white px-3 py-1 ${
              secure ? 'pr-10' : ''
            } shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:text-text-light focus:ring-[1.5px] focus:ring-primary-accent`,
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
