import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Role = "GURU" | "MURID" | null;

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
