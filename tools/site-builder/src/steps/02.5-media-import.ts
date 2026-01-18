/**
 * Step 2.5: Import Media z szablonu
 * Pobiera obrazy z szablonu i uploaduje do Strapi
 */

import { MediaImporter } from '../integrations/media-importer.js';
import type { StepHandler, BuildContext, StepResult } from '../types/index.js';

export class MediaImportStep implements StepHandler {
  name = '02.5-media-import';
  description = 'Import grafik z szablonu do Strapi';

  async execute(context: BuildContext): Promise<StepResult> {
    const startTime = Date.now();

    try {
      const { config, nextjsPath } = context;

      if (!nextjsPath) {
        throw new Error('Brak ścieżki projektu Next.js');
      }

      const importer = new MediaImporter(config.verbose, config.strapi);

      // 1. Ekstraktuj obrazy z szablonu
      const images = await importer.extractImagesFromTemplate(config.templateUrl);

      // 2. Pobierz obrazy lokalnie
      const mediaDir = `${nextjsPath}/public/images`;
      const downloaded = await importer.downloadImages(images, mediaDir);

      // 3. Upload do Strapi (jeśli nie dry-run)
      let uploaded: any[] = [];
      if (!config.dryRun && config.strapi) {
        uploaded = await importer.uploadToStrapi(downloaded);
      }

      // 4. Generuj mapowanie
      const mapping = importer.generateUrlMapping(uploaded.length > 0 ? uploaded : downloaded);

      return {
        step: this.name,
        status: 'completed',
        duration: Date.now() - startTime,
        message: `Pobrano ${downloaded.length} obrazów${uploaded.length > 0 ? `, uploadowano ${uploaded.length} do Strapi` : ''}`,
        data: {
          totalImages: images.length,
          downloaded: downloaded.length,
          uploaded: uploaded.length,
          mapping,
        },
      };
    } catch (error) {
      return {
        step: this.name,
        status: 'failed',
        duration: Date.now() - startTime,
        message: `Błąd podczas importu grafik: ${(error as Error).message}`,
        error: error as Error,
      };
    }
  }

  canSkip(context: BuildContext): boolean {
    return false;
  }
}
