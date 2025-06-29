import { FC } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CreateCardProps {
  buttonText: string;
  onClick: () => void;
  disabled?: boolean;
}

const CreateCard: FC<CreateCardProps> = ({ buttonText, onClick, disabled }) => {
  return (
    <div className="flex items-center justify-center w-[280px] h-auto p-4 bg-neutral-light rounded-lg border border-dashed border-primary-accent">
      <Button
        variant="secondary"
        onClick={onClick}
        disabled={disabled}
        className="w-fit"
      >
        <Plus size={16} />
        {buttonText}
      </Button>
    </div>
  );
};

export default CreateCard;
