export type User = {
  id: number;
  username: string;
  displayName: string;
  createdAt: string;
};

export type AuthPayload = {
  token: string;
  user: User;
};

export * from './rules/engine.js';
export * from './forms/conditions.js';
