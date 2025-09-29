export interface JwtPayload {
  sub: string;
  email: string;
  given_name: string;
  family_name: string;
  realm_access: {
    roles: string[];
  };
  iat: number;
  exp: number;
}

export interface UserInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}