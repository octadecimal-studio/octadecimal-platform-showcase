/**
 * Step 2: Import schematu do Strapi
 */

import { StrapiAPIClient } from '../integrations/strapi-api.js';
import type { StepHandler, BuildContext, StepResult } from '../types/index.js';

export class StrapiImportStep implements StepHandler {
  name = '02-strapi-import';
  description = 'Import schematów Content Types do Strapi';

  async execute(context: BuildContext): Promise<StepResult> {
    const startTime = Date.now();

    try {
      const { config, strapiSchema } = context;

      if (!strapiSchema) {
        throw new Error('Brak schematu Strapi - uruchom najpierw krok analyze');
      }

      const strapiClient = new StrapiAPIClient(config.strapi, config.verbose);

      // Health check
      const isHealthy = await strapiClient.healthCheck();
      if (!isHealthy) {
        throw new Error('Strapi nie odpowiada - sprawdź czy serwis działa');
      }

      // Import Content Types
      const contentTypes = Array.isArray(strapiSchema) ? strapiSchema : [strapiSchema];
      await strapiClient.importContentTypes(contentTypes);

      return {
        step: this.name,
        status: 'completed',
        duration: Date.now() - startTime,
        message: `Zaimportowano ${contentTypes.length} Content Types do Strapi`,
        data: {
          contentTypes: contentTypes.length,
        },
      };
    } catch (error) {
      return {
        step: this.name,
        status: 'failed',
        duration: Date.now() - startTime,
        message: `Błąd podczas importu do Strapi: ${(error as Error).message}`,
        error: error as Error,
      };
    }
  }

  canSkip(context: BuildContext): boolean {
    return false; // Zawsze wykonujemy
  }
}
