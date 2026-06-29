import { HealthCheck } from "@domain/entities/health-check";
import { Incident } from "@domain/entities/incident";
import { IMUOW } from "@domain/repositories/in-memory/_uow";
import { createTestOrganization } from "@domain/use-cases/utils/tests/organization";
import { createTestProject } from "@domain/use-cases/utils/tests/project";
import { createTestService } from "@domain/use-cases/utils/tests/service";
import {
	createTestAdminUser,
	createTestDevUser,
} from "@domain/use-cases/utils/tests/user";
import { beforeEach, describe, expect, it } from "vitest";
import { DeleteProject } from "./delete-project";
import { DeleteService } from "./delete-service";
import { NotAllowedError } from "./errors/NotAllowedError";
import { NotFoundError } from "./errors/NotFoundError";

let uow: IMUOW;
let deleteService: DeleteService;
let sut: DeleteProject;

describe("DeleteProject", () => {
	beforeEach(() => {
		uow = new IMUOW();
		deleteService = new DeleteService(uow);
		sut = new DeleteProject(uow, deleteService);
	});

	async function setup() {
		const { organization } = await createTestOrganization(uow);
		const { user: admin } = await createTestAdminUser(uow, organization);
		const { project } = await createTestProject(uow, organization);
		return { organization, admin, project };
	}

	it("should delete a project with no services when deleter is admin", async () => {
		const { admin, project } = await setup();

		const result = await sut.execute(
			admin.getProps().id,
			project.getProps().id,
		);

		expect(result.deleted).toBe(true);

		const found = await uow.repositories.projects.getById(
			project.getProps().id,
		);
		expect(found).toBeNull();
	});

	it("should delete a project and all its services", async () => {
		const { admin, project } = await setup();
		const { service: serviceA } = await createTestService(uow, project, {
			name: "Service A",
		});
		const { service: serviceB } = await createTestService(uow, project, {
			name: "Service B",
		});

		const result = await sut.execute(
			admin.getProps().id,
			project.getProps().id,
		);

		expect(result.deleted).toBe(true);

		expect(
			await uow.repositories.services.getById(serviceA.getProps().id),
		).toBeNull();
		expect(
			await uow.repositories.services.getById(serviceB.getProps().id),
		).toBeNull();
		expect(
			await uow.repositories.projects.getById(project.getProps().id),
		).toBeNull();
	});

	it("should delete healthchecks and incidents of all services under the project", async () => {
		const { admin, project } = await setup();
		const { service } = await createTestService(uow, project);

		const healthCheck = HealthCheck.create({
			serviceId: service.getProps().id,
			url: "https://api.example.com/health",
			requestTime: 100,
			isError: false,
			timedOut: false,
			responseStatus: 200,
			responseJsonData: null,
		});
		await uow.repositories.healthChecks.create(healthCheck);

		const incident = Incident.create({
			serviceId: service.getProps().id,
			startedAt: new Date(),
		});
		await uow.repositories.incidents.create(incident);

		await sut.execute(admin.getProps().id, project.getProps().id);

		expect(
			await uow.repositories.healthChecks.getByServiceId(service.getProps().id),
		).toHaveLength(0);
		expect(
			await uow.repositories.incidents.getByServiceId(service.getProps().id),
		).toHaveLength(0);
	});

	it("should resolve the current incident of a service before deleting the service", async () => {
		const { admin, project } = await setup();
		const { service } = await createTestService(uow, project);

		const incident = Incident.create({
			serviceId: service.getProps().id,
			startedAt: new Date(),
		});
		await uow.repositories.incidents.create(incident);

		const withIncident = service.setCurrentIncident(incident.getProps().id);
		await uow.repositories.services.update(withIncident);

		await sut.execute(admin.getProps().id, project.getProps().id);

		expect(
			await uow.repositories.services.getById(service.getProps().id),
		).toBeNull();
		expect(
			await uow.repositories.incidents.getByServiceId(service.getProps().id),
		).toHaveLength(0);
	});

	it("should delete only the targeted project, leaving other projects untouched", async () => {
		const { organization, admin, project } = await setup();
		const { project: otherProject } = await createTestProject(
			uow,
			organization,
			{
				name: "Other Project",
				publicPageSlug: "other-project-slug",
			},
		);
		await createTestService(uow, otherProject, { name: "Other Service" });

		await sut.execute(admin.getProps().id, project.getProps().id);

		expect(
			await uow.repositories.projects.getById(project.getProps().id),
		).toBeNull();
		expect(
			await uow.repositories.projects.getById(otherProject.getProps().id),
		).not.toBeNull();
		const remainingServices = await uow.repositories.services.getByProjectId(
			otherProject.getProps().id,
		);
		expect(remainingServices).toHaveLength(1);
	});

	it("should throw NotAllowedError when deleter is not admin", async () => {
		const { organization, project } = await setup();
		const { user: dev } = await createTestDevUser(uow, organization);

		await expect(
			sut.execute(dev.getProps().id, project.getProps().id),
		).rejects.toBeInstanceOf(NotAllowedError);
	});

	it("should throw NotFoundError when project does not exist", async () => {
		const { admin } = await setup();

		await expect(
			sut.execute(admin.getProps().id, "01940f8e-1f30-7c30-9a6f-1234567890ab"),
		).rejects.toBeInstanceOf(NotFoundError);
	});

	it("should throw NotAllowedError when deleter does not exist", async () => {
		const { project } = await setup();

		await expect(
			sut.execute(
				"01940f8e-1f30-7c30-9a6f-1234567890ab",
				project.getProps().id,
			),
		).rejects.toBeInstanceOf(NotAllowedError);
	});

	it("should throw NotAllowedError when project belongs to another organization", async () => {
		const { admin } = await setup();

		const { organization: orgB } = await createTestOrganization(uow, {
			name: "Other Corp",
		});
		const { user: adminB } = await createTestAdminUser(uow, orgB);
		const { project: projectB } = await createTestProject(uow, orgB, {
			name: "Cross Org Project",
			publicPageSlug: "cross-org-project-slug",
		});
		await createTestService(uow, projectB, { name: "Cross Org Service" });

		await expect(
			sut.execute(admin.getProps().id, projectB.getProps().id),
		).rejects.toBeInstanceOf(NotAllowedError);

		expect(
			await uow.repositories.projects.getById(projectB.getProps().id),
		).not.toBeNull();
		expect(
			await uow.repositories.services.getByProjectId(projectB.getProps().id),
		).toHaveLength(1);
	});
});
