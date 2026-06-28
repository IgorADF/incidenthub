import { CreatedAt } from "@domain/value-objects/created-at";
import { Url } from "@domain/value-objects/url";
import { UUIDv7 } from "@domain/value-objects/uuidv7";
import z from "zod";
import type { OmitDefaultValues } from "~types/omit-default-values";
import { DefaultEntity } from "./_default";

export const HealthCheckSchema = z.object({
	id: UUIDv7,
	serviceId: UUIDv7,
	url: Url,
	requestTime: z.number().int().min(0),
	isError: z.boolean(),
	timedOut: z.boolean(),
	responseStatus: z.number().int().min(0).max(599),
	responseJsonData: z.string().nullable(),
	createdAt: CreatedAt,
});

type HealthCheckType = z.infer<typeof HealthCheckSchema>;

export type CreateHealthCheckType = OmitDefaultValues<HealthCheckType>;

export class HealthCheck extends DefaultEntity<HealthCheckType> {
	static create(props: CreateHealthCheckType) {
		return HealthCheck.fromProps({
			...props,
			...DefaultEntity.generateEntityDefaultValues(),
		});
	}

	static fromProps(props: HealthCheckType) {
		return new HealthCheck(props, HealthCheckSchema);
	}
}
