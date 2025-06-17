import { IconButton, Card, CardContent, Tooltip } from '@mui/material';
import { PlusIcon } from 'lucide-react';
import type { FC } from 'react';
interface AIModelCardProps {
  disabled: boolean;
  tooltipMessage: string;
  onClick: () => void;
}

export const AIModelCreateCard: FC<AIModelCardProps> = ({
  onClick,
  disabled,
  tooltipMessage,
}) => {
  return (
    <Tooltip title={tooltipMessage}>
      <Card
        onClick={disabled ? undefined : onClick}
        sx={{
          width: '350px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease-in-out',
          opacity: disabled ? 0.5 : 1,
          '&:hover': {
            borderColor: disabled ? undefined : 'primary.main',
            bgcolor: disabled ? undefined : 'grey.50',
          },
        }}
      >
        <CardContent
          sx={{
            display: 'flex',
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            p: 2,
          }}
        >
          <IconButton
            color="primary"
            disabled={disabled}
            sx={{
              bgcolor: 'grey.200',
              '&:hover': {
                bgcolor: 'grey.300',
              },
            }}
            size="large"
          >
            <PlusIcon className="h-6 w-6" />
          </IconButton>
        </CardContent>
      </Card>
    </Tooltip>
  );
};
