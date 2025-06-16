import { useState } from 'react';
import type { FC } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
  Card,
  CardContent,
  Typography,
  IconButton,
  Box,
  Button,
  Paper,
} from '@mui/material';
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
  const [isExpanded, setIsExpanded] = useState(false);
  const { name, model, temperature, system_prompt, max_last_messages } =
    modelData;

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

        <Box sx={{ mt: 2 }}>
          <Button
            onClick={e => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            startIcon={
              isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )
            }
            size="small"
            color="inherit"
            sx={{
              textTransform: 'none',
              fontSize: '0.875rem',
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: 'transparent',
                color: 'text.primary',
              },
              p: 0,
              minWidth: 'auto',
            }}
          >
            {isExpanded ? 'Hide prompt' : 'Show prompt'}
          </Button>
          {isExpanded && (
            <Paper
              elevation={0}
              sx={{
                mt: 1,
                p: 1,
                bgcolor: 'grey.50',
                borderRadius: 1,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                {system_prompt}
              </Typography>
            </Paper>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};
