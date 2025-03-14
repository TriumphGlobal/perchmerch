export type ClerkRole = 'superAdmin' | 'platformAdmin' | 'user'

export interface ClerkMetadata {
  role?: ClerkRole;
}

export interface ClerkUser {
  id: string;
  emailAddresses: Array<{ emailAddress: string }>;
  primaryEmailAddress?: { emailAddress: string };
  firstName?: string | null;
  publicMetadata: ClerkMetadata;
  privateMetadata: ClerkMetadata;
}

export interface SessionClaims {
  azp?: string;
  exp?: number;
  iat?: number;
  iss?: string;
  nbf?: number;
  sid?: string;
  sub?: string;
  metadata?: ClerkMetadata;
  [key: string]: any;
}

export interface ClerkSession {
  sessionClaims: SessionClaims;
  userId: string;
}
