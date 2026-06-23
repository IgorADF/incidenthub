import { randomUUID } from "node:crypto";
import { HashPasswordInterface } from "./hash-password.interface";

export class HashPasswordTestService implements HashPasswordInterface {
  passwordCache: { [k: string]: string } = {};

  async compare(input: string, hash: string) {
    if (this.passwordCache[hash] === input) {
      return true;
    }

    return false;
  }

  async hashPassword(input: string) {
    const hash = randomUUID();

    this.passwordCache[hash] = input;

    return hash;
  }
}
