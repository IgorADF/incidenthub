import { describe, expect, it } from "vitest";
import { createE2EServer } from "./helpers/superserver";
import { createOrganizationAndLogin, createProject } from "./helpers/flows";

describe("project routes (e2e)", () => {
  it("should create and list projects for the authenticated organization", async () => {
    const server = await createE2EServer(import.meta.url);

    try {
      const { token } = await createOrganizationAndLogin(server);

      const unauthorized = await server.get("/projects");
      expect(unauthorized.statusCode).toBe(401);

      const created = await createProject(server, token, {
        name: "Public Status",
        showPublicPage: true,
        publicPageSlug: "public-status",
      });

      expect(created.statusCode).toBe(201);
      expect(created.body.data.project).toEqual(
        expect.objectContaining({
          name: "Public Status",
          showPublicPage: true,
          publicPageSlug: "public-status",
        }),
      );

      const listed = await server.get("/projects", token);

      expect(listed.statusCode).toBe(200);
      expect(listed.body.data.projects).toHaveLength(1);
      expect(listed.body.data.projects[0]).toEqual(
        expect.objectContaining({
          id: created.body.data.project.id,
          name: "Public Status",
        }),
      );
    } finally {
      await server.close();
    }
  });
});
