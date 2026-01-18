/**
 * Step 6: SSL Certbot
 */

import { VPSSSHClient } from '../integrations/vps-ssh.js';
import type { StepHandler, BuildContext, StepResult } from '../types/index.js';

export class SSLStep implements StepHandler {
  name = '06-ssl';
  description = 'Instalacja SSL przez Certbot';

  async execute(context: BuildContext): Promise<StepResult> {
    const startTime = Date.now();

    try {
      const { config } = context;

      const vpsClient = new VPSSSHClient(config.vps, config.verbose);
      
      // Email dla SSL (placeholder - powinien być w config)
      const email = 'admin@example.com';

      await vpsClient.installSSL(config.subdomain, email);

      // Aktualizuj URL na HTTPS
      context.deployUrl = `https://${config.subdomain}`;

      return {
        step: this.name,
        status: 'completed',
        duration: Date.now() - startTime,
        message: `SSL zainstalowany dla ${config.subdomain}`,
        data: {
          httpsUrl: context.deployUrl,
        },
      };
    } catch (error) {
      return {
        step: this.name,
        status: 'failed',
        duration: Date.now() - startTime,
        message: `Błąd podczas instalacji SSL: ${(error as Error).message}`,
        error: error as Error,
      };
    }
  }

  canSkip(context: BuildContext): boolean {
    return !!context.config.dryRun;
  }
}
