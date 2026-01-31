"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/store";
import { useSidebarStore } from "@/lib/sidebar-store";
import {
	LayoutGrid,
	BookOpen,
	FileText,
	Eye,
	Users,
	Settings,
	LogOut,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const guruLinks = [
	{ href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
	{ href: "/materials", label: "Material Generator", icon: BookOpen },
	{ href: "/scoring", label: "Penilaian Otomatis", icon: FileText },
	{ href: "/proctoring", label: "Smart Proctoring", icon: Eye },
	{ href: "/analytics", label: "Data Siswa", icon: Users },
];

const muridLinks = [
	{ href: "/courses", label: "Materi Saya", icon: BookOpen },
	{ href: "/exams", label: "Ujian", icon: FileText },
];

export function Sidebar() {
	const pathname = usePathname();
	const router = useRouter();
	const { user, logout } = useAuthStore();
	const { isCollapsed, toggle, setCollapsed } = useSidebarStore();

	if (!user) return null;

	const links = user.role === "GURU" ? guruLinks : muridLinks;

	const handleLogout = async () => {
		await logout();
		router.push("/login");
	};

	// Get user initials for avatar
	const getInitials = (name: string) => {
		return name
			.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase()
			.slice(0, 2);
	};

	return (
		<div
			className={cn(
				"flex h-screen flex-col border-r bg-white fixed left-0 top-0 transition-all duration-300 z-50",
				isCollapsed ? "w-20" : "w-72",
			)}
		>
			{/* Header / Logo */}
			<div className="h-20 flex items-center justify-between px-4 border-b">
				{!isCollapsed ? (
					<Link
						href="/"
						className="flex items-center gap-2 overflow-hidden hover:opacity-80 transition-opacity"
					>
						<Image
							src="/icon/sahabatguru-icon.png"
							alt="Logo"
							width={32}
							height={32}
							className="w-8 h-8 object-contain shrink-0"
						/>
						<span className="font-bold text-xl font-heading text-slate-800 whitespace-nowrap">
							SahabatGuru
						</span>
					</Link>
				) : (
					<Link href="/" className="w-full flex justify-center">
						<Image
							src="/icon/sahabatguru-icon.png"
							alt="Logo"
							width={32}
							height={32}
							className="w-8 h-8 object-contain"
						/>
					</Link>
				)}

				<Button
					variant="ghost"
					size="icon"
					className={cn(
						"text-slate-400 hover:text-slate-600",
						isCollapsed && "hidden",
					)}
					onClick={toggle}
				>
					<ChevronLeft className="h-5 w-5" />
				</Button>
			</div>

			{/* Toggle Button for Collapsed State (Optional replacement for the hidden one above) */}
			{isCollapsed && (
				<div className="flex justify-center py-2 border-b">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => setCollapsed(false)}
					>
						<ChevronRight className="h-5 w-5 text-slate-400" />
					</Button>
				</div>
			)}

			{/* Navigation */}
			<nav className="flex-1 p-4 space-y-2 overflow-y-auto overflow-x-hidden">
				{links.map((link) => {
					const Icon = link.icon;
					const isActive = pathname.startsWith(link.href);

					return (
						<Link key={link.href} href={link.href}>
							<div
								className={cn(
									"flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative mb-2",
									isActive
										? "bg-sky-500 text-white shadow-md shadow-sky-200"
										: "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
									isCollapsed && "justify-center",
								)}
							>
								<Icon
									className={cn(
										"h-6 w-6 shrink-0",
										isActive
											? "text-white"
											: "text-slate-500 group-hover:text-slate-900",
									)}
								/>

								{!isCollapsed && (
									<span className="font-medium text-sm whitespace-nowrap overflow-hidden text-ellipsis">
										{link.label}
									</span>
								)}

								{/* Tooltip for collapsed state */}
								{isCollapsed && (
									<div className="absolute left-16 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
										{link.label}
									</div>
								)}
							</div>
						</Link>
					);
				})}
			</nav>

			{/* User Footer */}
			<div className="p-4 border-t bg-slate-50/50">
				<div
					className={cn(
						"flex items-center gap-3",
						isCollapsed && "justify-center",
					)}
				>
					<Avatar className="h-10 w-10 border bg-sky-100 text-sky-600">
						<AvatarImage src="" />
						<AvatarFallback className="font-bold bg-sky-100 text-sky-600">
							{getInitials(user.name)}
						</AvatarFallback>
					</Avatar>

					{!isCollapsed && (
						<div className="flex-1 overflow-hidden">
							<h4 className="font-bold text-sm text-slate-800 truncate">
								{user.name}
							</h4>
							<p className="text-xs text-slate-500 truncate">
								{user.email}
							</p>
						</div>
					)}
				</div>

				{!isCollapsed && (
					<div className="flex items-center justify-between mt-4 pl-1">
						<Button
							variant="ghost"
							size="sm"
							className="text-slate-500 hover:text-slate-900 gap-2 h-auto p-0 hover:bg-transparent"
						>
							<Settings className="h-4 w-4" />
							<span className="text-xs font-medium">Setting</span>
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8 text-slate-400 hover:text-red-500"
							onClick={handleLogout}
						>
							<LogOut className="h-4 w-4" />
						</Button>
					</div>
				)}
			</div>
		</div>
	);
}
