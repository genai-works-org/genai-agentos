export const normalizeString = (str: string) => {
  if (!str) return '';
  const parts = str.split('_');
  return parts.length > 1 ? parts.slice(0, -1).join(' ') : str;
};
