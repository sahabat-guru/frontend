"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
	CheckCircle,
	PlayCircle,
	Users,
	FileText,
	Activity,
	Clock,
} from "lucide-react";

export function Hero() {
	return (
		<section className="relative pt-10 pb-20 lg:pt-20 lg:pb-32 overflow-hidden">
			{/* Background decoration */}
			<div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-hero -z-10 rounded-b-[50px] opacity-50" />

			{/* Green Shadow Accent */}
			<div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[100px] bg-emerald-500/20 blur-[100px] -z-10 rounded-full pointer-events-none" />

			<div className="container mx-auto px-4 text-center">
				<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-medium mb-6">
					<span className="relative flex h-2 w-2">
						<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
						<span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
					</span>
					Platform AI No.1 untuk Guru Indonesia
				</div>

				<h1 className="text-4xl md:text-6xl font-extrabold font-heading tracking-tight text-slate-900 mb-6 max-w-4xl mx-auto leading-tight">
					Kembalikan Waktu Anda untuk{" "}
					<span className="bg-gradient-primary bg-clip-text text-transparent">
						Mengajar
					</span>
				</h1>

				<p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
					SahabatGuru mengotomatisasi pembuatan ujian, menyusun materi
					dan RPP, mengawasi ujian, dan menganalisis performa siswa.
				</p>

				<div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
					<Link href="/login">
						<Button
							size="lg"
							className="h-12 px-8 rounded-full bg-gradient-primary text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
						>
							Mulai Gratis
						</Button>
					</Link>
					<Button
						size="lg"
						variant="outline"
						className="h-12 px-8 rounded-full text-lg border-primary/20 hover:bg-primary/5 gap-2"
					>
						<PlayCircle className="h-5 w-5" />
						Lihat Demo
					</Button>
				</div>

				<div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
					<div className="text-center">
						<div className="text-3xl font-bold text-slate-900 mb-1">
							10K+
						</div>
						<div className="text-sm text-muted-foreground">
							Guru Aktif
						</div>
					</div>
					<div className="text-center">
						<div className="text-3xl font-bold text-slate-900 mb-1">
							500K+
						</div>
						<div className="text-sm text-muted-foreground">
							Ujian Total
						</div>
					</div>
					<div className="text-center">
						<div className="text-3xl font-bold text-slate-900 mb-1">
							95%
						</div>
						<div className="text-sm text-muted-foreground">
							Akurasi AI
						</div>
					</div>
					<div className="text-center">
						<div className="text-3xl font-bold text-slate-900 mb-1">
							8 Jam
						</div>
						<div className="text-sm text-muted-foreground">
							Hemat Waktu/Minggu
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
