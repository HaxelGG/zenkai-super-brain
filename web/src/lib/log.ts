/**
 * Logging estructurado de una línea por evento (JSON) para las funciones serverless.
 *
 * Por qué JSON: en Vercel los logs se agrupan por línea. Un `console.error(err)` con
 * stack multilínea se parte en N entradas inconexas y es inbuscable. Una línea JSON
 * es una entrada, filtrable por `event` y correlacionable por `requestId`.
 *
 * No añade dependencias: es console.* con un shape fijo.
 */

export type LogLevel = 'info' | 'warn' | 'error';

export interface LogFields {
  /** Correlaciona todas las líneas de una misma request. */
  requestId?: string;
  [key: string]: unknown;
}

/** Serializa un error a algo loggeable sin perder el stack ni reventar en JSON.stringify. */
export const serializeError = (err: unknown): Record<string, unknown> => {
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: err.stack,
      ...(err.cause !== undefined ? { cause: String(err.cause) } : {}),
    };
  }
  return { name: 'NonError', message: String(err) };
};

export const log = (level: LogLevel, event: string, fields: LogFields = {}): void => {
  let line: string;
  try {
    line = JSON.stringify({ level, event, ts: new Date().toISOString(), ...fields });
  } catch {
    // Campos con referencias circulares · nunca dejamos que el logger tumbe el handler.
    line = JSON.stringify({ level, event, ts: new Date().toISOString(), unserializableFields: true });
  }
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
};

/** Id corto para correlacionar la request en logs y en el body de error devuelto al cliente. */
export const newRequestId = (): string => {
  try {
    return crypto.randomUUID().slice(0, 8);
  } catch {
    return Math.random().toString(36).slice(2, 10);
  }
};
