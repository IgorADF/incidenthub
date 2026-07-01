export type AuthUser = {
	id: string;
	organizationId: string;
	name: string;
	type: "ADMIN" | "DEV";
};
