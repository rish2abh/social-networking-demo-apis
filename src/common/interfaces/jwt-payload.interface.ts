export interface JwtPayload {
  sub: string; // user._id as string
  email: string;
  iat?: number;
  exp?: number;
}
