export type UserRole = "customer" | "admin" | "inventory" | "marketing" | "support" | string;

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  phone_number: string;
  role: UserRole;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  is_email_verified: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
  roles?: UserRole[];
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user?: UserProfile;
  token?: string; // Legacy fallback
  access: string;
  refresh: string;
}

export interface AuthContextValue {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: AuthCredentials) => Promise<UserProfile>;
  logout: () => void;
}
