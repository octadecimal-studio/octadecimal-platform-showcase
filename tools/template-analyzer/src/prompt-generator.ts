/**
 * Cursor Prompt Generator
 */

import { writeFile } from 'fs/promises';
import { resolve, dirname } from 'path';
import { mkdir } from 'fs/promises';
import { AnthropicClient } from './anthropic-client.js';
import type {
  TemplateAnalysis,
  GenerateCursorPromptOptions,
  AnalyzerConfig,
  CursorPrompt
} from './types/index.js';

export class CursorPromptGenerator {
  private anthropic: AnthropicClient;
  private verbose: boolean;

  constructor(config: AnalyzerConfig) {
    this.anthropic = new AnthropicClient(config);
    this.verbose = config.verbose || false;
  }

  /**
   * Generuje prompt dla Cursora
   */
  async generate(
    analysis: TemplateAnalysis,
    schema: any,
    projectName: string,
    options?: GenerateCursorPromptOptions
  ): Promise<string> {
    if (this.verbose) {
      console.log('\n=== Cursor Prompt Generator ===');
      console.log('Project:', projectName);
    }

    // Konwertuj dane do JSON
    const analysisJson = JSON.stringify(analysis, null, 2);
    const schemaJson = JSON.stringify(schema, null, 2);

    // Wygeneruj prompt przez Claude
    const promptMarkdown = await this.anthropic.generateCursorPrompt(
      analysisJson,
      schemaJson,
      projectName
    );

    if (this.verbose) {
      console.log('✓ Prompt wygenerowany');
      console.log('  Długość:', promptMarkdown.length, 'znaków');
    }

    // Zapisz do pliku jeśli podano opcje
    if (options?.outputFile) {
      await this.saveToFile(promptMarkdown, options);
    }

    return promptMarkdown;
  }

  /**
   * Zapisuje prompt do pliku Markdown
   */
  private async saveToFile(prompt: string, options: GenerateCursorPromptOptions): Promise<void> {
    const outputDir = options.outputDir || process.cwd();
    const outputFile = options.outputFile || 'CURSOR_PROMPT.md';
    const fullPath = resolve(outputDir, outputFile);

    // Upewnij się że katalog istnieje
    await mkdir(dirname(fullPath), { recursive: true });

    // Zapisz Markdown
    await writeFile(fullPath, prompt, 'utf-8');

    if (this.verbose) {
      console.log('✓ Prompt zapisany:', fullPath);
    }
  }

  /**
   * Generuje prompt w stylu .cursorrules (dla workspace rules)
   */
  generateCursorRules(analysis: TemplateAnalysis, projectName: string): string {
    const rules = `# Zasady projektu ${projectName}

## Informacje o projekcie

Projekt: ${projectName}
Szablon: ${analysis.sourceUrl}
Data analizy: ${analysis.analyzedAt}

## Content Types Strapi

${analysis.contentTypes.map(ct => `- **${ct.displayName}** (${ct.singularName}/${ct.pluralName})`).join('\n')}

## Komponenty

${analysis.components.map(c => `- **${c.name}** - ${c.description}`).join('\n')}

## Sekcje strony

${analysis.sections.map(s => `- **${s.name}** - ${s.description}`).join('\n')}

## Zasady implementacji

### Next.js
- Używaj App Router (Next.js 15+)
- Server Components domyślnie
- Client Components tylko gdy potrzebne (interakcje, hooks)
- Fetch danych przez Strapi API w Server Components

### Strapi
- URL API: process.env.NEXT_PUBLIC_STRAPI_API_URL
- Populuj relacje w zapytaniach (?populate=*)
- Używaj typów TypeScript wygenerowanych z API

### Styling
- Tailwind CSS zgodnie z szablonem
- Responsive design (mobile-first)
- Komponenty reusable

### Struktura katalogów
\`\`\`
app/
  page.tsx              # Strona główna
  layout.tsx            # Layout
  [section]/
    page.tsx            # Podstrony
components/
  sections/             # Sekcje strony
  ui/                   # Komponenty UI
lib/
  strapi.ts             # Klient Strapi API
  types.ts              # Typy TypeScript
\`\`\`

## Najlepsze praktyki

- Zawsze używaj TypeScript
- Waliduj dane z API
- Obsługuj błędy (try/catch, error boundaries)
- Optymalizuj obrazy (Next.js Image)
- SEO (metadata, structured data)
- Accessibility (ARIA, semantic HTML)
`;

    return rules;
  }
}
