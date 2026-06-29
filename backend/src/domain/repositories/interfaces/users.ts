import type { User, UserWithPassword } from "@domain/entities/user";
import type {
	ListUserPaginationType,
	NextPaginationListUserType,
} from "@domain/use-cases/utils/paginations/list-user-by-organization";

export type ListUsersByOrganizationResult = {
	users: User[];
	pagination: NextPaginationListUserType;
};

export interface UsersRepInterface {
	getById: (id: string) => Promise<User | null>;
	hasSameByEmail: (email: string) => Promise<boolean>;
	getByEmail: (email: string) => Promise<User | null>;
	getByEmailWithPassword: (email: string) => Promise<UserWithPassword | null>;
	listByOrganizationId: (
		organizationId: string,
		pagination: ListUserPaginationType,
	) => Promise<ListUsersByOrganizationResult>;
	create: (data: UserWithPassword) => Promise<User>;
	updatePassword: (id: string, password: string) => Promise<User | null>;
}
