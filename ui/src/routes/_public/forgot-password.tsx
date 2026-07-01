import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";

export const Route = createFileRoute("/_public/forgot-password")({
	component: ForgotPasswordComponent,
});

function ForgotPasswordComponent() {
	const { t } = useTranslation();

	return (
		<Card className="w-full max-w-sm md:max-w-md shadow-2xl">
			<CardHeader>
				<CardTitle className="text-lg md:text-xl">
					{t("forgotPassword.title")}
				</CardTitle>
			</CardHeader>
			<CardContent />
		</Card>
	);
}
