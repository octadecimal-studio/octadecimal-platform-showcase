/**
 * Content Extractor
 * Ekstraktuje teksty z szablonu i importuje do Strapi
 */

import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { StrapiAPIClient } from './strapi-api.js';
import type { StrapiConfig } from '../types/index.js';

export interface ExtractedContent {
  /** Sekcja */
  section: string;
  
  /** Typ elementu (heading, paragraph, list, etc.) */
  type: 'heading' | 'paragraph' | 'list' | 'button' | 'link';
  
  /** Treść tekstowa */
  content: string;
  
  /** Poziom (dla headings: h1-h6) */
  level?: number;
  
  /** Dodatkowe atrybuty */
  attributes?: Record<string, string>;
}

export class ContentExtractor {
  private verbose: boolean;
  private strapiClient?: StrapiAPIClient;

  constructor(verbose: boolean = false, strapiConfig?: StrapiConfig) {
    this.verbose = verbose;
    if (strapiConfig) {
      this.strapiClient = new StrapiAPIClient(strapiConfig, verbose);
    }
  }

  /**
   * Ekstraktuje wszystkie teksty z HTML szablonu
   */
  async extractContent(templateUrl: string): Promise<ExtractedContent[]> {
    if (this.verbose) {
      console.log('[Content Extractor] Extracting content from template...');
    }

    const response = await fetch(templateUrl);
    const html = await response.text();
    const $ = cheerio.load(html);

    const content: ExtractedContent[] = [];
    
    // Próba rozpoznania sekcji
    const sections = $('section, .section, [class*="section"], main > div');

    sections.each((sectionIdx, sectionElem) => {
      const $section = $(sectionElem as any);
      const sectionName = this.identifySectionName($section, sectionIdx as number);

      // Headings
      $section.find('h1, h2, h3, h4, h5, h6').each((i: any, elem: any) => {
        const text = $(elem).text().trim();
        if (text) {
          const tagName = elem.tagName.toLowerCase();
          const level = parseInt(tagName.replace('h', ''));

          content.push({
            section: sectionName,
            type: 'heading',
            content: text,
            level,
          });
        }
      });

      // Paragraphs
      $section.find('p').each((i: any, elem: any) => {
        const text = $(elem).text().trim();
        if (text && text.length > 10) { // Pomijamy bardzo krótkie
          content.push({
            section: sectionName,
            type: 'paragraph',
            content: text,
          });
        }
      });

      // Buttons
      $section.find('button, .btn, [class*="button"]').each((i: any, elem: any) => {
        const text = $(elem).text().trim();
        if (text) {
          content.push({
            section: sectionName,
            type: 'button',
            content: text,
            attributes: {
              href: $(elem).attr('href') || '',
            },
          });
        }
      });

      // Links (tylko istotne - w nav, CTA)
      $section.find('nav a, .cta a, [class*="cta"] a').each((i: any, elem: any) => {
        const text = $(elem).text().trim();
        const href = $(elem).attr('href') || '';
        
        if (text) {
          content.push({
            section: sectionName,
            type: 'link',
            content: text,
            attributes: { href },
          });
        }
      });

      // Lists
      $section.find('ul, ol').each((i: any, listElem: any) => {
        const items: string[] = [];
        $(listElem as any).find('li').each((j: any, li: any) => {
          const text = $(li).text().trim();
          if (text) {
            items.push(text);
          }
        });

        if (items.length > 0) {
          content.push({
            section: sectionName,
            type: 'list',
            content: items.join('\n'),
          });
        }
      });
    });

    if (this.verbose) {
      console.log(`[Content Extractor] Extracted ${content.length} content items`);
    }

    return content;
  }

  /**
   * Identyfikuje nazwę sekcji na podstawie elementów
   */
  private identifySectionName($section: any, index: number): string {
    // ID
    const id = $section.attr('id');
    if (id) return id;

    // Class zawierająca "section" lub nazwę
    const classes = $section.attr('class') || '';
    const sectionClass = classes.split(' ').find((c: any) => 
      c.includes('section') || 
      c.includes('hero') ||
      c.includes('about') ||
      c.includes('features') ||
      c.includes('pricing')
    );
    if (sectionClass) return sectionClass;

    // Pierwszy heading
    const firstHeading = $section.find('h1, h2, h3').first().text().trim();
    if (firstHeading) {
      return this.slugify(firstHeading);
    }

    // Fallback
    return `section-${index + 1}`;
  }

  /**
   * Konwertuje tekst na slug
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Usuń akcenty
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Importuje teksty do Strapi jako Content Type "Content"
   */
  async importToStrapi(content: ExtractedContent[], contentTypeName: string = 'contents'): Promise<void> {
    if (!this.strapiClient) {
      throw new Error('Strapi client not configured');
    }

    if (this.verbose) {
      console.log(`[Content Extractor] Importing ${content.length} items to Strapi...`);
    }

    // Grupuj po sekcjach
    const bySection = new Map<string, ExtractedContent[]>();
    
    for (const item of content) {
      if (!bySection.has(item.section)) {
        bySection.set(item.section, []);
      }
      bySection.get(item.section)!.push(item);
    }

    // Dla każdej sekcji utwórz wpis
    for (const [section, items] of bySection) {
      const entry = {
        section,
        headings: items.filter(i => i.type === 'heading').map(i => ({
          level: i.level,
          text: i.content,
        })),
        paragraphs: items.filter(i => i.type === 'paragraph').map(i => i.content),
        buttons: items.filter(i => i.type === 'button').map(i => ({
          text: i.content,
          href: i.attributes?.href,
        })),
        lists: items.filter(i => i.type === 'list').map(i => i.content.split('\n')),
      };

      await this.strapiClient.createEntry(contentTypeName, entry);

      if (this.verbose) {
        console.log(`[Content Extractor] ✓ ${section}: ${items.length} items`);
      }
    }

    if (this.verbose) {
      console.log(`[Content Extractor] ✓ All content imported to Strapi`);
    }
  }

  /**
   * Generuje JSON seed data z ekstraktowanych tekstów
   */
  generateSeedData(content: ExtractedContent[]): any {
    const bySection = new Map<string, ExtractedContent[]>();
    
    for (const item of content) {
      if (!bySection.has(item.section)) {
        bySection.set(item.section, []);
      }
      bySection.get(item.section)!.push(item);
    }

    const seedData: any[] = [];

    for (const [section, items] of bySection) {
      seedData.push({
        section,
        data: {
          headings: items.filter(i => i.type === 'heading'),
          paragraphs: items.filter(i => i.type === 'paragraph'),
          buttons: items.filter(i => i.type === 'button'),
          links: items.filter(i => i.type === 'link'),
          lists: items.filter(i => i.type === 'list'),
        },
      });
    }

    return seedData;
  }
}
