/**
 * Step 4: Deploy na VPS
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { VPSSSHClient } from '../integrations/vps-ssh.js';
import type { StepHandler, BuildContext, StepResult } from '../types/index.js';

const execAsync = promisify(exec);

export class DeployStep implements StepHandler {
  name = '04-deploy';
  description = 'Deploy plików na VPS';

  async execute(context: BuildContext): Promise<StepResult> {
    const startTime = Date.now();

    try {
      const { config, buildPath } = context;

      if (!buildPath) {
        throw new Error('Brak ścieżki build - uruchom najpierw krok nextjs-build');
      }

      const vpsClient = new VPSSSHClient(config.vps, config.verbose);
      
      // Utwórz katalog na VPS
      await vpsClient.createDirectory(config.vps.webRoot);

      // Deploy przez rsync
      const rsyncCmd = `rsync -avz --delete ${buildPath}/ ${config.vps.user}@${config.vps.host.split('@')[1]}:${config.vps.webRoot}/`;
      
      if (config.verbose) {
        console.log(`[Deploy] Executing: ${rsyncCmd}`);
      }

      await execAsync(rsyncCmd);

      // Konfiguruj Nginx
      await vpsClient.configureNginx(config.subdomain, config.vps.webRoot);

      context.deployUrl = `http://${config.subdomain}`;

      return {
        step: this.name,
        status: 'completed',
        duration: Date.now() - startTime,
        message: `Deploy zakończony pomyślnie na ${config.subdomain}`,
        data: {
          deployUrl: context.deployUrl,
        },
      };
    } catch (error) {
      return {
        step: this.name,
        status: 'failed',
        duration: Date.now() - startTime,
        message: `Błąd podczas deploy: ${(error as Error).message}`,
        error: error as Error,
      };
    }
  }

  canSkip(context: BuildContext): boolean {
    return !!context.config.dryRun;
  }
}
