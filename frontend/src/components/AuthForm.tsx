import type { FC, FormEvent, ChangeEvent } from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { Eye, EyeOff } from 'lucide-react';
import { validateField } from '../utils/validation';

interface AuthFormProps {
  title: string;
  buttonText: string;
  error?: string;
  passwordError?: string;
  name: string;
  setName: (name: string) => void;
  password: string;
  setPassword: (password: string) => void;
  repeatPassword: string;
  setRepeatPassword?: (password: string) => void;
  onRepeatPasswordBlur: () => void;
  onSubmit: (e: FormEvent) => void;
  footerText: string;
  footerLinkText: string;
  footerLinkTo: string;
}

const AuthForm: FC<AuthFormProps> = ({
  title,
  buttonText,
  error,
  passwordError,
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
  const { theme } = useTheme();
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
    <div className="max-w-md w-full space-y-8 px-4 sm:px-6 lg:px-8">
      <div>
        <h2
          className={`text-center text-3xl font-extrabold ${
            theme === 'light' ? 'text-light-text' : 'text-dark-text'
          }`}
        >
          {title}
        </h2>
      </div>
      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        {error && (
          <div
            className={`text-center text-sm ${
              theme === 'light' ? 'text-red-600' : 'text-red-400'
            }`}
          >
            {error}
          </div>
        )}
        {passwordError && (
          <div
            className={`text-center text-sm ${
              theme === 'light' ? 'text-red-600' : 'text-red-400'
            }`}
          >
            {passwordError}
          </div>
        )}
        <div className="rounded-md shadow-sm space-y-4">
          <div>
            <label htmlFor="name" className="sr-only">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className={`appearance-none rounded-md relative block w-full px-3 py-2 border ${
                theme === 'light'
                  ? 'border-light-secondary-secondary text-light-text placeholder-light-secondary-secondary focus:ring-light-secondary-primary focus:border-light-secondary-primary'
                  : 'border-dark-secondary-secondary text-dark-text placeholder-dark-secondary-secondary focus:ring-dark-secondary-primary focus:border-dark-secondary-primary'
              } focus:outline-none focus:z-10 sm:text-sm`}
              placeholder="Name"
              value={name}
              onChange={handleNameChange}
            />
            {validationErrors.username && (
              <div
                className={`text-sm mt-1 ${
                  theme === 'light' ? 'text-red-600' : 'text-red-400'
                }`}
              >
                {validationErrors.username}
              </div>
            )}
          </div>
          <div className="relative">
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                className={`appearance-none rounded-md relative block w-full px-3 py-2 pr-10 border ${
                  theme === 'light'
                    ? 'border-light-secondary-secondary text-light-text placeholder-light-secondary-secondary focus:ring-light-secondary-primary focus:border-light-secondary-primary'
                    : 'border-dark-secondary-secondary text-dark-text placeholder-dark-secondary-secondary focus:ring-dark-secondary-primary focus:border-dark-secondary-primary'
                } focus:outline-none  sm:text-sm`}
                placeholder="Password"
                value={password}
                onChange={handlePasswordChange}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute inset-y-0 right-0 pr-3 flex items-center ${
                  theme === 'light' ? 'text-light-text' : 'text-dark-text'
                }`}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {validationErrors.password && (
              <div
                className={`text-sm mt-1 ${
                  theme === 'light' ? 'text-red-600' : 'text-red-400'
                }`}
              >
                {validationErrors.password}
              </div>
            )}
          </div>
          {setRepeatPassword && (
            <div className="relative">
              <label htmlFor="repeatPassword" className="sr-only">
                Repeat Password
              </label>
              <div className="relative">
                <input
                  id="repeatPassword"
                  name="repeatPassword"
                  type={showRepeatPassword ? 'text' : 'password'}
                  required
                  className={`appearance-none rounded-md relative block w-full px-3 py-2 pr-10 border ${
                    theme === 'light'
                      ? 'border-light-secondary-secondary text-light-text placeholder-light-secondary-secondary focus:ring-light-secondary-primary focus:border-light-secondary-primary'
                      : 'border-dark-secondary-secondary text-dark-text placeholder-dark-secondary-secondary focus:ring-dark-secondary-primary focus:border-dark-secondary-primary'
                  } focus:outline-none  sm:text-sm`}
                  placeholder="Repeat Password"
                  value={repeatPassword}
                  onChange={handleRepeatPasswordChange}
                  onBlur={onRepeatPasswordBlur}
                />
                <button
                  type="button"
                  onClick={() => setShowRepeatPassword(!showRepeatPassword)}
                  className={`absolute inset-y-0 right-0 pr-3 flex items-center ${
                    theme === 'light' ? 'text-light-text' : 'text-dark-text'
                  }`}
                  tabIndex={-1}
                >
                  {showRepeatPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {validationErrors.repeatPassword && (
                <div
                  className={`text-sm mt-1 ${
                    theme === 'light' ? 'text-red-600' : 'text-red-400'
                  }`}
                >
                  {validationErrors.repeatPassword}
                </div>
              )}
            </div>
          )}
        </div>
        <div>
          <button
            type="submit"
            className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md ${
              theme === 'light'
                ? 'bg-light-secondary-primary text-light-bg hover:bg-light-secondary-secondary'
                : 'bg-dark-secondary-primary text-dark-bg hover:bg-dark-secondary-secondary'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              theme === 'light'
                ? 'focus:ring-light-secondary-primary focus:ring-offset-light-bg'
                : 'focus:ring-dark-secondary-primary focus:ring-offset-dark-bg'
            }`}
          >
            {buttonText}
          </button>
        </div>
        <div className="text-center">
          <Link
            to={footerLinkTo}
            className={`${
              theme === 'light'
                ? 'text-light-secondary-primary hover:text-light-secondary-secondary'
                : 'text-dark-secondary-primary hover:text-dark-secondary-secondary'
            }`}
          >
            {footerText} {footerLinkText}
          </Link>
        </div>
      </form>
    </div>
  );
};

export default AuthForm;
