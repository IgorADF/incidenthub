import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyZodInstance } from "~types/fastify-zod-instance";
import {
	runFinalTestConfigs,
	runInitTestConfigs,
} from "./helpers/run-test-config";
import {
	authCookies,
	seedDevUserAndLogin,
	seedOrganizationAndAdmin,
	seedProject,
	seedService,
	uniqueName,
} from "./helpers/seed";

let app: FastifyZodInstance;
let admin: { token: string; organizationId: string };

describe("project routes (e2e)", () => {
	beforeAll(async () => {
		app = await runInitTestConfigs();
		admin = await seedOrganizationAndAdmin(app);
	});

	afterAll(async () => {
		await runFinalTestConfigs();
	});

	describe("POST /projects", () => {
		it("should create a project within the caller's organization", async () => {
			const name = uniqueName("Project");

			const response = await app.inject({
				method: "POST",
				url: "/projects",
				...authCookies(admin.token),
				payload: {
					name,
					showPublicPage: true,
					publicPageSlug: "my-project-slug",
				},
			});

			expect(response.statusCode).toBe(201);

			const project = response.json().data.project;
			expect(project).toEqual(
				expect.objectContaining({
					name,
					organizationId: admin.organizationId,
					showPublicPage: true,
					publicPageSlug: "my-project-slug",
				}),
			);
			expect(project.id).toEqual(expect.any(String));
		});

		it("should return 409 when the project name already exists", async () => {
			const { projectId } = await seedProject(app, admin.token, {
				name: "Duplicate Project",
			});

			const response = await app.inject({
				method: "POST",
				url: "/projects",
				...authCookies(admin.token),
				payload: {
					name: "Duplicate Project",
					showPublicPage: false,
					publicPageSlug: null,
				},
			});

			expect(response.statusCode).toBe(409);
			expect(response.json()).toEqual(
				expect.objectContaining({
					code: "EntityAlreadyExists",
					context: { entity: "project", field: "name" },
				}),
			);
			expect(projectId).toBeDefined();
		});

		it("should return 400 when showPublicPage is true without a publicPageSlug", async () => {
			const response = await app.inject({
				method: "POST",
				url: "/projects",
				...authCookies(admin.token),
				payload: {
					name: uniqueName("Project"),
					showPublicPage: true,
					publicPageSlug: null,
				},
			});

			expect(response.statusCode).toBe(400);
			expect(response.json().code).toBe("ValidationEntitiesError");
		});

		it("should return 401 without a session cookie", async () => {
			const response = await app.inject({
				method: "POST",
				url: "/projects",
				payload: {
					name: uniqueName("Project"),
					showPublicPage: false,
					publicPageSlug: null,
				},
			});

			expect(response.statusCode).toBe(401);
			expect(response.json().code).toBe("UNAUTHORIZED");
		});
	});

	describe("GET /projects", () => {
		it("should list the projects scoped to the caller's organization", async () => {
			const { projectId } = await seedProject(app, admin.token);

			const response = await app.inject({
				method: "GET",
				url: "/projects",
				...authCookies(admin.token),
			});

			expect(response.statusCode).toBe(200);
			const projects = response.json().data.projects;
			expect(projects.length).toBeGreaterThan(0);
			expect(projects.some((p: { id: string }) => p.id === projectId)).toBe(
				true,
			);
			for (const project of projects) {
				expect(project.organizationId).toBe(admin.organizationId);
			}
		});

		it("should only list projects from the caller's organization", async () => {
			const other = await seedOrganizationAndAdmin(app);
			const { projectId: otherProjectId } = await seedProject(app, other.token);

			const response = await app.inject({
				method: "GET",
				url: "/projects",
				...authCookies(admin.token),
			});

			expect(response.statusCode).toBe(200);
			const projects = response.json().data.projects as Array<{
				id: string;
				organizationId: string;
			}>;
			expect(projects.some((p) => p.id === otherProjectId)).toBe(false);
			for (const project of projects) {
				expect(project.organizationId).toBe(admin.organizationId);
			}
		});

		it("should return 401 without a session cookie", async () => {
			const response = await app.inject({
				method: "GET",
				url: "/projects",
			});

			expect(response.statusCode).toBe(401);
			expect(response.json().code).toBe("UNAUTHORIZED");
		});
	});

	describe("PATCH /projects/:projectId", () => {
		it("should update the name and return the updated project", async () => {
			const localAdmin = await seedOrganizationAndAdmin(app);
			const { projectId } = await seedProject(app, localAdmin.token, {
				name: uniqueName("Original"),
			});

			const newName = uniqueName("Renamed");
			const response = await app.inject({
				method: "PATCH",
				url: `/projects/${projectId}`,
				...authCookies(localAdmin.token),
				payload: { name: newName },
			});

			expect(response.statusCode).toBe(200);
			expect(response.json().data.project.name).toBe(newName);
			expect(response.json().data.project.id).toBe(projectId);
		});

		it("should update showPublicPage to true with a slug", async () => {
			const localAdmin = await seedOrganizationAndAdmin(app);
			const { projectId } = await seedProject(app, localAdmin.token, {
				showPublicPage: false,
				publicPageSlug: null,
			});

			const response = await app.inject({
				method: "PATCH",
				url: `/projects/${projectId}`,
				...authCookies(localAdmin.token),
				payload: { showPublicPage: true, publicPageSlug: "made-public" },
			});

			expect(response.statusCode).toBe(200);
			expect(response.json().data.project.showPublicPage).toBe(true);
			expect(response.json().data.project.publicPageSlug).toBe("made-public");
		});

		it("should clear publicPageSlug when showPublicPage set to false", async () => {
			const localAdmin = await seedOrganizationAndAdmin(app);
			const { projectId } = await seedProject(app, localAdmin.token, {
				showPublicPage: true,
				publicPageSlug: "will-be-cleared",
			});

			const response = await app.inject({
				method: "PATCH",
				url: `/projects/${projectId}`,
				...authCookies(localAdmin.token),
				payload: { showPublicPage: false },
			});

			expect(response.statusCode).toBe(200);
			expect(response.json().data.project.showPublicPage).toBe(false);
			expect(response.json().data.project.publicPageSlug).toBeNull();
		});

		it("should update the publicPageSlug when it is globally unique", async () => {
			const localAdmin = await seedOrganizationAndAdmin(app);
			const { projectId } = await seedProject(app, localAdmin.token, {
				showPublicPage: true,
				publicPageSlug: "original-slug",
			});

			const response = await app.inject({
				method: "PATCH",
				url: `/projects/${projectId}`,
				...authCookies(localAdmin.token),
				payload: { publicPageSlug: "brand-new-slug" },
			});

			expect(response.statusCode).toBe(200);
			expect(response.json().data.project.publicPageSlug).toBe(
				"brand-new-slug",
			);
		});

		it("should return 409 when the name already belongs to another project in the org", async () => {
			const localAdmin = await seedOrganizationAndAdmin(app);
			await seedProject(app, localAdmin.token, {
				name: "Taken Project Name",
			});
			const { projectId } = await seedProject(app, localAdmin.token, {
				name: "Free Project Name",
			});

			const response = await app.inject({
				method: "PATCH",
				url: `/projects/${projectId}`,
				...authCookies(localAdmin.token),
				payload: { name: "Taken Project Name" },
			});

			expect(response.statusCode).toBe(409);
			expect(response.json()).toEqual(
				expect.objectContaining({
					code: "EntityAlreadyExists",
					context: { entity: "project", field: "name" },
				}),
			);
		});

		it("should return 409 when the slug belongs to another project (global)", async () => {
			const localAdmin = await seedOrganizationAndAdmin(app);
			await seedProject(app, localAdmin.token, {
				showPublicPage: true,
				publicPageSlug: "taken-slug-globally",
			});
			const { projectId } = await seedProject(app, localAdmin.token, {
				showPublicPage: true,
				publicPageSlug: "my-slug",
			});

			const response = await app.inject({
				method: "PATCH",
				url: `/projects/${projectId}`,
				...authCookies(localAdmin.token),
				payload: { publicPageSlug: "taken-slug-globally" },
			});

			expect(response.statusCode).toBe(409);
			expect(response.json()).toEqual(
				expect.objectContaining({
					code: "EntityAlreadyExists",
					context: { entity: "project", field: "publicPageSlug" },
				}),
			);
		});

		it("should return 400 when showPublicPage=true and publicPageSlug=null", async () => {
			const localAdmin = await seedOrganizationAndAdmin(app);
			const { projectId } = await seedProject(app, localAdmin.token, {
				showPublicPage: true,
				publicPageSlug: "existing-slug",
			});

			const response = await app.inject({
				method: "PATCH",
				url: `/projects/${projectId}`,
				...authCookies(localAdmin.token),
				payload: { showPublicPage: true, publicPageSlug: null },
			});

			expect(response.statusCode).toBe(400);
			expect(response.json().code).toBe("ValidationEntitiesError");
		});

		it("should return 401 without a session cookie", async () => {
			const localAdmin = await seedOrganizationAndAdmin(app);
			const { projectId } = await seedProject(app, localAdmin.token);

			const response = await app.inject({
				method: "PATCH",
				url: `/projects/${projectId}`,
				payload: { name: "Renamed" },
			});

			expect(response.statusCode).toBe(401);
			expect(response.json().code).toBe("UNAUTHORIZED");
		});

		it("should return 403 when the caller is not an admin", async () => {
			const localAdmin = await seedOrganizationAndAdmin(app);
			const dev = await seedDevUserAndLogin(app, localAdmin.token);
			const { projectId } = await seedProject(app, localAdmin.token);

			const response = await app.inject({
				method: "PATCH",
				url: `/projects/${projectId}`,
				...authCookies(dev.token),
				payload: { name: "Dev Attempt" },
			});

			expect(response.statusCode).toBe(403);
			expect(response.json().code).toBe("NotAllowedError");
		});

		it("should return 404 when the project does not exist", async () => {
			const localAdmin = await seedOrganizationAndAdmin(app);

			const response = await app.inject({
				method: "PATCH",
				url: "/projects/01940f8e-1f30-7c30-9a6f-1234567890ab",
				...authCookies(localAdmin.token),
				payload: { name: "Renamed" },
			});

			expect(response.statusCode).toBe(404);
			expect(response.json().code).toBe("NotFoundError");
		});

		it("should return 403 when the project belongs to another organization", async () => {
			const localAdmin = await seedOrganizationAndAdmin(app);
			const other = await seedOrganizationAndAdmin(app);
			const { projectId } = await seedProject(app, other.token);

			const response = await app.inject({
				method: "PATCH",
				url: `/projects/${projectId}`,
				...authCookies(localAdmin.token),
				payload: { name: "Cross Org Attempt" },
			});

			expect(response.statusCode).toBe(403);
			expect(response.json().code).toBe("NotAllowedError");
		});

		it("should return 400 when the projectId param is not a uuid", async () => {
			const localAdmin = await seedOrganizationAndAdmin(app);

			const response = await app.inject({
				method: "PATCH",
				url: "/projects/not-a-uuid",
				...authCookies(localAdmin.token),
				payload: { name: "Renamed" },
			});

			expect(response.statusCode).toBe(400);
			expect(response.json().code).toBe("VALIDATION_ERROR");
		});

		it("should return 400 when the body is empty", async () => {
			const localAdmin = await seedOrganizationAndAdmin(app);
			const { projectId } = await seedProject(app, localAdmin.token);

			const response = await app.inject({
				method: "PATCH",
				url: `/projects/${projectId}`,
				...authCookies(localAdmin.token),
				payload: {},
			});

			expect(response.statusCode).toBe(400);
			expect(response.json().code).toBe("VALIDATION_ERROR");
		});

		it("should return 400 when the slug format is invalid (uppercase)", async () => {
			const localAdmin = await seedOrganizationAndAdmin(app);
			const { projectId } = await seedProject(app, localAdmin.token, {
				showPublicPage: true,
				publicPageSlug: "valid-slug",
			});

			const response = await app.inject({
				method: "PATCH",
				url: `/projects/${projectId}`,
				...authCookies(localAdmin.token),
				payload: { publicPageSlug: "InvalidSlug" },
			});

			expect(response.statusCode).toBe(400);
			expect(response.json().code).toBe("VALIDATION_ERROR");
		});
	});

	describe("DELETE /projects/:projectId", () => {
		it("should delete a project with no services when actor is admin", async () => {
			const localAdmin = await seedOrganizationAndAdmin(app);
			const { projectId } = await seedProject(app, localAdmin.token, {
				name: uniqueName("ToDelete"),
			});

			const response = await app.inject({
				method: "DELETE",
				url: `/projects/${projectId}`,
				...authCookies(localAdmin.token),
			});

			expect(response.statusCode).toBe(200);
			expect(response.json().data).toEqual({ deleted: true });

			const list = await app.inject({
				method: "GET",
				url: "/projects",
				...authCookies(localAdmin.token),
			});
			const ids = (
				list.json().data.projects as Array<{ id: string }>
			).map((p) => p.id);
			expect(ids).not.toContain(projectId);
		});

		it("should delete a project and cascade-delete its services", async () => {
			const localAdmin = await seedOrganizationAndAdmin(app);
			const { projectId } = await seedProject(app, localAdmin.token);
			const { serviceId } = await seedService(app, localAdmin.token, projectId);

			const response = await app.inject({
				method: "DELETE",
				url: `/projects/${projectId}`,
				...authCookies(localAdmin.token),
			});

			expect(response.statusCode).toBe(200);
			expect(response.json().data).toEqual({ deleted: true });

			const serviceList = await app.inject({
				method: "GET",
				url: `/projects/${projectId}/services`,
				...authCookies(localAdmin.token),
			});
			expect(serviceList.statusCode).toBe(404);
			expect(serviceList.json().code).toBe("NotFoundError");
		});

		it("should return 401 without a session cookie", async () => {
			const localAdmin = await seedOrganizationAndAdmin(app);
			const { projectId } = await seedProject(app, localAdmin.token);

			const response = await app.inject({
				method: "DELETE",
				url: `/projects/${projectId}`,
			});

			expect(response.statusCode).toBe(401);
			expect(response.json().code).toBe("UNAUTHORIZED");
		});

		it("should return 403 when the caller is not an admin", async () => {
			const localAdmin = await seedOrganizationAndAdmin(app);
			const dev = await seedDevUserAndLogin(app, localAdmin.token);
			const { projectId } = await seedProject(app, localAdmin.token);

			const response = await app.inject({
				method: "DELETE",
				url: `/projects/${projectId}`,
				...authCookies(dev.token),
			});

			expect(response.statusCode).toBe(403);
			expect(response.json().code).toBe("NotAllowedError");
		});

		it("should return 404 when the project does not exist", async () => {
			const localAdmin = await seedOrganizationAndAdmin(app);

			const response = await app.inject({
				method: "DELETE",
				url: "/projects/01940f8e-1f30-7c30-9a6f-1234567890ab",
				...authCookies(localAdmin.token),
			});

			expect(response.statusCode).toBe(404);
			expect(response.json().code).toBe("NotFoundError");
		});

		it("should return 403 when the project belongs to another organization", async () => {
			const localAdmin = await seedOrganizationAndAdmin(app);
			const other = await seedOrganizationAndAdmin(app);
			const { projectId } = await seedProject(app, other.token);

			const response = await app.inject({
				method: "DELETE",
				url: `/projects/${projectId}`,
				...authCookies(localAdmin.token),
			});

			expect(response.statusCode).toBe(403);
			expect(response.json().code).toBe("NotAllowedError");
		});

		it("should return 400 when the projectId param is not a uuid", async () => {
			const localAdmin = await seedOrganizationAndAdmin(app);

			const response = await app.inject({
				method: "DELETE",
				url: "/projects/not-a-uuid",
				...authCookies(localAdmin.token),
			});

			expect(response.statusCode).toBe(400);
			expect(response.json().code).toBe("VALIDATION_ERROR");
		});

		it("should not delete another org's project when targeted by cross-org admin", async () => {
			const localAdmin = await seedOrganizationAndAdmin(app);
			const other = await seedOrganizationAndAdmin(app);
			const { projectId } = await seedProject(app, other.token);
			const { serviceId } = await seedService(app, other.token, projectId);

			await app.inject({
				method: "DELETE",
				url: `/projects/${projectId}`,
				...authCookies(localAdmin.token),
			});

			const otherList = await app.inject({
				method: "GET",
				url: "/projects",
				...authCookies(other.token),
			});
			const ids = (
				otherList.json().data.projects as Array<{ id: string }>
			).map((p) => p.id);
			expect(ids).toContain(projectId);

			const servicesOfProject = await app.inject({
				method: "GET",
				url: `/projects/${projectId}/services`,
				...authCookies(other.token),
			});
			const serviceIds = (
				servicesOfProject.json().data.services as Array<{ id: string }>
			).map((s) => s.id);
			expect(serviceIds).toContain(serviceId);
		});
	});
});
