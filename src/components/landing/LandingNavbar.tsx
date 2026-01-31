"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export function LandingNavbar() {
	return (
		<nav className="flex items-center justify-between py-4 px-6 md:px-12 max-w-7xl mx-auto w-full">
			<div className="flex items-center gap-2">
				<Image
					src="/icon/sahabatguru-icon.png"
					alt="SahabatGuru Logo"
					width={32}
					height={32}
					className="w-8 h-8 object-contain"
				/>
				<span className="text-xl font-bold font-heading bg-gradient-primary bg-clip-text text-transparent">
					SahabatGuru
				</span>
			</div>

			<div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
				<Link
					href="#features"
					className="hover:text-primary transition-colors"
				>
					Fitur
				</Link>
				<Link
					href="/dashboard"
					className="hover:text-primary transition-colors"
				>
					Dashboard
				</Link>
				<Link
					href="#pricing"
					className="hover:text-primary transition-colors"
				>
					Harga
				</Link>
				<Link
					href="#showcase"
					className="hover:text-primary transition-colors"
				>
					Karya
				</Link>
			</div>

			<div className="flex items-center gap-4">
		
				<Link href="/login">
					<Button className="bg-gradient-primary hover:opacity-90 transition-opacity rounded-full px-6">
						Masuk
					</Button>
				</Link>
			</div>
		</nav>
	);
}
