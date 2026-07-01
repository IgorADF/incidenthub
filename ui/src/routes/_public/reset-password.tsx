import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CircleX, Loader2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { PasswordInput } from "#/components/password-input";
import { Button } from "#/components/ui/button";
import { ApiError } from "#/lib/api/client";
import { resetPassword } from "#/lib/api/password";

export const Route = createFileRoute("/_public/reset-password")({
	validateSearch: z.object({ token: z.string().optional() }),
	component: ResetPasswordComponent,
});

function ResetPasswordComponent() {
	const { t } = useTranslation();
	const { token } = Route.useSearch();
	const [serverError, setServerError] = useState<string | null>(null);

	const resetSchema = z
		.object({
			password: z.string().min(1, t("resetPassword.errors.passwordRequired")),
			confirmPassword: z
				.string()
				.min(1, t("resetPassword.errors.passwordRequired")),
		})
		.refine((data) => data.password === data.confirmPassword, {
			message: t("resetPassword.errors.passwordMismatch"),
			path: ["confirmPassword"],
		});

	type ResetValues = z.infer<typeof resetSchema>;

	const form = useForm<ResetValues>({
		resolver: zodResolver(resetSchema),
		defaultValues: { password: "", confirmPassword: "" },
	});

	const mutation = useMutation({
		mutationFn: (values: ResetValues) =>
			resetPassword({ token: token ?? "", password: values.password }),
		onSuccess: () => setServerError(null),
		onError: (error: unknown) => {
			if (error instanceof ApiError) {
				if (error.isNetworkError) {
					setServerError(t("resetPassword.errors.network"));
					return;
				}
				if (error.status === 401) {
					setServerError(
						error.message || t("resetPassword.errors.invalidToken"),
					);
					return;
				}
				if (error.status === 400) {
					setServerError(error.message || t("resetPassword.errors.validation"));
					return;
				}
				setServerError(error.message || t("resetPassword.errors.generic"));
				return;
			}
			setServerError(t("resetPassword.errors.generic"));
		},
	});

	const onSubmit = form.handleSubmit((values) => mutation.mutate(values));

	if (!token) {
		return (
			<div className="w-full max-w-sm md:max-w-md flex flex-col">
				<div className="text-lg md:text-xl w-full text-center mb-4">
					{t("resetPassword.title")}
				</div>

				<div className="w-full text-center flex justify-center items-center mb-4">
					<CircleX className="size-10 text-red-400" />
				</div>

				<div className="space-y-1.5 text-center">
					<p className="text-sm md:text-base text-red-400">
						{t("resetPassword.missingToken_1")}
					</p>
					<p className="text-sm md:text-base text-red-400">
						{t("resetPassword.missingToken_2")}
					</p>
				</div>

				<div className="flex flex-col gap-2 mt-6">
					<Button asChild variant="outline" className="w-full">
						<Link to="/forgot-password">{t("forgotPassword.submit")}</Link>
					</Button>
					<Button asChild variant="ghost" className="w-full">
						<Link to="/login">{t("common.backToLogin")}</Link>
					</Button>
				</div>

				<div className="text-muted-foreground w-full text-center text-sm mt-16 animate-caret-blink text-red-400 dark:text-red-300">
					{t("common.tagline")}
				</div>
			</div>
		);
	}

	if (mutation.isSuccess) {
		return (
			<div className="w-full max-w-sm md:max-w-md">
				<div className="text-lg md:text-xl w-full text-center mb-4">
					{t("resetPassword.successTitle")}
				</div>
				<div className="space-y-4">
					<div className="flex flex-col items-center gap-3 text-center">
						<ShieldCheck className="text-primary size-10" />
						<p className="text-muted-foreground text-sm md:text-base">
							{t("resetPassword.successDescription")}
						</p>
					</div>
					<Button asChild className="w-full">
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
				{t("resetPassword.title")}
			</div>
			<form className="space-y-4" onSubmit={onSubmit} noValidate>
				{serverError && (
					<div className="border-destructive/30 text-destructive bg-destructive/10 rounded-lg border px-3 py-2 text-sm">
						{serverError}
					</div>
				)}

				<PasswordInput
					id="password"
					label={t("resetPassword.password.label")}
					showLabel={t("common.showPassword")}
					hideLabel={t("common.hidePassword")}
					autoComplete="new-password"
					placeholder={"**********"}
					error={form.formState.errors.password?.message}
					{...form.register("password")}
				/>

				<PasswordInput
					id="confirmPassword"
					label={t("resetPassword.confirmPassword.label")}
					showLabel={t("common.showPassword")}
					hideLabel={t("common.hidePassword")}
					autoComplete="new-password"
					placeholder={"**********"}
					error={form.formState.errors.confirmPassword?.message}
					{...form.register("confirmPassword")}
				/>

				<Button type="submit" className="w-full" disabled={mutation.isPending}>
					{mutation.isPending ? (
						<>
							<Loader2 className="size-4 animate-spin" />
							{t("resetPassword.submitLoading")}
						</>
					) : (
						t("resetPassword.submit")
					)}
				</Button>
			</form>
			<div className="text-muted-foreground w-full text-center text-sm mt-16 animate-caret-blink text-red-400 dark:text-red-300">
				{t("common.tagline")}
			</div>
		</div>
	);
}
