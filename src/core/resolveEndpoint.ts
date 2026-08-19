import { OpenApiSpec, ResolvedEndpoint } from '../types/openapi.js';
import { findRefs, resolveAllRefs } from './resolveRefs.js';

export function resolveEndpoint(
  spec: OpenApiSpec,
  method: string,
  path: string
): ResolvedEndpoint | null {
  if (!spec || !spec.paths) {
    return null;
  }

  const normalizedMethod = method.toLowerCase();
  
  // Case-insensitive path search fallback if exact path case isn't found directly
  let targetPath = path;
  if (!spec.paths[targetPath]) {
    const matchedKey = Object.keys(spec.paths).find(
      (p) => p.toLowerCase() === path.toLowerCase()
    );
    if (matchedKey) {
      targetPath = matchedKey;
    } else {
      return null;
    }
  }

  const endpointDef = spec.paths[targetPath]?.[normalizedMethod];
  if (!endpointDef) {
    return null;
  }

  const allAvailableSchemas = {
    ...((spec.definitions || {}) as Record<string, Record<string, unknown>>),
    ...((spec.components?.schemas || {}) as Record<string, Record<string, unknown>>),
  };

  // Extract initial references from operation definition
  const initialRefs = findRefs(endpointDef);

  // Recursively expand all references
  const usedSchemas = resolveAllRefs(initialRefs, allAvailableSchemas);

  // Build clean dictionary of filtered schemas
  const filteredSchemas: Record<string, Record<string, unknown>> = {};
  usedSchemas.forEach((schemaName) => {
    if (allAvailableSchemas[schemaName]) {
      filteredSchemas[schemaName] = allAvailableSchemas[schemaName];
    }
  });

  const securitySchemes = (spec.components?.securitySchemes || {}) as Record<
    string,
    Record<string, unknown>
  >;

  return {
    path: targetPath,
    method: normalizedMethod,
    definition: endpointDef,
    components: {
      schemas: filteredSchemas,
      securitySchemes,
    },
  };
}
