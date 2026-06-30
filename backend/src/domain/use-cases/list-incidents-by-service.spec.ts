import { Incident } from "@domain/entities/incident";
import { IMUOW } from "@domain/repositories/in-memory/_uow";
import { DEFAULT_PAGE_LIMIT } from "@domain/use-cases/utils/paginations/pagination";
import { createTestOrganization } from "@domain/use-cases/utils/tests/organization";
import { createTestProject } from "@domain/use-cases/utils/tests/project";
import { createTestService } from "@domain/use-cases/utils/tests/service";
import {
	createTestAdminUser,
	createTestDevUser,
} from "@domain/use-cases/utils/tests/user";
import { beforeEach, describe, expect, it } from "vitest";
import { NotAllowedError } from "./errors/NotAllowedError";
import { NotFoundError } from "./errors/NotFoundError";
import { ListIncidentsByService } from "./list-incidents-by-service";

let uow: IMUOW;
let sut: ListIncidentsByService;

describe("ListIncidentsByService", () => {
	beforeEach(() => {
		uow = new IMUOW();
		sut = new ListIncidentsByService(uow);
	});

	async function setup() {
		const { organization } = await createTestOrganization(uow);
		const { user: admin } = await createTestAdminUser(uow, organization);
		const { project } = await createTestProject(uow, organization);
		const { service } = await createTestService(uow, project);
		return { organization, admin, project, service };
	}

	async function createIncident(serviceId: string) {
		const incident = Incident.create({
			serviceId,
			startedAt: new Date(),
		});
		await uow.repositories.incidents.create(incident);
		return incident;
	}

	it("should list incidents scoped to the service ordered by id descending (newest first)", async () => {
		const { admin, service } = await setup();
		const incA = await createIncident(service.getProps().id);
		const incB = await createIncident(service.getProps().id);
		const incC = await createIncident(service.getProps().id);

		const result = await sut.execute(
			admin.getProps().id,
			service.getProps().id,
			{
				limit: DEFAULT_PAGE_LIMIT,
				cursor: { id: null },
			},
		);

		expect(result.incidents).toHaveLength(3);
		const ids = result.incidents.map((i) => i.id);
		const sortedIds = [incA, incB, incC]
			.map((i) => i.getProps().id)
			.sort((a, b) => b.localeCompare(a));
		expect(ids).toEqual(sortedIds);
	});

	it("should paginate with limit and return hasNextPage + nextCursor", async () => {
		const { admin, service } = await setup();
		for (let i = 0; i < 3; i++) {
			await createIncident(service.getProps().id);
		}

		const firstPage = await sut.execute(
			admin.getProps().id,
			service.getProps().id,
			{ limit: 2, cursor: { id: null } },
		);

		expect(firstPage.incidents).toHaveLength(2);
		expect(firstPage.pagination).toEqual({
			limit: 2,
			hasNextPage: true,
			nextCursor: {
				id: expect.any(String),
			},
		});

		const nextCursorId = firstPage.pagination.nextCursor.id!;

		const secondPage = await sut.execute(
			admin.getProps().id,
			service.getProps().id,
			{ limit: 2, cursor: { id: nextCursorId } },
		);

		expect(secondPage.incidents).toHaveLength(1);
		expect(secondPage.pagination).toEqual({
			limit: 2,
			hasNextPage: false,
			nextCursor: { id: null },
		});
	});

	it("should return empty list when no incidents exist", async () => {
		const { admin, service } = await setup();

		const result = await sut.execute(
			admin.getProps().id,
			service.getProps().id,
			{
				limit: DEFAULT_PAGE_LIMIT,
				cursor: { id: null },
			},
		);

		expect(result.incidents).toHaveLength(0);
		expect(result.pagination).toEqual({
			limit: DEFAULT_PAGE_LIMIT,
			hasNextPage: false,
			nextCursor: { id: null },
		});
	});

	it("should only list incidents of the specified service", async () => {
		const { admin, project, service } = await setup();
		const { service: otherService } = await createTestService(uow, project, {
			name: "Other Service",
		});

		await createIncident(service.getProps().id);
		await createIncident(otherService.getProps().id);

		const result = await sut.execute(
			admin.getProps().id,
			service.getProps().id,
			{
				limit: DEFAULT_PAGE_LIMIT,
				cursor: { id: null },
			},
		);

		expect(result.incidents).toHaveLength(1);
		expect(result.incidents[0]!.serviceId).toBe(service.getProps().id);
	});

	it("should throw NotAllowedError when requester is not admin", async () => {
		const { organization, service } = await setup();
		const { user: dev } = await createTestDevUser(uow, organization);

		await expect(
			sut.execute(dev.getProps().id, service.getProps().id, {
				limit: DEFAULT_PAGE_LIMIT,
				cursor: { id: null },
			}),
		).rejects.toBeInstanceOf(NotAllowedError);
	});

	it("should throw NotFoundError when service does not exist", async () => {
		const { admin } = await setup();

		await expect(
			sut.execute(admin.getProps().id, "01940f8e-1f30-7c30-9a6f-1234567890ab", {
				limit: DEFAULT_PAGE_LIMIT,
				cursor: { id: null },
			}),
		).rejects.toBeInstanceOf(NotFoundError);
	});

	it("should throw NotAllowedError when requester does not exist", async () => {
		const { service } = await setup();

		await expect(
			sut.execute(
				"01940f8e-1f30-7c30-9a6f-1234567890ab",
				service.getProps().id,
				{ limit: DEFAULT_PAGE_LIMIT, cursor: { id: null } },
			),
		).rejects.toBeInstanceOf(NotAllowedError);
	});

	it("should throw NotAllowedError when service belongs to another organization", async () => {
		const { admin } = await setup();

		const { organization: orgB } = await createTestOrganization(uow, {
			name: "Other Corp",
		});
		await createTestAdminUser(uow, orgB);
		const { project: projectB } = await createTestProject(uow, orgB, {
			name: "Cross Org Project",
			publicPageSlug: "cross-org-project-slug",
		});
		const { service: serviceB } = await createTestService(uow, projectB, {
			name: "Cross Org Service",
		});

		await expect(
			sut.execute(admin.getProps().id, serviceB.getProps().id, {
				limit: DEFAULT_PAGE_LIMIT,
				cursor: { id: null },
			}),
		).rejects.toBeInstanceOf(NotAllowedError);
	});
});
