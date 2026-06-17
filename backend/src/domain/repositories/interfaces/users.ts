import { User } from "@domain/entities/user";

export interface UsersRepInterface {
  getById: (id: string) => Promise<User | null>;
  getByEmail: (email: string) => Promise<User | null>;
  create: (data: User) => Promise<User>;
}
