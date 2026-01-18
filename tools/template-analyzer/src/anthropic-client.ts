/**
 * Wrapper dla Anthropic API (Claude)
 */

import Anthropic from '@anthropic-ai/sdk';
import type { AnalyzerConfig } from './types/index.js';

export class AnthropicClient {
  private client: Anthropic;
  private model: string;
  private maxTokens: number;
  private verbose: boolean;

  constructor(config: AnalyzerConfig) {
    this.client = new Anthropic({
      apiKey: config.anthropicApiKey,
    });
    
    this.model = config.model || 'claude-sonnet-4-20250514';
    this.maxTokens = config.maxTokens || 8000;
    this.verbose = config.verbose || false;
  }

  /**
   * Wysyła zapytanie do Claude i zwraca odpowiedź
   */
  async sendMessage(prompt: string, systemPrompt?: string): Promise<string> {
    if (this.verbose) {
      console.log('\n[Anthropic] Sending message...');
      console.log('[Model]', this.model);
      console.log('[Max tokens]', this.maxTokens);
      console.log('[Prompt length]', prompt.length, 'characters');
    }

    try {
      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      if (this.verbose) {
        console.log('[Response] Received');
        console.log('[Usage]', {
          input: message.usage.input_tokens,
          output: message.usage.output_tokens,
          total: message.usage.input_tokens + message.usage.output_tokens
        });
      }

      // Ekstrakcja tekstu z odpowiedzi
      const content = message.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected content type from Claude');
      }

      return content.text;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Anthropic API error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Analizuje szablon HTML i zwraca strukturyzowaną analizę
   */
  async analyzeTemplate(templateHtml: string, projectName: string): Promise<string> {
    const systemPrompt = `Jesteś ekspertem od analizy szablonów stron internetowych i projektowania Content Types dla Strapi CMS.

Twoim zadaniem jest przeanalizować podany szablon HTML i wygenerować szczegółową analizę obejmującą:

1. **Sekcje strony** - zidentyfikuj główne sekcje (Hero, Features, Pricing, Contact, etc.)
2. **Komponenty** - rozpoznaj powtarzające się komponenty (Card, Form, Gallery, etc.)
3. **Dynamiczne dane** - określ które elementy powinny być zarządzane przez CMS
4. **Content Types** - zaproponuj strukturę Content Types dla Strapi
5. **Relacje** - zidentyfikuj relacje między typami danych

⚠️ WAŻNE: TEKSTY Z SZABLONU SĄ ŚWIĘTE!
- Wszystkie teksty (headings, paragraphs, buttons) zostały zaakceptowane przez klienta
- NIE WOLNO ich zmieniać, modyfikować, tłumaczyć ani poprawiać
- Content Types w Strapi muszą przechowywać DOKŁADNIE te same teksty co w szablonie
- W analizie uwzględnij pole "originalContent" z ekstraktowanymi tekstami

Odpowiedź zwróć w formacie JSON zgodnym z interfejsem TemplateAnalysis (TypeScript).

Bądź szczegółowy i dokładny. Użyj nazw polskich dla opisów, ale angielskich dla identyfikatorów i nazw pól.`;

    const prompt = `Przeanalizuj poniższy szablon HTML dla projektu "${projectName}".

**HTML szablonu:**
\`\`\`html
${templateHtml.substring(0, 50000)} ${templateHtml.length > 50000 ? '...(truncated)' : ''}
\`\`\`

Wygeneruj pełną analizę w formacie JSON.`;

    return this.sendMessage(prompt, systemPrompt);
  }

  /**
   * Generuje schemat Strapi na podstawie analizy
   */
  async generateStrapiSchema(analysis: string): Promise<string> {
    const systemPrompt = `Jesteś ekspertem od Strapi CMS. Twoim zadaniem jest przekształcić analizę szablonu w gotowy schemat JSON dla importu do Strapi.

Schemat powinien zawierać:
1. Kompletne definicje Content Types (Collection Types i Single Types)
2. Wszystkie atrybuty z poprawnymi typami
3. Relacje między typami
4. Walidacje (required, unique, min/max, etc.)
5. Opcje (draftAndPublish)

Format wyjściowy: JSON gotowy do importu przez Strapi API lub Content-Type Builder.

Używaj najlepszych praktyk Strapi:
- Nazwy w camelCase dla API, lowercase dla plików
- Poprawne typy pól (string, text, richtext, media, relation, etc.)
- Sensowne domyślne wartości
- Odpowiednie relacje (oneToOne, oneToMany, manyToOne, manyToMany)`;

    const prompt = `Na podstawie poniższej analizy szablonu, wygeneruj kompletny schemat Strapi.

**Analiza:**
${analysis}

Wygeneruj JSON schema w formacie Strapi Content Types.`;

    return this.sendMessage(prompt, systemPrompt);
  }

  /**
   * Generuje prompt dla Cursora na podstawie analizy i schematu
   */
  async generateCursorPrompt(analysis: string, schema: string, projectName: string): Promise<string> {
    const systemPrompt = `Jesteś ekspertem od promptowania AI (Cursor IDE) dla projektów webowych.

Twoim zadaniem jest wygenerować szczegółowy prompt dla Cursora, który pomoże developerowi zaimplementować projekt Next.js + Strapi na podstawie analizy szablonu.

Prompt powinien zawierać:
1. Główny opis projektu i cel
2. Strukturę katalogów (Next.js 15 App Router)
3. Listę komponentów do stworzenia z opisem
4. Instrukcje integracji ze Strapi (fetch, SSR/SSG)
5. Styling (Tailwind CSS)
6. Najlepsze praktyki Next.js i React
7. Przykładowy kod dla kluczowych komponentów

Prompt ma być:
- Jasny i szczegółowy
- Gotowy do skopiowania do Cursor
- Napisany w języku polskim
- Zawierający konkretne przykłady kodu`;

    const prompt = `Wygeneruj kompletny prompt dla Cursor IDE na podstawie:

**Projekt:** ${projectName}

**Analiza szablonu:**
${analysis}

**Schemat Strapi:**
${schema}

Wygeneruj prompt w formacie Markdown, gotowy do użycia w Cursor.`;

    return this.sendMessage(prompt, systemPrompt);
  }

  /**
   * Parsuje JSON z odpowiedzi Claude (usuwa markdown backticks jeśli są)
   */
  static parseJSON<T = any>(text: string): T {
    // Usuń markdown code blocks jeśli istnieją
    let cleaned = text.trim();
    
    // Usuń markdown code fences
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*\n/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*\n/, '');
    }
    
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.replace(/\n```\s*$/, '');
    }
    
    // Znajdź pierwszy { i ostatni } (JSON object)
    // lub pierwszy [ i ostatni ] (JSON array)
    const firstBrace = cleaned.indexOf('{');
    const firstBracket = cleaned.indexOf('[');
    const start = Math.min(
      firstBrace >= 0 ? firstBrace : Infinity,
      firstBracket >= 0 ? firstBracket : Infinity
    );
    
    if (start === Infinity) {
      throw new Error('No JSON object or array found in response');
    }
    
    const isObject = cleaned[start] === '{';
    const endChar = isObject ? '}' : ']';
    const lastEnd = cleaned.lastIndexOf(endChar);
    
    if (lastEnd < 0) {
      throw new Error(`No closing ${endChar} found`);
    }
    
    // Wytnij tylko JSON
    cleaned = cleaned.substring(start, lastEnd + 1);
    
    try {
      return JSON.parse(cleaned);
    } catch (error) {
      throw new Error(`Failed to parse JSON from Claude response: ${error}`);
    }
  }
}
