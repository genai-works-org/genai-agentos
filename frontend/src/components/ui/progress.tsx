// components/ui/progress.tsx
import * as React from 'react';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // percentage value from 0 to 100
  className?: string; // optional class for background styling
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ value, className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`w-full h-2 rounded-full overflow-hidden ${className}`}
        {...props}
      >
        <div
          className="h-full transition-all duration-300"
          style={{
            width: `${value}%`,
            backgroundColor: 'currentColor', // inherit from text color
          }}
        />
      </div>
    );
  },
);

Progress.displayName = 'Progress';
