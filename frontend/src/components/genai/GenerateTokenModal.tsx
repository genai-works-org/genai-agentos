import { FC } from 'react';
import { Copy } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

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
      <DialogContent
        aria-describedby={undefined}
        className="max-w-[600px] p-8 gap-4"
      >
        <DialogHeader>
          <DialogTitle className="text-left mb-4">Generated Token</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Textarea name="token" value={token} disabled className="pr-10" />
          <Copy
            size={20}
            className="absolute top-2.5 right-2.5 cursor-pointer"
            onClick={copyToken}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GenerateTokenModal;
