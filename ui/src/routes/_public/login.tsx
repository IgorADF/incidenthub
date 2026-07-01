import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { PasswordInput } from "#/components/password-input";
import { Alert, AlertDescription } from "#/components/ui/alert";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { useAuth } from "#/context/auth/auth-context";
import { login } from "#/lib/api/auth";
import { ApiError } from "#/lib/api/client";

export const Route = createFileRoute("/_public/login")({
	component: LoginComponent,
});

function LoginComponent() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { setUser } = useAuth();
	const [serverError, setServerError] = useState<string | null>(null);

	const loginSchema = z.object({
		email: z.email(t("login.errors.emailInvalid")),
		password: z.string().min(1, t("login.errors.passwordRequired")),
	});

	type LoginValues = z.infer<typeof loginSchema>;

	const form = useForm<LoginValues>({
		resolver: zodResolver(loginSchema),
		defaultValues: { email: "", password: "" },
	});

	const mutation = useMutation({
		mutationFn: (values: LoginValues) => login(values),
		onSuccess: ({ data }) => {
			setUser(data.user);
			setServerError(null);
			navigate({ to: "/" });
		},
		onError: (error: unknown) => {
			if (error instanceof ApiError) {
				if (error.isNetworkError) {
					setServerError(t("login.errors.network"));
					return;
				}
				if (error.status === 401) {
					setServerError(error.message || t("login.errors.invalidCredentials"));
					return;
				}
				if (error.status === 400) {
					setServerError(error.message || t("login.errors.validation"));
					return;
				}
				setServerError(error.message || t("login.errors.generic"));
				return;
			}
			setServerError(t("login.errors.generic"));
		},
	});

	const onSubmit = form.handleSubmit((values) => mutation.mutate(values));

	return (
		<div className="w-full max-w-sm md:max-w-md">
			<div className="text-lg md:text-xl w-full text-center mb-4">
				{t("login.title")}
			</div>

			<form className="space-y-4" onSubmit={onSubmit} noValidate>
				{serverError && (
					<Alert variant="destructive">
						<AlertDescription>{serverError}</AlertDescription>
					</Alert>
				)}

				<div className="space-y-2">
					<Label htmlFor="email">{t("login.email.label")}</Label>
					<Input
						id="email"
						type="email"
						autoComplete="email"
						autoFocus
						placeholder={t("login.email.placeholder")}
						aria-invalid={form.formState.errors.email ? "true" : "false"}
						{...form.register("email")}
					/>
					{form.formState.errors.email && (
						<p className="text-destructive text-xs">
							{form.formState.errors.email.message}
						</p>
					)}
				</div>

				<div className="space-y-2">
					<PasswordInput
						id="password"
						showLabel={t("common.showPassword")}
						hideLabel={t("common.hidePassword")}
						autoComplete="current-password"
						placeholder={"**********"}
						error={form.formState.errors.password?.message}
						header={
							<div className="flex items-center justify-between">
								<Label htmlFor="password">{t("login.password.label")}</Label>
								<Link
									to="/forgot-password"
									className="text-muted-foreground hover:text-foreground text-xs underline-offset-4 hover:underline"
								>
									{t("login.forgotPassword")}
								</Link>
							</div>
						}
						{...form.register("password")}
					/>
				</div>

				<Button type="submit" className="w-full" disabled={mutation.isPending}>
					{mutation.isPending ? (
						<>
							<Loader2 className="size-4 animate-spin" />
							{t("login.submitLoading")}
						</>
					) : (
						t("login.submit")
					)}
				</Button>
			</form>

			<div className="text-muted-foreground w-full text-center text-sm mt-16 animate-caret-blink text-red-400 dark:text-red-300">
				{t("common.tagline")}
			</div>
		</div>
	);
}
