import { loadConfig } from '../../config/loadConfig.js';
import { fetchSpec } from '../../core/fetchSpec.js';
import { resolveEndpoint } from '../../core/resolveEndpoint.js';
import {
  toJsonFormatter,
  toMarkdownFormatter,
  toCompactFormatter,
} from '../../core/formatters.js';
import { findSimilarEndpoints } from '../../utils/matcher.js';

export interface GetOptions {
  spec?: string;
  format?: 'json' | 'markdown' | 'compact' | 'dsl' | 'min';
}

export async function handleGet(
  method: string,
  path: string,
  options: GetOptions
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

  const resolved = resolveEndpoint(spec, method, path);

  if (!resolved) {
    console.error(`Error: Endpoint "${method.toUpperCase()} ${path}" not found in spec at ${specUrl}`);
    
    const suggestions = findSimilarEndpoints(spec, method, path);
    if (suggestions.length > 0) {
      console.error('\nDid you mean one of these?');
      suggestions.forEach((s) => console.error(`  - ${s}`));
    }
    
    process.exit(1);
  }

  const fmt = (options.format || 'json').toLowerCase();
  let output: string;

  if (fmt === 'markdown') {
    output = toMarkdownFormatter(resolved);
  } else if (fmt === 'compact' || fmt === 'dsl' || fmt === 'min') {
    output = toCompactFormatter(resolved);
  } else {
    output = toJsonFormatter(resolved);
  }

  // Pure output to stdout
  process.stdout.write(output + '\n');
}
