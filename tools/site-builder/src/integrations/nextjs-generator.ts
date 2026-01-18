/**
 * Next.js Code Generator
 * Generuje kompletny projekt Next.js przez Claude AI
 */

import Anthropic from '@anthropic-ai/sdk';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import type { AnthropicConfig } from '../types/index.js';
import type { TemplateAnalysis } from '@octadecimal/template-analyzer';

export interface GeneratedFile {
  path: string;
  content: string;
  description: string;
}

export class NextJSGenerator {
  private client: Anthropic;
  private model: string;
  private verbose: boolean;

  constructor(config: AnthropicConfig, verbose: boolean = false) {
    this.client = new Anthropic({
      apiKey: config.apiKey,
    });
    this.model = config.model || 'claude-sonnet-4-20250514';
    this.verbose = verbose;
  }

  /**
   * Generuje kompletny projekt Next.js
   */
  async generateProject(
    analysis: TemplateAnalysis,
    cursorPrompt: string,
    strapiSchema: any,
    projectName: string
  ): Promise<GeneratedFile[]> {
    if (this.verbose) {
      console.log('[Next.js Generator] Starting code generation...');
    }

    const files: GeneratedFile[] = [];

    // 1. Generuj package.json
    files.push(await this.generatePackageJson(projectName));

    // 2. Generuj next.config.mjs
    files.push(await this.generateNextConfig());

    // 3. Generuj tailwind.config.ts
    files.push(await this.generateTailwindConfig());

    // 4. Generuj app/layout.tsx
    files.push(await this.generateLayout(analysis));

    // 5. Generuj app/page.tsx (główna strona)
    files.push(await this.generateMainPage(analysis, cursorPrompt));

    // 6. Generuj lib/strapi.ts (Strapi client)
    files.push(await this.generateStrapiClient());

    // 7. Generuj lib/types.ts (TypeScript types)
    files.push(await this.generateTypes(strapiSchema, analysis));

    // 8. Generuj komponenty sekcji
    for (const section of analysis.sections.slice(0, 5)) { // Pierwsze 5 sekcji
      const component = await this.generateSectionComponent(section, analysis);
      files.push(component);
    }

    // 9. Generuj komponenty UI
    for (const comp of analysis.components.slice(0, 5)) { // Pierwsze 5 komponentów
      const component = await this.generateUIComponent(comp, analysis);
      files.push(component);
    }

    if (this.verbose) {
      console.log(`[Next.js Generator] Generated ${files.length} files`);
    }

    return files;
  }

  /**
   * Zapisuje wygenerowane pliki do dysku
   */
  async writeFiles(files: GeneratedFile[], outputDir: string): Promise<void> {
    for (const file of files) {
      const fullPath = join(outputDir, file.path);
      const dir = dirname(fullPath);

      // Utwórz katalog jeśli nie istnieje
      await mkdir(dir, { recursive: true });

      // Zapisz plik
      await writeFile(fullPath, file.content, 'utf-8');

      if (this.verbose) {
        console.log(`[Next.js Generator] ✓ ${file.path}`);
      }
    }
  }

  /**
   * Generuje package.json
   */
  private async generatePackageJson(projectName: string): Promise<GeneratedFile> {
    const content = JSON.stringify({
      name: projectName,
      version: '1.0.0',
      private: true,
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
        lint: 'next lint',
        export: 'next build && next export',
      },
      dependencies: {
        next: '^15.1.6',
        react: '^18.3.1',
        'react-dom': '^18.3.1',
        'react-hook-form': '^7.54.2',
        'framer-motion': '^11.15.0',
      },
      devDependencies: {
        '@types/node': '^22.10.5',
        '@types/react': '^18.3.18',
        '@types/react-dom': '^18.3.5',
        autoprefixer: '^10.4.20',
        postcss: '^8.4.49',
        tailwindcss: '^3.4.17',
        typescript: '^5.7.2',
        eslint: '^9.17.0',
        'eslint-config-next': '^15.1.6',
      },
    }, null, 2);

    return {
      path: 'package.json',
      content,
      description: 'Package configuration',
    };
  }

  /**
   * Generuje next.config.mjs
   */
  private async generateNextConfig(): Promise<GeneratedFile> {
    const content = `/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_STRAPI_API_URL: process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337',
  },
};

export default nextConfig;
`;

    return {
      path: 'next.config.mjs',
      content,
      description: 'Next.js configuration',
    };
  }

  /**
   * Generuje tailwind.config.ts
   */
  private async generateTailwindConfig(): Promise<GeneratedFile> {
    const content = `import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF6B35',
          50: '#FFE8E1',
          100: '#FFD4C7',
          200: '#FFAC94',
          300: '#FF8461',
          400: '#FF752E',
          500: '#FF6B35',
          600: '#E85621',
          700: '#B03F19',
          800: '#782B11',
          900: '#401709',
        },
      },
    },
  },
  plugins: [],
};

export default config;
`;

    return {
      path: 'tailwind.config.ts',
      content,
      description: 'Tailwind CSS configuration',
    };
  }

  /**
   * Generuje app/layout.tsx przez AI
   */
  private async generateLayout(analysis: TemplateAnalysis): Promise<GeneratedFile> {
    const systemPrompt = `Jesteś ekspertem Next.js. Wygeneruj plik app/layout.tsx dla projektu.

Layout powinien zawierać:
- Metadata (title, description)
- Font (Inter z Google Fonts)
- RootLayout component
- HTML structure
- body z Tailwind classes
- Import global CSS

Zwróć TYLKO kod TypeScript/React. Bez komentarzy wyjaśniających.`;

    const prompt = `Wygeneruj app/layout.tsx dla projektu:

Tytuł: ${analysis.sections[0]?.name || 'Website'}
Opis: ${analysis.sections[0]?.description || 'Modern website'}

Zwróć TYLKO kod.`;

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0].type === 'text' 
      ? response.content[0].text 
      : '';

    return {
      path: 'src/app/layout.tsx',
      content: this.cleanCode(content),
      description: 'Root layout component',
    };
  }

  /**
   * Generuje app/page.tsx (główna strona) przez AI
   */
  private async generateMainPage(analysis: TemplateAnalysis, cursorPrompt: string): Promise<GeneratedFile> {
    const systemPrompt = `Jesteś ekspertem Next.js. Wygeneruj główną stronę (app/page.tsx).

Strona powinna:
- Być Server Component (default w Next.js 15)
- Importować sekcje z components/sections/
- Renderować sekcje w kolejności
- Używać Tailwind CSS
- Być responsywna

Zwróć TYLKO kod TypeScript/React. Bez komentarzy wyjaśniających.`;

    const sectionsList = analysis.sections.map((s: any) => `- ${s.name}: ${s.description}`).join('\n');

    const prompt = `Wygeneruj app/page.tsx dla projektu.

Sekcje do wyrenderowania:
${sectionsList}

Zwróć TYLKO kod.`;

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 3000,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0].type === 'text' 
      ? response.content[0].text 
      : '';

    return {
      path: 'src/app/page.tsx',
      content: this.cleanCode(content),
      description: 'Main page component',
    };
  }

  /**
   * Generuje lib/strapi.ts
   */
  private async generateStrapiClient(): Promise<GeneratedFile> {
    const content = `/**
 * Strapi API Client
 */

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337';

export async function fetchAPI(path: string, options: RequestInit = {}) {
  const url = \`\${STRAPI_URL}/api\${path}\`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(\`Strapi API error: \${response.statusText}\`);
  }

  return response.json();
}

export async function getEntries(contentType: string, params?: Record<string, any>) {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  const data = await fetchAPI(\`/\${contentType}\${query}\`);
  return data.data || [];
}

export async function getEntry(contentType: string, id: string | number) {
  const data = await fetchAPI(\`/\${contentType}/\${id}?populate=*\`);
  return data.data;
}
`;

    return {
      path: 'src/lib/strapi.ts',
      content,
      description: 'Strapi API client',
    };
  }

  /**
   * Generuje lib/types.ts przez AI
   */
  private async generateTypes(strapiSchema: any, analysis: TemplateAnalysis): Promise<GeneratedFile> {
    const systemPrompt = `Jesteś ekspertem TypeScript. Wygeneruj typy TypeScript dla aplikacji Next.js.

Typy powinny:
- Odpowiadać strukturze Strapi Content Types
- Być eksportowane jako interface
- Zawierać wszystkie pola z odpowiednimi typami
- Używać TypeScript best practices

Zwróć TYLKO kod TypeScript. Bez komentarzy wyjaśniających.`;

    const contentTypesInfo = analysis.contentTypes
      .map((ct: any) => `${ct.displayName}: ${JSON.stringify(ct.attributes, null, 2)}`)
      .join('\n\n');

    const prompt = `Wygeneruj typy TypeScript dla Content Types:

${contentTypesInfo}

Zwróć TYLKO kod.`;

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0].type === 'text' 
      ? response.content[0].text 
      : '';

    return {
      path: 'src/lib/types.ts',
      content: this.cleanCode(content),
      description: 'TypeScript type definitions',
    };
  }

  /**
   * Generuje komponent sekcji przez AI
   */
  private async generateSectionComponent(section: any, analysis: TemplateAnalysis): Promise<GeneratedFile> {
    const systemPrompt = `Jesteś ekspertem React/Next.js. Wygeneruj komponent sekcji dla Next.js 15.

Komponent powinien:
- Być Server Component (default)
- Używać Tailwind CSS
- Być responsywny (mobile-first)
- Fetchować dane ze Strapi jeśli potrzebne
- Eksportować jako default

⚠️ KRYTYCZNIE WAŻNE: TEKSTY Z SZABLONU
- Klient zaakceptował wszystkie teksty w szablonie
- NIE WOLNO zmieniać, tłumaczyć ani modyfikować tekstów
- Użyj DOKŁADNIE tych samych tekstów co w szablonie
- Jeśli masz dostęp do originalContent - użyj tych tekstów
- Żadnych "Lorem ipsum" ani placeholder tekstów

Zwróć TYLKO kod TypeScript/React. Bez komentarzy wyjaśniających.`;

    const prompt = `Wygeneruj komponent dla sekcji:

Nazwa: ${section.name}
Opis: ${section.description}
Czy dynamiczna: ${section.isDynamic ? 'Tak (fetch ze Strapi)' : 'Nie (statyczna)'}

Zwróć TYLKO kod.`;

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 3000,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0].type === 'text' 
      ? response.content[0].text 
      : '';

    const fileName = this.toFileName(section.name);

    return {
      path: `src/components/sections/${fileName}.tsx`,
      content: this.cleanCode(content),
      description: `${section.name} section component`,
    };
  }

  /**
   * Generuje komponent UI przez AI
   */
  private async generateUIComponent(component: any, analysis: TemplateAnalysis): Promise<GeneratedFile> {
    const systemPrompt = `Jesteś ekspertem React/Next.js. Wygeneruj reusable UI component.

Komponent powinien:
- Przyjmować props przez interface
- Być Client Component jeśli interaktywny ('use client')
- Używać Tailwind CSS
- Być responsywny
- TypeScript strict mode

Zwróć TYLKO kod TypeScript/React. Bez komentarzy wyjaśniających.`;

    const prompt = `Wygeneruj komponent UI:

Nazwa: ${component.name}
Typ: ${component.type}
Opis: ${component.description}

Pola:
${component.fields.map((f: any) => `- ${f.name}: ${f.type}`).join('\n')}

Zwróć TYLKO kod.`;

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 2500,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0].type === 'text' 
      ? response.content[0].text 
      : '';

    const fileName = this.toFileName(component.name);

    return {
      path: `src/components/ui/${fileName}.tsx`,
      content: this.cleanCode(content),
      description: `${component.name} UI component`,
    };
  }

  /**
   * Czyści kod z markdown code fences
   */
  private cleanCode(code: string): string {
    let cleaned = code.trim();

    // Usuń markdown code fences
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```[a-z]*\n/, '').replace(/\n```$/, '');
    }

    return cleaned.trim();
  }

  /**
   * Konwertuje nazwę na nazwę pliku (kebab-case)
   */
  private toFileName(name: string): string {
    return name
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/\s+/g, '-')
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '');
  }
}
