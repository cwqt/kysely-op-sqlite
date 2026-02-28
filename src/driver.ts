import type { DatabaseConnection, Driver } from 'kysely';
import { open, type DB } from '@op-engineering/op-sqlite';
import { ConnectionMutex } from './connection-mutex';
import { OpSqliteConnection } from './connection';

export interface OpSqliteDriverConfig {
  database: DB | { name: string; location?: string; encryptionKey?: string };
  disableForeignKeys?: boolean;
  disableStrictModeCreateTable?: boolean;
  autoAffinityConversion?: boolean;
  debug?: boolean;
  onError?: (message: string, error: unknown) => void;
}

export class OpSqliteDriver implements Driver {
  private db: DB | null = null;
  private connection: OpSqliteConnection | null = null;
  private readonly mutex = new ConnectionMutex();
  private readonly config: OpSqliteDriverConfig;
  private initPromise: Promise<void> | null = null;

  constructor(config: OpSqliteDriverConfig) {
    this.config = config;
  }

  async init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.doInit();
    return this.initPromise;
  }

  private async doInit(): Promise<void> {
    if (this.isExistingDb(this.config.database)) {
      this.db = this.config.database;
    } else {
      this.db = open(this.config.database);
    }

    if (!this.config.disableForeignKeys) {
      await this.db.execute('PRAGMA foreign_keys = ON');
    }

    this.connection = new OpSqliteConnection({
      db: this.db,
      autoAffinityConversion: this.config.autoAffinityConversion ?? false,
      disableStrictModeCreateTable:
        this.config.disableStrictModeCreateTable ?? false,
      debug: this.config.debug ?? false,
      onError: this.config.onError,
    });
  }

  async acquireConnection(): Promise<DatabaseConnection> {
    if (!this.connection) {
      await this.init();
    }
    await this.mutex.lock();
    return this.connection!;
  }

  async beginTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery({
      sql: 'BEGIN TRANSACTION',
      parameters: [],
      query: { kind: 'RawNode' } as any,
    });
  }

  async commitTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery({
      sql: 'COMMIT',
      parameters: [],
      query: { kind: 'RawNode' } as any,
    });
  }

  async rollbackTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery({
      sql: 'ROLLBACK',
      parameters: [],
      query: { kind: 'RawNode' } as any,
    });
  }

  async releaseConnection(): Promise<void> {
    this.mutex.unlock();
  }

  async destroy(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.connection = null;
      this.initPromise = null;
    }
  }

  private isExistingDb(
    database: OpSqliteDriverConfig['database']
  ): database is DB {
    return typeof database === 'object' && 'execute' in database;
  }
}
