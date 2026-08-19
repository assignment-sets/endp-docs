import { cosmiconfig } from 'cosmiconfig';
import { EndpointDocsConfig } from '../types/openapi.js';

const moduleName = 'endpointdocs';

export async function loadConfig(cliSpecUrl?: string): Promise<string> {
  // Priority 1: Explicit CLI flag
  if (cliSpecUrl && cliSpecUrl.trim().length > 0) {
    return cliSpecUrl.trim();
  }

  // Priority 2: Config file lookup via cosmiconfig
  try {
    const explorer = cosmiconfig(moduleName, {
      searchPlaces: [
        'package.json',
        `.${moduleName}rc`,
        `.${moduleName}rc.json`,
        `.${moduleName}rc.yaml`,
        `.${moduleName}rc.yml`,
        `${moduleName}.config.json`,
        `${moduleName}.config.js`,
      ],
    });

    const result = await explorer.search();
    if (result && result.config) {
      const config = result.config as EndpointDocsConfig;
      if (config.specUrl && typeof config.specUrl === 'string') {
        return config.specUrl.trim();
      }
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`Warning: Failed to load config file: ${errorMsg}`);
  }

  // Neither flag nor config file yielded a specUrl
  throw new Error(
    'No spec URL configured! Please specify --spec <url> or run "endpoint-docs init --spec <url>" to save config.'
  );
}
