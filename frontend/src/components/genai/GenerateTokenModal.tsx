import { FC } from 'react';
import { Copy } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface GenerateTokenModalProps {
  open: boolean;
  onClose: () => void;
  token: string;
  copyToken: () => void;
}

const GenerateTokenModal: FC<GenerateTokenModalProps> = ({
  open,
  onClose,
  token,
  copyToken,
}) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[420px] px-9 py-12 gap-6">
        <DialogHeader>
          <DialogTitle className="mb-1">Token Generated!</DialogTitle>
          <DialogDescription className="">
            Press on the field to copy Token
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Input
            id="token"
            name="token"
            label="Token"
            value={token}
            disabled
            className="pl-12 truncate"
          />
          <Copy
            size={24}
            className="absolute top-9 left-4 cursor-pointer text-primary-accent"
            onClick={copyToken}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GenerateTokenModal;
