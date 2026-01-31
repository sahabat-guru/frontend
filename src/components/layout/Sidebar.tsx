"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/lib/store";
import {
	LayoutDashboard,
	BookOpen,
	Video,
	CheckCircle,
	BarChart,
	GraduationCap,
	LogOut,
	Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const guruLinks = [
	{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
	{ href: "/materials", label: "Material Generator", icon: BookOpen },
	{ href: "/proctoring", label: "Smart Proctoring", icon: Video },
	{ href: "/scoring", label: "Automated Scoring", icon: CheckCircle },
	{ href: "/analytics", label: "Analytics", icon: BarChart },
];

const muridLinks = [
	{ href: "/courses", label: "My Courses", icon: BookOpen },
	{ href: "/exams", label: "Exams", icon: GraduationCap },
];

export function Sidebar() {
	const pathname = usePathname();
	const { user, logout } = useUserStore();

	if (!user) return null;

	const links = user.role === "GURU" ? guruLinks : muridLinks;

	return (
		<div className="flex h-screen flex-col border-r bg-card w-64 fixed left-0 top-0 overflow-y-auto">
			<div className="p-6 border-b">
				<h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-green-400 bg-clip-text text-transparent">
					SahabatGuru
				</h1>
				<p className="text-sm text-muted-foreground mt-1 capitalize">
					{user.role}
				</p>
			</div>

			<nav className="flex-1 p-4 space-y-2">
				{links.map((link) => {
					const Icon = link.icon;
					const isActive = pathname.startsWith(link.href);

					return (
						<Link key={link.href} href={link.href}>
							<Button
								variant={isActive ? "secondary" : "ghost"}
								className={cn(
									"w-full justify-start gap-3",
									isActive &&
										"bg-primary/10 text-primary hover:bg-primary/20",
								)}
							>
								<Icon className="h-5 w-5" />
								{link.label}
							</Button>
						</Link>
					);
				})}
			</nav>

			<div className="p-4 border-t">
				<Button
					variant="ghost"
					className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
					onClick={logout}
				>
					<LogOut className="h-5 w-5" />
					Logout
				</Button>
			</div>
		</div>
	);
}
