import { OpenApiSpec } from '../types/openapi.js';

export async function fetchSpec(specUrl: string): Promise<OpenApiSpec> {
  let response: Response;
  try {
    response = await fetch(specUrl, {
      headers: {
        Accept: 'application/json, application/yaml, text/plain, */*',
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to reach spec URL "${specUrl}": ${errorMsg}`);
  }

  if (!response.ok) {
    throw new Error(
      `Failed to fetch spec from "${specUrl}" (HTTP ${response.status} ${response.statusText})`
    );
  }

  let text: string;
  try {
    text = await response.text();
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to read response body from "${specUrl}": ${errorMsg}`);
  }

  let data: OpenApiSpec;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      `Response from "${specUrl}" is not valid JSON. Ensure the URL points to raw OpenAPI JSON spec.`
    );
  }

  if (!data || typeof data !== 'object' || (!data.paths && !data.swagger && !data.openapi)) {
    throw new Error(
      `Invalid OpenAPI spec structure from "${specUrl}". Missing 'paths' object.`
    );
  }

  return data;
}
