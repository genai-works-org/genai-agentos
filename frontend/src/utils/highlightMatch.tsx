export const highlightMatch = (
  text: string,
  match: string,
  isDescription: boolean = false,
) => {
  if (!match) return text;
  const idx = text.toLowerCase().indexOf(match.toLowerCase());
  if (idx === -1) return text;

  if (!isDescription) {
    // For name, show full text with highlight
    return (
      <>
        {text.slice(0, idx)}
        <span style={{ background: 'yellow', fontWeight: 600 }}>
          {text.slice(idx, idx + match.length)}
        </span>
        {text.slice(idx + match.length)}
      </>
    );
  } else {
    // For description, show only portion around match
    const start = Math.max(0, idx - 20);
    const end = Math.min(text.length, idx + match.length + 20);
    return (
      <>
        {start > 0 ? '...' : ''}
        {text.slice(start, idx)}
        <span style={{ background: 'yellow', fontWeight: 600 }}>
          {text.slice(idx, idx + match.length)}
        </span>
        {text.slice(idx + match.length, end)}
        {end < text.length ? '...' : ''}
      </>
    );
  }
};
