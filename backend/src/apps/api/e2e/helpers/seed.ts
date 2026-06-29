import { randomUUID } from "node:crypto";
import { envs } from "@infra/envs";
import type { FastifyZodInstance } from "~types/fastify-zod-instance";

const DEFAULT_PASSWORD = "password123";

export function authCookies(token: string): {
	cookies: Record<string, string>;
} {
	return { cookies: { [envs.COOKIE_NAME]: token } };
}

function extractTokenFromSetCookie(setCookie: string | string[]): string {
	const raw = Array.isArray(setCookie) ? setCookie[0] : setCookie;
	if (!raw) {
		throw new Error("login response missing Set-Cookie header");
	}
	const pair = raw.split(";")[0];
	const eq = pair.indexOf("=");
	if (eq === -1) {
		throw new Error("malformed Set-Cookie header");
	}
	return pair.slice(eq + 1);
}

export function uniqueEmail(): string {
	return `user-${randomUUID()}@e2e.test`;
}

export function uniqueName(prefix: string): string {
	return `${prefix}-${randomUUID().slice(0, 8)}`;
}

/** POST /organizations (creates org + ADMIN user) then POST /auth/login. */
export async function seedOrganizationAndAdmin(app: FastifyZodInstance) {
	const email = uniqueEmail();
	const password = DEFAULT_PASSWORD;
	const organizationName = uniqueName("Org");

	const createOrgResponse = await app.inject({
		method: "POST",
		url: "/organizations",
		payload: {
			organization: { name: organizationName },
			user: { name: "Admin User", email, password },
		},
	});

	if (createOrgResponse.statusCode !== 201) {
		throw new Error(
			`seedOrganizationAndAdmin failed: ${createOrgResponse.statusCode} ${createOrgResponse.body}`,
		);
	}

	const loginResponse = await app.inject({
		method: "POST",
		url: "/auth/login",
		payload: { email, password },
	});

	if (loginResponse.statusCode !== 200) {
		throw new Error(
			`seedOrganizationAndAdmin login failed: ${loginResponse.statusCode} ${loginResponse.body}`,
		);
	}

	const user = loginResponse.json().data.user;
	const token = extractTokenFromSetCookie(
		loginResponse.headers["set-cookie"] ?? "",
	);

	return {
		token,
		userId: user.id,
		organizationId: user.organizationId,
		email,
		password,
		organizationName,
	};
}

/** POST /users (type DEV) within the admin's org then login as that user. */
export async function seedDevUserAndLogin(
	app: FastifyZodInstance,
	adminToken: string,
) {
	const email = uniqueEmail();
	const password = DEFAULT_PASSWORD;

	const createResponse = await app.inject({
		method: "POST",
		url: "/users",
		...authCookies(adminToken),
		payload: { name: "Dev User", email, password, type: "DEV" },
	});

	if (createResponse.statusCode !== 201) {
		throw new Error(
			`seedDevUserAndLogin failed: ${createResponse.statusCode} ${createResponse.body}`,
		);
	}

	const loginResponse = await app.inject({
		method: "POST",
		url: "/auth/login",
		payload: { email, password },
	});

	if (loginResponse.statusCode !== 200) {
		throw new Error(
			`seedDevUserAndLogin login failed: ${loginResponse.statusCode} ${loginResponse.body}`,
		);
	}

	const user = loginResponse.json().data.user;
	const token = extractTokenFromSetCookie(
		loginResponse.headers["set-cookie"] ?? "",
	);

	return {
		token,
		userId: user.id,
		organizationId: user.organizationId,
		email,
		password,
	};
}

/** POST /users (type ADMIN) within the caller's org. Returns created user (no login). */
export async function seedSecondAdmin(
	app: FastifyZodInstance,
	adminToken: string,
) {
	const email = uniqueEmail();
	const password = DEFAULT_PASSWORD;

	const createResponse = await app.inject({
		method: "POST",
		url: "/users",
		...authCookies(adminToken),
		payload: { name: "Second Admin", email, password, type: "ADMIN" },
	});

	if (createResponse.statusCode !== 201) {
		throw new Error(
			`seedSecondAdmin failed: ${createResponse.statusCode} ${createResponse.body}`,
		);
	}

	const user = createResponse.json().data.user;

	return {
		userId: user.id,
		organizationId: user.organizationId,
		email,
		password,
	};
}

/** POST /projects within the caller's organization. */
export async function seedProject(
	app: FastifyZodInstance,
	token: string,
	overrides?: {
		name?: string;
		showPublicPage?: boolean;
		publicPageSlug?: string;
	},
) {
	const showPublicPage = overrides?.showPublicPage ?? false;
	const response = await app.inject({
		method: "POST",
		url: "/projects",
		...authCookies(token),
		payload: {
			name: overrides?.name ?? uniqueName("Project"),
			showPublicPage,
			publicPageSlug: overrides?.publicPageSlug ?? null,
		},
	});

	if (response.statusCode !== 201) {
		throw new Error(
			`seedProject failed: ${response.statusCode} ${response.body}`,
		);
	}

	return { projectId: response.json().data.project.id as string };
}

/** POST /projects/:projectId/services under a project. */
export async function seedService(
	app: FastifyZodInstance,
	token: string,
	projectId: string,
) {
	const response = await app.inject({
		method: "POST",
		url: `/projects/${projectId}/services`,
		...authCookies(token),
		payload: {
			name: uniqueName("Service"),
			url: "https://api.example.com/health",
			intervalSeconds: 60,
			timeoutSeconds: 10,
			expectedResponseStatus: 200,
			incidentDetectionFails: 3,
			emailToAlert: "ops@example.com",
		},
	});

	if (response.statusCode !== 201) {
		throw new Error(
			`seedService failed: ${response.statusCode} ${response.body}`,
		);
	}

	return { serviceId: response.json().data.service.id as string };
}