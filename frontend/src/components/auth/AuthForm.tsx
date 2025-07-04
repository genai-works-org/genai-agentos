import type { FC, FormEvent, ChangeEvent } from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { validateField } from '../../utils/validation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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

    if (setRepeatPassword && repeatPassword !== password) {
      setValidationErrors(prev => ({
        ...prev,
        repeatPassword: 'Passwords do not match',
      }));
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
          <Input
            id="name"
            name="name"
            label="Name"
            placeholder="Name"
            value={name}
            onChange={handleNameChange}
            error={validationErrors.username}
          />
          <Input
            id="password"
            name="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            secure
            value={password}
            onChange={handlePasswordChange}
            error={validationErrors.password}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
          />
          {setRepeatPassword && (
            <Input
              id="repeatPassword"
              name="repeatPassword"
              label="Confirm Password"
              type={showRepeatPassword ? 'text' : 'password'}
              placeholder="Confirm Password"
              secure
              value={repeatPassword || ''}
              onChange={handleRepeatPasswordChange}
              onBlur={onRepeatPasswordBlur}
              error={validationErrors.repeatPassword}
              showPassword={showRepeatPassword}
              setShowPassword={setShowRepeatPassword}
            />
          )}
        </div>
        <Button type="submit">{buttonText}</Button>
      </form>

      <p className="flex items-center gap-6 mt-4 font-medium text-center text-text-light">
        <span className="w-full h-px bg-neutral-border" />
        <span>or</span>
        <span className="w-full h-px bg-neutral-border" />
      </p>

      <div className="mt-4 flex justify-center gap-2">
        <p className="font-medium text-text-light">{footerText}</p>
        <Button variant="link" size="link" asChild>
          <Link to={footerLinkTo}>{footerLinkText}</Link>
        </Button>
      </div>
    </div>
  );
};

export default AuthForm;
