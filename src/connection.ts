import type {
  CompiledQuery,
  DatabaseConnection,
  QueryResult,
} from 'kysely';
import type { DB } from '@op-engineering/op-sqlite';
import { serializeParams } from './serialize';
import { deserializeRows } from './deserialize';

export interface OpSqliteConnectionConfig {
  db: DB;
  autoAffinityConversion: boolean;
  disableStrictModeCreateTable: boolean;
  debug: boolean;
  onError?: (message: string, error: unknown) => void;
}

export class OpSqliteConnection implements DatabaseConnection {
  private readonly db: DB;
  private readonly autoAffinityConversion: boolean;
  private readonly disableStrictModeCreateTable: boolean;
  private readonly debug: boolean;
  private readonly onError?: (message: string, error: unknown) => void;

  constructor(config: OpSqliteConnectionConfig) {
    this.db = config.db;
    this.autoAffinityConversion = config.autoAffinityConversion;
    this.disableStrictModeCreateTable = config.disableStrictModeCreateTable;
    this.debug = config.debug;
    this.onError = config.onError;
  }

  async executeQuery<R>(compiledQuery: CompiledQuery): Promise<QueryResult<R>> {
    let sql = compiledQuery.sql;
    const params = serializeParams(compiledQuery.parameters);

    if (!this.disableStrictModeCreateTable) {
      sql = this.appendStrictMode(sql);
    }

    if (this.debug) {
      console.log('[kysely-op-sqlite] Executing:', sql, params);
    }

    try {
      const result = await this.db.execute(sql, params);

      const rows = deserializeRows(
        (result.rows ?? []) as Record<string, unknown>[],
        this.autoAffinityConversion
      ) as R[];

      return {
        rows,
        numAffectedRows:
          result.rowsAffected !== undefined
            ? BigInt(result.rowsAffected)
            : undefined,
        insertId:
          result.insertId !== undefined ? BigInt(result.insertId) : undefined,
      };
    } catch (error) {
      if (this.onError) {
        this.onError(`Query failed: ${sql}`, error);
      }
      throw error;
    }
  }

  async *streamQuery<R>(): AsyncIterableIterator<QueryResult<R>> {
    throw new Error('OpSqliteConnection does not support streaming queries');
  }

  private appendStrictMode(sql: string): string {
    const normalized = sql.toUpperCase().trim();
    if (!normalized.startsWith('CREATE TABLE')) {
      return sql;
    }

    if (normalized.includes(' STRICT')) {
      return sql;
    }

    const trimmed = sql.trimEnd();
    if (trimmed.endsWith(')')) {
      return trimmed + ' STRICT';
    }

    return sql;
  }
}
