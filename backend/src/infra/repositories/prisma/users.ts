import { User } from "@domain/entities/user";
import { UsersRepInterface } from "@domain/repositories/interfaces/users";
import { TPrismaClient } from "@infra/db/prisma-client";
import { UserMapper } from "@infra/mappers/user";

export class PrismaUsersRep implements UsersRepInterface {
  constructor(private readonly prisma: TPrismaClient) {}

  async getById(id: string) {
    const record = await this.prisma.user.findUnique({ where: { id } });
    return record ? UserMapper.fromPrismaToEntity(record) : null;
  }

  async getByEmail(email: string) {
    const record = await this.prisma.user.findUnique({ where: { email } });
    return record ? UserMapper.fromPrismaToEntity(record) : null;
  }

  async create(data: User) {
    const record = await this.prisma.user.create({
      data: UserMapper.fromEntityToPrisma(data),
    });
    return UserMapper.fromPrismaToEntity(record);
  }
}
