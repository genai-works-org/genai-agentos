import { FC } from 'react';
import { Save } from 'lucide-react';
import Tooltip from '../shared/Tooltip';
import { Button } from '../ui/button';

interface HeaderButtonsProps {
  message: string;
  onSave: () => void;
  onClear: () => void;
  isSaveDisabled?: boolean;
}

const HeaderButtons: FC<HeaderButtonsProps> = ({
  message,
  onSave,
  onClear,
  isSaveDisabled,
}) => {
  return (
    <div className="flex gap-4">
      <Tooltip message={message}>
        <Button
          variant="secondary"
          onClick={onSave}
          disabled={isSaveDisabled}
          className="w-[108px]"
        >
          <Save size={16} />
          Save
        </Button>
      </Tooltip>
      <Button variant="remove" onClick={onClear} className="w-[88px]">
        Clear
      </Button>
    </div>
  );
};

export default HeaderButtons;
