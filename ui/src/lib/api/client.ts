import { envs } from "#/lib/envs";

export type DuplicateContext = {
	entity?: string;
	field?: string;
};

export type ApiErrorBody = {
	code?: string;
	message?: string;
	details?: unknown;
	issues?: unknown;
	context?: DuplicateContext;
};

export class ApiError extends Error {
	readonly code: string;
	readonly status: number;
	readonly details?: unknown;
	readonly issues?: unknown;
	readonly context?: DuplicateContext;

	constructor(
		code: string,
		message: string,
		status: number,
		body?: ApiErrorBody,
	) {
		super(message);
		this.name = "ApiError";
		this.code = code;
		this.status = status;
		this.details = body?.details;
		this.issues = body?.issues;
		this.context = body?.context;
	}

	get isNetworkError(): boolean {
		return this.status === 0;
	}
}

export async function apiFetch<T>(
	path: string,
	init?: RequestInit,
): Promise<T> {
	let res: Response;
	try {
		res = await fetch(`${envs.VITE_API_URL}${path}`, {
			credentials: "include",
			headers: {
				"Content-Type": "application/json",
				...init?.headers,
			},
			...init,
		});
	} catch {
		throw new ApiError("NETWORK_ERROR", "Unable to reach the server", 0);
	}

	const body: unknown = await res.json().catch(() => null);
	const errorBody = (body ?? {}) as ApiErrorBody;

	if (!res.ok) {
		throw new ApiError(
			errorBody.code ?? "UNKNOWN_ERROR",
			errorBody.message ?? res.statusText,
			res.status,
			errorBody,
		);
	}

	return body as T;
}
