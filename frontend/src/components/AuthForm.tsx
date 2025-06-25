import type { FC, FormEvent, ChangeEvent } from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { validateField } from '../utils/validation';
import TextInput from './shared/TextInput';
import Button from './shared/Button';

interface AuthFormProps {
  title: string;
  subtitle: string;
  buttonText: string;
  name: string;
  setName: (name: string) => void;
  password: string;
  setPassword: (password: string) => void;
  repeatPassword?: string;
  setRepeatPassword?: (password: string) => void;
  onRepeatPasswordBlur?: () => void;
  onSubmit: (e: FormEvent) => void;
  footerText: string;
  footerLinkText: string;
  footerLinkTo: string;
}

const AuthForm: FC<AuthFormProps> = ({
  title,
  subtitle,
  buttonText,
  name,
  setName,
  password,
  setPassword,
  repeatPassword,
  setRepeatPassword,
  onRepeatPasswordBlur,
  onSubmit,
  footerText,
  footerLinkText,
  footerLinkTo,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({});

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    const error = validateField('username', value);
    setValidationErrors(prev => ({ ...prev, username: error || '' }));
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    const error = validateField('password', value);
    setValidationErrors(prev => ({ ...prev, password: error || '' }));
  };

  const handleRepeatPasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!setRepeatPassword) return;
    const value = e.target.value;
    setRepeatPassword(value);
    let error = value !== password ? 'Passwords do not match' : '';
    error = validationErrors.password ? 'Check your password' : error;
    setValidationErrors(prev => ({ ...prev, repeatPassword: error || '' }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const usernameError = validateField('username', name);
    const passwordError = validateField('password', password);

    if (usernameError || passwordError) {
      setValidationErrors({
        username: usernameError || '',
        password: passwordError || '',
      });
      return;
    }

    onSubmit(e);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      <p className="font-medium text-text-secondary mb-6">{subtitle}</p>
      <form className="space-y-8" onSubmit={handleSubmit}>
        <div className="space-y-4">
          <TextInput
            id="name"
            name="name"
            label="Name"
            placeholder="Name"
            required
            value={name}
            onChange={handleNameChange}
            error={validationErrors.username}
          />
          <TextInput
            id="password"
            name="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            required
            value={password}
            onChange={handlePasswordChange}
            error={validationErrors.password}
            rightSection={
              <button
                onClick={e => {
                  e.preventDefault();
                  setShowPassword(!showPassword);
                }}
                className="absolute right-3 top-9"
              >
                {showPassword ? (
                  <Eye className="h-5 w-5" />
                ) : (
                  <EyeOff className="h-5 w-5" />
                )}
              </button>
            }
          />
          {setRepeatPassword && (
            <TextInput
              id="repeatPassword"
              name="repeatPassword"
              label="Confirm Password"
              type={showRepeatPassword ? 'text' : 'password'}
              placeholder="Confirm Password"
              required
              value={repeatPassword || ''}
              onChange={handleRepeatPasswordChange}
              onBlur={onRepeatPasswordBlur}
              error={validationErrors.repeatPassword}
              rightSection={
                <button
                  onClick={e => {
                    e.preventDefault();
                    setShowRepeatPassword(!showRepeatPassword);
                  }}
                  className="absolute right-3 top-9"
                >
                  {showRepeatPassword ? (
                    <Eye className="h-5 w-5" />
                  ) : (
                    <EyeOff className="h-5 w-5" />
                  )}
                </button>
              }
            />
          )}
        </div>
        <Button type="submit">{buttonText}</Button>
      </form>

      <p className="mt-4 font-medium text-text-light text-center">
        {footerText}{' '}
        <span className="ml-2">
          <Link to={footerLinkTo} className="font-medium text-primary-accent">
            {footerLinkText}
          </Link>
        </span>
      </p>
    </div>
  );
};

export default AuthForm;
