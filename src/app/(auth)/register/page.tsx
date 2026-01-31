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
import { authApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import { School, Eye, EyeOff, Loader2, GraduationCap } from "lucide-react";
import Link from "next/link";
import { AxiosError } from "axios";
import { useToast } from "@/hooks/use-toast";

type RoleType = "GURU" | "MURID";

export default function RegisterPage() {
	const router = useRouter();
	const { toast } = useToast();

	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [role, setRole] = useState<RoleType>("MURID");
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");
	const [validationErrors, setValidationErrors] = useState<string[]>([]);

	const validatePassword = (pwd: string): string[] => {
		const errors: string[] = [];
		if (pwd.length < 8) {
			errors.push("Minimal 8 karakter");
		}
		if (!/[A-Z]/.test(pwd)) {
			errors.push("Harus mengandung huruf besar");
		}
		if (!/[a-z]/.test(pwd)) {
			errors.push("Harus mengandung huruf kecil");
		}
		if (!/[0-9]/.test(pwd)) {
			errors.push("Harus mengandung angka");
		}
		return errors;
	};

	const handlePasswordChange = (value: string) => {
		setPassword(value);
		if (value) {
			setValidationErrors(validatePassword(value));
		} else {
			setValidationErrors([]);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		// Validate password
		const pwdErrors = validatePassword(password);
		if (pwdErrors.length > 0) {
			setValidationErrors(pwdErrors);
			return;
		}

		// Check password match
		if (password !== confirmPassword) {
			setError("Password tidak cocok");
			return;
		}

		setIsLoading(true);

		try {
			// Call register API directly (don't auto-login)
			await authApi.register({ name, email, password, role });

			// Show success toast
			toast({
				title: "Registrasi Berhasil! 🎉",
				description: "Akun Anda telah dibuat. Silakan login untuk melanjutkan.",
			});

			// Redirect to login
			router.push("/login");
		} catch (err) {
			const axiosError = err as AxiosError<{ error?: string; message?: string }>;
			const message =
				axiosError.response?.data?.error ||
				axiosError.response?.data?.message ||
				"Gagal mendaftar. Silakan coba lagi.";
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
						Daftar Akun
					</CardTitle>
					<CardDescription className="text-base">
						Buat akun baru untuk memulai
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
							<Label htmlFor="name">Nama Lengkap</Label>
							<Input
								id="name"
								type="text"
								placeholder="Masukkan nama lengkap"
								value={name}
								onChange={(e) => setName(e.target.value)}
								required
								disabled={isLoading}
								className="h-11"
								minLength={2}
							/>
						</div>

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
									placeholder="Buat password"
									value={password}
									onChange={(e) => handlePasswordChange(e.target.value)}
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
							{validationErrors.length > 0 && password && (
								<ul className="text-xs text-red-500 mt-1 space-y-0.5">
									{validationErrors.map((err, idx) => (
										<li key={idx}>• {err}</li>
									))}
								</ul>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="confirmPassword">Konfirmasi Password</Label>
							<div className="relative">
								<Input
									id="confirmPassword"
									type={showConfirmPassword ? "text" : "password"}
									placeholder="Ulangi password"
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
									required
									disabled={isLoading}
									className="h-11 pr-10"
								/>
								<button
									type="button"
									onClick={() => setShowConfirmPassword(!showConfirmPassword)}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
								>
									{showConfirmPassword ? (
										<EyeOff className="h-5 w-5" />
									) : (
										<Eye className="h-5 w-5" />
									)}
								</button>
							</div>
						</div>

						<div className="space-y-2">
							<Label>Daftar Sebagai</Label>
							<div className="grid grid-cols-2 gap-3">
								<button
									type="button"
									onClick={() => setRole("GURU")}
									disabled={isLoading}
									className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
										role === "GURU"
											? "border-primary bg-primary/5 text-primary"
											: "border-gray-200 hover:border-gray-300"
									}`}
								>
									<School className={`h-8 w-8 ${role === "GURU" ? "text-primary" : "text-gray-500"}`} />
									<span className="font-medium text-sm">Guru</span>
								</button>
								<button
									type="button"
									onClick={() => setRole("MURID")}
									disabled={isLoading}
									className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
										role === "MURID"
											? "border-primary bg-primary/5 text-primary"
											: "border-gray-200 hover:border-gray-300"
									}`}
								>
									<GraduationCap className={`h-8 w-8 ${role === "MURID" ? "text-primary" : "text-gray-500"}`} />
									<span className="font-medium text-sm">Murid</span>
								</button>
							</div>
						</div>

						<Button
							type="submit"
							className="w-full h-11 text-base font-semibold"
							disabled={isLoading || validationErrors.length > 0}
						>
							{isLoading ? (
								<>
									<Loader2 className="mr-2 h-5 w-5 animate-spin" />
									Mendaftar...
								</>
							) : (
								"Daftar"
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
								Sudah punya akun?
							</span>
						</div>
					</div>

					<Link href="/login" className="w-full">
						<Button
							type="button"
							variant="outline"
							className="w-full h-11 text-base"
						>
							Masuk
						</Button>
					</Link>
				</CardFooter>
			</Card>
		</div>
	);
}
