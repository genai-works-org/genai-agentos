import type { FC } from 'react';
import { useState } from 'react';
import { Box, Typography, Paper, TextField, IconButton } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

interface JsonFieldProps {
  label: string;
  value: any;
  fieldId: string;
}

export const JsonField: FC<JsonFieldProps> = ({ label, value }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isObject = typeof value === 'object' && value !== null;
  const stringValue = isObject ? JSON.stringify(value, null, 2) : value;
  const preview =
    stringValue?.length > 100
      ? stringValue.substring(0, 100) + '...'
      : stringValue;

  return (
    <Box sx={{ mb: 2 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Typography variant="subtitle2" gutterBottom>
          {label}:
        </Typography>
        {stringValue?.length > 100 && (
          <IconButton size="small" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        )}
      </Box>
      {isExpanded ? (
        isObject ? (
          <Paper variant="outlined" sx={{ p: 2 }}>
            {Object.entries(value).map(([key, val]) => (
              <TextField
                key={key}
                label={key}
                value={
                  typeof val === 'object' ? JSON.stringify(val) : String(val)
                }
                fullWidth
                margin="dense"
                InputProps={{ readOnly: true }}
                multiline
              />
            ))}
          </Paper>
        ) : (
          <TextField
            value={stringValue}
            fullWidth
            multiline
            InputProps={{ readOnly: true }}
          />
        )
      ) : (
        <Typography variant="body2" sx={{ mt: 1 }}>
          {preview}
        </Typography>
      )}
    </Box>
  );
};
