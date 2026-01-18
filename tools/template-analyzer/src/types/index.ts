/**
 * Typy dla Template Analyzer
 */

export interface TemplateAnalysis {
  /** URL źródłowego szablonu */
  sourceUrl: string;
  
  /** Data analizy */
  analyzedAt: string;
  
  /** Zidentyfikowane sekcje strony */
  sections: Section[];
  
  /** Zidentyfikowane komponenty */
  components: Component[];
  
  /** Wymagane Content Types dla Strapi */
  contentTypes: ContentType[];
  
  /** Zależności między typami (relacje) */
  relations: Relation[];
  
  /** Podsumowanie analizy */
  summary: string;
}

export interface Section {
  /** Identyfikator sekcji */
  id: string;
  
  /** Nazwa sekcji (np. "Hero", "Features", "Pricing") */
  name: string;
  
  /** Opis sekcji */
  description: string;
  
  /** Czy sekcja wymaga dynamicznych danych */
  isDynamic: boolean;
  
  /** Komponenty w sekcji */
  components: string[];
  
  /** Pola danych wymagane w sekcji */
  fields: Field[];
}

export interface Component {
  /** Identyfikator komponentu */
  id: string;
  
  /** Nazwa komponentu (np. "BikeCard", "ContactForm") */
  name: string;
  
  /** Typ komponentu (card, form, gallery, etc.) */
  type: 'card' | 'form' | 'gallery' | 'list' | 'slider' | 'hero' | 'other';
  
  /** Opis komponentu */
  description: string;
  
  /** Pola komponentu */
  fields: Field[];
}

export interface Field {
  /** Nazwa pola */
  name: string;
  
  /** Typ pola Strapi */
  type: StrapiFieldType;
  
  /** Czy pole jest wymagane */
  required: boolean;
  
  /** Opis pola */
  description?: string;
  
  /** Domyślna wartość */
  defaultValue?: any;
  
  /** Opcje dla pola (enum, relacja, etc.) */
  options?: Record<string, any>;
}

export type StrapiFieldType = 
  | 'string'
  | 'text'
  | 'richtext'
  | 'email'
  | 'password'
  | 'integer'
  | 'biginteger'
  | 'float'
  | 'decimal'
  | 'date'
  | 'time'
  | 'datetime'
  | 'boolean'
  | 'enumeration'
  | 'json'
  | 'media'
  | 'relation'
  | 'component'
  | 'dynamiczone'
  | 'uid';

export interface ContentType {
  /** Nazwa Content Type (singular) */
  singularName: string;
  
  /** Nazwa Content Type (plural) */
  pluralName: string;
  
  /** Nazwa wyświetlana */
  displayName: string;
  
  /** Opis */
  description?: string;
  
  /** Czy jest Collection Type (false = Single Type) */
  isCollection: boolean;
  
  /** Atrybuty (pola) */
  attributes: Record<string, FieldDefinition>;
  
  /** Opcje */
  options?: {
    draftAndPublish?: boolean;
  };
}

export interface FieldDefinition {
  /** Typ pola */
  type: StrapiFieldType;
  
  /** Czy wymagane */
  required?: boolean;
  
  /** Unikalność */
  unique?: boolean;
  
  /** Min długość */
  minLength?: number;
  
  /** Max długość */
  maxLength?: number;
  
  /** Wartość domyślna */
  default?: any;
  
  /** Enum values */
  enum?: string[];
  
  /** Relacja */
  relation?: 'oneToOne' | 'oneToMany' | 'manyToOne' | 'manyToMany';
  
  /** Target dla relacji */
  target?: string;
  
  /** Dozwolone typy mediów */
  allowedTypes?: ('images' | 'videos' | 'files' | 'audios')[];
  
  /** Multiple media */
  multiple?: boolean;
}

export interface Relation {
  /** Typ źródłowy */
  from: string;
  
  /** Typ docelowy */
  to: string;
  
  /** Typ relacji */
  type: 'oneToOne' | 'oneToMany' | 'manyToOne' | 'manyToMany';
  
  /** Opis relacji */
  description?: string;
}

export interface CursorPrompt {
  /** Nazwa projektu */
  projectName: string;
  
  /** Główny prompt */
  mainPrompt: string;
  
  /** Prompt dla struktury katalogów */
  structurePrompt: string;
  
  /** Prompt dla komponentów */
  componentsPrompt: string;
  
  /** Prompt dla integracji Strapi */
  strapiPrompt: string;
  
  /** Przykładowy kod */
  examples: CodeExample[];
}

export interface CodeExample {
  /** Nazwa pliku */
  filename: string;
  
  /** Język programowania */
  language: string;
  
  /** Kod */
  code: string;
  
  /** Opis */
  description: string;
}

export interface AnalyzerConfig {
  /** Klucz API Anthropic */
  anthropicApiKey: string;
  
  /** Model Claude (domyślnie: claude-sonnet-4-20250514) */
  model?: string;
  
  /** Max tokenów odpowiedzi */
  maxTokens?: number;
  
  /** Verbose logging */
  verbose?: boolean;
}

export interface AnalyzeOptions {
  /** URL szablonu do analizy */
  templateUrl: string;
  
  /** Nazwa projektu */
  projectName: string;
  
  /** Katalog wyjściowy */
  outputDir?: string;
  
  /** Czy zapisać wyniki do pliku */
  saveToFile?: boolean;
  
  /** Czy wygenerować również prompt dla Cursora */
  generateCursorPrompt?: boolean;
}

export interface GenerateSchemaOptions {
  /** Katalog wyjściowy */
  outputDir?: string;
  
  /** Nazwa pliku wyjściowego */
  outputFile?: string;
}

export interface GenerateCursorPromptOptions {
  /** Katalog wyjściowy */
  outputDir?: string;
  
  /** Nazwa pliku wyjściowego */
  outputFile?: string;
}
