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

export * from './rules/engine';
export * from './forms/conditions';
export * from './locales/catalog';
export * from './routing/urlPattern';
