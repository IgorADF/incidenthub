import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { LanguageSwitcher } from "#/components/language-switcher";
import { ModeToggle } from "#/components/mode-toggle";

export const Route = createFileRoute("/_public")({
	component: PublicLayout,
});

function PublicLayout() {
	return (
		<div className="bg-background flex min-h-svh flex-col">
			<header className="border-b">
				<div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-2 px-4 py-3 md:px-8">
					<div
						className="font-semibold"
					>
						incidenthub
					</div>
					<div className="flex items-center gap-2">
						<LanguageSwitcher />
						<ModeToggle />
					</div>
				</div>
			</header>
			<main className="flex flex-1 items-center justify-center p-4 md:p-8">
				<Outlet />
			</main>
		</div>
	);
}
