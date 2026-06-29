import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyZodInstance } from "~types/fastify-zod-instance";
import {
	runFinalTestConfigs,
	runInitTestConfigs,
} from "./helpers/run-test-config";
import {
	authCookies,
	seedOrganizationAndAdmin,
	seedProject,
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
});
