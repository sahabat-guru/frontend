"use client";

import RoleGuard from "@/components/common/RoleGuard";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { useSidebarStore } from "@/lib/sidebar-store";
import { cn } from "@/lib/utils";

export default function MuridLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const { isCollapsed } = useSidebarStore();

	return (
		<RoleGuard allowedRoles={["MURID"]}>
			<div className="flex min-h-screen bg-muted/20">
				<Sidebar />
				<div
					className={cn(
						"flex-1 flex flex-col transition-all duration-300",
						isCollapsed ? "ml-20" : "ml-72",
					)}
				>
					<Navbar />
					<main className="flex-1 p-6 overflow-y-auto">
						{children}
					</main>
				</div>
			</div>
		</RoleGuard>
	);
}
