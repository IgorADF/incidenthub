import type { Incident } from "@domain/entities/incident";
import type {
	ListPaginationType,
	NextPaginationListType,
} from "@domain/use-cases/utils/paginations/pagination";

export type ListIncidentsResult = {
	incidents: Incident[];
	pagination: NextPaginationListType;
};

export interface IncidentsRepInterface {
	getById: (id: string) => Promise<Incident | null>;
	getByServiceId: (serviceId: string) => Promise<Incident[]>;
	listByServiceId: (
		serviceId: string,
		pagination: ListPaginationType,
	) => Promise<ListIncidentsResult>;
	create: (data: Incident) => Promise<Incident>;
	update: (data: Incident) => Promise<Incident>;
	deleteByServiceId: (serviceId: string) => Promise<void>;
}
