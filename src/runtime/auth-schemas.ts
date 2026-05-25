import type { ZodType } from "zod";

const map = new Map<string, Map<string, ZodType>>();

export const authSchemas = {
  get(provider: string, key: string): ZodType | undefined {
    return map.get(provider)?.get(key);
  },
  set(provider: string, key: string, value: ZodType): void {
    let inner = map.get(provider);
    if (!inner) {
      inner = new Map();
      map.set(provider, inner);
    }
    inner.set(key, value);
  },
};

export function defineAuthSchemas(
  schemas: Record<string, Record<string, ZodType>>,
): void {
  for (const [provider, providerSchemas] of Object.entries(schemas)) {
    for (const [key, schema] of Object.entries(providerSchemas)) {
      authSchemas.set(provider, key, schema);
    }
  }
}
