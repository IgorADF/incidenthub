import {
  JwtInterface,
  JwtSignInput,
  JwtVerifyResult,
  JwtAuthSignInput,
  JwtAuthVerifyResult,
} from "./jwt.interface";

export class JwtTestService implements JwtInterface {
  private counter = 0;
  private tokens: { [token: string]: JwtVerifyResult | JwtAuthVerifyResult } =
    {};

  async signForgotPassword(input: JwtSignInput) {
    this.counter += 1;
    const token = `test-token-${this.counter}`;
    this.tokens[token] = { userId: input.userId };
    return token;
  }

  async verifyForgotPassword(token: string) {
    const payload = this.tokens[token] as JwtVerifyResult | undefined;
    if (!payload) {
      throw new Error("Invalid token");
    }
    return payload;
  }

  async signAuth(input: JwtAuthSignInput) {
    this.counter += 1;
    const token = `test-auth-token-${this.counter}`;
    this.tokens[token] = { ...input };
    return token;
  }

  async verifyAuth(token: string) {
    const payload = this.tokens[token] as JwtAuthVerifyResult | undefined;
    if (!payload) {
      throw new Error("Invalid token");
    }
    return payload;
  }
}
