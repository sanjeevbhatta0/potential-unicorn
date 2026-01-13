import {
  format,
  formatDistanceToNow,
  parseISO,
  isValid,
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
} from 'date-fns';

export const formatDate = (date: Date | string, formatStr: string = 'PPP'): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isValid(d) ? format(d, formatStr) : '';
};

export const formatRelativeTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '';

  const now = new Date();
  const minutes = differenceInMinutes(now, d);
  const hours = differenceInHours(now, d);
  const days = differenceInDays(now, d);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;

  return formatDistanceToNow(d, { addSuffix: true });
};

export const isDateInRange = (
  date: Date | string,
  start: Date | string,
  end: Date | string
): boolean => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const s = typeof start === 'string' ? parseISO(start) : start;
  const e = typeof end === 'string' ? parseISO(end) : end;

  return isValid(d) && isValid(s) && isValid(e) && d >= s && d <= e;
};

export const parseDate = (dateString: string): Date | null => {
  try {
    const parsed = parseISO(dateString);
    return isValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
};
