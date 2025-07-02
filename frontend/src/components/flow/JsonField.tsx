import type { FC } from 'react';
import { useState } from 'react';
import { Box, IconButton } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

import { Textarea } from '../ui/textarea';

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
    <div className="mt-4">
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <p className="text-sm font-bold mb-3">{label}:</p>
        {stringValue?.length > 100 && (
          <IconButton size="small" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        )}
      </Box>
      {isExpanded ? (
        isObject ? (
          <div className="space-y-3">
            {Object.entries(value).map(([key, val]) => (
              <Textarea
                key={key}
                id={key}
                name={key}
                label={key}
                value={
                  typeof val === 'object' ? JSON.stringify(val) : String(val)
                }
                className="min-h-[80px]"
                readOnly
              />
            ))}
          </div>
        ) : (
          <Textarea value={stringValue} className="min-h-[80px]" readOnly />
        )
      ) : (
        <p>{preview}</p>
      )}
    </div>
  );
};
