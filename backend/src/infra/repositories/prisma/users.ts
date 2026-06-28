import { UserWithPassword } from "@domain/entities/user";
import { UsersRepInterface } from "@domain/repositories/interfaces/users";
import { TPrismaClient } from "@infra/db/prisma-client";
import { UserMapper } from "@infra/mappers/user";

export class PrismaUsersRep implements UsersRepInterface {
  constructor(private readonly prisma: TPrismaClient) { }

  async getById(id: string) {
    const record = await this.prisma.user.findUnique({ where: { id } });
    return record ? UserMapper.fromPrismaToEntity(record) : null;
  }

  async hasSameByEmail(email: string) {
    const record = await this.prisma.user.findUnique({ where: { email }, select: { email: true } });
    return record ? record.email === email : false;
  }

  async getByEmail(email: string) {
    const record = await this.prisma.user.findUnique({ where: { email } });
    return record ? UserMapper.fromPrismaToEntity(record) : null;
  }

  async getByEmailWithPassword(email: string) {
    const record = await this.prisma.user.findUnique({
      where: { email },
      omit: { password: false },
    });

    return record ? UserMapper.fromPrismaToEntityWithPassword(record) : null;
  }

  async create(data: UserWithPassword) {
    const record = await this.prisma.user.create({
      data: UserMapper.fromEntityWithPasswordToPrisma(data),
    });
    return UserMapper.fromPrismaToEntity(record);
  }
}
