import { loadConfig } from '../../config/loadConfig.js';
import { fetchSpec } from '../../core/fetchSpec.js';
import { EndpointSummary } from '../../types/openapi.js';

export interface SearchOptions {
  spec?: string;
  format?: 'json' | 'text';
}

export async function handleSearch(
  query: string,
  options: SearchOptions
): Promise<void> {
  let specUrl: string;
  try {
    specUrl = await loadConfig(options.spec);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`Config Error: ${errorMsg}`);
    process.exit(3);
  }

  let spec;
  try {
    spec = await fetchSpec(specUrl);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`Spec Fetch Error: ${errorMsg}`);
    process.exit(2);
  }

  const qLower = query.toLowerCase();
  const results: EndpointSummary[] = [];

  if (spec.paths) {
    for (const [pathKey, methods] of Object.entries(spec.paths)) {
      for (const [methodKey, op] of Object.entries(methods)) {
        if (!op || typeof op !== 'object') continue;

        const summary = op.summary || '';
        const description = op.description || '';
        const tags = op.tags || [];
        const operationId = op.operationId || '';

        const match =
          pathKey.toLowerCase().includes(qLower) ||
          methodKey.toLowerCase().includes(qLower) ||
          summary.toLowerCase().includes(qLower) ||
          description.toLowerCase().includes(qLower) ||
          operationId.toLowerCase().includes(qLower) ||
          tags.some((t) => t.toLowerCase().includes(qLower));

        if (match) {
          results.push({
            method: methodKey.toUpperCase(),
            path: pathKey,
            summary: summary || undefined,
            tags: tags.length > 0 ? tags : undefined,
            operationId: operationId || undefined,
          });
        }
      }
    }
  }

  if (options.format === 'json') {
    process.stdout.write(JSON.stringify(results, null, 2) + '\n');
  } else {
    if (results.length === 0) {
      console.error(`No endpoints matching "${query}".`);
      return;
    }

    const lines: string[] = [];
    results.forEach((e) => {
      const summaryStr = e.summary ? ` - ${e.summary}` : '';
      const tagsStr = e.tags ? ` [${e.tags.join(', ')}]` : '';
      lines.push(`${e.method.padEnd(7)} ${e.path}${summaryStr}${tagsStr}`);
    });

    process.stdout.write(lines.join('\n') + '\n');
  }
}
