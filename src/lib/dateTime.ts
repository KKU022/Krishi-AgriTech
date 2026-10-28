export function formatTimestamp(value: string | undefined, options?: Intl.DateTimeFormatOptions): string {
  if (!value) return 'Timestamp unavailable';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Timestamp unavailable';
  return date.toLocaleString(undefined, options);
}
