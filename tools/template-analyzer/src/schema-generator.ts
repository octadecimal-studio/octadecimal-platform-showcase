/**
 * Strapi Schema Generator
 */

import { writeFile } from 'fs/promises';
import { resolve, dirname } from 'path';
import { mkdir } from 'fs/promises';
import { AnthropicClient } from './anthropic-client.js';
import type {
  TemplateAnalysis,
  GenerateSchemaOptions,
  AnalyzerConfig
} from './types/index.js';

export class StrapiSchemaGenerator {
  private anthropic: AnthropicClient;
  private verbose: boolean;

  constructor(config: AnalyzerConfig) {
    this.anthropic = new AnthropicClient(config);
    this.verbose = config.verbose || false;
  }

  /**
   * Generuje schemat Strapi z analizy szablonu
   */
  async generate(analysis: TemplateAnalysis, options?: GenerateSchemaOptions): Promise<any> {
    if (this.verbose) {
      console.log('\n=== Strapi Schema Generator ===');
      console.log('Content Types:', analysis.contentTypes.length);
    }

    // Konwertuj analizę do JSON string
    const analysisJson = JSON.stringify(analysis, null, 2);

    // Wygeneruj schemat przez Claude
    const schemaJson = await this.anthropic.generateStrapiSchema(analysisJson);

    // Parsuj odpowiedź
    const schema = AnthropicClient.parseJSON(schemaJson);

    if (this.verbose) {
      console.log('✓ Schemat wygenerowany');
    }

    // Zapisz do pliku jeśli podano opcje
    if (options?.outputFile) {
      await this.saveToFile(schema, options);
    }

    return schema;
  }

  /**
   * Zapisuje schemat do pliku JSON
   */
  private async saveToFile(schema: any, options: GenerateSchemaOptions): Promise<void> {
    const outputDir = options.outputDir || process.cwd();
    const outputFile = options.outputFile || 'strapi-schema.json';
    const fullPath = resolve(outputDir, outputFile);

    // Upewnij się że katalog istnieje
    await mkdir(dirname(fullPath), { recursive: true });

    // Zapisz JSON
    await writeFile(fullPath, JSON.stringify(schema, null, 2), 'utf-8');

    if (this.verbose) {
      console.log('✓ Schemat zapisany:', fullPath);
    }
  }

  /**
   * Generuje przykładowe dane (seed data) na podstawie schematu
   */
  async generateSeedData(schema: any): Promise<any> {
    // TODO: Implementacja generowania przykładowych danych
    // Wykorzystaj Claude do wygenerowania sensownych przykładowych danych
    return {};
  }
}
