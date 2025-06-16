import type { FC } from 'react';
import { Card, CardContent, Typography, IconButton, Box } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { ModelConfig } from '../types/model';

interface AIModelCardProps {
  modelData: ModelConfig;
  onEdit: () => void;
  onDelete: () => void;
  isSelected: boolean;
  provider: string;
}

export const AIModelCard: FC<AIModelCardProps> = ({
  modelData,
  onEdit,
  onDelete,
  isSelected,
  provider,
}) => {
  const { name, model, temperature, max_last_messages } = modelData;

  return (
    <Card
      sx={{
        position: 'relative',
        border: isSelected ? 3 : 1,
        borderColor: isSelected ? 'primary.main' : 'grey.300',
        bgcolor: isSelected ? 'primary.50' : 'background.paper',
        '&:hover': {
          borderColor: isSelected ? 'primary.main' : 'primary.light',
          bgcolor: isSelected ? 'primary.50' : 'grey.50',
        },
      }}
    >
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" component="h3" color="text.primary">
              {name}
            </Typography>
            <Box
              sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}
            >
              <Typography variant="body2" color="text.secondary">
                Model: {model}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Provider: {provider}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Temperature: {temperature}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                LLM context length: {max_last_messages}
              </Typography>
            </Box>
          </Box>
          <Box>
            <IconButton
              onClick={e => {
                e.stopPropagation();
                onEdit();
              }}
              size="small"
            >
              <EditIcon />
            </IconButton>
            <IconButton
              onClick={e => {
                e.stopPropagation();
                onDelete();
              }}
              color="error"
              size="small"
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
