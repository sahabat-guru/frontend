"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useUserStore, Role } from "@/lib/store";
import { useRouter } from "next/navigation";
import { GraduationCap, School } from "lucide-react";

export default function LoginPage() {
	const { login } = useUserStore();
	const router = useRouter();

	const handleLogin = (role: Role) => {
		const name = role === "GURU" ? "Pak Budi" : "Andi Siswa";
		login(name, role);
		if (role === "GURU") router.push("/dashboard");
		else router.push("/courses");
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-hero">
			<Card className="w-[400px] border-none shadow-xl">
				<CardHeader className="text-center">
					<div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
						<School className="h-6 w-6 text-primary" />
					</div>
					<CardTitle className="text-2xl font-bold text-primary">
						SahabatGuru
					</CardTitle>
					<CardDescription>Masuk untuk melanjutkan</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-4">
					<Button
						size="lg"
						className="h-16 text-lg justify-start gap-4"
						onClick={() => handleLogin("GURU")}
					>
						<School className="h-8 w-8" />
						<div className="text-left">
							<div className="font-semibold">
								Masuk sebagai Guru
							</div>
							<div className="text-xs font-normal opacity-80">
								Kelola kelas dan materi
							</div>
						</div>
					</Button>

					<Button
						size="lg"
						variant="outline"
						className="h-16 text-lg justify-start gap-4 border-primary/20 hover:bg-primary/5"
						onClick={() => handleLogin("MURID")}
					>
						<GraduationCap className="h-8 w-8 text-primary" />
						<div className="text-left">
							<div className="font-semibold">
								Masuk sebagai Murid
							</div>
							<div className="text-xs font-normal opacity-80">
								Akses materi dan ujian
							</div>
						</div>
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
