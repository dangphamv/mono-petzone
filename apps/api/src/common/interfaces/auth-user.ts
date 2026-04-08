export interface AuthUser {
  id: string;
  email?: string;
  role?: string;
  aud?: string | string[];
  app_metadata: Record<string, unknown>;
  user_metadata: Record<string, unknown>;
}
