import { User } from "../../entities/user";

export interface UsersRepInterface {
  getByEmail: (email: string) => Promise<User | null>;
  create: (data: User) => Promise<User>;
}
