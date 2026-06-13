import { User } from "../../types/entities";
import { TPrismaClient } from "../../types/prisma-client";
import { createPrismaDefaultValues } from "../../utils/prisma-default-values";
import { UsersRepInterface } from "../interfaces/users";

export class PrismaUsersRep implements UsersRepInterface {
  constructor(private readonly prisma: TPrismaClient) {}

  async getByEmail(email: string) {
    return await this.prisma.user.findUnique({ where: { email } });
  }

  async create({
    organizationId,
    email,
    password,
    type,
  }: {
    organizationId: string;
    email: string;
    password: string;
    type: "ADMIN" | "DEV";
  }) {
    const newUser: User = {
      organizationId,
      email,
      password,
      type,
      deletedAt: null,
      ...createPrismaDefaultValues(),
    };

    return await this.prisma.user.create({ data: newUser });
  }
}
