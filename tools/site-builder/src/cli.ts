#!/usr/bin/env node

/**
 * Site Builder CLI
 */

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { SiteBuilder } from './builder.js';
import type { SiteBuilderConfig } from './types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const packageJson = JSON.parse(
  readFileSync(resolve(__dirname, '../package.json'), 'utf-8')
);

const program = new Command();

program
  .name('site-builder')
  .description('Automatyczne narzędzie do budowy i wdrażania stron z szablonów HTML')
  .version(packageJson.version);

/**
 * Komenda: deploy
 */
program
  .command('deploy')
  .description('Wdróż stronę z szablonu HTML na VPS')
  .requiredOption('-t, --template <url>', 'URL szablonu HTML')
  .requiredOption('-s, --subdomain <domain>', 'Subdomena (np. example-rental.test)')
  .requiredOption('-v, --vps <host>', 'VPS host (np. debian@203.0.113.10)')
  .option('-p, --project <name>', 'Nazwa projektu', 'website')
  .option('--strapi-url <url>', 'URL Strapi API', 'http://localhost:1337')
  .option('--strapi-token <token>', 'Token Strapi API')
  .option('--strapi-instance <name>', 'Instancja Strapi', 'sites')
  .option('--ovh-key <key>', 'OVH App Key')
  .option('--ovh-secret <secret>', 'OVH App Secret')
  .option('--ovh-consumer <key>', 'OVH Consumer Key')
  .option('--anthropic-key <key>', 'Anthropic API Key (lub ANTHROPIC_API_KEY env)')
  .option('--work-dir <dir>', 'Katalog roboczy', process.cwd())
  .option('--dry-run', 'Dry run (bez deploy)')
  .option('--verbose', 'Verbose logging')
  .action(async (options) => {
    try {
      // Konfiguracja
      const config: SiteBuilderConfig = {
        projectName: options.project,
        templateUrl: options.template,
        subdomain: options.subdomain,
        
        vps: {
          host: options.vps,
          user: options.vps.includes('@') ? options.vps.split('@')[0] : 'debian',
          webRoot: `/var/www/${options.subdomain}`,
        },
        
        strapi: {
          apiUrl: options.strapiUrl,
          apiToken: options.strapiToken || process.env.STRAPI_API_TOKEN || '',
          instance: options.strapiInstance,
        },
        
        anthropic: {
          apiKey: options.anthropicKey || process.env.ANTHROPIC_API_KEY || '',
        },
        
        workDir: options.workDir,
        dryRun: options.dryRun,
        verbose: options.verbose,
      };

      // OVH (opcjonalnie)
      if (options.ovhKey && options.ovhSecret && options.ovhConsumer) {
        config.ovh = {
          appKey: options.ovhKey,
          appSecret: options.ovhSecret,
          consumerKey: options.ovhConsumer,
        };
      }

      // Walidacja
      if (!config.anthropic.apiKey) {
        console.error(chalk.red('❌ Brak Anthropic API Key. Ustaw ANTHROPIC_API_KEY env lub użyj --anthropic-key'));
        process.exit(1);
      }

      // Build
      const builder = new SiteBuilder(config);
      const result = await builder.build();

      process.exit(result.success ? 0 : 1);
      
    } catch (error) {
      console.error(chalk.red('❌ Błąd:'), (error as Error).message);
      process.exit(1);
    }
  });

program.parse();
