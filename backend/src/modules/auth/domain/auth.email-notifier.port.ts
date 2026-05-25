// Pattern: Output Port — abstracts side-effect (transactional email)
export interface AuthEmailNotifierPort {
  sendVerificationEmail(
    email: string,
    name: string,
    token: string,
  ): Promise<void>;
  sendPasswordResetEmail(
    email: string,
    name: string,
    token: string,
  ): Promise<void>;
}
