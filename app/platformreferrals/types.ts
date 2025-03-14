export type UserRole = 'USER' | 'PLATFORMADMIN' | 'SUPERADMIN';

export interface ClerkUserMetadata {
  role: UserRole;
  brandIds: string[];
  referredByUserId?: string;
}

export interface UserSession {
  userId: string;
  role: UserRole;
  email: string;
  firstName?: string;
  lastName?: string;
  brandIds: string[];
  referredByUserId?: string;
} 