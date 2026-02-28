import {
  isStringBoolean,
  isStringIso8601,
  isStringJson,
  safeParse,
} from './helpers';

export function deserialize(value: unknown, autoAffinity: boolean): unknown {
  if (!autoAffinity || typeof value !== 'string') {
    return value;
  }

  if (isStringBoolean(value)) {
    return value === 'true';
  }

  if (isStringIso8601(value)) {
    return new Date(value);
  }

  if (isStringJson(value)) {
    return safeParse(value);
  }

  return value;
}

export function deserializeRow<T extends Record<string, unknown>>(
  row: T,
  autoAffinity: boolean
): T {
  if (!autoAffinity) {
    return row;
  }

  const result: Record<string, unknown> = {};
  for (const key of Object.keys(row)) {
    result[key] = deserialize(row[key], autoAffinity);
  }
  return result as T;
}

export function deserializeRows<T extends Record<string, unknown>>(
  rows: T[],
  autoAffinity: boolean
): T[] {
  if (!autoAffinity) {
    return rows;
  }
  return rows.map((row) => deserializeRow(row, autoAffinity));
}
