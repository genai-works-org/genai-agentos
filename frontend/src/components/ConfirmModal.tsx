import { FC } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
} from '@mui/material';
import Button from './shared/Button';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  text: string;
  confirmText?: string;
}

const ConfirmModal: FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmation Required',
  text,
  confirmText = 'Delete',
}) => {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      aria-labelledby="delete-dialog-title"
      aria-describedby="delete-dialog-description"
      sx={{
        '& .MuiDialog-paper': {
          width: '420px',
          padding: '48px 36px',
          borderRadius: '16px',
        },
      }}
    >
      <DialogTitle
        id="delete-dialog-title"
        sx={{
          padding: 0,
          marginBottom: '4px',
          fontWeight: 700,
          fontSize: '20px',
          color: '#00231A',
          textAlign: 'center',
        }}
      >
        {title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText
          id="delete-dialog-description"
          sx={{
            marginBottom: '24px',
            fontSize: '14px',
            color: '#3D5E56',
            textAlign: 'center',
          }}
        >
          {text}
        </DialogContentText>
      </DialogContent>

      <div className="flex space-x-4 justify-center">
        <Button onClick={onClose} variant="outlined" className="w-[100px]">
          Cancel
        </Button>
        <Button onClick={onConfirm} className="w-[100px]">
          {confirmText}
        </Button>
      </div>
    </Dialog>
  );
};

export default ConfirmModal;
