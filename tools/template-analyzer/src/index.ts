/**
 * Template Analyzer - Main Entry Point
 */

export { TemplateAnalyzer } from './analyzer.js';
export { StrapiSchemaGenerator } from './schema-generator.js';
export { CursorPromptGenerator } from './prompt-generator.js';
export { AnthropicClient } from './anthropic-client.js';

export type {
  TemplateAnalysis,
  Section,
  Component,
  Field,
  ContentType,
  Relation,
  CursorPrompt,
  AnalyzerConfig,
  AnalyzeOptions,
  GenerateSchemaOptions,
  GenerateCursorPromptOptions,
} from './types/index.js';
