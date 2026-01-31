"use client";

import { useUserStore } from "@/lib/store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";

export function Navbar() {
	const { user } = useUserStore();

	return (
		<header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 flex items-center justify-between sticky top-0 z-10 w-full">
			<div className="flex items-center gap-4">
				{/* Breadcrumb or Page Title could go here */}
				<h2 className="text-lg font-semibold text-foreground/80">
					Selamat datang, {user?.name || "User"}
				</h2>
			</div>

		</header>
	);
}
