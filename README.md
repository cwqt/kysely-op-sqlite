# kysely-op-sqlite

A [Kysely](https://github.com/kysely-org/kysely) dialect for [@op-engineering/op-sqlite](https://github.com/OP-Engineering/op-sqlite) - a fast SQLite library for React Native.

## Installation

```bash
npm install kysely-op-sqlite kysely @op-engineering/op-sqlite
# or
yarn add kysely-op-sqlite kysely @op-engineering/op-sqlite
```

## Usage

### With React Provider

```tsx
import { KyselyOpSqliteProvider, useKysely } from 'kysely-op-sqlite';
import type { DB } from './types';

function App() {
  return (
    <KyselyOpSqliteProvider<DB>
      database={{ name: 'myapp.db' }}
      autoAffinityConversion={true}
      onInit={async (db) => {
        // Run migrations, seed data, etc.
        await db.schema.createTable('users')
          .ifNotExists()
          .addColumn('id', 'integer', col => col.primaryKey().autoIncrement())
          .addColumn('name', 'text', col => col.notNull())
          .execute();
      }}
      onError={(error) => console.error(error)}
    >
      <MyComponent />
    </KyselyOpSqliteProvider>
  );
}

function MyComponent() {
  const db = useKysely<DB>();

  // Use db to query...
}
```

### Direct Usage

```tsx
import { Kysely } from 'kysely';
import { OpSqliteDialect } from 'kysely-op-sqlite';
import type { DB } from './types';

const db = new Kysely<DB>({
  dialect: new OpSqliteDialect({
    database: { name: 'myapp.db' },
    autoAffinityConversion: true,
  }),
});

const users = await db.selectFrom('users').selectAll().execute();
```

### Schema Builder with SQLite Types

```tsx
import { SQLiteType } from 'kysely-op-sqlite';

await db.schema
  .createTable('users')
  .addColumn('id', SQLiteType.Integer, col => col.primaryKey().autoIncrement())
  .addColumn('name', SQLiteType.String, col => col.notNull())
  .addColumn('email', SQLiteType.String)
  .addColumn('created_at', SQLiteType.DateTime, col => col.notNull())
  .addColumn('is_active', SQLiteType.Boolean, col => col.notNull().defaultTo('true'))
  .execute();
```

## API

### OpSqliteDialect

The main dialect class for Kysely.

```tsx
new OpSqliteDialect({
  database: { name: 'myapp.db', location?: string, encryptionKey?: string },
  // or pass an existing op-sqlite DB instance
  database: existingDb,

  autoAffinityConversion?: boolean,  // Auto-convert types (default: false)
  disableForeignKeys?: boolean,       // Disable foreign keys (default: false)
  disableStrictModeCreateTable?: boolean, // Disable STRICT tables (default: false)
  debug?: boolean,                    // Log queries (default: false)
  onError?: (message: string, error: unknown) => void,
})
```

### KyselyOpSqliteProvider

React context provider for Kysely.

```tsx
<KyselyOpSqliteProvider<DB>
  database={{ name: 'myapp.db' }}
  autoAffinityConversion={true}
  onInit={async (db) => { /* ... */ }}
  onError={(error) => { /* ... */ }}
>
  {children}
</KyselyOpSqliteProvider>
```

### Hooks

- `useKysely<T>()` - Returns the Kysely instance. Throws if not ready.
- `useKyselyContext<T>()` - Returns `{ db, isReady, error }` for loading states.

### SQLiteType

Type constants for STRICT mode compatible schemas:

- `SQLiteType.String` - TEXT
- `SQLiteType.Integer` - INTEGER
- `SQLiteType.Number` - REAL
- `SQLiteType.Boolean` - TEXT ('true'/'false')
- `SQLiteType.DateTime` - TEXT (ISO 8601)
- `SQLiteType.Blob` - BLOB

## Features

- STRICT mode tables by default (safer schemas)
- Auto affinity conversion (strings to dates, booleans, JSON)
- Connection mutex for safe concurrent access
- React provider with loading/error states

## License

MIT
