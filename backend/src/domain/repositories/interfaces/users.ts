import type { User, UserWithPassword } from "@domain/entities/user";

export interface UsersRepInterface {
	getById: (id: string) => Promise<User | null>;
	hasSameByEmail: (email: string) => Promise<boolean>;
	getByEmail: (email: string) => Promise<User | null>;
	getByEmailWithPassword: (email: string) => Promise<UserWithPassword | null>;
	create: (data: UserWithPassword) => Promise<User>;
}
