import type { EmailInterface, SendEmailInput } from "./email.interface";

export class EmailTestService implements EmailInterface {
	sentEmails: SendEmailInput[] = [];

	async sendEmail(input: SendEmailInput) {
		this.sentEmails.push(input);
	}
}
