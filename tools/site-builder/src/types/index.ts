/**
 * Typy dla Site Builder
 */

import type { TemplateAnalysis } from '@octadecimal/template-analyzer';

/**
 * Konfiguracja Site Builder
 */
export interface SiteBuilderConfig {
  /** Nazwa projektu */
  projectName: string;
  
  /** URL szablonu HTML */
  templateUrl: string;
  
  /** Subdomena (np. example-rental.test) */
  subdomain: string;
  
  /** Konfiguracja VPS */
  vps: VPSConfig;
  
  /** Konfiguracja Strapi */
  strapi: StrapiConfig;
  
  /** Konfiguracja OVH (opcjonalna) */
  ovh?: OVHConfig;
  
  /** Konfiguracja Anthropic AI */
  anthropic: AnthropicConfig;
  
  /** Katalog roboczy */
  workDir?: string;
  
  /** Czy wykonać dry-run (bez deploy) */
  dryRun?: boolean;
  
  /** Verbose logging */
  verbose?: boolean;
}

/**
 * Konfiguracja VPS
 */
export interface VPSConfig {
  /** Host (np. debian@203.0.113.10) */
  host: string;
  
  /** Port SSH (domyślnie 22) */
  port?: number;
  
  /** Klucz prywatny SSH (opcjonalnie) */
  privateKey?: string;
  
  /** Hasło (opcjonalnie) */
  password?: string;
  
  /** Katalog docelowy na VPS */
  webRoot: string;
  
  /** User (np. debian) */
  user: string;
}

/**
 * Konfiguracja Strapi
 */
export interface StrapiConfig {
  /** URL API Strapi */
  apiUrl: string;
  
  /** Token API (admin) */
  apiToken: string;
  
  /** Nazwa instancji (sites, motorent, etc.) */
  instance: string;
}

/**
 * Konfiguracja OVH
 */
export interface OVHConfig {
  /** Application Key */
  appKey: string;
  
  /** Application Secret */
  appSecret: string;
  
  /** Consumer Key */
  consumerKey: string;
  
  /** Endpoint (domyślnie: ovh-eu) */
  endpoint?: string;
}

/**
 * Konfiguracja Anthropic
 */
export interface AnthropicConfig {
  /** API Key */
  apiKey: string;
  
  /** Model (domyślnie: claude-sonnet-4-20250514) */
  model?: string;
}

/**
 * Status kroku budowania
 */
export type StepStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';

/**
 * Wynik kroku
 */
export interface StepResult {
  /** Nazwa kroku */
  step: string;
  
  /** Status */
  status: StepStatus;
  
  /** Czas wykonania (ms) */
  duration?: number;
  
  /** Komunikat */
  message?: string;
  
  /** Dane wyjściowe */
  data?: any;
  
  /** Błąd (jeśli failed) */
  error?: Error;
}

/**
 * Kontekst budowania (przechowuje dane między krokami)
 */
export interface BuildContext {
  /** Konfiguracja */
  config: SiteBuilderConfig;
  
  /** Analiza szablonu */
  analysis?: TemplateAnalysis;
  
  /** Schemat Strapi */
  strapiSchema?: any;
  
  /** Prompt dla Cursora */
  cursorPrompt?: string;
  
  /** Ścieżka do projektu Next.js */
  nextjsPath?: string;
  
  /** Build output path */
  buildPath?: string;
  
  /** Deploy URL */
  deployUrl?: string;
  
  /** Wyniki kroków */
  stepResults: StepResult[];
  
  /** Timestamp rozpoczęcia */
  startTime: number;
  
  /** Timestamp zakończenia */
  endTime?: number;
}

/**
 * Interfejs dla Step Handler
 */
export interface StepHandler {
  /** Nazwa kroku */
  name: string;
  
  /** Opis kroku */
  description: string;
  
  /** Wykonaj krok */
  execute(context: BuildContext): Promise<StepResult>;
  
  /** Czy krok może być pominięty */
  canSkip?(context: BuildContext): boolean;
}

/**
 * Opcje deployu
 */
export interface DeployOptions {
  /** Czy zrobić backup przed deploy */
  backup?: boolean;
  
  /** Czy zrestartować serwisy */
  restart?: boolean;
  
  /** Czy skonfigurować SSL */
  ssl?: boolean;
  
  /** Czy skonfigurować DNS */
  dns?: boolean;
}

/**
 * Wynik całego procesu budowania
 */
export interface BuildResult {
  /** Czy sukces */
  success: boolean;
  
  /** Czas całkowity (ms) */
  totalDuration: number;
  
  /** URL wdrożonej strony */
  deployUrl?: string;
  
  /** Wyniki kroków */
  steps: StepResult[];
  
  /** Błędy */
  errors: Error[];
  
  /** Metryki */
  metrics: BuildMetrics;
}

/**
 * Metryki budowania
 */
export interface BuildMetrics {
  /** Liczba kroków */
  totalSteps: number;
  
  /** Liczba udanych kroków */
  completedSteps: number;
  
  /** Liczba pominiętych kroków */
  skippedSteps: number;
  
  /** Liczba błędów */
  failedSteps: number;
  
  /** Koszty API (USD) */
  apiCosts?: {
    anthropic?: number;
    strapi?: number;
    total?: number;
  };
  
  /** Tokeny użyte (Anthropic) */
  tokens?: {
    input: number;
    output: number;
    total: number;
  };
}
