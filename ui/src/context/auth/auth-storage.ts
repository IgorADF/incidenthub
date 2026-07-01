import type { AuthUser } from "#/types/user";

const STORAGE_KEY = "ih_user";

export type AuthContextValue = {
	user: AuthUser | null;
	setUser: (user: AuthUser) => void;
	clearUser: () => void;
	isAuthenticated: boolean;
};

function readStoredUser(): AuthUser | null {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) {
			return null;
		}
		return JSON.parse(raw) as AuthUser;
	} catch {
		return null;
	}
}

export function readInitialUser(): AuthUser | null {
	return readStoredUser();
}

export function persistUser(user: AuthUser): void {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function clearStoredUser(): void {
	localStorage.removeItem(STORAGE_KEY);
}
