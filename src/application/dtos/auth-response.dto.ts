export interface AuthTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export interface UserInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  isActive: boolean;
  keycloakId?: string;
  roles?: string[];
}

export interface TokenValidationResult {
  isValid: boolean;
  user?: UserInfo;
  error?: string;
}