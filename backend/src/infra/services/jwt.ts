import type {
	JwtAuthSignInput,
	JwtInterface,
	JwtSignInput,
} from "@domain/services/jwt.interface";
import { envs } from "@infra/envs";
import jwt from "jsonwebtoken";

export const FORGOT_PASSWORD_EXPIRES_IN_SECONDS = 60 * 10;
export const AUTH_EXPIRES_IN_SECONDS = 60 * 60 * 24;

export class JwtService implements JwtInterface {
	async signForgotPassword(input: JwtSignInput) {
		return jwt.sign({ sub: input.userId }, envs.FORGOT_PASSWORD_JWT_SECRET, {
			expiresIn: FORGOT_PASSWORD_EXPIRES_IN_SECONDS,
		});
	}

	async verifyForgotPassword(token: string) {
		const payload = jwt.verify(
			token,
			envs.FORGOT_PASSWORD_JWT_SECRET,
		) as jwt.JwtPayload;
		return { userId: payload.sub as string };
	}

	async signAuth(input: JwtAuthSignInput) {
		return jwt.sign(
			{
				userId: input.userId,
				organizationId: input.organizationId,
				type: input.type,
			},
			envs.AUTH_JWT_SECRET,
			{ expiresIn: AUTH_EXPIRES_IN_SECONDS },
		);
	}

	async verifyAuth(token: string) {
		const payload = jwt.verify(token, envs.AUTH_JWT_SECRET) as jwt.JwtPayload;
		return {
			userId: payload.userId as string,
			organizationId: payload.organizationId as string,
			type: payload.type as "ADMIN" | "DEV",
		};
	}
}
