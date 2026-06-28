import type { HashPasswordInterface } from "@domain/services/hash-password.interface";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

export class HashPasswordService implements HashPasswordInterface {
	async compare(input: string, hash: string) {
		return bcrypt.compare(input, hash);
	}

	async hashPassword(input: string) {
		const result = await bcrypt.hash(input, SALT_ROUNDS);
		return result;
	}
}
