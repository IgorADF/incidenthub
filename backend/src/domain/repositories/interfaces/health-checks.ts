import type { HealthCheck } from "@domain/entities/health-check";
import type {
	ListPaginationType,
	NextPaginationListType,
} from "@domain/use-cases/utils/paginations/pagination";

export type ListHealthChecksResult = {
	healthChecks: HealthCheck[];
	pagination: NextPaginationListType;
};

export interface HealthChecksRepInterface {
	getById: (id: string) => Promise<HealthCheck | null>;
	getByServiceId: (serviceId: string) => Promise<HealthCheck[]>;
	listByServiceId: (
		serviceId: string,
		pagination: ListPaginationType,
	) => Promise<ListHealthChecksResult>;
	create: (data: HealthCheck) => Promise<HealthCheck>;
	deleteByServiceId: (serviceId: string) => Promise<void>;
}
