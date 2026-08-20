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
      'CLI tool to query OpenAPI JSON specs and extract self-contained endpoint documentation with resolved schemas'
    )
    .version('1.0.1')
    .addHelpText(
      'after',
      `
Alias:
  You can use either 'endp' or 'endp-docs' interchangeably.

Examples:
  $ endp init --spec http://localhost:8080/v3/api-docs
  $ endp get POST /api/v1/auth/login
  $ endp get POST /api/v1/auth/login --format compact
  $ endp get POST /api/v1/auth/login -f markdown
  $ endp list --tag user-controller
  $ endp search bookings
`
    );

  program
    .command('init')
    .description('Initialize config file (.endpointdocsrc.json) in current directory')
    .option('-s, --spec <url>', 'OpenAPI JSON spec URL')
    .addHelpText(
      'after',
      `
Examples:
  $ endp init --spec http://localhost:8080/v3/api-docs
  $ endp init
`
    )
    .action(async (options) => {
      await handleInit(options);
    });

  program
    .command('get <method> <path>')
    .description('Fetch clean definition + resolved DTO schemas for a specific endpoint')
    .option('-s, --spec <url>', 'Override spec URL')
    .option(
      '-f, --format <format>',
      'Output format: json (default), markdown, or compact (dsl/min)',
      'json'
    )
    .addHelpText(
      'after',
      `
Supported Formats:
  compact (or dsl, min)  Token-optimized custom DSL for AI coding agents (>60% token savings)
  markdown               Human-readable Markdown tables with inline DTOs and grouped errors
  json                   Raw resolved JSON object containing operation and filtered schemas

Examples:
  $ endp get POST /api/v1/auth/login
  $ endp get POST /api/v1/auth/login --format compact
  $ endp get POST /api/v1/auth/login -f compact
  $ endp get POST /api/v1/auth/login -f markdown
  $ endp get GET /api/v1/users -s http://localhost:8080/v3/api-docs
`
    )
    .action(async (method, path, options) => {
      await handleGet(method, path, options);
    });

  program
    .command('list')
    .description('List available endpoints from the spec')
    .option('-s, --spec <url>', 'Override spec URL')
    .option('-t, --tag <tag>', 'Filter endpoints by tag')
    .option('-f, --format <format>', 'Output format: text (default) or json', 'text')
    .addHelpText(
      'after',
      `
Examples:
  $ endp list
  $ endp list --tag user-controller
  $ endp list -t booking-controller -f json
`
    )
    .action(async (options) => {
      await handleList(options);
    });

  program
    .command('search <query>')
    .description('Search endpoints by path, method, summary, or tag')
    .option('-s, --spec <url>', 'Override spec URL')
    .option('-f, --format <format>', 'Output format: text (default) or json', 'text')
    .addHelpText(
      'after',
      `
Note:
  Pass a single search term or wrap multi-word/path queries in quotes.

Examples:
  $ endp search bookings
  $ endp search auth
  $ endp search "/api/v1/bookings"
  $ endp search users -f json
`
    )
    .action(async (query, options) => {
      await handleSearch(query, options);
    });

  return program;
}
