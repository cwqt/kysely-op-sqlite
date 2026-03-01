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
import { KyselyOpSqliteProvider, useKysely } from 'kysely-op-sqlite'
import type { DB } from './types'

function App() {
  return (
    <KyselyOpSqliteProvider<DB>
      database={{ name: 'myapp.db' }}
      autoAffinityConversion={true}
      onInit={async (db) => {
        // Run migrations, seed data, etc.
        await db.schema
          .createTable('users')
          .ifNotExists()
          .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
          .addColumn('name', 'text', (col) => col.notNull())
          .execute()
      }}
      onError={(error) => console.error(error)}
    >
      <MyComponent />
    </KyselyOpSqliteProvider>
  )
}

function MyComponent() {
  const db = useKysely<DB>()

  // Use db to query...
}
```

### Direct Usage

```tsx
import { Kysely } from 'kysely'
import { OpSqliteDialect } from 'kysely-op-sqlite'
import type { DB } from './types'

const db = new Kysely<DB>({
  dialect: new OpSqliteDialect({
    database: { name: 'myapp.db' },
    autoAffinityConversion: true,
  }),
})

const users = await db.selectFrom('users').selectAll().execute()
```

### Schema Builder with SQLite Types

```tsx
import { SQLiteType } from 'kysely-op-sqlite'

await db.schema
  .createTable('users')
  .addColumn('id', SQLiteType.Integer, (col) => col.primaryKey().autoIncrement())
  .addColumn('name', SQLiteType.String, (col) => col.notNull())
  .addColumn('email', SQLiteType.String)
  .addColumn('created_at', SQLiteType.DateTime, (col) => col.notNull())
  .addColumn('is_active', SQLiteType.Boolean, (col) => col.notNull().defaultTo('true'))
  .execute()
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
  disableMutex?: boolean,             // Disable connection mutex (default: false)
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
  onInit={async (db) => {
    /* ... */
  }}
  onError={(error) => {
    /* ... */
  }}
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

## Architecture: Connection Mutex

This library includes a JavaScript-level mutex that serializes all database operations. Counter-intuitively, this **improves performance** significantly.

### Why a Mutex Helps

Without the mutex, concurrent queries cause SQLite lock contention at the native level. SQLite handles this internally, but with expensive busy-waiting and retries. The JS mutex moves serialization to JavaScript, which is nearly free.

**Without JS mutex (concurrent queries contend at SQLite level):**
```
query1 ━━━━━━━━━━━━━━━━━━━━━━━                             396ms
query2 ━━━━━━━━━━━━━━━━━━━━━━━                             394ms
query3              ━━━━━━━━━━━                            195ms
query4 ━━━━━━━━━━━━━━━━━━━━━━━━━━━                         464ms
query5  ━━━━━━━━━━━━━━━━━━━━━━━━━━                         445ms
                                                 total: 862ms
```

**With JS mutex (queries run sequentially, no contention):**
```
query1 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━     375ms
query2 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━    388ms
query3                          ━━━━━━━━━━━━━━━━━━━━━━━━━  209ms
query4                                                ━━━   25ms
query5                                                ━━━   27ms
                                                 total: 402ms
```

Same queries, but **2x faster** with the mutex because:
1. No SQLite lock contention overhead
2. Later queries benefit from warm caches
3. JS mutex acquire/release is ~0ms vs SQLite busy-wait

### Disabling the Mutex

If you have a specific use case that benefits from concurrent SQLite access (rare), you can disable it:

```tsx
<KyselyOpSqliteProvider<DB> database={{ name: 'myapp.db' }} disableMutex={true}>
  {children}
</KyselyOpSqliteProvider>
```

Or with direct dialect usage:

```tsx
new OpSqliteDialect({
  database: { name: 'myapp.db' },
  disableMutex: true,
})
```

## License

MIT
