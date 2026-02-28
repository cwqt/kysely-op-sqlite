export type SqliteValue =
  | string
  | number
  | null
  | ArrayBuffer
  | ArrayBufferView;

export function serialize(value: unknown): SqliteValue {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return value;
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof ArrayBuffer || ArrayBuffer.isView(value)) {
    return value as ArrayBuffer | ArrayBufferView;
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

export function serializeParams(params: readonly unknown[]): SqliteValue[] {
  return params.map(serialize);
}
