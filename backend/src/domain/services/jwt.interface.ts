export interface JwtSignInput {
  sub: string;
}

export interface JwtVerifyResult {
  sub: string;
}

export interface JwtInterface {
  signForgotPassword: (input: JwtSignInput) => Promise<string>;
  verifyForgotPassword: (token: string) => Promise<JwtVerifyResult>;
}
