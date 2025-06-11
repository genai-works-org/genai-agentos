import { useEffect, useState, type FC } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Divider,
  CircularProgress,
} from '@mui/material';
import { Modal } from './Modal';
import { FlowChain } from './FlowChain';
import { FLOW_NAME_REGEX } from '../constants/regex';

interface SaveFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  flowName: string;
  onFlowNameChange: (value: string) => void;
  flowDescription: string;
  onFlowDescriptionChange: (value: string) => void;
  links: any[];
  saveError: string | null;
  saving: boolean;
  onSave: () => void;
  setError: (error: boolean) => void;
}

export const SaveFlowModal: FC<SaveFlowModalProps> = ({
  isOpen,
  onClose,
  flowName,
  onFlowNameChange,
  flowDescription,
  onFlowDescriptionChange,
  links,
  saveError,
  saving,
  onSave,
  setError,
}) => {
  const [flowNameError, setFlowNameError] = useState<string | null>(null);

  const isReadyToSave =
    saving ||
    links.length === 0 ||
    flowDescription.trim().length === 0 ||
    flowName.trim().length === 0 ||
    !!flowNameError;

  useEffect(() => {
    if (!FLOW_NAME_REGEX.test(flowName)) {
      setFlowNameError('Only letters, numbers and hyphens are allowed');
      setError(true);
    } else {
      setFlowNameError(null);
      setError(false);
    }
  }, [flowName]);

  useEffect(() => {
    if (!FLOW_NAME_REGEX.test(flowName)) {
      setFlowNameError(
        'Only letters, numbers, underscores and hyphens are allowed',
      );
      setError(true);
    } else {
      setFlowNameError(null);
      setError(false);
    }
  }, [flowName]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Save Agent Flow">
      <Box display="flex" flexDirection="column" gap={2}>
        <TextField
          label="Flow Name"
          value={flowName}
          onChange={e => onFlowNameChange(e.target.value.slice(0, 55))}
          fullWidth
          error={!!flowNameError}
          helperText={flowNameError}
        />
        <TextField
          label="Description"
          value={flowDescription}
          onChange={e => onFlowDescriptionChange(e.target.value)}
          fullWidth
          multiline
          minRows={2}
          maxRows={4}
          sx={{
            '& .MuiInputBase-root': {
              overflow: 'auto',
            },
          }}
        />
        <FlowChain links={links} />
        <Divider />
        {saveError && <Typography color="error">{saveError}</Typography>}
        <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
          <Button onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={onSave}
            disabled={isReadyToSave}
          >
            {saving ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};
