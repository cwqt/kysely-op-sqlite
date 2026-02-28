import type { ColumnDataType } from 'kysely';

/**
 * SQLite type constants for use with Kysely schema builder.
 * These map to SQLite STRICT mode compatible types.
 */
export const SQLiteType = {
  String: 'text' as ColumnDataType,
  Integer: 'integer' as ColumnDataType,
  Number: 'real' as ColumnDataType,
  Boolean: 'text' as ColumnDataType, // SQLite doesn't have boolean, store as 'true'/'false'
  DateTime: 'text' as ColumnDataType, // Store as ISO 8601 string
  Blob: 'blob' as ColumnDataType,
} as const;

const ISO_8601_REGEX =
  /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})?)?$/;

export function isStringIso8601(value: string): boolean {
  return ISO_8601_REGEX.test(value);
}

export function isStringBoolean(value: string): boolean {
  return value === 'true' || value === 'false';
}

export function isStringJson(value: string): boolean {
  const trimmed = value.trim();
  return (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  );
}

export function safeParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
