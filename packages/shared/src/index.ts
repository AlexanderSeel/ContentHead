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