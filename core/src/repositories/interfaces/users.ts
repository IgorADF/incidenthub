import { User } from "../../types/entities";

export interface UsersRepInterface {
  getByEmail: (email: string) => Promise<User | null>;
  create: (data: {
    organizationId: string;
    email: string;
    password: string;
    type: "ADMIN" | "DEV";
  }) => Promise<User>;
}
