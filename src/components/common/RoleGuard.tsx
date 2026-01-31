"use client";

import { useUserStore, Role } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface RoleGuardProps {
	children: React.ReactNode;
	allowedRoles: Role[];
}

export default function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
	const { user, isAuthenticated } = useUserStore();
	const router = useRouter();

	useEffect(() => {
		if (!isAuthenticated) {
			router.push("/login");
			return;
		}

		if (user && !allowedRoles.includes(user.role)) {
			// Redirect to their appropriate dashboard if allowed
			if (user.role === "GURU") {
				router.push("/dashboard");
			} else if (user.role === "MURID") {
				router.push("/courses");
			} else {
				router.push("/login");
			}
		}
	}, [isAuthenticated, user, router, allowedRoles]);

	if (!isAuthenticated || (user && !allowedRoles.includes(user.role))) {
		return null; // Don't render anything while redirecting
	}

	return <>{children}</>;
}
