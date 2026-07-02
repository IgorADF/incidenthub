import { apiFetch } from "#/lib/api/client";

export type OrganizationOutput = {
	id: string;
	name: string;
	createdAt: string;
};

export type UserOutput = {
	id: string;
	organizationId: string;
	name: string;
	email: string;
	normalizedName: string;
	type: "ADMIN" | "DEV";
	createdAt: string;
};

export type CreateOrganizationInput = {
	organization: { name: string };
	user: { name: string; email: string; password: string };
};

export type CreateOrganizationResponse = {
	data: { organization: OrganizationOutput; user: UserOutput };
};

export function createOrganization(
	input: CreateOrganizationInput,
): Promise<CreateOrganizationResponse> {
	return apiFetch<CreateOrganizationResponse>("/organizations", {
		method: "POST",
		body: JSON.stringify(input),
	});
}
