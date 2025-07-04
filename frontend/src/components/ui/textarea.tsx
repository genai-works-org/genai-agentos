import * as React from 'react';

import { cn } from '@/utils/utils';
import { Label } from './label';

interface TextareaProps extends React.ComponentProps<'textarea'> {
  label?: string;
  withAsterisk?: boolean;
  error?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, withAsterisk, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <Label
            className={`mb-2 block text-xs text-text-secondary ${
              withAsterisk
                ? 'after:content-["*"] after:text-error-main after:ml-1'
                : ''
            }`}
            htmlFor={props.id}
          >
            {label}
          </Label>
        )}

        <textarea
          className={cn(
            'flex min-h-[264px] w-full rounded-xl border border-input bg-primary-white px-4 py-3 text-base placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:text-text-light resize-none',
            className,
          )}
          ref={ref}
          {...props}
        />

        {error && <p className="text-xs mt-1 text-error-main">{error}</p>}
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';

export { Textarea };
