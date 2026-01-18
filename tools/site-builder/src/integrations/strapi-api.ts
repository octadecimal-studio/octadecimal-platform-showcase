/**
 * Strapi API Client
 * Integracja z Strapi CMS - import schematów, seed data
 */

import fetch from 'node-fetch';
import type { StrapiConfig } from '../types/index.js';

export class StrapiAPIClient {
  private baseUrl: string;
  private token: string;
  private verbose: boolean;

  constructor(config: StrapiConfig, verbose: boolean = false) {
    this.baseUrl = config.apiUrl.replace(/\/$/, '');
    this.token = config.apiToken;
    this.verbose = verbose;
  }

  /**
   * Importuje schemat Content Type do Strapi
   */
  async importContentType(schema: any): Promise<void> {
    if (this.verbose) {
      console.log(`[Strapi] Importing Content Type: ${schema.singularName}`);
    }

    const url = `${this.baseUrl}/content-type-builder/content-types`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
      },
      body: JSON.stringify(schema),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to import Content Type: ${error}`);
    }

    if (this.verbose) {
      console.log(`[Strapi] ✓ Content Type imported: ${schema.singularName}`);
    }
  }

  /**
   * Importuje wiele Content Types
   */
  async importContentTypes(schemas: any[]): Promise<void> {
    if (this.verbose) {
      console.log(`[Strapi] Importing ${schemas.length} Content Types...`);
    }

    for (const schema of schemas) {
      await this.importContentType(schema);
    }

    if (this.verbose) {
      console.log(`[Strapi] ✓ All Content Types imported`);
    }
  }

  /**
   * Tworzy wpis (entry) w Content Type
   */
  async createEntry(contentType: string, data: any): Promise<any> {
    if (this.verbose) {
      console.log(`[Strapi] Creating entry in: ${contentType}`);
    }

    const url = `${this.baseUrl}/api/${contentType}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
      },
      body: JSON.stringify({ data }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create entry: ${error}`);
    }

    const result: any = await response.json();
    
    if (this.verbose) {
      console.log(`[Strapi] ✓ Entry created: ${result.data?.id}`);
    }

    return result.data;
  }

  /**
   * Seeduje dane (tworzy wiele wpisów)
   */
  async seedData(contentType: string, entries: any[]): Promise<void> {
    if (this.verbose) {
      console.log(`[Strapi] Seeding ${entries.length} entries to: ${contentType}`);
    }

    for (const entry of entries) {
      await this.createEntry(contentType, entry);
    }

    if (this.verbose) {
      console.log(`[Strapi] ✓ All entries seeded to ${contentType}`);
    }
  }

  /**
   * Pobiera wszystkie wpisy z Content Type
   */
  async getEntries(contentType: string, params?: Record<string, any>): Promise<any[]> {
    const queryParams = new URLSearchParams(params).toString();
    const url = `${this.baseUrl}/api/${contentType}${queryParams ? '?' + queryParams : ''}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch entries: ${response.statusText}`);
    }

    const result: any = await response.json();
    return result.data || [];
  }

  /**
   * Sprawdza czy Content Type istnieje
   */
  async contentTypeExists(singularName: string): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/content-type-builder/content-types/${singularName}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Usuwa Content Type (ostrożnie!)
   */
  async deleteContentType(singularName: string): Promise<void> {
    if (this.verbose) {
      console.log(`[Strapi] Deleting Content Type: ${singularName}`);
    }

    const url = `${this.baseUrl}/content-type-builder/content-types/${singularName}`;
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete Content Type: ${response.statusText}`);
    }

    if (this.verbose) {
      console.log(`[Strapi] ✓ Content Type deleted: ${singularName}`);
    }
  }

  /**
   * Health check - sprawdza czy Strapi działa
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/_health`, {
        method: 'HEAD',
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
