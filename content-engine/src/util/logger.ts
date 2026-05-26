type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  ts: string;
  run_id: string;
  module: string;
  level: LogLevel;
  event: string;
  duration_ms?: number;
  error?: { message: string; stack?: string; requestId?: string };
  [key: string]: unknown;
}

let globalRunId = 'unknown';

export function setRunId(runId: string): void {
  globalRunId = runId;
}

export function createLogger(module: string) {
  function log(level: LogLevel, event: string, extra?: Record<string, unknown>): void {
    const entry: LogEntry = {
      ts: new Date().toISOString(),
      run_id: globalRunId,
      module,
      level,
      event,
      ...extra,
    };
    const line = JSON.stringify(entry);
    if (level === 'error') {
      console.error(line);
    } else {
      console.log(line);
    }
  }

  return {
    info: (event: string, extra?: Record<string, unknown>) => log('info', event, extra),
    warn: (event: string, extra?: Record<string, unknown>) => log('warn', event, extra),
    error: (event: string, err?: Error, extra?: Record<string, unknown>) =>
      log('error', event, {
        error: err ? { message: err.message, stack: err.stack } : undefined,
        ...extra,
      }),
    debug: (event: string, extra?: Record<string, unknown>) => log('debug', event, extra),
    timed: async <T>(event: string, fn: () => Promise<T>, extra?: Record<string, unknown>): Promise<T> => {
      const start = Date.now();
      try {
        const result = await fn();
        log('info', event, { duration_ms: Date.now() - start, ...extra });
        return result;
      } catch (err) {
        log('error', event, {
          duration_ms: Date.now() - start,
          error: err instanceof Error ? { message: err.message, stack: err.stack } : undefined,
          ...extra,
        });
        throw err;
      }
    },
  };
}
