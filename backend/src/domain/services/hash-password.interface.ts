export interface HashPasswordInterface {
  compare: (input: string, hash: string) => Promise<boolean>;
  hashPassword: (input: string) => Promise<string>;
}
