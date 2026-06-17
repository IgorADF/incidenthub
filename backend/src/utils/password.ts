import bcrypt from "bcrypt";
import { HashedPassword } from "~types/hashed-password";

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<HashedPassword> {
  const result = await bcrypt.hash(password, SALT_ROUNDS);
  return result as HashedPassword;
}

export async function comparePassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}
