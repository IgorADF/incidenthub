import jwt from "jsonwebtoken";
import {
  JwtInterface,
  JwtSignInput,
  JwtVerifyResult,
} from "@domain/services/jwt.interface";
import { envs } from "@infra/envs";

const FORGOT_PASSWORD_EXPIRES_IN_SECONDS = 60 * 10;

export class JwtService implements JwtInterface {
  async signForgotPassword(input: JwtSignInput) {
    return jwt.sign({ sub: input.sub }, envs.FORGOT_PASSWORD_JWT_SECRET, {
      expiresIn: FORGOT_PASSWORD_EXPIRES_IN_SECONDS,
    });
  }

  async verifyForgotPassword(token: string) {
    const payload = jwt.verify(
      token,
      envs.FORGOT_PASSWORD_JWT_SECRET,
    ) as jwt.JwtPayload;
    return { sub: payload.sub as string };
  }
}
