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
					Welcome back, {user?.name || "User"}
				</h2>
			</div>

			<div className="flex items-center gap-4">
				<Button
					variant="ghost"
					size="icon"
					className="relative text-muted-foreground hover:text-foreground"
				>
					<Bell className="h-5 w-5" />
					<span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full" />
				</Button>

				<div className="flex items-center gap-3 pl-4 border-l">
					<div className="text-right hidden md:block">
						<p className="text-sm font-medium leading-none">
							{user?.name}
						</p>
						<p className="text-xs text-muted-foreground">
							{user?.role}
						</p>
					</div>
					<Avatar>
						<AvatarImage
							src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`}
						/>
						<AvatarFallback>
							{user?.name?.[0] || "U"}
						</AvatarFallback>
					</Avatar>
				</div>
			</div>
		</header>
	);
}
