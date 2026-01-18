/**
 * VPS SSH Client
 * Operacje SSH na VPS (deploy, konfiguracja)
 */

import { Client } from 'ssh2';
import { readFileSync } from 'fs';
import type { VPSConfig } from '../types/index.js';

export class VPSSSHClient {
  private config: VPSConfig;
  private verbose: boolean;

  constructor(config: VPSConfig, verbose: boolean = false) {
    this.config = config;
    this.verbose = verbose;
  }

  /**
   * Wykonuje komendę SSH na VPS
   */
  async executeCommand(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const conn = new Client();

      if (this.verbose) {
        console.log(`[SSH] Executing: ${command.substring(0, 100)}...`);
      }

      conn.on('ready', () => {
        conn.exec(command, (err, stream) => {
          if (err) {
            conn.end();
            return reject(err);
          }

          let output = '';
          let errorOutput = '';

          stream.on('close', (code: number) => {
            conn.end();
            
            if (code !== 0) {
              reject(new Error(`Command failed with code ${code}: ${errorOutput}`));
            } else {
              if (this.verbose) {
                console.log(`[SSH] ✓ Command completed`);
              }
              resolve(output);
            }
          });

          stream.on('data', (data: Buffer) => {
            output += data.toString();
          });

          stream.stderr.on('data', (data: Buffer) => {
            errorOutput += data.toString();
          });
        });
      });

      conn.on('error', reject);

      // Connect
      const connectConfig: any = {
        host: this.config.host.includes('@') ? this.config.host.split('@')[1] : this.config.host,
        port: this.config.port || 22,
        username: this.config.user,
      };

      if (this.config.privateKey) {
        connectConfig.privateKey = readFileSync(this.config.privateKey);
      } else if (this.config.password) {
        connectConfig.password = this.config.password;
      }

      conn.connect(connectConfig);
    });
  }

  /**
   * Tworzy katalog na VPS
   */
  async createDirectory(path: string): Promise<void> {
    await this.executeCommand(`mkdir -p ${path}`);
  }

  /**
   * Sprawdza czy plik/katalog istnieje
   */
  async exists(path: string): Promise<boolean> {
    try {
      await this.executeCommand(`test -e ${path}`);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Konfiguruje Nginx dla strony
   */
  async configureNginx(subdomain: string, webRoot: string): Promise<void> {
    if (this.verbose) {
      console.log(`[SSH] Configuring Nginx for: ${subdomain}`);
    }

    const nginxConfig = `
server {
    listen 80;
    server_name ${subdomain};
    root ${webRoot};
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    # Cache static files
    location ~* \\.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
`;

    // Zapisz konfigurację
    await this.executeCommand(`echo '${nginxConfig}' | sudo tee /etc/nginx/sites-available/${subdomain}`);
    
    // Symlink do sites-enabled
    await this.executeCommand(`sudo ln -sf /etc/nginx/sites-available/${subdomain} /etc/nginx/sites-enabled/${subdomain}`);
    
    // Test konfiguracji
    await this.executeCommand('sudo nginx -t');
    
    // Reload Nginx
    await this.executeCommand('sudo systemctl reload nginx');

    if (this.verbose) {
      console.log(`[SSH] ✓ Nginx configured and reloaded`);
    }
  }

  /**
   * Instaluje SSL przez Certbot
   */
  async installSSL(subdomain: string, email: string): Promise<void> {
    if (this.verbose) {
      console.log(`[SSH] Installing SSL for: ${subdomain}`);
    }

    await this.executeCommand(
      `sudo certbot --nginx -d ${subdomain} --non-interactive --agree-tos --email ${email}`
    );

    if (this.verbose) {
      console.log(`[SSH] ✓ SSL installed`);
    }
  }

  /**
   * Sprawdza status serwisu
   */
  async checkService(serviceName: string): Promise<boolean> {
    try {
      await this.executeCommand(`sudo systemctl is-active ${serviceName}`);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Uruchamia serwis
   */
  async startService(serviceName: string): Promise<void> {
    await this.executeCommand(`sudo systemctl start ${serviceName}`);
  }

  /**
   * Restartuje serwis
   */
  async restartService(serviceName: string): Promise<void> {
    await this.executeCommand(`sudo systemctl restart ${serviceName}`);
  }
}
