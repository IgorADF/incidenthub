import type { ReactNode } from "react";
import { createContext, useContext, useState } from "react";
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

	const setUser = (next: AuthUser) => {
		persistUser(next);
		setUserState(next);
	};

	const clearUser = () => {
		clearStoredUser();
		setUserState(null);
	};

	const value = {
		user,
		setUser,
		clearUser,
		isAuthenticated: user !== null,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
	const ctx = useContext(AuthContext);
	if (!ctx) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return ctx;
}
