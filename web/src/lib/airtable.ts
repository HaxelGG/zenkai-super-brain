import Airtable from 'airtable';

export interface DemoRecord {
  texto_usuario: string;
  sector_detectado: string;
  tier_recomendado: string;
  propuesta_json: string;
  ip_hash: string;
  email_capturado?: string;
  whatsapp_capturado?: string;
}

let cachedBase: ReturnType<typeof Airtable.base> | null = null;

const getBase = () => {
  if (cachedBase) return cachedBase;
  const token = import.meta.env.AIRTABLE_TOKEN;
  const baseId = import.meta.env.AIRTABLE_BASE_VENTAS;
  if (!token || !baseId) {
    throw new Error('airtable not configured · AIRTABLE_TOKEN or AIRTABLE_BASE_VENTAS missing');
  }
  Airtable.configure({ apiKey: token });
  cachedBase = Airtable.base(baseId);
  return cachedBase;
};

const TABLE_NAME = 'demos';

export const createDemo = (record: DemoRecord): Promise<{ id: string }> =>
  new Promise((resolve, reject) => {
    let base: ReturnType<typeof Airtable.base>;
    try {
      base = getBase();
    } catch (err) {
      reject(err);
      return;
    }
    // El SDK v0.12 acepta callback estilo node · tipado del package es laxo, casteamos
    const fields = { ...record } as Record<string, unknown>;
    base(TABLE_NAME).create(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [{ fields }] as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (err: Error | null, records: any) => {
        if (err) {
          reject(err);
          return;
        }
        if (!records || !records[0] || !records[0].id) {
          reject(new Error('airtable createDemo did not return an id'));
          return;
        }
        resolve({ id: records[0].id });
      },
    );
  });

/** Solo para tests · resetea el cache del base singleton. */
export const _resetCache = () => {
  cachedBase = null;
};
