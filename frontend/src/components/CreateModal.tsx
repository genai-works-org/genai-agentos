import { FC, useState } from 'react';
import { DialogActions, TextField, Button } from '@mui/material';
import { validateUrl } from '../utils/validation';
import { Modal } from './Modal';

interface CreateAgentModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (url: string) => void;
  title: string;
  loading?: boolean;
}

const CreateAgentModal: FC<CreateAgentModalProps> = ({
  open,
  onClose,
  onCreate,
  title,
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
    <Modal isOpen={open} onClose={onClose} title={title}>
      <TextField
        label="Server URL"
        fullWidth
        value={url}
        onChange={e => setUrl(e.target.value)}
        error={hasError}
        helperText={hasError ? 'Invalid URL' : ''}
      />
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isDisabled}
        >
          {loading ? 'Connecting...' : 'Create'}
        </Button>
      </DialogActions>
    </Modal>
  );
};

export default CreateAgentModal;
