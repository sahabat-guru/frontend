"use client";

import { useAuthStore, Role } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";

interface RoleGuardProps {
	children: React.ReactNode;
	allowedRoles: Role[];
}

export default function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
	const { user, isAuthenticated, checkAuth } = useAuthStore();
	const router = useRouter();
	const [isChecking, setIsChecking] = useState(true);
	const hasChecked = useRef(false);

	useEffect(() => {
		// Only check auth once on mount
		if (hasChecked.current) return;
		hasChecked.current = true;

		const check = async () => {
			await checkAuth();
			setIsChecking(false);
		};
		check();
	}, []);

	useEffect(() => {
		if (isChecking) return;

		if (!isAuthenticated || !user) {
			router.push("/login");
			return;
		}

		if (!allowedRoles.includes(user.role)) {
			// Redirect to their appropriate dashboard if wrong role
			if (user.role === "GURU") {
				router.push("/dashboard");
			} else if (user.role === "MURID") {
				router.push("/courses");
			} else {
				router.push("/login");
			}
		}
	}, [isChecking, isAuthenticated, user, router, allowedRoles]);

	// Show loading while checking auth
	if (isChecking) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-muted/20">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
			</div>
		);
	}

	if (!isAuthenticated || !user || !allowedRoles.includes(user.role)) {
		return null; // Don't render anything while redirecting
	}

	return <>{children}</>;
}

