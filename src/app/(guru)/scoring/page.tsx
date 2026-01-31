"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Search,
	Plus,
	Eye,
	Sparkles,
	FileText,
	Loader2,
	RefreshCw,
	CheckCircle,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { scoringApi, type ExamListItem } from "@/lib/scoring-api";

// Map backend status to display status
const statusMap: Record<string, string> = {
	DRAFT: "Draft",
	ONGOING: "Aktif",
	FINISHED: "Selesai",
};

export default function ScoringPage() {
	const [activeTab, setActiveTab] = useState("all");
	const [searchQuery, setSearchQuery] = useState("");
	const [exams, setExams] = useState<ExamListItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedExam, setSelectedExam] = useState<ExamListItem | null>(null);
	const [isGrading, setIsGrading] = useState(false);
	const [examScores, setExamScores] = useState<
		Record<
			string,
			{ submissions: number; scored: number; average: number | null }
		>
	>({});

	// Fetch exams
	const fetchExams = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const statusFilter =
				activeTab === "all" ? undefined : activeTab.toUpperCase();
			const data = await scoringApi.getExams({
				status: statusFilter,
				search: searchQuery || undefined,
			});
			setExams(data.exams);

			// Fetch scores for each exam
			const scoresMap: Record<
				string,
				{ submissions: number; scored: number; average: number | null }
			> = {};
			for (const exam of data.exams) {
				try {
					const scores = await scoringApi.getExamScores(exam.id);
					scoresMap[exam.id] = {
						submissions: scores.stats.submitted,
						scored: scores.stats.scored,
						average: scores.stats.average || null,
					};
				} catch {
					scoresMap[exam.id] = {
						submissions: 0,
						scored: 0,
						average: null,
					};
				}
			}
			setExamScores(scoresMap);
		} catch (err) {
			setError("Gagal memuat data ujian");
			console.error(err);
		} finally {
			setLoading(false);
		}
	}, [activeTab, searchQuery]);

	useEffect(() => {
		const debounceTimer = setTimeout(() => {
			fetchExams();
		}, 300);
		return () => clearTimeout(debounceTimer);
	}, [fetchExams]);

	// Filter exams client-side for status (backup if API doesn't support it)
	const filteredExams = (exams || []).filter((exam) => {
		if (activeTab === "all") return true;
		return exam.status.toLowerCase() === activeTab;
	});

	const getStatusColor = (status: string) => {
		switch (status) {
			case "FINISHED":
				return "bg-green-100 text-green-700 hover:bg-green-100/80 border-green-200";
			case "ONGOING":
				return "bg-amber-100 text-amber-700 hover:bg-amber-100/80 border-amber-200";
			case "DRAFT":
				return "bg-slate-100 text-slate-700 hover:bg-slate-100/80 border-slate-200";
			default:
				return "bg-slate-100 text-slate-700";
		}
	};

	const handleOpenAiDialog = (exam: ExamListItem) => {
		setSelectedExam(exam);
	};

	const handleStartGrading = async () => {
		if (!selectedExam) return;

		setIsGrading(true);
		try {
			await scoringApi.triggerScoring(selectedExam.id);
			// Refresh data after scoring
			await fetchExams();
		} catch (err) {
			console.error("Scoring failed:", err);
		} finally {
			setIsGrading(false);
			setSelectedExam(null);
		}
	};

	// Count exams by status
	const statusCounts = (exams || []).reduce(
		(acc, exam) => {
			acc[exam.status] = (acc[exam.status] || 0) + 1;
			return acc;
		},
		{} as Record<string, number>,
	);

	return (
		<div className="space-y-8">
			{/* Header */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold tracking-tight text-slate-900 font-heading">
						Penilaian Otomatis
					</h1>
					<p className="text-muted-foreground text-sm">
						Kelola dan nilai ujian siswa secara otomatis dengan AI
					</p>
				</div>
				<div className="flex items-center gap-3">
					<Button
						variant="outline"
						className="gap-2 bg-white"
						onClick={() => fetchExams()}
						disabled={loading}
					>
						<RefreshCw
							className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
						/>
						Refresh
					</Button>
					<Link href="/ujian/baru">
						<Button className="gap-2 bg-sky-500 hover:bg-sky-600 text-white">
							<Plus className="h-4 w-4" />
							Buat Ujian
						</Button>
					</Link>
				</div>
			</div>

			{/* Toolbar & Filters */}
			<div className="flex flex-col md:flex-row gap-4 items-center justify-between">
				<div className="relative w-full md:w-96">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
					<Input
						placeholder="Cari ujian..."
						className="pl-10 bg-white border-slate-200 focus-visible:ring-sky-500"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>
			</div>

			{/* Tabs */}
			<Tabs
				defaultValue="all"
				className="w-full"
				onValueChange={setActiveTab}
			>
				<TabsList className="bg-transparent p-0 gap-2 h-auto flex-wrap justify-start">
					<TabsTrigger
						value="all"
						className="data-[state=active]:bg-sky-100 data-[state=active]:text-sky-700 data-[state=active]:shadow-none rounded-full px-4 py-1.5 h-auto text-sm border border-transparent data-[state=active]:border-sky-200 bg-white text-slate-600 hover:bg-slate-50"
					>
						Semua ({exams.length})
					</TabsTrigger>
					<TabsTrigger
						value="ongoing"
						className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-700 data-[state=active]:shadow-none rounded-full px-4 py-1.5 h-auto text-sm border border-transparent data-[state=active]:border-amber-200 bg-white text-slate-600 hover:bg-slate-50"
					>
						Aktif ({statusCounts.ONGOING || 0})
					</TabsTrigger>
					<TabsTrigger
						value="finished"
						className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700 data-[state=active]:shadow-none rounded-full px-4 py-1.5 h-auto text-sm border border-transparent data-[state=active]:border-green-200 bg-white text-slate-600 hover:bg-slate-50"
					>
						Selesai ({statusCounts.FINISHED || 0})
					</TabsTrigger>
					<TabsTrigger
						value="draft"
						className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-700 data-[state=active]:shadow-none rounded-full px-4 py-1.5 h-auto text-sm border border-transparent data-[state=active]:border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
					>
						Draft ({statusCounts.DRAFT || 0})
					</TabsTrigger>
				</TabsList>
			</Tabs>

			{/* Error State */}
			{error && (
				<div className="text-center py-8 text-red-500">
					<p>{error}</p>
					<Button
						variant="outline"
						onClick={() => fetchExams()}
						className="mt-4"
					>
						Coba Lagi
					</Button>
				</div>
			)}

			{/* Loading State */}
			{loading && (
				<div className="flex justify-center py-12">
					<Loader2 className="h-8 w-8 animate-spin text-sky-500" />
				</div>
			)}

			{/* Empty State */}
			{!loading && !error && filteredExams.length === 0 && (
				<div className="text-center py-12 text-slate-500">
					<FileText className="h-12 w-12 mx-auto mb-4 text-slate-300" />
					<p>Tidak ada ujian ditemukan</p>
				</div>
			)}

			{/* Exam List */}
			{!loading && !error && (
				<div className="space-y-4">
					{filteredExams.map((exam) => (
						<Card
							key={exam.id}
							className="border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200 rounded-xl overflow-hidden"
						>
							<CardContent className="p-0">
								<div className="flex flex-col md:flex-row items-stretch min-h-[100px]">
									{/* Left Accent / Icon Area */}
									<div className="p-6 md:w-16 flex items-start justify-center">
										<div className="p-3 bg-sky-50 rounded-lg text-sky-600">
											<FileText className="h-6 w-6" />
										</div>
									</div>

									{/* Main Content */}
									<div className="flex-1 p-6 pl-0 md:pl-2 flex flex-col justify-center">
										<div className="flex flex-wrap items-center gap-3 mb-2">
											<h3 className="font-bold text-lg text-slate-900">
												{exam.title}
											</h3>
											<Badge
												className={`font-normal rounded-md border text-xs px-2.5 py-0.5 ${getStatusColor(exam.status)} shadow-none`}
											>
												{statusMap[exam.status] ||
													exam.status}
											</Badge>
										</div>
										<div className="text-sm text-slate-500 flex items-center gap-2">
											{exam.description && (
												<>
													<span>
														{exam.description}
													</span>
													<span className="w-1 h-1 rounded-full bg-slate-300" />
												</>
											)}
											<span>
												{new Date(
													exam.createdAt,
												).toLocaleDateString("id-ID")}
											</span>
										</div>
									</div>

									{/* Stats & Actions */}
									<div className="flex items-center border-t md:border-t-0 md:border-l border-slate-100 bg-slate-50/30 md:bg-transparent">
										<div className="flex flex-1 md:flex-none items-center justify-around md:justify-end gap-8 px-6 py-4 md:py-0">
											<div className="text-center">
												<div className="text-xl font-bold text-slate-900">
													{examScores[exam.id]
														?.submissions ?? "-"}
												</div>
												<div className="text-xs text-slate-400 font-medium uppercase tracking-wide">
													Pengumpulan
												</div>
											</div>
											<div className="text-center w-20">
												<div
													className={`text-xl font-bold ${
														examScores[exam.id]
															?.average &&
														examScores[exam.id]
															.average! >= 75
															? "text-green-600"
															: "text-sky-600"
													}`}
												>
													{examScores[
														exam.id
													]?.average?.toFixed(1) ??
														"-"}
												</div>
												<div className="text-xs text-slate-400 font-medium uppercase tracking-wide">
													Rata-rata
												</div>
											</div>
										</div>

										<div className="flex items-center gap-2 pr-6 pl-2 py-4 md:py-0 border-l border-slate-100 md:border-none">
											<Link href={`/scoring/${exam.id}`}>
												<Button
													variant="outline"
													size="sm"
													className="bg-white hover:bg-slate-50 text-slate-600 border-slate-200"
												>
													<Eye className="h-4 w-4 mr-2" />
													Review
												</Button>
											</Link>

											{exam.status === "ONGOING" && (
												<Button
													size="sm"
													className={`shadow-sm shadow-sky-200 ${
														examScores[exam.id]
															?.scored > 0 &&
														examScores[exam.id]
															?.scored >=
															examScores[exam.id]
																?.submissions
															? "bg-green-500 hover:bg-green-600 text-white"
															: "bg-sky-500 hover:bg-sky-600 text-white"
													}`}
													onClick={() =>
														handleOpenAiDialog(exam)
													}
													disabled={
														examScores[exam.id]
															?.scored > 0 &&
														examScores[exam.id]
															?.scored >=
															examScores[exam.id]
																?.submissions
													}
												>
													{examScores[exam.id]
														?.scored > 0 &&
													examScores[exam.id]
														?.scored >=
														examScores[exam.id]
															?.submissions ? (
														<>
															<CheckCircle className="h-3.5 w-3.5 mr-2" />
															Sudah Dinilai
														</>
													) : (
														<>
															<Sparkles className="h-3.5 w-3.5 mr-2" />
															Nilai AI
														</>
													)}
												</Button>
											)}
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}

			{/* AI Grading Dialog */}
			<Dialog
				open={!!selectedExam}
				onOpenChange={(open) =>
					!open && !isGrading && setSelectedExam(null)
				}
			>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							Penilaian Otomatis dengan AI
						</DialogTitle>
						<DialogDescription>
							AI akan menilai semua jawaban essay siswa
							menggunakan analisis semantik
						</DialogDescription>
					</DialogHeader>
					{selectedExam && (
						<div className="grid gap-4 py-4">
							<div className="rounded-lg bg-slate-50 p-4 space-y-2">
								<div className="flex justify-between text-sm">
									<span className="text-slate-500">
										Ujian:
									</span>
									<span className="font-medium text-slate-900">
										{selectedExam.title}
									</span>
								</div>
								<div className="flex justify-between text-sm">
									<span className="text-slate-500">
										Pengumpulan:
									</span>
									<span className="font-medium text-slate-900">
										{examScores[selectedExam.id]
											?.submissions ?? 0}{" "}
										siswa
									</span>
								</div>
							</div>
						</div>
					)}
					<DialogFooter>
						<Button
							className="w-full bg-sky-500 hover:bg-sky-600 text-white"
							onClick={handleStartGrading}
							disabled={isGrading}
						>
							{isGrading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Menilai...
								</>
							) : (
								<>
									<Sparkles className="mr-2 h-4 w-4" />
									Mulai Penilaian AI
								</>
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
