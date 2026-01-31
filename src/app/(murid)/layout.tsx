"use client";

import RoleGuard from "@/components/common/RoleGuard";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";

export default function MuridLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<RoleGuard allowedRoles={["MURID"]}>
			<div className="flex min-h-screen bg-muted/20">
				<Sidebar />
				<div className="flex-1 ml-64 flex flex-col">
					<Navbar />
					<main className="flex-1 p-6 overflow-y-auto">
						{children}
					</main>
				</div>
			</div>
		</RoleGuard>
	);
}
