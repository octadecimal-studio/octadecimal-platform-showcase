/**
 * Media Importer
 * Pobiera obrazy z szablonu i uploaduje do Strapi
 */

import fetch from 'node-fetch';
import { writeFile, mkdir } from 'fs/promises';
import { join, basename } from 'path';
import * as cheerio from 'cheerio';
import FormData from 'form-data';
import { createReadStream } from 'fs';
import type { StrapiConfig } from '../types/index.js';

export interface MediaFile {
  /** URL źródłowy */
  sourceUrl: string;
  
  /** Ścieżka lokalna */
  localPath: string;
  
  /** Nazwa pliku */
  filename: string;
  
  /** Typ (image, video, etc.) */
  type: string;
  
  /** ID w Strapi (po upload) */
  strapiId?: number;
  
  /** URL w Strapi */
  strapiUrl?: string;
}

export class MediaImporter {
  private verbose: boolean;
  private strapiConfig?: StrapiConfig;

  constructor(verbose: boolean = false, strapiConfig?: StrapiConfig) {
    this.verbose = verbose;
    this.strapiConfig = strapiConfig;
  }

  /**
   * Ekstraktuje wszystkie obrazy z HTML szablonu
   */
  async extractImagesFromTemplate(templateUrl: string): Promise<MediaFile[]> {
    if (this.verbose) {
      console.log('[Media Importer] Extracting images from template...');
    }

    // Pobierz HTML
    const response = await fetch(templateUrl);
    const html = await response.text();
    
    const $ = cheerio.load(html);
    const images: MediaFile[] = [];

    // Base URL dla relatywnych ścieżek
    const baseUrl = new URL(templateUrl).origin;

    // Ekstraktuj <img>
    $('img').each((i, elem) => {
      const src = $(elem).attr('src');
      if (!src) return;

      const fullUrl = src.startsWith('http') ? src : `${baseUrl}${src.startsWith('/') ? '' : '/'}${src}`;
      const filename = basename(new URL(fullUrl).pathname);

      images.push({
        sourceUrl: fullUrl,
        localPath: '',
        filename,
        type: 'image',
      });
    });

    // Ekstraktuj CSS background-image
    $('[style*="background-image"]').each((i, elem) => {
      const style = $(elem).attr('style') || '';
      const match = style.match(/background-image:\s*url\(['"]?([^'"]+)['"]?\)/);
      
      if (match && match[1]) {
        const url = match[1];
        const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
        const filename = basename(new URL(fullUrl).pathname);

        images.push({
          sourceUrl: fullUrl,
          localPath: '',
          filename,
          type: 'image',
        });
      }
    });

    // Ekstraktuj ze <style> i <link> (background-image w CSS)
    const styleContent = $('style').text();
    const bgImageMatches = styleContent.matchAll(/background-image:\s*url\(['"]?([^'"]+)['"]?\)/g);
    
    for (const match of bgImageMatches) {
      const url = match[1];
      const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
      const filename = basename(new URL(fullUrl).pathname);

      images.push({
        sourceUrl: fullUrl,
        localPath: '',
        filename,
        type: 'image',
      });
    }

    // Deduplikacja
    const uniqueImages = Array.from(
      new Map(images.map(img => [img.sourceUrl, img])).values()
    );

    if (this.verbose) {
      console.log(`[Media Importer] Found ${uniqueImages.length} unique images`);
    }

    return uniqueImages;
  }

  /**
   * Pobiera obrazy lokalnie
   */
  async downloadImages(images: MediaFile[], outputDir: string): Promise<MediaFile[]> {
    if (this.verbose) {
      console.log(`[Media Importer] Downloading ${images.length} images...`);
    }

    await mkdir(outputDir, { recursive: true });

    const downloaded: MediaFile[] = [];

    for (const image of images) {
      try {
        const response = await fetch(image.sourceUrl);
        
        if (!response.ok) {
          if (this.verbose) {
            console.warn(`[Media Importer] Failed to download: ${image.filename}`);
          }
          continue;
        }

        const buffer = await response.buffer();
        const localPath = join(outputDir, image.filename);

        await writeFile(localPath, buffer);

        downloaded.push({
          ...image,
          localPath,
        });

        if (this.verbose) {
          console.log(`[Media Importer] ✓ ${image.filename} (${(buffer.length / 1024).toFixed(2)} KB)`);
        }
      } catch (error) {
        if (this.verbose) {
          console.warn(`[Media Importer] Error downloading ${image.filename}: ${error}`);
        }
      }
    }

    if (this.verbose) {
      console.log(`[Media Importer] Downloaded ${downloaded.length}/${images.length} images`);
    }

    return downloaded;
  }

  /**
   * Uploaduje obrazy do Strapi
   */
  async uploadToStrapi(images: MediaFile[]): Promise<MediaFile[]> {
    if (!this.strapiConfig) {
      throw new Error('Strapi config required for upload');
    }

    if (this.verbose) {
      console.log(`[Media Importer] Uploading ${images.length} images to Strapi...`);
    }

    const uploaded: MediaFile[] = [];

    for (const image of images) {
      try {
        const form = new FormData();
        form.append('files', createReadStream(image.localPath), image.filename);

        const response = await fetch(`${this.strapiConfig.apiUrl}/api/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.strapiConfig.apiToken}`,
          },
          body: form,
        });

        if (!response.ok) {
          if (this.verbose) {
            console.warn(`[Media Importer] Failed to upload: ${image.filename}`);
          }
          continue;
        }

        const result: any = await response.json();
        const uploadedFile = result[0];

        uploaded.push({
          ...image,
          strapiId: uploadedFile.id,
          strapiUrl: `${this.strapiConfig.apiUrl}${uploadedFile.url}`,
        });

        if (this.verbose) {
          console.log(`[Media Importer] ✓ ${image.filename} → Strapi ID: ${uploadedFile.id}`);
        }
      } catch (error) {
        if (this.verbose) {
          console.warn(`[Media Importer] Error uploading ${image.filename}: ${error}`);
        }
      }
    }

    if (this.verbose) {
      console.log(`[Media Importer] Uploaded ${uploaded.length}/${images.length} images to Strapi`);
    }

    return uploaded;
  }

  /**
   * Generuje mapowanie starych URL → nowych URL Strapi
   */
  generateUrlMapping(images: MediaFile[]): Record<string, string> {
    const mapping: Record<string, string> = {};

    for (const image of images) {
      if (image.strapiUrl) {
        mapping[image.sourceUrl] = image.strapiUrl;
        
        // Dodaj również relatywne ścieżki
        const relativePath = '/' + image.filename;
        mapping[relativePath] = image.strapiUrl;
        mapping[image.filename] = image.strapiUrl;
      }
    }

    return mapping;
  }
}
