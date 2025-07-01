import { FC } from 'react';
import {
  Select as SelectWrapper,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SelectProps {
  value: string;
  label?: string;
  options: { value: string; label: string }[];
  onChange?: (value: string) => void;
  disabled?: boolean;
  withAsterisk?: boolean;
}

const Select: FC<SelectProps> = ({
  value,
  onChange,
  label,
  options,
  disabled,
  withAsterisk,
}) => {
  return (
    <div className="w-full min-w-[160px]">
      <SelectWrapper value={value} onValueChange={onChange} disabled={disabled}>
        {label && (
          <SelectGroup>
            <SelectLabel
              className={`${
                withAsterisk
                  ? 'after:content-["*"] after:text-error-main after:ml-1'
                  : ''
              }`}
            >
              {label}
            </SelectLabel>
          </SelectGroup>
        )}
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </SelectWrapper>
    </div>
  );
};

export default Select;
