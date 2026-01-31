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
	BarChart3,
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
import { analyticsApi, type ExamAnalytics } from "@/lib/analytics-api";
import { useToast } from "@/hooks/use-toast";
import {
	ResponsiveContainer,
	BarChart,
	Bar,
	XAxis,
	YAxis,
	Tooltip,
} from "recharts";

// Map backend status to display status
const statusMap: Record<string, string> = {
	DRAFT: "Draft",
	ONGOING: "Aktif",
	FINISHED: "Selesai",
	PUBLISHED: "Dipublikasi",
};

export default function ScoringPage() {
	const { toast } = useToast();
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
	const [analyticsModalOpen, setAnalyticsModalOpen] = useState(false);
	const [analyticsData, setAnalyticsData] = useState<ExamAnalytics | null>(
		null,
	);
	const [loadingAnalytics, setLoadingAnalytics] = useState(false);
	const [analyticsExamTitle, setAnalyticsExamTitle] = useState("");
	const [triggeredExams, setTriggeredExams] = useState<Set<string>>(
		new Set(),
	);

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
			case "PUBLISHED":
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
		// Only allow AI scoring when exam is FINISHED
		if (exam.status !== "FINISHED") {
			toast({
				title: "Tidak dapat menilai",
				description:
					"Penilaian AI hanya dapat dilakukan setelah ujian selesai (status: Selesai)",
				variant: "destructive",
			});
			return;
		}
		setSelectedExam(exam);
	};

	const handleStartGrading = async () => {
		if (!selectedExam) return;

		setIsGrading(true);
		try {
			await scoringApi.triggerScoring(selectedExam.id);
			// Refresh data after scoring
			await fetchExams();
			// Show success toast
			toast({
				title: "Penilaian sedang diproses",
				description:
					"Silahkan tunggu beberapa saat untuk hasil penilaian",
			});
			// Mark this exam as triggered so button stays disabled
			setTriggeredExams((prev) => new Set(prev).add(selectedExam.id));
			// Close modal after success
			setSelectedExam(null);
		} catch (err) {
			console.error("Scoring failed:", err);
			toast({
				title: "Penilaian gagal",
				description:
					"Terjadi kesalahan saat menilai jawaban. Silakan coba lagi.",
				variant: "destructive",
			});
		} finally {
			setIsGrading(false);
			setSelectedExam(null);
		}
	};

	const handleOpenAnalytics = async (exam: ExamListItem) => {
		setAnalyticsExamTitle(exam.title);
		setAnalyticsModalOpen(true);
		setLoadingAnalytics(true);
		setAnalyticsData(null);

		try {
			const data = await analyticsApi.getExamAnalytics(exam.id);
			setAnalyticsData(data);
		} catch (err) {
			console.error("Failed to fetch analytics:", err);
			toast({
				title: "Gagal memuat analytics",
				description: "Terjadi kesalahan saat memuat data analytics.",
				variant: "destructive",
			});
			setAnalyticsModalOpen(false);
		} finally {
			setLoadingAnalytics(false);
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

											<Button
												variant="outline"
												size="sm"
												className="bg-white hover:bg-purple-50 text-purple-600 border-purple-200"
												onClick={() =>
													handleOpenAnalytics(exam)
												}
											>
												<BarChart3 className="h-4 w-4 mr-2" />
												Analytics
											</Button>

											{exam.status === "FINISHED" && (
												<Button
													size="sm"
													className={`shadow-sm shadow-sky-200 ${
														triggeredExams.has(
															exam.id,
														)
															? "bg-amber-500 hover:bg-amber-600 text-white"
															: examScores[
																		exam.id
																  ]?.scored >
																		0 &&
																  examScores[
																		exam.id
																  ]?.scored >=
																		examScores[
																			exam
																				.id
																		]
																			?.submissions
																? "bg-green-500 hover:bg-green-600 text-white"
																: "bg-sky-500 hover:bg-sky-600 text-white"
													}`}
													onClick={() =>
														handleOpenAiDialog(exam)
													}
													disabled={
														triggeredExams.has(
															exam.id,
														) ||
														(examScores[exam.id]
															?.scored > 0 &&
															examScores[exam.id]
																?.scored >=
																examScores[
																	exam.id
																]?.submissions)
													}
												>
													{triggeredExams.has(
														exam.id,
													) ? (
														<>
															<Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
															Sedang Diproses
														</>
													) : examScores[exam.id]
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
				<DialogContent
					className="sm:max-w-[425px]"
					onPointerDownOutside={(e) =>
						isGrading && e.preventDefault()
					}
					onEscapeKeyDown={(e) => isGrading && e.preventDefault()}
				>
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

			{/* Analytics Modal */}
			<Dialog
				open={analyticsModalOpen}
				onOpenChange={setAnalyticsModalOpen}
			>
				<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<BarChart3 className="h-5 w-5 text-purple-600" />
							Analytics: {analyticsExamTitle}
						</DialogTitle>
						<DialogDescription>
							Statistik dan distribusi nilai ujian
						</DialogDescription>
					</DialogHeader>

					{loadingAnalytics ? (
						<div className="flex items-center justify-center py-12">
							<Loader2 className="h-8 w-8 animate-spin text-purple-500" />
						</div>
					) : analyticsData ? (
						<div className="space-y-6">
							{/* Stats Grid */}
							<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
								<div className="bg-sky-50 rounded-lg p-3 text-center">
									<p className="text-xl font-bold text-sky-600">
										{analyticsData.statistics.avgScore.toFixed(
											1,
										)}
									</p>
									<p className="text-xs text-slate-500">
										Rata-rata
									</p>
								</div>
								<div className="bg-green-50 rounded-lg p-3 text-center">
									<p className="text-xl font-bold text-green-600">
										{analyticsData.statistics.maxScore}
									</p>
									<p className="text-xs text-slate-500">
										Tertinggi
									</p>
								</div>
								<div className="bg-red-50 rounded-lg p-3 text-center">
									<p className="text-xl font-bold text-red-600">
										{analyticsData.statistics.minScore}
									</p>
									<p className="text-xs text-slate-500">
										Terendah
									</p>
								</div>
								<div className="bg-amber-50 rounded-lg p-3 text-center">
									<p className="text-xl font-bold text-amber-600">
										{
											analyticsData.statistics
												.completionRate
										}
										%
									</p>
									<p className="text-xs text-slate-500">
										Penyelesaian
									</p>
								</div>
								<div className="bg-purple-50 rounded-lg p-3 text-center">
									<p className="text-xl font-bold text-purple-600">
										{analyticsData.statistics.scoredCount}
									</p>
									<p className="text-xs text-slate-500">
										Dinilai
									</p>
								</div>
								<div className="bg-slate-50 rounded-lg p-3 text-center">
									<p className="text-xl font-bold text-slate-600">
										{
											analyticsData.statistics
												.totalParticipants
										}
									</p>
									<p className="text-xs text-slate-500">
										Peserta
									</p>
								</div>
							</div>

							{/* Score Distribution Chart */}
							<div className="bg-white border rounded-xl p-4">
								<h4 className="font-semibold text-slate-700 mb-3">
									Distribusi Nilai
								</h4>
								<div className="h-[200px] w-full">
									<ResponsiveContainer
										width="100%"
										height="100%"
									>
										<BarChart
											data={Object.entries(
												analyticsData.scoreDistribution,
											).map(([range, count]) => ({
												range,
												count,
											}))}
										>
											<XAxis
												dataKey="range"
												fontSize={10}
												tickLine={false}
												axisLine={false}
											/>
											<YAxis
												fontSize={12}
												tickLine={false}
												axisLine={false}
											/>
											<Tooltip />
											<Bar
												dataKey="count"
												fill="#3B82F6"
												radius={[4, 4, 0, 0]}
											/>
										</BarChart>
									</ResponsiveContainer>
								</div>
							</div>

							{/* Proctoring Violations */}
							{analyticsData.proctoringViolations.length > 0 && (
								<div className="bg-white border rounded-xl p-4">
									<h4 className="font-semibold text-slate-700 mb-3">
										Pelanggaran Proctoring (
										{analyticsData.suspiciousCount}{" "}
										mencurigakan)
									</h4>
									<div className="h-[150px] w-full">
										<ResponsiveContainer
											width="100%"
											height="100%"
										>
											<BarChart
												data={analyticsData.proctoringViolations.map(
													(v) => ({
														name: v.eventType
															.replace(/_/g, " ")
															.slice(0, 12),
														count: Number(v.count),
													}),
												)}
												layout="vertical"
											>
												<XAxis
													type="number"
													fontSize={12}
												/>
												<YAxis
													dataKey="name"
													type="category"
													fontSize={10}
													tickLine={false}
													axisLine={false}
													width={100}
												/>
												<Tooltip />
												<Bar
													dataKey="count"
													fill="#EF4444"
													radius={[0, 4, 4, 0]}
												/>
											</BarChart>
										</ResponsiveContainer>
									</div>
								</div>
							)}
						</div>
					) : null}
				</DialogContent>
			</Dialog>
		</div>
	);
}
