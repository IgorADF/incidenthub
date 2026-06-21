export interface SendEmailInput {
  to: string;
  subject: string;
  body: string;
}

export interface EmailInterface {
  sendEmail: (input: SendEmailInput) => Promise<void>;
}
