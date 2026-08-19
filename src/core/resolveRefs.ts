/**
  Recursively extract schema names referenced via $ref in an object tree.
 */
export function findRefs(obj: unknown): string[] {
  let refs: string[] = [];
  if (!obj || typeof obj !== 'object') {
    return refs;
  }

  if (Array.isArray(obj)) {
    for (const item of obj) {
      refs = refs.concat(findRefs(item));
    }
    return refs;
  }

  const record = obj as Record<string, unknown>;
  for (const key in record) {
    if (Object.prototype.hasOwnProperty.call(record, key)) {
      const val = record[key];
      if (key === '$ref' && typeof val === 'string') {
        const schemaName = val.split('/').pop();
        if (schemaName) {
          refs.push(schemaName);
        }
      } else if (typeof val === 'object' && val !== null) {
        refs = refs.concat(findRefs(val));
      }
    }
  }

  return refs;
}

/**
 * Iteratively resolves all transitive schema references until no new reference is discovered.
 * Prevents infinite loops on circular dependencies using a Set.
 */
export function resolveAllRefs(
  initialRefs: string[],
  schemas: Record<string, Record<string, unknown>> = {}
): Set<string> {
  const usedSchemas = new Set<string>(initialRefs);
  let addedNew = true;

  while (addedNew) {
    addedNew = false;
    for (const schemaName of Array.from(usedSchemas)) {
      const schemaBody = schemas[schemaName];
      if (schemaBody) {
        const subRefs = findRefs(schemaBody);
        for (const ref of subRefs) {
          if (!usedSchemas.has(ref)) {
            usedSchemas.add(ref);
            addedNew = true;
          }
        }
      }
    }
  }

  return usedSchemas;
}
