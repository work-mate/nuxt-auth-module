import type { ZodType } from "zod";

const map = new Map<string, ZodType>();

export const endpointSchemas = {
  set(key: string, value: ZodType): void {
    map.set(key, value);
  },
  get(key: string): ZodType | undefined {
    return map.get(key);
  },
};

export function defineAuthEndpointSchemas(schemas: Record<string, ZodType>): void {
  for (const [key, schema] of Object.entries(schemas)) {
    map.set(key, schema);
  }
}
