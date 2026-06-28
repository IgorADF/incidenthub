import { IMUOW } from "@domain/repositories/in-memory/_uow";
import { EmailTestService } from "@domain/services/email";
import { HashPasswordTestService } from "@domain/services/hash-password";
import { JwtTestService } from "@domain/services/jwt";
import { createTestOrganization } from "@domain/use-cases/utils/tests/organization";
import { createTestAdminUser } from "@domain/use-cases/utils/tests/user";
import { beforeEach, describe, expect, it } from "vitest";
import { NotFoundError } from "./errors/NotFoundError";
import { ForgotPassword } from "./forgot-password";

let uow: IMUOW;
let emailTestService: EmailTestService;
let jwtTestService: JwtTestService;
let hashPasswordTestService: HashPasswordTestService;
let sut: ForgotPassword;

const uiUrl = "http://localhost:5173";

describe("Forgot Password", () => {
	beforeEach(() => {
		uow = new IMUOW();
		emailTestService = new EmailTestService();
		jwtTestService = new JwtTestService();
		hashPasswordTestService = new HashPasswordTestService();
		sut = new ForgotPassword(uow, emailTestService, jwtTestService, uiUrl);
	});

	it("should send an email with a reset link containing the ui url and token", async () => {
		const { organization } = await createTestOrganization(uow);
		const { user } = await createTestAdminUser(uow, organization);

		const email = user.getProps().email;

		await sut.execute({ email });

		expect(emailTestService.sentEmails).toHaveLength(1);
		const sent = emailTestService.sentEmails[0]!;
		expect(sent.to).toBe(email);
		expect(sent.body).toContain(`${uiUrl}/reset-password?token=`);
	});

	it("should sign a jwt with the user id as subject", async () => {
		const { organization } = await createTestOrganization(uow);
		const { user } = await createTestAdminUser(
			uow,
			organization,
			{ email: "user@acme.com" },
			hashPasswordTestService,
		);

		await sut.execute({ email: "user@acme.com" });

		const sent = emailTestService.sentEmails[0]!;
		const token = sent.body.split("token=")[1]!;
		const payload = await jwtTestService.verifyForgotPassword(token);
		expect(payload.userId).toBe(user.getProps().id);
	});

	it("should throw NotFoundError when email is invalid", async () => {
		const error = await sut.execute({ email: "not-an-email" }).catch((e) => e);

		expect(error).toBeInstanceOf(NotFoundError);
		expect(emailTestService.sentEmails).toHaveLength(0);
	});

	it("should throw NotFoundError when user is not found", async () => {
		const error = await sut
			.execute({ email: "nobody@acme.com" })
			.catch((e) => e);

		expect(error).toBeInstanceOf(NotFoundError);
		expect(emailTestService.sentEmails).toHaveLength(0);
	});
});
