/**
 * Template Analyzer - główna logika analizy szablonów
 */

import { readFile } from 'fs/promises';
import { resolve } from 'path';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { AnthropicClient } from './anthropic-client.js';
import type {
  AnalyzeOptions,
  TemplateAnalysis,
  AnalyzerConfig
} from './types/index.js';

export class TemplateAnalyzer {
  private anthropic: AnthropicClient;
  private verbose: boolean;

  constructor(config: AnalyzerConfig) {
    this.anthropic = new AnthropicClient(config);
    this.verbose = config.verbose || false;
  }

  /**
   * Główna metoda - analizuje szablon i zwraca pełną analizę
   */
  async analyze(options: AnalyzeOptions): Promise<TemplateAnalysis> {
    if (this.verbose) {
      console.log('\n=== Template Analyzer ===');
      console.log('Project:', options.projectName);
      console.log('Template URL:', options.templateUrl);
    }

    // 1. Pobranie HTML szablonu
    const html = await this.fetchTemplate(options.templateUrl);
    
    // 2. Pre-processing HTML (czyszczenie, ekstrakcja metadanych)
    const processedHtml = this.preprocessHtml(html);
    
    // 3. Analiza przez Claude AI
    const analysisJson = await this.anthropic.analyzeTemplate(
      processedHtml,
      options.projectName
    );
    
    // 4. Parsowanie odpowiedzi do TypeScript
    const analysis = AnthropicClient.parseJSON<TemplateAnalysis>(analysisJson);
    
    // 5. Walidacja i uzupełnienie
    const validated = this.validateAnalysis(analysis);
    
    if (this.verbose) {
      console.log('\n=== Analiza zakończona ===');
      console.log('Sekcje:', validated.sections.length);
      console.log('Komponenty:', validated.components.length);
      console.log('Content Types:', validated.contentTypes.length);
      console.log('Relacje:', validated.relations.length);
    }

    return validated;
  }

  /**
   * Pobiera HTML szablonu (z URL lub pliku lokalnego)
   */
  private async fetchTemplate(urlOrPath: string): Promise<string> {
    if (this.verbose) {
      console.log('\n[1/4] Pobieranie szablonu...');
    }

    // Sprawdź czy to URL czy ścieżka lokalna
    if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {
      // Pobierz z URL
      if (this.verbose) {
        console.log('  Źródło: URL');
      }
      
      const response = await fetch(urlOrPath);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch template: ${response.statusText}`);
      }
      
      const html = await response.text();
      
      if (this.verbose) {
        console.log(`  Rozmiar: ${(html.length / 1024).toFixed(2)} KB`);
      }
      
      return html;
    } else {
      // Wczytaj z pliku lokalnego
      if (this.verbose) {
        console.log('  Źródło: Plik lokalny');
      }
      
      const fullPath = resolve(urlOrPath);
      const html = await readFile(fullPath, 'utf-8');
      
      if (this.verbose) {
        console.log(`  Plik: ${fullPath}`);
        console.log(`  Rozmiar: ${(html.length / 1024).toFixed(2)} KB`);
      }
      
      return html;
    }
  }

  /**
   * Pre-processing HTML - czyszczenie i ekstrakcja metadanych
   */
  private preprocessHtml(html: string): string {
    if (this.verbose) {
      console.log('\n[2/4] Pre-processing HTML...');
    }

    const $ = cheerio.load(html);

    // Usuń skrypty (nie są potrzebne do analizy)
    $('script').remove();
    
    // Usuń style inline (zostawiamy tylko strukturę)
    // $('style').remove(); // Zostawiamy style - mogą zawierać ważne informacje
    
    // Ekstrakcja metadanych
    const title = $('title').text();
    const description = $('meta[name="description"]').attr('content');
    
    if (this.verbose) {
      console.log('  Title:', title || '(brak)');
      console.log('  Description:', description || '(brak)');
    }

    // Dodaj sekcje komentarzy dla lepszej analizy
    const processed = $.html();
    
    if (this.verbose) {
      console.log(`  Rozmiar po czyszczeniu: ${(processed.length / 1024).toFixed(2)} KB`);
    }

    return processed;
  }

  /**
   * Walidacja i uzupełnienie analizy
   */
  private validateAnalysis(analysis: TemplateAnalysis): TemplateAnalysis {
    if (this.verbose) {
      console.log('\n[4/4] Walidacja analizy...');
    }

    // Uzupełnij brakujące pola
    if (!analysis.analyzedAt) {
      analysis.analyzedAt = new Date().toISOString();
    }

    // Waliduj sekcje
    for (const section of analysis.sections) {
      if (!section.id) {
        section.id = this.generateId(section.name);
      }
    }

    // Waliduj komponenty
    for (const component of analysis.components) {
      if (!component.id) {
        component.id = this.generateId(component.name);
      }
    }

    // Waliduj Content Types
    for (const contentType of analysis.contentTypes) {
      if (!contentType.singularName) {
        contentType.singularName = this.toSingular(contentType.pluralName || contentType.displayName);
      }
      if (!contentType.pluralName) {
        contentType.pluralName = this.toPlural(contentType.singularName);
      }
    }

    return analysis;
  }

  /**
   * Generuje ID z nazwy (lowercase, dash-case)
   */
  private generateId(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Konwertuje do formy pojedynczej (prosty algorytm)
   */
  private toSingular(plural: string): string {
    if (plural.endsWith('s')) {
      return plural.slice(0, -1);
    }
    return plural;
  }

  /**
   * Konwertuje do formy mnogiej (prosty algorytm)
   */
  private toPlural(singular: string): string {
    if (!singular.endsWith('s')) {
      return singular + 's';
    }
    return singular;
  }

  /**
   * Ekstrakcja statystyk z HTML (pomocnicza metoda)
   */
  extractStats(html: string): {
    sections: number;
    images: number;
    forms: number;
    links: number;
  } {
    const $ = cheerio.load(html);

    return {
      sections: $('section, .section, [class*="section"]').length,
      images: $('img').length,
      forms: $('form').length,
      links: $('a').length,
    };
  }
}
