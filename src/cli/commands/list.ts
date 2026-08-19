import { loadConfig } from '../../config/loadConfig.js';
import { fetchSpec } from '../../core/fetchSpec.js';
import { EndpointSummary } from '../../types/openapi.js';

export interface ListOptions {
  spec?: string;
  tag?: string;
  format?: 'json' | 'text';
}

export async function handleList(options: ListOptions): Promise<void> {
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

  const endpoints: EndpointSummary[] = [];

  if (spec.paths) {
    for (const [pathKey, methods] of Object.entries(spec.paths)) {
      for (const [methodKey, op] of Object.entries(methods)) {
        if (!op || typeof op !== 'object') continue;

        const summary = op.summary || '';
        const tags = op.tags || [];
        const operationId = op.operationId;

        if (options.tag) {
          const targetTag = options.tag.toLowerCase();
          const hasTag = tags.some((t) => t.toLowerCase() === targetTag);
          if (!hasTag) continue;
        }

        endpoints.push({
          method: methodKey.toUpperCase(),
          path: pathKey,
          summary: summary || undefined,
          tags: tags.length > 0 ? tags : undefined,
          operationId,
        });
      }
    }
  }

  if (options.format === 'json') {
    process.stdout.write(JSON.stringify(endpoints, null, 2) + '\n');
  } else {
    if (endpoints.length === 0) {
      console.error('No endpoints found.');
      return;
    }

    const lines: string[] = [];
    endpoints.forEach((e) => {
      const summaryStr = e.summary ? ` - ${e.summary}` : '';
      const tagsStr = e.tags ? ` [${e.tags.join(', ')}]` : '';
      lines.push(`${e.method.padEnd(7)} ${e.path}${summaryStr}${tagsStr}`);
    });

    process.stdout.write(lines.join('\n') + '\n');
  }
}
