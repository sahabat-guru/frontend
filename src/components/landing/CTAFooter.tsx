"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle2, School } from "lucide-react";
import Link from "next/link";

export function CTA() {
	return (
		<section className="py-20 px-4">
			<div className="container max-w-5xl mx-auto">
				<div className="bg-gradient-primary rounded-3xl p-8 md:p-16 text-center text-white shadow-2xl relative overflow-hidden">
					{/* Decorative circles */}
					<div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
					<div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />

					<h2 className="text-3xl md:text-5xl font-bold font-heading mb-6 relative z-10">
						Siap Menghemat Waktu Anda?
					</h2>
					<p className="text-blue-50 text-lg mb-8 max-w-2xl mx-auto relative z-10">
						Bergabung dengan 10,000+ guru di Indonesia yang sudah
						merasakan kemudahan mengajar dengan SahabatGuru.
					</p>

					<div className="flex flex-wrap justify-center gap-6 mb-10 text-sm font-medium relative z-10">
						<div className="flex items-center gap-2">
							<CheckCircle2 className="text-white/80 h-5 w-5" />{" "}
							Coba untuk 30 hari gratis
						</div>
						<div className="flex items-center gap-2">
							<CheckCircle2 className="text-white/80 h-5 w-5" />{" "}
							Tanpa kartu kredit
						</div>
						<div className="flex items-center gap-2">
							<CheckCircle2 className="text-white/80 h-5 w-5" />{" "}
							Dukungan penuh SahabatGuru
						</div>
					</div>

					<Link href="/login" className="relative z-10">
						<Button
							size="lg"
							className="h-14 px-8 text-lg bg-white text-emerald-600 hover:bg-white/90 rounded-full font-bold shadow-lg"
						>
							Mulai Sekarang — Gratis
						</Button>
					</Link>
				</div>
			</div>
		</section>
	);
}

export function Footer() {
	return (
		<footer className="bg-slate-900 text-slate-300 py-16 border-t border-slate-800">
			<div className="container mx-auto px-4">
				<div className="grid md:grid-cols-4 gap-12 mb-12">
					<div className="col-span-1 md:col-span-1">
						<div className="flex items-center gap-2 text-white font-bold font-heading text-xl mb-4">
							<School className="h-6 w-6 text-emerald-500" />{" "}
							SahabatGuru
						</div>
						<p className="text-slate-400 text-sm leading-relaxed">
							Platform Al untuk guru modern. Otomatisasi
							administrasi, fokus pada esensi mendidik.
						</p>
					</div>

					<div>
						<h4 className="text-white font-bold mb-4">Produk</h4>
						<ul className="space-y-2 text-sm">
							<li>
								<Link
									href="#"
									className="hover:text-emerald-400"
								>
									Automated Scoring
								</Link>
							</li>
							<li>
								<Link
									href="#"
									className="hover:text-emerald-400"
								>
									Material Generator
								</Link>
							</li>
							<li>
								<Link
									href="#"
									className="hover:text-emerald-400"
								>
									Smart Proctoring
								</Link>
							</li>
							<li>
								<Link
									href="#"
									className="hover:text-emerald-400"
								>
									Student Insights
								</Link>
							</li>
						</ul>
					</div>

					<div>
						<h4 className="text-white font-bold mb-4">
							Perusahaan
						</h4>
						<ul className="space-y-2 text-sm">
							<li>
								<Link
									href="#"
									className="hover:text-emerald-400"
								>
									Tentang Kami
								</Link>
							</li>
							<li>
								<Link
									href="#"
									className="hover:text-emerald-400"
								>
									Karir
								</Link>
							</li>
							<li>
								<Link
									href="#"
									className="hover:text-emerald-400"
								>
									Blog
								</Link>
							</li>
							<li>
								<Link
									href="#"
									className="hover:text-emerald-400"
								>
									Kebijakan Privasi
								</Link>
							</li>
						</ul>
					</div>

					<div>
						<h4 className="text-white font-bold mb-4">Kontak</h4>
						<ul className="space-y-2 text-sm">
							<li>
								<a
									href="mailto:hello@sahabatguru.id"
									className="hover:text-emerald-400"
								>
									hello@sahabatguru.id
								</a>
							</li>
							<li>
								<span className="text-slate-400">
									+62 812 3456 7890
								</span>
							</li>
							<li>
								<span className="text-slate-400">
									Jakarta, Indonesia
								</span>
							</li>
						</ul>
					</div>
				</div>

				<div className="pt-8 border-t border-slate-800 text-center text-xs text-slate-500">
					&copy; {new Date().getFullYear()} SahabatGuru. Hak Cipta
					Dilindungi.
				</div>
			</div>
		</footer>
	);
}
