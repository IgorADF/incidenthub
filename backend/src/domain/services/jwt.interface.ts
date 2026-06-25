export interface JwtSignInput {
  userId: string;
}

export interface JwtVerifyResult {
  userId: string;
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
