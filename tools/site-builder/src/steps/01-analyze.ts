/**
 * Step 1: Analiza szablonu
 * Wykorzystuje Template Analyzer do analizy HTML i generowania schematów
 */

import { TemplateAnalyzer, StrapiSchemaGenerator, CursorPromptGenerator } from '@octadecimal/template-analyzer';
import type { StepHandler, BuildContext, StepResult } from '../types/index.js';

export class AnalyzeStep implements StepHandler {
  name = '01-analyze';
  description = 'Analiza szablonu HTML przez AI';

  async execute(context: BuildContext): Promise<StepResult> {
    const startTime = Date.now();

    try {
      const { config } = context;

      // 1. Analiza szablonu
      const analyzer = new TemplateAnalyzer({
        anthropicApiKey: config.anthropic.apiKey,
        model: config.anthropic.model,
        verbose: config.verbose,
      });

      context.analysis = await analyzer.analyze({
        templateUrl: config.templateUrl,
        projectName: config.projectName,
      });

      // 2. Generowanie schematu Strapi
      const schemaGen = new StrapiSchemaGenerator({
        anthropicApiKey: config.anthropic.apiKey,
        verbose: config.verbose,
      });

      context.strapiSchema = await schemaGen.generate(context.analysis);

      // 3. Generowanie prompta dla Cursora
      const promptGen = new CursorPromptGenerator({
        anthropicApiKey: config.anthropic.apiKey,
        verbose: config.verbose,
      });

      context.cursorPrompt = await promptGen.generate(
        context.analysis,
        context.strapiSchema,
        config.projectName
      );

      return {
        step: this.name,
        status: 'completed',
        duration: Date.now() - startTime,
        message: `Przeanalizowano szablon: ${context.analysis.sections.length} sekcji, ${context.analysis.components.length} komponentów`,
        data: {
          sections: context.analysis.sections.length,
          components: context.analysis.components.length,
          contentTypes: context.analysis.contentTypes.length,
        },
      };
    } catch (error) {
      return {
        step: this.name,
        status: 'failed',
        duration: Date.now() - startTime,
        message: `Błąd podczas analizy: ${(error as Error).message}`,
        error: error as Error,
      };
    }
  }

  canSkip(context: BuildContext): boolean {
    // Skip jeśli już mamy analizę
    return !!context.analysis && !!context.strapiSchema;
  }
}
