import { randomUUID } from "node:crypto";
import type { FastifyZodInstance } from "~types/fastify-zod-instance";

const DEFAULT_PASSWORD = "password123";

export function authHeader(token: string): Record<string, string> {
  return { authorization: `Bearer ${token}` };
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

  const { token, user } = loginResponse.json().data;

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
    headers: authHeader(adminToken),
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

  const { token, user } = loginResponse.json().data;

  return {
    token,
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
  overrides?: { name?: string; showPublicPage?: boolean; publicPageSlug?: string },
) {
  const showPublicPage = overrides?.showPublicPage ?? false;
  const response = await app.inject({
    method: "POST",
    url: "/projects",
    headers: authHeader(token),
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
    headers: authHeader(token),
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
