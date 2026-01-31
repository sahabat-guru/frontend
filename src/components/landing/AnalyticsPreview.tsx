"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Clock, CheckCircle } from "lucide-react";

export function AnalyticsPreview() {
	return (
		<section className="py-20 relative overflow-hidden">
			{/* Green background */}
			<div className="absolute inset-0 bg-emerald-50 opacity-50 -z-10" />
			<div className="absolute top-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-200 to-transparent" />

			<div className="container mx-auto px-4">
				<div className="text-center max-w-3xl mx-auto mb-16">
					<h2 className="text-3xl font-bold font-heading text-slate-900 mb-4">
						Dashboard Analitik yang Intuitif
					</h2>
					<p className="text-muted-foreground text-lg">
						Pantau performa kelas, history progress siswa, dan
						kelola tugas dalam satu tampilan terpadu.
					</p>
				</div>

				{/* Mock Dashboard UI */}
				<div className="max-w-5xl mx-auto bg-white rounded-xl shadow-2xl border p-2 md:p-6 relative">
					<div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/50 to-transparent pointer-events-none rounded-xl" />

					<div className="bg-slate-50 rounded-lg p-6 border">
						{/* Header Mock */}
						<div className="flex justify-between items-center mb-6">
							<div className="flex gap-2">
								<div className="h-3 w-3 rounded-full bg-red-400"></div>
								<div className="h-3 w-3 rounded-full bg-yellow-400"></div>
								<div className="h-3 w-3 rounded-full bg-green-400"></div>
							</div>
							<div className="h-4 w-32 bg-slate-200 rounded-full"></div>
						</div>

						{/* Stats Row */}
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
							{[
								{
									label: "Total Siswa",
									val: "324",
									icon: Users,
									color: "text-blue-600",
								},
								{
									label: "Ujian Aktif",
									val: "12",
									icon: FileText,
									color: "text-green-600",
								},
								{
									label: "Tertunda",
									val: "1,847",
									icon: CheckCircle,
									color: "text-emerald-600",
								},
								{
									label: "Waktu Hemat",
									val: "32 Jam",
									icon: Clock,
									color: "text-orange-600",
								},
							].map((stat, i) => (
								<div
									key={i}
									className="bg-white p-4 rounded-lg shadow-sm border"
								>
									<div className="flex items-center gap-2 mb-2">
										<stat.icon
											className={`h-4 w-4 ${stat.color}`}
										/>
										<span className="text-xs text-slate-500">
											{stat.label}
										</span>
									</div>
									<div className="text-xl font-bold text-slate-800">
										{stat.val}
									</div>
								</div>
							))}
						</div>

						{/* Chart Mock */}
						<div className="grid md:grid-cols-3 gap-6">
							<div className="md:col-span-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg p-6 text-white shadow-lg">
								<div className="flex justify-between items-center mb-4">
									<span className="font-medium text-white/90">
										Performa Kelas
									</span>
									<span className="text-xs bg-white/20 px-2 py-1 rounded">
										+12% dari semester lalu
									</span>
								</div>
								<div className="h-40 flex items-end justify-between gap-2">
									{[
										40, 60, 45, 70, 65, 80, 75, 90, 85, 95,
										80, 70,
									].map((h, i) => (
										<div
											key={i}
											className="w-full bg-white/30 hover:bg-white/50 transition-colors rounded-t-sm"
											style={{ height: `${h}%` }}
										></div>
									))}
								</div>
								<div className="mt-2 flex justify-between text-xs text-white/60">
									<span>Jan</span>
									<span>Dec</span>
								</div>
							</div>

							<div className="bg-emerald-100 rounded-lg p-6 border border-emerald-200">
								<h4 className="font-bold text-emerald-800 mb-4">
									Perlu Perhatian
								</h4>
								<div className="space-y-3">
									{[
										"Ahmad Budi",
										"Siti Nurhaliza",
										"Eko Purnomo",
									].map((name, i) => (
										<div
											key={i}
											className="bg-white p-3 rounded shadow-sm flex items-center gap-3"
										>
											<div className="h-8 w-8 rounded-full bg-slate-200" />
											<div>
												<div className="text-sm font-bold text-slate-700">
													{name}
												</div>
												<div className="text-xs text-slate-500">
													Nilai rata-rata &lt; 70
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
						</div>

						<div className="mt-8 text-center">
							<Button className="bg-gradient-primary">
								Lihat Dashboard Langsung{" "}
								<ArrowRight className="ml-2 h-4 w-4" />
							</Button>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

// Icon helper components for this file
const FileText = (props: any) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="24"
		height="24"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		{...props}
	>
		<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
		<polyline points="14 2 14 8 20 8" />
	</svg>
);
