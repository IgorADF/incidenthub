import { apiFetch } from "#/lib/api/client";

export type ForgotPasswordInput = {
	email: string;
};

export type ForgotPasswordResponse = {
	data: { sent: boolean };
};

export type ResetPasswordInput = {
	token: string;
	password: string;
};

export type ResetPasswordResponse = {
	data: { reset: boolean };
};

export function forgotPassword(
	input: ForgotPasswordInput,
): Promise<ForgotPasswordResponse> {
	return apiFetch<ForgotPasswordResponse>("/password/forgot", {
		method: "POST",
		body: JSON.stringify(input),
	});
}

export function resetPassword(
	input: ResetPasswordInput,
): Promise<ResetPasswordResponse> {
	return apiFetch<ResetPasswordResponse>("/password/reset", {
		method: "POST",
		body: JSON.stringify(input),
	});
}
