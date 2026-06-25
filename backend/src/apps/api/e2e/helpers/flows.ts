import type { E2EResponse, E2EServer } from "./superserver";

export type AuthenticatedUser = {
  token: string;
  user: {
    id: string;
    organizationId: string;
    email: string;
    type: "ADMIN" | "DEV";
  };
};

export async function createOrganization(
  server: E2EServer,
  input: {
    organizationName?: string;
    userName?: string;
    email?: string;
    password?: string;
  } = {},
) {
  return await server.post("/organizations", {
    organization: { name: input.organizationName ?? "Acme Corp" },
    user: {
      name: input.userName ?? "Admin User",
      email: input.email ?? "admin@acme.com",
      password: input.password ?? "secret123",
    },
  });
}

export async function login(
  server: E2EServer,
  credentials: { email?: string; password?: string } = {},
): Promise<E2EResponse<{ data: AuthenticatedUser }>> {
  return await server.post("/auth/login", {
    email: credentials.email ?? "admin@acme.com",
    password: credentials.password ?? "secret123",
  });
}

export async function createOrganizationAndLogin(server: E2EServer) {
  const created = await createOrganization(server);
  const authenticated = await login(server);

  return {
    created,
    token: authenticated.body.data.token,
    user: authenticated.body.data.user,
  };
}

export async function createProject(
  server: E2EServer,
  token: string,
  input: { name?: string; showPublicPage?: boolean; publicPageSlug?: string | null } = {},
) {
  return await server.post(
    "/projects",
    {
      name: input.name ?? "Incident Hub",
      showPublicPage: input.showPublicPage ?? false,
      publicPageSlug: input.publicPageSlug ?? null,
    },
    token,
  );
}

export async function createService(
  server: E2EServer,
  token: string,
  projectId: string,
  input: { name?: string; url?: string } = {},
) {
  return await server.post(
    `/projects/${projectId}/services`,
    {
      name: input.name ?? "Backend API",
      url: input.url ?? "https://api.example.com/health",
      intervalSeconds: 120,
      timeoutSeconds: 15,
      expectedResponseStatus: 200,
      incidentDetectionFails: 3,
      emailToAlert: "ops@example.com",
    },
    token,
  );
}
