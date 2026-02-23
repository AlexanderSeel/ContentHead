import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';

import type { DbClient } from '../db/DbClient.js';
import type { DbUser, SafeUser } from '../types/user.js';

export type JwtClaims = {
  sub: string;
  username: string;
};

export type PreviewClaims = {
  type: 'preview';
  contentItemId: number;
};

export class InternalAuthProvider {
  constructor(
    private readonly db: DbClient,
    private readonly jwtSecret: string,
    private readonly jwtExpiresIn: NonNullable<SignOptions['expiresIn']>
  ) {}

  async createUser(input: { username: string; password: string; displayName: string }): Promise<SafeUser> {
    const passwordHash = await bcrypt.hash(input.password, 12);
    const nextIdRow = await this.db.get<{ nextId: number }>(
      'SELECT COALESCE(MAX(id), 0) + 1 as nextId FROM users'
    );
    const nextId = nextIdRow?.nextId ?? 1;

    await this.db.run(
      'INSERT INTO users(id, username, password_hash, display_name) VALUES (?, ?, ?, ?)',
      [nextId, input.username, passwordHash, input.displayName]
    );

    const created = await this.db.get<DbUser>(
      'SELECT id, username, password_hash as passwordHash, display_name as displayName, COALESCE(active, TRUE) as active, created_at as createdAt FROM users WHERE username = ?',
      [input.username]
    );

    if (!created) {
      throw new Error('User creation failed');
    }

    return this.toSafeUser(created);
  }

  async validateCredentials(username: string, password: string): Promise<SafeUser | null> {
    const user = await this.db.get<DbUser>(
      'SELECT id, username, password_hash as passwordHash, display_name as displayName, COALESCE(active, TRUE) as active, created_at as createdAt FROM users WHERE username = ?',
      [username]
    );

    if (!user || user.active === false) {
      return null;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return null;
    }

    return this.toSafeUser(user);
  }

  async getUserById(id: number): Promise<SafeUser | null> {
    const user = await this.db.get<DbUser>(
      'SELECT id, username, password_hash as passwordHash, display_name as displayName, COALESCE(active, TRUE) as active, created_at as createdAt FROM users WHERE id = ?',
      [id]
    );

    if (!user || user.active === false) {
      return null;
    }

    return this.toSafeUser(user);
  }

  issueToken(user: SafeUser): string {
    return jwt.sign({ sub: String(user.id), username: user.username }, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn
    });
  }

  verifyToken(token: string): JwtClaims | null {
    try {
      return jwt.verify(token, this.jwtSecret) as JwtClaims;
    } catch {
      return null;
    }
  }

  issuePreviewToken(contentItemId: number): string {
    return jwt.sign({ type: 'preview', contentItemId } as PreviewClaims, this.jwtSecret, {
      expiresIn: '2h'
    });
  }

  verifyPreviewToken(token: string): PreviewClaims | null {
    try {
      const claims = jwt.verify(token, this.jwtSecret) as PreviewClaims;
      if (claims.type !== 'preview') {
        return null;
      }
      return claims;
    } catch {
      return null;
    }
  }

  private toSafeUser(user: DbUser): SafeUser {
    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      createdAt: user.createdAt
    };
  }
}
