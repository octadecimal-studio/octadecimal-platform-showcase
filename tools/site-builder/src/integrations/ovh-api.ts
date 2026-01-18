/**
 * OVH API Client
 * Zarządzanie DNS przez OVH API
 */

// @ts-ignore
import ovh from 'ovh';
import type { OVHConfig } from '../types/index.js';

export class OVHAPIClient {
  private client: any;
  private verbose: boolean;

  constructor(config: OVHConfig, verbose: boolean = false) {
    this.client = ovh({
      endpoint: config.endpoint || 'ovh-eu',
      appKey: config.appKey,
      appSecret: config.appSecret,
      consumerKey: config.consumerKey,
    });
    this.verbose = verbose;
  }

  /**
   * Tworzy rekord DNS typu A
   */
  async createARecord(domain: string, subdomain: string, target: string, ttl: number = 3600): Promise<void> {
    if (this.verbose) {
      console.log(`[OVH] Creating A record: ${subdomain}.${domain} -> ${target}`);
    }

    try {
      await this.client.requestPromised('POST', `/domain/zone/${domain}/record`, {
        fieldType: 'A',
        subDomain: subdomain,
        target: target,
        ttl: ttl,
      });

      // Refresh zone
      await this.client.requestPromised('POST', `/domain/zone/${domain}/refresh`);

      if (this.verbose) {
        console.log(`[OVH] ✓ A record created and zone refreshed`);
      }
    } catch (error) {
      throw new Error(`Failed to create A record: ${error}`);
    }
  }

  /**
   * Usuwa rekord DNS
   */
  async deleteRecord(domain: string, recordId: number): Promise<void> {
    if (this.verbose) {
      console.log(`[OVH] Deleting DNS record ID: ${recordId}`);
    }

    try {
      await this.client.requestPromised('DELETE', `/domain/zone/${domain}/record/${recordId}`);
      await this.client.requestPromised('POST', `/domain/zone/${domain}/refresh`);

      if (this.verbose) {
        console.log(`[OVH] ✓ Record deleted and zone refreshed`);
      }
    } catch (error) {
      throw new Error(`Failed to delete record: ${error}`);
    }
  }

  /**
   * Pobiera wszystkie rekordy DNS dla subdomeny
   */
  async getRecords(domain: string, subdomain: string): Promise<any[]> {
    try {
      const recordIds = await this.client.requestPromised('GET', `/domain/zone/${domain}/record`, {
        subDomain: subdomain,
      });

      const records = [];
      for (const id of recordIds) {
        const record = await this.client.requestPromised('GET', `/domain/zone/${domain}/record/${id}`);
        records.push(record);
      }

      return records;
    } catch (error) {
      throw new Error(`Failed to fetch records: ${error}`);
    }
  }

  /**
   * Sprawdza czy rekord istnieje
   */
  async recordExists(domain: string, subdomain: string, type: string = 'A'): Promise<boolean> {
    try {
      const records = await this.getRecords(domain, subdomain);
      return records.some(r => r.fieldType === type);
    } catch {
      return false;
    }
  }

  /**
   * Aktualizuje rekord DNS (usuwa stary, tworzy nowy)
   */
  async updateARecord(domain: string, subdomain: string, newTarget: string): Promise<void> {
    if (this.verbose) {
      console.log(`[OVH] Updating A record: ${subdomain}.${domain} -> ${newTarget}`);
    }

    // Pobierz istniejące rekordy
    const records = await this.getRecords(domain, subdomain);
    const aRecords = records.filter(r => r.fieldType === 'A');

    // Usuń stare rekordy A
    for (const record of aRecords) {
      await this.deleteRecord(domain, record.id);
    }

    // Utwórz nowy rekord
    await this.createARecord(domain, subdomain, newTarget);

    if (this.verbose) {
      console.log(`[OVH] ✓ A record updated`);
    }
  }
}
