// Pattern: Strategy Port — pluggable password hashing (bcrypt today, argon2 tomorrow)
export interface AuthPasswordHasherPort {
  hash(plaintext: string, rounds?: number): Promise<string>;
  compare(plaintext: string, hash: string): Promise<boolean>;
}
