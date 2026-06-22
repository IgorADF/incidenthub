import { JwtInterface, JwtSignInput, JwtVerifyResult } from "./jwt.interface";

export class JwtTestService implements JwtInterface {
  private counter = 0;
  private tokens: { [token: string]: JwtVerifyResult } = {};

  // async sign(input: JwtSignInput, ) {
  //   this.counter += 1;
  //   const token = `test-token-${this.counter}`;
  //   this.tokens[token] = { sub: input.sub };
  //   return token;
  // }

  // async verify(token: string) {
  //   const payload = this.tokens[token];
  //   if (!payload) {
  //     throw new Error("Invalid token");
  //   }
  //   return payload;
  // }

  async signForgotPassword(input: JwtSignInput) {
    this.counter += 1;
    const token = `test-token-${this.counter}`;
    this.tokens[token] = { sub: input.sub };
    return token;
  }

  async verifyForgotPassword(token: string) {
    const payload = this.tokens[token];
    if (!payload) {
      throw new Error("Invalid token");
    }
    return payload;
  }
}
