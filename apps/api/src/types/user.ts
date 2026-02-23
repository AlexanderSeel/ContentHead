export type DbUser = {
  id: number;
  username: string;
  passwordHash: string;
  displayName: string;
  createdAt: string;
};

export type SafeUser = {
  id: number;
  username: string;
  displayName: string;
  createdAt: string;
};