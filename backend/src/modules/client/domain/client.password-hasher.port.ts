export interface ClientPasswordHasherPort {
  hash(plaintext: string): Promise<string>;
}
