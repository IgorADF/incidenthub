import { User, type UserWithPassword } from "@domain/entities/user";
import type { UsersRepInterface } from "@domain/repositories/interfaces/users";
import type { IMUOWdb } from "./_uow";

export class IMUsersRep implements UsersRepInterface {
	constructor(private readonly db: IMUOWdb) {}

	private toUserClass(data: UserWithPassword) {
		const { password: _password, ...props } = data.getProps();
		return User.fromProps(props);
	}

	async getById(id: string) {
		const record = this.db.users.find((u) => u.getProps().id === id);
		return record ? this.toUserClass(record) : null;
	}

	async hasSameByEmail(email: string) {
		const record = this.db.users.find((u) => u.getProps().email === email);

		if (!record) {
			return false;
		}

		return record.getProps().email === email;
	}

	async getByEmail(email: string) {
		const record = this.db.users.find((u) => u.getProps().email === email);

		if (!record) {
			return null;
		}

		return this.toUserClass(record);
	}

	async getByEmailWithPassword(email: string) {
		const record = this.db.users.find((u) => u.getProps().email === email);

		if (!record) {
			return null;
		}

		return record ?? null;
	}

	async create(data: UserWithPassword) {
		this.db.users.push(data);
		return this.toUserClass(data);
	}
}
