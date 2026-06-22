export interface JwtSignInput {
  sub: string;
}

export interface JwtVerifyResult {
  sub: string;
}

export interface JwtInterface {
  // sign: (input: JwtSignInput) => Promise<string>;
  // verify: (token: string) => Promise<JwtVerifyResult>;

  signForgotPassword: (input: JwtSignInput) => Promise<string>;
  verifyForgotPassword: (token: string) => Promise<JwtVerifyResult>;
}
