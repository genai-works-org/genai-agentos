import { FC, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { validateUrl } from '@/utils/validation';

interface CreateAgentModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (url: string) => void;
  title: string;
  placeholder: string;
  loading?: boolean;
}

const CreateAgentModal: FC<CreateAgentModalProps> = ({
  open,
  onClose,
  onCreate,
  title,
  placeholder,
  loading,
}) => {
  const [url, setUrl] = useState('');

  const hasError = url.length > 0 && !validateUrl(url);
  const isDisabled = !url.trim() || !validateUrl(url);

  const handleSubmit = () => {
    onCreate(url);
    setUrl('');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        aria-describedby={undefined}
        className="max-w-[420px] px-9 py-12"
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <Input
          label="Server URL"
          placeholder={placeholder}
          value={url}
          onChange={e => setUrl(e.target.value)}
          error={hasError ? 'Invalid URL' : ''}
          className="bg-primary-white"
        />

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" onClick={onClose} className="w-[99px]">
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isDisabled}
            className="w-[84px]"
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAgentModal;
