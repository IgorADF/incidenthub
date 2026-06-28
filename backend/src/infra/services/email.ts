import type {
	EmailInterface,
	SendEmailInput,
} from "@domain/services/email.interface";
import { envs } from "@infra/envs";
import nodemailer from "nodemailer";

export class EmailService implements EmailInterface {
	private transporter = nodemailer.createTransport(envs.SMTP_URL);

	async sendEmail(input: SendEmailInput) {
		await this.transporter.sendMail({
			from: envs.SMTP_FROM,
			to: input.to,
			subject: input.subject,
			text: input.body,
		});
	}
}
