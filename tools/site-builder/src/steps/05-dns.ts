/**
 * Step 5: Konfiguracja DNS
 */

import { OVHAPIClient } from '../integrations/ovh-api.js';
import type { StepHandler, BuildContext, StepResult } from '../types/index.js';

export class DNSStep implements StepHandler {
  name = '05-dns';
  description = 'Konfiguracja DNS przez OVH';

  async execute(context: BuildContext): Promise<StepResult> {
    const startTime = Date.now();

    try {
      const { config } = context;

      if (!config.ovh) {
        return {
          step: this.name,
          status: 'skipped',
          duration: Date.now() - startTime,
          message: 'Konfiguracja OVH nie podana - pomijam DNS',
        };
      }

      const ovhClient = new OVHAPIClient(config.ovh, config.verbose);
      
      // Wyciągnij domenę i subdomenę
      const parts = config.subdomain.split('.');
      const subdomain = parts[0];
      const domain = parts.slice(1).join('.');

      // Pobierz IP VPS
      const vpsIP = config.vps.host.includes('@') ? config.vps.host.split('@')[1] : config.vps.host;

      // Sprawdź czy rekord istnieje
      const exists = await ovhClient.recordExists(domain, subdomain);

      if (exists) {
        await ovhClient.updateARecord(domain, subdomain, vpsIP);
      } else {
        await ovhClient.createARecord(domain, subdomain, vpsIP);
      }

      return {
        step: this.name,
        status: 'completed',
        duration: Date.now() - startTime,
        message: `DNS skonfigurowany: ${subdomain}.${domain} -> ${vpsIP}`,
        data: {
          subdomain,
          domain,
          ip: vpsIP,
        },
      };
    } catch (error) {
      return {
        step: this.name,
        status: 'failed',
        duration: Date.now() - startTime,
        message: `Błąd podczas konfiguracji DNS: ${(error as Error).message}`,
        error: error as Error,
      };
    }
  }

  canSkip(context: BuildContext): boolean {
    return !context.config.ovh || !!context.config.dryRun;
  }
}
