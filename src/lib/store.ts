import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authApi, tokenManager, User, AuthTokens } from "./api";

export type Role = "GURU" | "MURID" | null;

interface AuthState {
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	
	// Actions
	login: (email: string, password: string) => Promise<void>;
	register: (name: string, email: string, password: string, role: "GURU" | "MURID") => Promise<void>;
	logout: () => Promise<void>;
	setUser: (user: User) => void;
	setLoading: (loading: boolean) => void;
	checkAuth: () => Promise<void>;
	clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
	persist(
		(set, get) => ({
			user: null,
			isAuthenticated: false,
			isLoading: true,

			login: async (email: string, password: string) => {
				set({ isLoading: true });
				try {
					const response = await authApi.login({ email, password });
					const { user, accessToken, refreshToken } = response.data;
					
					tokenManager.setTokens({ accessToken, refreshToken });
					
					set({
						user,
						isAuthenticated: true,
						isLoading: false,
					});
				} catch (error) {
					set({ isLoading: false });
					throw error;
				}
			},

			register: async (name: string, email: string, password: string, role: "GURU" | "MURID") => {
				set({ isLoading: true });
				try {
					const response = await authApi.register({ name, email, password, role });
					const { user, accessToken, refreshToken } = response.data;
					
					tokenManager.setTokens({ accessToken, refreshToken });
					
					set({
						user,
						isAuthenticated: true,
						isLoading: false,
					});
				} catch (error) {
					set({ isLoading: false });
					throw error;
				}
			},

			logout: async () => {
				set({ isLoading: true });
				try {
					await authApi.logout();
				} finally {
					set({
						user: null,
						isAuthenticated: false,
						isLoading: false,
					});
				}
			},

			setUser: (user: User) => {
				set({ user, isAuthenticated: true });
			},

			setLoading: (loading: boolean) => {
				set({ isLoading: loading });
			},

			checkAuth: async () => {
				const token = tokenManager.getAccessToken();
				if (!token) {
					set({ user: null, isAuthenticated: false, isLoading: false });
					return;
				}

				try {
					const user = await authApi.getCurrentUser();
					set({ user, isAuthenticated: true, isLoading: false });
				} catch {
					tokenManager.clearTokens();
					set({ user: null, isAuthenticated: false, isLoading: false });
				}
			},

			clearAuth: () => {
				tokenManager.clearTokens();
				set({ user: null, isAuthenticated: false, isLoading: false });
			},
		}),
		{
			name: "sahabatguru-auth",
			partialize: (state) => ({
				user: state.user,
				isAuthenticated: state.isAuthenticated,
			}),
		}
	)
);

// Legacy store for backward compatibility
interface UserState {
	user: {
		name: string;
		role: Role;
		id: string;
	} | null;
	isAuthenticated: boolean;
	login: (name: string, role: Role) => void;
	logout: () => void;
}

export const useUserStore = create<UserState>()(
	persist(
		(set) => ({
			user: null,
			isAuthenticated: false,
			login: (name, role) =>
				set({
					user: {
						name,
						role,
						id: Math.random().toString(36).substr(2, 9),
					},
					isAuthenticated: true,
				}),
			logout: () => set({ user: null, isAuthenticated: false }),
		}),
		{
			name: "sahabatguru-storage",
		},
	),
);
