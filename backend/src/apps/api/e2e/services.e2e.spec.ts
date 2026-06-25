import { describe, expect, it } from "vitest";
import {
  createE2EServer,
} from "./helpers/superserver";
import {
  createOrganizationAndLogin,
  createProject,
  createService,
} from "./helpers/flows";

describe("service routes (e2e)", () => {
  it("should create, list, disable, update, and delete a service", async () => {
    const server = await createE2EServer(import.meta.url);

    try {
      const { token } = await createOrganizationAndLogin(server);
      const project = await createProject(server, token);
      const projectId = project.body.data.project.id;

      const created = await createService(server, token, projectId);

      expect(created.statusCode).toBe(201);
      expect(created.body.data.service).toEqual(
        expect.objectContaining({
          projectId,
          name: "Backend API",
          status: "CHECKING",
          enabled: true,
        }),
      );
      expect(created.body.data.service).not.toHaveProperty(
        "consecutivesIncidentDetectionFails",
      );
      expect(created.body.data.service).not.toHaveProperty("lastCheckedAt");

      const serviceId = created.body.data.service.id;
      const listed = await server.get(`/projects/${projectId}/services`, token);

      expect(listed.statusCode).toBe(200);
      expect(listed.body.data.services).toHaveLength(1);
      expect(listed.body.data.services[0]).toEqual(
        expect.objectContaining({ id: serviceId, status: "CHECKING" }),
      );

      const disabled = await server.patch(
        `/services/${serviceId}/enabled`,
        { enable: false },
        token,
      );

      expect(disabled.statusCode).toBe(200);
      expect(disabled.body.data.service.enabled).toBe(false);
      expect(disabled.body.data.service.status).toBe("DISABLED");

      const updated = await server.put(
        `/services/${serviceId}`,
        { name: "Updated Backend API" },
        token,
      );

      expect(updated.statusCode).toBe(200);
      expect(updated.body.data.service.name).toBe("Updated Backend API");

      const deleted = await server.delete(`/services/${serviceId}`, token);

      expect(deleted.statusCode).toBe(200);
      expect(deleted.body.deleted).toBe(true);

      const listedAfterDelete = await server.get(
        `/projects/${projectId}/services`,
        token,
      );

      expect(listedAfterDelete.statusCode).toBe(200);
      expect(listedAfterDelete.body.data.services).toEqual([]);
    } finally {
      await server.close();
    }
  });
});
