import type { ReactNode } from "react";
import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState,
} from "react";
import {
	type AuthContextValue,
	clearStoredUser,
	persistUser,
	readInitialUser,
} from "#/context/auth/auth-storage";
import type { AuthUser } from "#/types/user";

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUserState] = useState<AuthUser | null>(() =>
		readInitialUser(),
	);

	const setUser = useCallback((next: AuthUser) => {
		persistUser(next);
		setUserState(next);
	}, []);

	const clearUser = useCallback(() => {
		clearStoredUser();
		setUserState(null);
	}, []);

	const value = useMemo<AuthContextValue>(
		() => ({
			user,
			setUser,
			clearUser,
			isAuthenticated: user !== null,
		}),
		[user, setUser, clearUser],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
	const ctx = useContext(AuthContext);
	if (!ctx) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return ctx;
}
