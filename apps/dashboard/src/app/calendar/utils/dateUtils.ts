import { DateTime, type Zone } from 'luxon';

export function safeParseDate(
  dateInput: string | Date | null | undefined,
  zone?: string | Zone,
): DateTime {
  if (!dateInput) return DateTime.invalid('Invalid input');

  return typeof dateInput === 'string'
    ? DateTime.fromISO(dateInput, { zone: zone || 'local' })
    : DateTime.fromJSDate(dateInput, { zone: zone || 'local' });
}

export function safeToISOString(
  dateInput: string | Date | null | undefined,
  zone?: string | Zone,
): string | null {
  const dateTime = safeParseDate(dateInput, zone);
  return dateTime.isValid ? dateTime.toUTC().toISO() : null;
}

export function formatForDatabase(
  dateInput: string | Date | null | undefined,
  zone?: string | Zone,
): string | null {
  const dateTime = safeParseDate(dateInput, zone);
  return dateTime.isValid
    ? dateTime.toUTC().toSQL({ includeOffset: true })
    : null;
}

export function formatForDisplay(
  dateInput: string | Date | null | undefined,
  format = 'yyyy-MM-dd HH:mm:ss',
  zone?: string | Zone,
): string {
  const dateTime = safeParseDate(dateInput, zone);
  return dateTime.isValid ? dateTime.toLocal().toFormat(format) : '';
}

export function getCurrentTimestamp(): string {
  return DateTime.utc().toSQL({ includeOffset: true });
}
