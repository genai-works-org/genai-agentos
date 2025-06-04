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
      validate: (value: string) => value.length >= 6,
      message: 'Password must be at least 6 characters long',
    },
    {
      validate: (value: string) => !value.includes(' '),
      message: 'Password cannot contain spaces',
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
