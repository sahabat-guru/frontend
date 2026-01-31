"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";

export default function AuthLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const { isAuthenticated, user, checkAuth } = useAuthStore();
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
	}, []); // Empty dependency array - run only once

	useEffect(() => {
		// Redirect if already logged in
		if (!isChecking && isAuthenticated && user) {
			if (user.role === "GURU") {
				router.push("/dashboard");
			} else {
				router.push("/courses");
			}
		}
	}, [isAuthenticated, user, isChecking, router]);

	// Show loading or children
	if (isChecking) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-hero">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
			</div>
		);
	}

	return <>{children}</>;
}


