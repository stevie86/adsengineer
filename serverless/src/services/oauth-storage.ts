import { Hono } from 'hono';
import type { Context } from 'hono';

export class OAuthStorageService {
  constructor(private db: D1Database) {}

  async storeEncryptedTokens(agencyId: string, tokens: any) {
    const encryptedTokens = await this.encryptOAuthTokens(tokens);

    await this.db.prepare(`
      UPDATE agencies
      SET config = json_patch(config, json(?)),
          updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      JSON.stringify({ oauth_tokens: encryptedTokens }),
      agencyId
    ).run();
  }

  async getTokens(agencyId: string): Promise<any> {
    const agency = await this.db.prepare('SELECT config FROM agencies WHERE id = ?')
      .bind(agencyId).first();

    if (!agency?.config?.oauth_tokens) return null;

    return this.decryptOAuthTokens(agency.config.oauth_tokens);
  }

  private async encryptOAuthTokens(tokens: any): Promise<string> {
    const { encrypt } = await import('./encryption');
    return encrypt(JSON.stringify(tokens), 'oauth-tokens');
  }

  private async decryptOAuthTokens(encryptedTokens: string): Promise<any> {
    const { decrypt } = await import('./encryption');
    const decrypted = await decrypt(encryptedTokens, 'oauth-tokens');
    return JSON.parse(decrypted);
  }
}