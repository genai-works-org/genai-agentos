import { ChangeEvent, FC, ReactNode } from 'react';

interface TextInputProps {
  id: string;
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  required?: boolean;
  error?: string;
  rightSection?: ReactNode;
}

const TextInput: FC<TextInputProps> = ({
  id,
  name,
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  required,
  error,
  rightSection,
}) => {
  return (
    <div className="relative">
      <label htmlFor={id} className="block text-xs text-text-secondary mb-2">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        className="block w-full h-12 px-3 py-2 border rounded-xl focus:outline-none"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
      />
      {rightSection}
      {error && <p className="text-xs mt-1 text-error-main">{error}</p>}
    </div>
  );
};

export default TextInput;
