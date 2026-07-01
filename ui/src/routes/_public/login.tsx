import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { Alert, AlertDescription } from "#/components/ui/alert";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
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
	const [showPassword, setShowPassword] = useState(false);
	const [serverError, setServerError] = useState<string | null>(null);

	const loginSchema = useMemo(
		() =>
			z.object({
				email: z.email(t("login.errors.emailInvalid")),
				password: z.string().min(1, t("login.errors.passwordRequired")),
			}),
		[t],
	);

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
		<Card className="w-full max-w-sm md:max-w-md shadow-2xl">
			<CardHeader>
				<CardTitle className="text-lg md:text-xl">{t("login.title")}</CardTitle>
			</CardHeader>
			<CardContent>
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
						<div className="flex items-center justify-between">
							<Label htmlFor="password">{t("login.password.label")}</Label>
							<Link
								to="/forgot-password"
								className="text-muted-foreground hover:text-foreground text-xs underline-offset-4 hover:underline"
							>
								{t("login.forgotPassword")}
							</Link>
						</div>
						<div className="relative">
							<Input
								id="password"
								type={showPassword ? "text" : "password"}
								autoComplete="current-password"
								className="pr-10"
								placeholder={"**********"}
								aria-invalid={form.formState.errors.password ? "true" : "false"}
								{...form.register("password")}
							/>
							<button
								type="button"
								onClick={() => setShowPassword((s) => !s)}
								className="cursor-pointer text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex items-center px-3"
								aria-label={
									showPassword
										? t("login.hidePassword")
										: t("login.showPassword")
								}
								tabIndex={-1}
							>
								{showPassword ? (
									<EyeOff className="size-4" />
								) : (
									<Eye className="size-4" />
								)}
							</button>
						</div>
						{form.formState.errors.password && (
							<p className="text-destructive text-xs">
								{form.formState.errors.password.message}
							</p>
						)}
					</div>

					<Button
						type="submit"
						className="w-full"
						disabled={mutation.isPending}
					>
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
			</CardContent>
		</Card>
	);
}
