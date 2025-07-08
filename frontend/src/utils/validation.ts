import {
  UPPERCASE_CHAR,
  SPECIAL_CHAR,
  LOWERCASE_CHAR,
  DIGIT_CHAR,
} from '../constants/regex';

export interface ValidationRule {
  validate: (value: string) => boolean;
  message: string;
}

export interface ValidationRules {
  [key: string]: ValidationRule[];
}

export const validationRules: ValidationRules = {
  username: [
    {
      validate: (value: string) => value.length >= 3,
      message: 'Username must be at least 3 characters long',
    },
    {
      validate: (value: string) => !value.includes(' '),
      message: 'Username cannot contain spaces',
    },
  ],
  password: [
    {
      validate: (value: string) => value.length >= 8,
      message: 'Password must be at least 8 characters long',
    },
    {
      validate: (value: string) => !value.includes(' '),
      message: 'Password cannot contain spaces',
    },
    {
      validate: (value: string) => UPPERCASE_CHAR.test(value),
      message: 'Password must contain at least one uppercase letter',
    },
    {
      validate: (value: string) => LOWERCASE_CHAR.test(value),
      message: 'Password must contain at least one lowercase letter',
    },
    {
      validate: (value: string) => SPECIAL_CHAR.test(value),
      message: 'Password must contain at least one special character',
    },
    {
      validate: (value: string) => DIGIT_CHAR.test(value),
      message: 'Password must contain at least one digit',
    },
  ],
  maxLastMessages: [
    {
      validate: (value: string) => {
        if (!Number(value)) return true;
        return Number(value) >= 1 && Number(value) <= 20;
      },
      message: 'Value must be between 1 and 20',
    },
  ],
};

export const validateField = (
  fieldName: string,
  value: string,
): string | null => {
  const rules = validationRules[fieldName];
  if (!rules) return null;

  for (const rule of rules) {
    if (!rule.validate(value)) {
      return rule.message;
    }
  }
  return null;
};

export const validateUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    const isHttp = parsed.protocol === 'http:' || parsed.protocol === 'https:';
    const hasHostname = !!parsed.hostname;

    return isHttp && hasHostname;
  } catch {
    return false;
  }
};

export const validateModelsField = (name: string, value: string) => {
  if (!value) {
    return 'Field is required';
  }

  if (name === 'temperature') {
    const num = Number(value);

    if (isNaN(num)) {
      return 'Temperature must be a valid number';
    }

    if (num < 0 || num > 2) {
      return 'Temperature must be between 0 and 2';
    }

    if (Math.round(num * 10) !== num * 10) {
      return 'Temperature must be a multiple of 0.1';
    }
  }

  if (name === 'max_last_messages') {
    const num = Number(value);

    if (isNaN(num)) {
      return 'LLM Message context window must be a valid number';
    }

    if (num < 1 || num > 20) {
      return 'LLM Message context window must be between 1 and 20';
    }

    if (num % 1 !== 0) {
      return 'LLM Message context window must be an integer';
    }
  }

  return null;
};
