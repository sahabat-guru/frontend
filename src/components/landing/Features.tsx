"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
	CheckCircle,
	FileText,
	Video,
	BarChart2,
	ArrowRight,
} from "lucide-react";
import Link from "next/link";

const features = [
	{
		icon: CheckCircle,
		color: "bg-blue-100 text-blue-600",
		title: "Automated Scoring System",
		description:
			"Koreksi otomatis untuk essay dan pilihan ganda. Terintegrasi dengan Google Form dan input langsung di aplikasi.",
		link: "#",
	},
	{
		icon: FileText,
		color: "bg-green-100 text-green-600",
		title: "Lesson & Material Generator",
		description:
			"Buat RPP, silabus, dan materi ajar yang dipersonalisasi sesuai gaya mengajar Anda dalam hitungan menit.",
		link: "#",
	},
	{
		icon: Video,
		color: "bg-teal-100 text-teal-600",
		title: "Smart Proctoring",
		description:
			"Deteksi indikasi kecurangan selama ujian online menggunakan kamera laptop siswa untuk menjaga integritas akademik.",
		link: "#",
	},
	{
		icon: BarChart2,
		color: "bg-orange-100 text-orange-600",
		title: "Student Insight Dashboard",
		description:
			"Analisis performa siswa berdasarkan data historis untuk identifikasi siswa yang membutuhkan bimbingan tambahan.",
		link: "#",
	},
];

export function Features() {
	return (
		<section id="features" className="py-20 bg-slate-50">
			<div className="container mx-auto px-4">
				<div className="text-center max-w-2xl mx-auto mb-16">
					<h2 className="text-3xl font-bold font-heading text-slate-900 mb-4">
						Fitur Unggulan untuk Guru Modern
					</h2>
					<p className="text-muted-foreground text-lg">
						Empat teknologi AI yang dirancang khusus untuk
						meringankan beban administrasi guru.
					</p>
				</div>

				<div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
					{features.map((feature, index) => (
						<Card
							key={index}
							className="border-none shadow-sm hover:shadow-md transition-shadow"
						>
							<CardContent className="p-8">
								<div
									className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-6`}
								>
									<feature.icon className="h-6 w-6" />
								</div>
								<h3 className="text-xl font-bold font-heading mb-3 text-slate-900">
									{feature.title}
								</h3>
								<p className="text-muted-foreground mb-6 leading-relaxed">
									{feature.description}
								</p>
								<Link
									href={feature.link}
									className="inline-flex items-center text-primary font-medium hover:underline"
								>
									Coba Sekarang{" "}
									<ArrowRight className="ml-2 h-4 w-4" />
								</Link>
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		</section>
	);
}
