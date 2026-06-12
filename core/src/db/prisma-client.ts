import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/client";
import { envs } from "../envs";

const connectionString = envs.DATABASE_URL;

const adapter = new PrismaPg({ connectionString });
const prismaClient = new PrismaClient({ adapter });

export { prismaClient };
