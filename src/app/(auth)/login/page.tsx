"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { School, Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { AxiosError } from "axios";

export default function LoginPage() {
	const { login } = useAuthStore();
	const router = useRouter();
	
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setIsLoading(true);

		try {
			await login(email, password);
			
			// Get updated user from store
			const user = useAuthStore.getState().user;
			if (user?.role === "GURU") {
				router.push("/dashboard");
			} else {
				router.push("/courses");
			}
		} catch (err) {
			const axiosError = err as AxiosError<{ error?: string; message?: string }>;
			const message = 
				axiosError.response?.data?.error || 
				axiosError.response?.data?.message || 
				"Email atau password salah";
			setError(message);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
			<Card className="w-full max-w-[420px] border-none shadow-xl">
				<CardHeader className="text-center pb-2">
					<div className="mx-auto w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-4">
						<School className="h-7 w-7 text-primary" />
					</div>
					<CardTitle className="text-2xl font-bold text-primary">
						SahabatGuru
					</CardTitle>
					<CardDescription className="text-base">
						Masuk ke akun Anda
					</CardDescription>
				</CardHeader>
				
				<form onSubmit={handleSubmit}>
					<CardContent className="space-y-4">
						{error && (
							<div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
								{error}
							</div>
						)}
						
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								placeholder="nama@email.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								disabled={isLoading}
								className="h-11"
							/>
						</div>
						
						<div className="space-y-2">
							<Label htmlFor="password">Password</Label>
							<div className="relative">
								<Input
									id="password"
									type={showPassword ? "text" : "password"}
									placeholder="Masukkan password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required
									disabled={isLoading}
									className="h-11 pr-10"
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
								>
									{showPassword ? (
										<EyeOff className="h-5 w-5" />
									) : (
										<Eye className="h-5 w-5" />
									)}
								</button>
							</div>
						</div>

						<Button
							type="submit"
							className="w-full h-11 text-base font-semibold"
							disabled={isLoading}
						>
							{isLoading ? (
								<>
									<Loader2 className="mr-2 h-5 w-5 animate-spin" />
									Memproses...
								</>
							) : (
								"Masuk"
							)}
						</Button>
					</CardContent>
				</form>

				<CardFooter className="flex flex-col gap-4 pt-0">
					<div className="relative w-full">
						<div className="absolute inset-0 flex items-center">
							<span className="w-full border-t" />
						</div>
						<div className="relative flex justify-center text-xs uppercase">
							<span className="bg-white px-2 text-muted-foreground">
								Belum punya akun?
							</span>
						</div>
					</div>
					
					<Link href="/register" className="w-full">
						<Button
							type="button"
							variant="outline"
							className="w-full h-11 text-base"
						>
							Daftar Sekarang
						</Button>
					</Link>
				</CardFooter>
			</Card>
		</div>
	);
}
