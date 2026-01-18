/**
 * Site Builder - Główny orchestrator
 */

import { AnalyzeStep } from './steps/01-analyze.js';
import { StrapiImportStep } from './steps/02-strapi-import.js';
import { NextJSBuildStep } from './steps/03-nextjs-build.js';
import { DeployStep } from './steps/04-deploy.js';
import { DNSStep } from './steps/05-dns.js';
import { SSLStep } from './steps/06-ssl.js';
import type {
  SiteBuilderConfig,
  BuildContext,
  BuildResult,
  StepHandler,
} from './types/index.js';

export class SiteBuilder {
  private config: SiteBuilderConfig;
  private steps: StepHandler[];

  constructor(config: SiteBuilderConfig) {
    this.config = config;
    this.steps = [
      new AnalyzeStep(),
      new StrapiImportStep(),
      new NextJSBuildStep(),
      new DeployStep(),
      new DNSStep(),
      new SSLStep(),
    ];
  }

  /**
   * Wykonuje cały proces budowania
   */
  async build(): Promise<BuildResult> {
    const context: BuildContext = {
      config: this.config,
      stepResults: [],
      startTime: Date.now(),
    };

    console.log(`\n🚀 Site Builder - Start: ${this.config.projectName}`);
    console.log(`📦 Template: ${this.config.templateUrl}`);
    console.log(`🌐 Subdomain: ${this.config.subdomain}\n`);

    const errors: Error[] = [];
    let completedSteps = 0;
    let skippedSteps = 0;

    for (const step of this.steps) {
      // Skip jeśli można
      if (step.canSkip && step.canSkip(context)) {
        console.log(`⏭️  [${step.name}] Pominięty: ${step.description}`);
        
        context.stepResults.push({
          step: step.name,
          status: 'skipped',
          message: 'Pominięty',
        });
        
        skippedSteps++;
        continue;
      }

      console.log(`⚙️  [${step.name}] Rozpoczynam: ${step.description}`);

      const result = await step.execute(context);
      context.stepResults.push(result);

      if (result.status === 'completed') {
        console.log(`✅ [${step.name}] Zakończony: ${result.message}`);
        completedSteps++;
      } else if (result.status === 'failed') {
        console.error(`❌ [${step.name}] Błąd: ${result.message}`);
        if (result.error) {
          errors.push(result.error);
        }
        // Continue mimo błędu (niektóre kroki mogą się nie udać)
      }
    }

    context.endTime = Date.now();
    const totalDuration = context.endTime - context.startTime;

    const buildResult: BuildResult = {
      success: errors.length === 0,
      totalDuration,
      deployUrl: context.deployUrl,
      steps: context.stepResults,
      errors,
      metrics: {
        totalSteps: this.steps.length,
        completedSteps,
        skippedSteps,
        failedSteps: errors.length,
      },
    };

    // Podsumowanie
    console.log(`\n${buildResult.success ? '✅' : '⚠️'}  Proces zakończony`);
    console.log(`⏱️  Czas: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log(`📊 Kroki: ${completedSteps}/${this.steps.length} zakończone`);
    
    if (buildResult.deployUrl) {
      console.log(`🌐 URL: ${buildResult.deployUrl}`);
    }

    if (errors.length > 0) {
      console.log(`\n⚠️  Błędy (${errors.length}):`);
      errors.forEach(err => console.error(`  - ${err.message}`));
    }

    return buildResult;
  }
}
