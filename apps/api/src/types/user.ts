export type DbUser = {
  id: number;
  username: string;
  passwordHash: string;
  displayName: string;
  active?: boolean;
  createdAt: string;
};

export type SafeUser = {
  id: number;
  username: string;
  displayName: string;
  createdAt: string;
};
