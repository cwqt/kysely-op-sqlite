import {
  SqliteAdapter,
  SqliteIntrospector,
  SqliteQueryCompiler,
  type DatabaseIntrospector,
  type Dialect,
  type DialectAdapter,
  type Driver,
  type Kysely,
  type QueryCompiler,
} from 'kysely';
import { OpSqliteDriver, type OpSqliteDriverConfig } from './driver';

export type OpSqliteDialectConfig = OpSqliteDriverConfig;

export class OpSqliteDialect implements Dialect {
  private readonly config: OpSqliteDialectConfig;

  constructor(config: OpSqliteDialectConfig) {
    this.config = config;
  }

  createDriver(): Driver {
    return new OpSqliteDriver(this.config);
  }

  createQueryCompiler(): QueryCompiler {
    return new SqliteQueryCompiler();
  }

  createAdapter(): DialectAdapter {
    return new SqliteAdapter();
  }

  createIntrospector(db: Kysely<unknown>): DatabaseIntrospector {
    return new SqliteIntrospector(db);
  }
}
