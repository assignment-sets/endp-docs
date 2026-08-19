import { Command } from 'commander';
import { handleInit } from './commands/init.js';
import { handleGet } from './commands/get.js';
import { handleList } from './commands/list.js';
import { handleSearch } from './commands/search.js';

export function createCli(): Command {
  const program = new Command();

  program
    .name('endp-docs')
    .description(
      'CLI tool to query OpenAPI JSON specs and extract self-contained endpoint documentation with resolved DTO schemas'
    )
    .version('1.0.0');

  program
    .command('init')
    .description('Initialize config file (.endpointdocsrc.json) in current directory')
    .option('-s, --spec <url>', 'OpenAPI JSON spec URL')
    .action(async (options) => {
      await handleInit(options);
    });

  program
    .command('get <method> <path>')
    .description('Fetch clean definition + resolved DTO schemas for a specific endpoint')
    .option('-s, --spec <url>', 'Override spec URL')
    .option('-f, --format <format>', 'Output format: json (default), markdown, or compact (dsl/min)', 'json')
    .action(async (method, path, options) => {
      await handleGet(method, path, options);
    });

  program
    .command('list')
    .description('List available endpoints from the spec')
    .option('-s, --spec <url>', 'Override spec URL')
    .option('-t, --tag <tag>', 'Filter endpoints by tag')
    .option('-f, --format <format>', 'Output format: text (default) or json', 'text')
    .action(async (options) => {
      await handleList(options);
    });

  program
    .command('search <query>')
    .description('Search endpoints by path, method, summary, or tag')
    .option('-s, --spec <url>', 'Override spec URL')
    .option('-f, --format <format>', 'Output format: text (default) or json', 'text')
    .action(async (query, options) => {
      await handleSearch(query, options);
    });

  return program;
}
