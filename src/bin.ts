import { createCli } from './cli/index.js';

const program = createCli();
program.parseAsync(process.argv).catch((err: unknown) => {
  const errorMsg = err instanceof Error ? err.message : String(err);
  console.error(`Unexpected Error: ${errorMsg}`);
  process.exit(2);
});
