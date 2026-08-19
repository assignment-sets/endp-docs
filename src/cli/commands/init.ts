import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

export interface InitOptions {
  spec?: string;
}

export async function handleInit(options: InitOptions): Promise<void> {
  let specUrl = options.spec;

  if (!specUrl && process.stdin.isTTY) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stderr,
    });

    specUrl = await new Promise<string>((resolve) => {
      rl.question(
        'Enter raw OpenAPI JSON spec URL (e.g. http://localhost:8080/v3/api-docs): ',
        (answer) => {
          rl.close();
          resolve(answer.trim());
        }
      );
    });
  }

  if (!specUrl || specUrl.trim().length === 0) {
    console.error('Error: Spec URL is required. Usage: endpoint-docs init --spec <url>');
    process.exit(3);
  }

  const configPath = path.join(process.cwd(), '.endpointdocsrc.json');
  const configData = {
    specUrl: specUrl.trim(),
  };

  try {
    fs.writeFileSync(configPath, JSON.stringify(configData, null, 2) + '\n', 'utf-8');
    console.error(`Successfully initialized config at ${configPath}`);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`Error writing config file to ${configPath}: ${errorMsg}`);
    process.exit(2);
  }
}
