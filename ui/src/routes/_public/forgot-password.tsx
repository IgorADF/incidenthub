import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, MailCheck } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { ApiError } from "#/lib/api/client";
import { forgotPassword } from "#/lib/api/password";

export const Route = createFileRoute("/_public/forgot-password")({
	component: ForgotPasswordComponent,
});

function ForgotPasswordComponent() {
	const { t } = useTranslation();
	const [serverError, setServerError] = useState<string | null>(null);

	const forgotSchema = z.object({
		email: z.email(t("forgotPassword.errors.emailInvalid")),
	});

	type ForgotValues = z.infer<typeof forgotSchema>;

	const form = useForm<ForgotValues>({
		resolver: zodResolver(forgotSchema),
		defaultValues: { email: "" },
	});

	const mutation = useMutation({
		mutationFn: (values: ForgotValues) => forgotPassword(values),
		onSuccess: () => setServerError(null),
		onError: (error: unknown) => {
			if (error instanceof ApiError) {
				if (error.isNetworkError) {
					setServerError(t("forgotPassword.errors.network"));
					return;
				}
				setServerError(error.message || t("forgotPassword.errors.generic"));
				return;
			}
			setServerError(t("forgotPassword.errors.generic"));
		},
	});

	const onSubmit = form.handleSubmit((values) => mutation.mutate(values));

	if (mutation.isSuccess) {
		return (
			<div className="w-full max-w-sm md:max-w-md">
				<div className="text-lg md:text-xl w-full text-center mb-4">
					{t("forgotPassword.successTitle")}
				</div>
				<div className="space-y-4">
					<div className="flex flex-col items-center gap-3 text-center">
						<MailCheck className="text-primary size-10" />
						<p className="text-muted-foreground text-sm md:text-base">
							{t("forgotPassword.successDescription")}
						</p>
					</div>
					<Button asChild variant="outline" className="w-full">
						<Link to="/login">{t("common.backToLogin")}</Link>
					</Button>
				</div>
				<div className="text-muted-foreground w-full text-center text-sm mt-16 animate-caret-blink text-red-400 dark:text-red-300">
					{t("common.tagline")}
				</div>
			</div>
		);
	}

	return (
		<div className="w-full max-w-sm md:max-w-md">
			<div className="text-lg md:text-xl w-full text-center mb-4">
				{t("forgotPassword.title")}
			</div>
			<form className="space-y-4" onSubmit={onSubmit} noValidate>
				{serverError && (
					<div className="border-destructive/30 text-destructive bg-destructive/10 rounded-lg border px-3 py-2 text-sm">
						{serverError}
					</div>
				)}

				<div className="space-y-2">
					<Label htmlFor="email">{t("forgotPassword.email.label")}</Label>
					<Input
						id="email"
						type="email"
						autoComplete="email"
						autoFocus
						placeholder={t("forgotPassword.email.placeholder")}
						aria-invalid={form.formState.errors.email ? "true" : "false"}
						{...form.register("email")}
					/>
					{form.formState.errors.email && (
						<p className="text-destructive text-xs">
							{form.formState.errors.email.message}
						</p>
					)}
				</div>

				<Button type="submit" className="w-full" disabled={mutation.isPending}>
					{mutation.isPending ? (
						<>
							<Loader2 className="size-4 animate-spin" />
							{t("forgotPassword.submitLoading")}
						</>
					) : (
						t("forgotPassword.submit")
					)}
				</Button>

				<div className="text-center">
					<Link
						to="/login"
						className="text-muted-foreground hover:text-foreground text-xs underline-offset-4 hover:underline"
					>
						{t("common.backToLogin")}
					</Link>
				</div>
			</form>
			<div className="text-muted-foreground w-full text-center text-sm mt-16 animate-caret-blink text-red-400 dark:text-red-300">
				{t("common.tagline")}
			</div>
		</div>
	);
}
