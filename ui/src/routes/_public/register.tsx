import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { PasswordInput } from "#/components/password-input";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { ApiError } from "#/lib/api/client";
import { createOrganization } from "#/lib/api/organizations";

export const Route = createFileRoute("/_public/register")({
	component: RegisterComponent,
});

type FieldError = { message: string };

function RegisterComponent() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [serverError, setServerError] = useState<string | null>(null);

	const registerSchema = z.object({
		organization: z.object({
			name: z.string().min(1, t("register.errors.orgNameRequired")),
		}),
		user: z.object({
			name: z.string().min(3, t("register.errors.userNameShort")),
			email: z.email(t("register.errors.emailInvalid")),
			password: z.string().min(8, t("register.errors.passwordShort")),
		}),
	});

	type RegisterValues = z.infer<typeof registerSchema>;

	const form = useForm<RegisterValues>({
		resolver: zodResolver(registerSchema),
		defaultValues: {
			organization: { name: "" },
			user: { name: "", email: "", password: "" },
		},
	});

	const mutation = useMutation({
		mutationFn: (values: RegisterValues) => createOrganization(values),
		onSuccess: () => {
			setServerError(null);
			navigate({ to: "/login", search: { registered: true } });
		},
		onError: (error: unknown) => {
			if (error instanceof ApiError) {
				if (error.isNetworkError) {
					setServerError(t("register.errors.network"));
					return;
				}
				if (error.status === 409 && error.context) {
					const { entity, field } = error.context;
					if (field === "email" && entity === "user") {
						form.setError("user.email", {
							message: t("register.errors.emailTaken"),
						} as FieldError);
						return;
					}
					if (field === "name" && entity === "organization") {
						form.setError("organization.name", {
							message: t("register.errors.orgNameTaken"),
						} as FieldError);
						return;
					}
					if (field === "name" && entity === "user") {
						form.setError("user.name", {
							message: t("register.errors.userNameTaken"),
						} as FieldError);
						return;
					}
				}
				if (error.status === 400) {
					setServerError(error.message || t("register.errors.validation"));
					return;
				}
				setServerError(error.message || t("register.errors.generic"));
				return;
			}
			setServerError(t("register.errors.generic"));
		},
	});

	const onSubmit = form.handleSubmit((values) => mutation.mutate(values));

	return (
		<div className="w-full max-w-sm md:max-w-md">
			<div className="text-lg md:text-xl w-full text-center mb-4">
				{t("register.title")}
			</div>
			<form className="space-y-4" onSubmit={onSubmit} noValidate>
				{serverError && (
					<div className="border-destructive/30 text-destructive bg-destructive/10 rounded-lg border px-3 py-2 text-sm">
						{serverError}
					</div>
				)}

				<div className="space-y-2">
					<Label htmlFor="organization.name">
						{t("register.organization.name.label")}
					</Label>
					<Input
						id="organization.name"
						type="text"
						autoComplete="organization"
						autoFocus
						aria-invalid={
							form.formState.errors.organization?.name ? "true" : "false"
						}
						{...form.register("organization.name")}
					/>
					{form.formState.errors.organization?.name && (
						<p className="text-destructive text-xs">
							{form.formState.errors.organization.name.message}
						</p>
					)}
				</div>

				<div className="space-y-2">
					<Label htmlFor="user.name">{t("register.user.name.label")}</Label>
					<Input
						id="user.name"
						type="text"
						autoComplete="name"
						aria-invalid={form.formState.errors.user?.name ? "true" : "false"}
						{...form.register("user.name")}
					/>
					{form.formState.errors.user?.name && (
						<p className="text-destructive text-xs">
							{form.formState.errors.user.name.message}
						</p>
					)}
				</div>

				<div className="space-y-2">
					<Label htmlFor="user.email">{t("register.user.email.label")}</Label>
					<Input
						id="user.email"
						type="email"
						autoComplete="email"
						placeholder={t("register.user.email.placeholder")}
						aria-invalid={form.formState.errors.user?.email ? "true" : "false"}
						{...form.register("user.email")}
					/>
					{form.formState.errors.user?.email && (
						<p className="text-destructive text-xs">
							{form.formState.errors.user.email.message}
						</p>
					)}
				</div>

				<PasswordInput
					id="user.password"
					label={t("register.user.password.label")}
					showLabel={t("common.showPassword")}
					hideLabel={t("common.hidePassword")}
					autoComplete="new-password"
					placeholder={"**********"}
					error={form.formState.errors.user?.password?.message}
					{...form.register("user.password")}
				/>

				<Button type="submit" className="w-full" disabled={mutation.isPending}>
					{mutation.isPending ? (
						<>
							<Loader2 className="size-4 animate-spin" />
							{t("register.submitLoading")}
						</>
					) : (
						t("register.submit")
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
