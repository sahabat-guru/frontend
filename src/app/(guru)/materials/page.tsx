"use client";

import { useState } from "react";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/components/ui/tabs";
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
} from "@/components/ui/card";
import { RPPGenerator } from "@/components/features/materials/RPPGenerator";
import { PPTGenerator } from "@/components/features/materials/PPTGenerator";
import { SoalGenerator } from "@/components/features/materials/SoalGenerator";
import { LKPDGenerator } from "@/components/features/materials/LKPDGenerator";
import { MaterialArchive } from "@/components/features/materials/MaterialArchive";
import { GeneratedResult } from "@/components/features/materials/GeneratedResult";
import {
	FileText,
	Presentation,
	ClipboardList,
	BookOpen,
	Archive,
	Box
} from "lucide-react";

export default function MaterialPage() {
	const [result, setResult] = useState<any>(null);
	const [activeTab, setActiveTab] = useState("rpp");

	const handleGenerate = (data: any) => {
		setResult(data);
	};

	// Mapping tab value to generator type for result display
	const getGeneratorType = () => {
		switch (activeTab) {
			case "rpp": return "RPP";
			case "ppt": return "PPT";
			case "soal": return "QUESTIONS";
			case "lkpd": return "LKPD";
			default: return null;
		}
	};

	return (
		<div className="space-y-6 flex flex-col">
			<div className="flex items-center justify-between shrink-0">
				<div>
					<h2 className="text-3xl font-bold tracking-tight text-[#0F172A]">
						Lesson & Material Generator
					</h2>
					<p className="text-muted-foreground">
						Buat RPP, presentasi, soal, dan materi pembelajaran dengan bantuan AI
					</p>
				</div>
			</div>

			<Tabs defaultValue="rpp" value={activeTab} onValueChange={setActiveTab} className="w-full">
				<TabsList className="bg-transparent p-0 gap-2 h-auto w-full justify-start flex-wrap mb-6">
					<TabsTrigger
						value="rpp"
						className="rounded-xl px-6 py-2 gap-2 border bg-white data-[state=active]:bg-[#0093E9] data-[state=active]:text-white data-[state=active]:border-[#0093E9]"
					>
						<FileText className="h-4 w-4" />
						RPP Generator
					</TabsTrigger>
					<TabsTrigger
						value="ppt"
						className="rounded-xl px-6 py-2 gap-2 border bg-white data-[state=active]:bg-[#0093E9] data-[state=active]:text-white data-[state=active]:border-[#0093E9]"
					>
						<Presentation className="h-4 w-4" />
						PPT Generator
					</TabsTrigger>
					<TabsTrigger
						value="soal"
						className="rounded-xl px-6 py-2 gap-2 border bg-white data-[state=active]:bg-[#0093E9] data-[state=active]:text-white data-[state=active]:border-[#0093E9]"
					>
						<ClipboardList className="h-4 w-4" />
						Soal Generator
					</TabsTrigger>
					<TabsTrigger
						value="lkpd"
						className="rounded-xl px-6 py-2 gap-2 border bg-white data-[state=active]:bg-[#0093E9] data-[state=active]:text-white data-[state=active]:border-[#0093E9]"
					>
						<BookOpen className="h-4 w-4" />
						LKPD Creator
					</TabsTrigger>
					<TabsTrigger
						value="arsip"
						className="rounded-xl px-6 py-2 gap-2 border bg-white data-[state=active]:bg-[#0093E9] data-[state=active]:text-white data-[state=active]:border-[#0093E9]"
					>
						<Archive className="h-4 w-4" />
						Arsip
					</TabsTrigger>
				</TabsList>

				<div className="w-full">
					{/* Generators Section with Natural Height */}
					<TabsContent value="rpp" className="mt-0">
						<div className="mb-4 shrink-0">
							<h3 className="text-xl font-bold flex items-center gap-2">
								<FileText className="text-primary" />
								Smart Lesson Planner
							</h3>
							<p className="text-muted-foreground text-sm">Generate RPP/Modul Ajar lengkap dalam satu klik</p>
						</div>
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
							<div className="h-full pr-2">
								<RPPGenerator onGenerate={handleGenerate} />
							</div>
							<div className="h-full overflow-hidden">
								<Card className="h-full border shadow-sm rounded-xl overflow-hidden bg-white flex flex-col">
									<CardHeader className="pb-2 bg-white shrink-0">
										<CardTitle className="text-xl font-bold text-gray-800">Preview RPP</CardTitle>
										<CardDescription className="text-gray-500">Hasil generate RPP/Modul Ajar</CardDescription>
									</CardHeader>
									<CardContent className="h-full p-0">
										<GeneratedResult result={result} type="RPP" />
									</CardContent>
								</Card>
							</div>
						</div>
					</TabsContent>

					<TabsContent value="ppt" className="mt-0">
						<div className="mb-4 shrink-0">
							<h3 className="text-xl font-bold flex items-center gap-2">
								<Presentation className="text-[#6E2CF4]" />
								Presentation Architect
							</h3>
							<p className="text-muted-foreground text-sm">Generate slide presentasi visual secara instan</p>
						</div>
						<div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
							<div className="h-full pr-2 col-span-12 lg:col-span-4">
								<PPTGenerator onGenerate={handleGenerate} />
							</div>
							<div className="h-full overflow-hidden col-span-12 lg:col-span-8">
								<Card className="h-full border shadow-sm rounded-xl overflow-hidden bg-white flex flex-col">
									<CardHeader className="pb-2 bg-white shrink-0">
										<CardTitle className="text-xl font-bold text-gray-800">Preview Slide</CardTitle>
										<CardDescription className="text-gray-500">Belum ada slide</CardDescription>
									</CardHeader>
									<CardContent className="h-full p-0">
										<GeneratedResult result={result} type="PPT" />
									</CardContent>
								</Card>
							</div>
						</div>
					</TabsContent>

					<TabsContent value="soal" className="mt-0">
						<div className="mb-4 shrink-0">
							<h3 className="text-xl font-bold flex items-center gap-2">
								<ClipboardList className="text-[#00C853]" />
								Exam & Quiz Builder
							</h3>
							<p className="text-muted-foreground text-sm">Buat bank soal dalam hitungan detik</p>
						</div>
						<div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
							<div className="h-full pr-2 col-span-12 lg:col-span-4">
								<SoalGenerator onGenerate={handleGenerate} />
							</div>
							<div className="h-full overflow-hidden col-span-12 lg:col-span-8">
								<Card className="h-full border shadow-sm rounded-xl overflow-hidden bg-white flex flex-col">
									<CardHeader className="pb-2 bg-white shrink-0">
										<CardTitle className="text-xl font-bold text-gray-800">Preview Soal</CardTitle>
										<CardDescription className="text-gray-500">Belum ada soal</CardDescription>
									</CardHeader>
									<CardContent className="h-full p-0">
										<GeneratedResult result={result} type="QUESTIONS" />
									</CardContent>
								</Card>
							</div>
						</div>
					</TabsContent>

					<TabsContent value="lkpd" className="mt-0">
						<div className="mb-4 shrink-0">
							<h3 className="text-xl font-bold flex items-center gap-2">
								<BookOpen className="text-[#F97316]" />
								Student Worksheet (LKPD) Creator
							</h3>
							<p className="text-muted-foreground text-sm">Buat lembar kerja siswa yang menarik dan interaktif</p>
						</div>
						<div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
							<div className="h-full pr-2 col-span-12 lg:col-span-4">
								<LKPDGenerator onGenerate={handleGenerate} />
							</div>
							<div className="h-full overflow-hidden col-span-12 lg:col-span-8">
								<Card className="h-full border shadow-sm rounded-xl overflow-hidden bg-white flex flex-col">
									<CardHeader className="pb-2 bg-white shrink-0">
										<CardTitle className="text-xl font-bold text-gray-800">Preview LKPD</CardTitle>
										<CardDescription className="text-gray-500">Belum ada konten</CardDescription>
									</CardHeader>
									<CardContent className="h-full p-0">
										<GeneratedResult result={result} type="LKPD" />
									</CardContent>
								</Card>
							</div>
						</div>
					</TabsContent>

					<TabsContent value="arsip" className="mt-0">
						<div className="mb-6 shrink-0">
							<h3 className="text-xl font-bold flex items-center gap-2 text-[#0F172A]">
								<Archive className="h-6 w-6 text-slate-700" />
								Archive & Version Control
							</h3>
							<p className="text-muted-foreground text-sm">Kelola semua materi yang pernah dibuat</p>
						</div>
						<div className="overflow-hidden pb-6">
							<MaterialArchive />
						</div>
					</TabsContent>
				</div>
			</Tabs>
		</div>
	);
}
