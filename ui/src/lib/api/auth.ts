import { apiFetch } from "#/lib/api/client";
import type { AuthUser } from "#/types/user";

export type LoginInput = {
	email: string;
	password: string;
};

export type LoginResponse = {
	data: {
		user: AuthUser;
	};
};

export function login(input: LoginInput): Promise<LoginResponse> {
	return apiFetch<LoginResponse>("/auth/login", {
		method: "POST",
		body: JSON.stringify(input),
	});
}
