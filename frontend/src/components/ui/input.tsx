import * as React from 'react';

import { cn } from '@/utils/utils';

interface InputWithIconProps extends React.ComponentProps<'input'> {
  icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputWithIconProps>(
  ({ className, type, icon, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <input
          type={type}
          className={cn(
            'flex h-12 w-full rounded-xl border border-input bg-transparent px-3 py-1 pr-10 shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
            className,
          )}
          ref={ref}
          {...props}
        />

        {icon && (
          <div className="absolute inset-y-0 right-3 flex items-center text-muted-foreground">
            {icon}
          </div>
        )}
      </div>
    );
  },
);
Input.displayName = 'Input';

export { Input };
