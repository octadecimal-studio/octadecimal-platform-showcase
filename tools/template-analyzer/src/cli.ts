#!/usr/bin/env node

/**
 * Template Analyzer CLI
 */

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import ora from 'ora';
import { TemplateAnalyzer } from './analyzer.js';
import { StrapiSchemaGenerator } from './schema-generator.js';
import { CursorPromptGenerator } from './prompt-generator.js';
import type { AnalyzerConfig } from './types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Wczytaj package.json
const packageJson = JSON.parse(
  readFileSync(resolve(__dirname, '../package.json'), 'utf-8')
);

const program = new Command();

program
  .name('template-analyzer')
  .description('AI-powered template analyzer for generating Strapi schemas and Cursor prompts')
  .version(packageJson.version);

/**
 * Komenda: analyze
 * Analizuje szablon i generuje wszystko (schema + prompt)
 */
program
  .command('analyze')
  .description('Analyze template and generate Strapi schema + Cursor prompt')
  .requiredOption('-u, --url <url>', 'Template URL or local file path')
  .requiredOption('-p, --project <name>', 'Project name')
  .option('-o, --output <dir>', 'Output directory', './output')
  .option('-k, --api-key <key>', 'Anthropic API key (or use ANTHROPIC_API_KEY env)')
  .option('-v, --verbose', 'Verbose logging', false)
  .action(async (options) => {
    const spinner = ora('Initializing...').start();

    try {
      // Konfiguracja
      const apiKey = options.apiKey || process.env.ANTHROPIC_API_KEY;
      
      if (!apiKey) {
        throw new Error('Anthropic API key required. Set ANTHROPIC_API_KEY env or use --api-key');
      }

      const config: AnalyzerConfig = {
        anthropicApiKey: apiKey,
        verbose: options.verbose,
      };

      // 1. Analiza szablonu
      spinner.text = 'Analyzing template...';
      const analyzer = new TemplateAnalyzer(config);
      
      const analysis = await analyzer.analyze({
        templateUrl: options.url,
        projectName: options.project,
        outputDir: options.output,
        saveToFile: true,
        generateCursorPrompt: true,
      });

      spinner.succeed(chalk.green('Template analyzed!'));
      console.log(chalk.dim(`  Sections: ${analysis.sections.length}`));
      console.log(chalk.dim(`  Components: ${analysis.components.length}`));
      console.log(chalk.dim(`  Content Types: ${analysis.contentTypes.length}`));

      // 2. Generowanie schematu Strapi
      spinner.start('Generating Strapi schema...');
      const schemaGenerator = new StrapiSchemaGenerator(config);
      
      const schema = await schemaGenerator.generate(analysis, {
        outputDir: options.output,
        outputFile: 'strapi-schema.json',
      });

      spinner.succeed(chalk.green('Strapi schema generated!'));
      console.log(chalk.dim(`  File: ${options.output}/strapi-schema.json`));

      // 3. Generowanie prompta dla Cursora
      spinner.start('Generating Cursor prompt...');
      const promptGenerator = new CursorPromptGenerator(config);
      
      await promptGenerator.generate(analysis, schema, options.project, {
        outputDir: options.output,
        outputFile: 'CURSOR_PROMPT.md',
      });

      spinner.succeed(chalk.green('Cursor prompt generated!'));
      console.log(chalk.dim(`  File: ${options.output}/CURSOR_PROMPT.md`));

      // 4. Podsumowanie
      console.log('\n' + chalk.bold.green('✓ All done!'));
      console.log(chalk.dim('\nNext steps:'));
      console.log(chalk.dim('  1. Review the generated files'));
      console.log(chalk.dim('  2. Import Strapi schema to CMS'));
      console.log(chalk.dim('  3. Use CURSOR_PROMPT.md in Cursor IDE'));

    } catch (error) {
      spinner.fail(chalk.red('Error: ' + (error as Error).message));
      process.exit(1);
    }
  });

/**
 * Komenda: generate-schema
 * Generuje tylko schemat Strapi (z istniejącej analizy)
 */
program
  .command('generate-schema')
  .description('Generate Strapi schema from existing analysis')
  .requiredOption('-a, --analysis <file>', 'Analysis JSON file')
  .option('-o, --output <file>', 'Output file', 'strapi-schema.json')
  .option('-k, --api-key <key>', 'Anthropic API key (or use ANTHROPIC_API_KEY env)')
  .option('-v, --verbose', 'Verbose logging', false)
  .action(async (options) => {
    const spinner = ora('Generating Strapi schema...').start();

    try {
      const apiKey = options.apiKey || process.env.ANTHROPIC_API_KEY;
      
      if (!apiKey) {
        throw new Error('Anthropic API key required');
      }

      // Wczytaj analizę
      const analysis = JSON.parse(readFileSync(options.analysis, 'utf-8'));

      // Generuj schemat
      const config: AnalyzerConfig = {
        anthropicApiKey: apiKey,
        verbose: options.verbose,
      };

      const generator = new StrapiSchemaGenerator(config);
      const schema = await generator.generate(analysis, {
        outputFile: options.output,
      });

      spinner.succeed(chalk.green('Schema generated!'));
      console.log(chalk.dim(`  File: ${options.output}`));

    } catch (error) {
      spinner.fail(chalk.red('Error: ' + (error as Error).message));
      process.exit(1);
    }
  });

/**
 * Komenda: generate-prompt
 * Generuje tylko prompt dla Cursora (z istniejącej analizy i schematu)
 */
program
  .command('generate-prompt')
  .description('Generate Cursor prompt from existing analysis and schema')
  .requiredOption('-a, --analysis <file>', 'Analysis JSON file')
  .requiredOption('-s, --schema <file>', 'Strapi schema JSON file')
  .requiredOption('-p, --project <name>', 'Project name')
  .option('-o, --output <file>', 'Output file', 'CURSOR_PROMPT.md')
  .option('-k, --api-key <key>', 'Anthropic API key (or use ANTHROPIC_API_KEY env)')
  .option('-v, --verbose', 'Verbose logging', false)
  .action(async (options) => {
    const spinner = ora('Generating Cursor prompt...').start();

    try {
      const apiKey = options.apiKey || process.env.ANTHROPIC_API_KEY;
      
      if (!apiKey) {
        throw new Error('Anthropic API key required');
      }

      // Wczytaj dane
      const analysis = JSON.parse(readFileSync(options.analysis, 'utf-8'));
      const schema = JSON.parse(readFileSync(options.schema, 'utf-8'));

      // Generuj prompt
      const config: AnalyzerConfig = {
        anthropicApiKey: apiKey,
        verbose: options.verbose,
      };

      const generator = new CursorPromptGenerator(config);
      await generator.generate(analysis, schema, options.project, {
        outputFile: options.output,
      });

      spinner.succeed(chalk.green('Prompt generated!'));
      console.log(chalk.dim(`  File: ${options.output}`));

    } catch (error) {
      spinner.fail(chalk.red('Error: ' + (error as Error).message));
      process.exit(1);
    }
  });

// Parse arguments
program.parse();
