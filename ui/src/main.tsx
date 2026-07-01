import { QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { AuthProvider, useAuth } from "#/context/auth/auth-context";
import "#/i18n/config"; // side-effect: initializes i18next synchronously before render
import { ThemeProvider } from "#/context/theme/theme-provider";
import { queryClient } from "#/lib/query-client";
import { routeTree } from "./routeTree.gen";

const router = createRouter({
	routeTree,
	defaultPreload: "intent",
	scrollRestoration: true,
	context: {
		auth: undefined as unknown as ReturnType<typeof useAuth>,
	},
});

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

function RouterWithAuth() {
	const auth = useAuth();

	useEffect(() => {
		router.update({ context: { auth } });
	}, [auth]);

	return <RouterProvider router={router} />;
}

const rootElement = document.getElementById("app");

if (rootElement && !rootElement.innerHTML) {
	const root = ReactDOM.createRoot(rootElement);
	root.render(
		<QueryClientProvider client={queryClient}>
			<ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
				<AuthProvider>
					<RouterWithAuth />
				</AuthProvider>
			</ThemeProvider>
		</QueryClientProvider>,
	);
}
