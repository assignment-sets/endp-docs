import { OpenApiSpec } from '../types/openapi.js';

export function findSimilarEndpoints(
  spec: OpenApiSpec,
  targetMethod: string,
  targetPath: string
): string[] {
  if (!spec.paths) return [];

  const normalizedMethod = targetMethod.toLowerCase();
  const normalizedPath = targetPath.toLowerCase();
  const suggestions: string[] = [];

  for (const [pathKey, methods] of Object.entries(spec.paths)) {
    const pLower = pathKey.toLowerCase();

    // Exact path match, different method
    if (pLower === normalizedPath) {
      for (const m of Object.keys(methods)) {
        suggestions.push(`${m.toUpperCase()} ${pathKey}`);
      }
      continue;
    }

    // Partial substring match in path
    if (pLower.includes(normalizedPath) || normalizedPath.includes(pLower)) {
      for (const m of Object.keys(methods)) {
        if (m.toLowerCase() === normalizedMethod || suggestions.length < 5) {
          suggestions.push(`${m.toUpperCase()} ${pathKey}`);
        }
      }
    }
  }

  // Deduplicate and cap to top 5 suggestions
  return Array.from(new Set(suggestions)).slice(0, 5);
}
