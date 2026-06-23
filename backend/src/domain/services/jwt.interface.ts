export interface JwtSignInput {
  sub: string;
}

export interface JwtVerifyResult {
  sub: string;
}

export interface JwtAuthSignInput {
  userId: string;
  organizationId: string;
  type: "ADMIN" | "DEV";
}

export interface JwtAuthVerifyResult {
  userId: string;
  organizationId: string;
  type: "ADMIN" | "DEV";
}

export interface JwtInterface {
  signForgotPassword: (input: JwtSignInput) => Promise<string>;
  verifyForgotPassword: (token: string) => Promise<JwtVerifyResult>;
  signAuth: (input: JwtAuthSignInput) => Promise<string>;
  verifyAuth: (token: string) => Promise<JwtAuthVerifyResult>;
}
