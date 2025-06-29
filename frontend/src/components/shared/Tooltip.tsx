import { FC, ReactNode } from 'react';
import {
  TooltipProvider,
  Tooltip as TooltipWrapper,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TooltipProps {
  children: ReactNode;
  message: string;
}

const Tooltip: FC<TooltipProps> = ({ children, message }) => {
  if (!message) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider>
      <TooltipWrapper>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent>{message}</TooltipContent>
      </TooltipWrapper>
    </TooltipProvider>
  );
};

export default Tooltip;
