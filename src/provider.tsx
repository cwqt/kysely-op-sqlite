import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { Kysely } from 'kysely';
import { OpSqliteDialect } from './dialect';
import type { OpSqliteDriverConfig } from './driver';

export type OnError = (error: Error) => void;

export interface KyselyOpSqliteProviderProps<T> extends Omit<OpSqliteDriverConfig, 'onError'> {
  children: ReactNode;
  onInit?: (db: Kysely<T>) => Promise<void>;
  onError?: OnError;
}

interface KyselyContextValue<T> {
  db: Kysely<T> | null;
  isReady: boolean;
  error: Error | null;
}

const KyselyContext = createContext<KyselyContextValue<unknown> | null>(null);

export function KyselyOpSqliteProvider<T>({
  children,
  database,
  debug,
  autoAffinityConversion,
  disableForeignKeys,
  disableStrictModeCreateTable,
  onInit,
  onError,
}: KyselyOpSqliteProviderProps<T>): ReactNode {
  const [db, setDb] = useState<Kysely<T> | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    let kyselyInstance: Kysely<T> | null = null;

    const initDatabase = async () => {
      try {
        const dialect = new OpSqliteDialect({
          database,
          debug,
          autoAffinityConversion,
          disableForeignKeys,
          disableStrictModeCreateTable,
          onError: onError ? (msg, err) => onError(err instanceof Error ? err : new Error(String(err))) : undefined,
        });

        kyselyInstance = new Kysely<T>({ dialect });

        if (onInit) {
          await onInit(kyselyInstance);
        }

        if (mounted) {
          setDb(kyselyInstance);
          setIsReady(true);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        if (mounted) {
          setError(error);
        }
        onError?.(error);
      }
    };

    initDatabase();

    return () => {
      mounted = false;
      if (kyselyInstance) {
        kyselyInstance.destroy().catch(console.error);
      }
    };
  }, [
    database,
    debug,
    autoAffinityConversion,
    disableForeignKeys,
    disableStrictModeCreateTable,
  ]);

  const contextValue: KyselyContextValue<T> = {
    db,
    isReady,
    error,
  };

  return (
    <KyselyContext.Provider value={contextValue as KyselyContextValue<unknown>}>
      {children}
    </KyselyContext.Provider>
  );
}

/**
 * Hook to access the Kysely database instance from context.
 * Must be used within a KyselyOpSqliteProvider.
 */
export function useKysely<T>(): Kysely<T> {
  const context = useContext(KyselyContext);

  if (!context) {
    throw new Error('useKysely must be used within a KyselyOpSqliteProvider');
  }

  if (!context.db) {
    throw new Error('Database not initialized yet. Check isReady before using.');
  }

  return context.db as Kysely<T>;
}

/**
 * Hook to access the full Kysely context including loading/error state.
 */
export function useKyselyContext<T>(): KyselyContextValue<T> {
  const context = useContext(KyselyContext);

  if (!context) {
    throw new Error(
      'useKyselyContext must be used within a KyselyOpSqliteProvider'
    );
  }

  return context as KyselyContextValue<T>;
}
