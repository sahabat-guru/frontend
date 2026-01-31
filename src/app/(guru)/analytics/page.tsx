"use client";

import { useState, useEffect, useCallback } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	ResponsiveContainer,
	AreaChart,
	Area,
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	PieChart,
	Pie,
	Cell,
} from "recharts";
import {
	Loader2,
	Users,
	FileText,
	BookOpen,
	TrendingUp,
	RefreshCw,
	AlertTriangle,
} from "lucide-react";
import {
	analyticsApi,
	type OverviewAnalytics,
	type ExamAnalytics,
} from "@/lib/analytics-api";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export default function AnalyticsPage() {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [overview, setOverview] = useState<OverviewAnalytics | null>(null);
	const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
	const [examAnalytics, setExamAnalytics] = useState<ExamAnalytics | null>(
		null,
	);
	const [loadingExam, setLoadingExam] = useState(false);

	const fetchOverview = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const data = await analyticsApi.getOverview();
			setOverview(data);
			// Select first exam if available
			if (data.recentExams.length > 0 && !selectedExamId) {
				setSelectedExamId(data.recentExams[0].id);
			}
		} catch (err) {
			console.error("Failed to fetch analytics:", err);
			setError("Gagal memuat data analytics");
		} finally {
			setLoading(false);
		}
	}, [selectedExamId]);

	const fetchExamAnalytics = useCallback(async (examId: string) => {
		try {
			setLoadingExam(true);
			const data = await analyticsApi.getExamAnalytics(examId);
			setExamAnalytics(data);
		} catch (err) {
			console.error("Failed to fetch exam analytics:", err);
		} finally {
			setLoadingExam(false);
		}
	}, []);

	useEffect(() => {
		fetchOverview();
	}, [fetchOverview]);

	useEffect(() => {
		if (selectedExamId) {
			fetchExamAnalytics(selectedExamId);
		}
	}, [selectedExamId, fetchExamAnalytics]);

	// Transform data for charts
	const scoreDistributionData = examAnalytics
		? Object.entries(examAnalytics.scoreDistribution).map(
				([range, count]) => ({
					name: range,
					count,
				}),
			)
		: [];

	const violationData = examAnalytics
		? examAnalytics.proctoringViolations.map((v) => ({
				name: v.eventType.replace(/_/g, " ").slice(0, 10),
				count: Number(v.count),
			}))
		: [];

	const performanceData =
		overview?.recentExams
			?.slice()
			.reverse()
			.map((exam) => ({
				name: exam.title.slice(0, 15),
				score: exam.avgScore,
			})) || [];

	const examStatusData = overview
		? Object.entries(overview.examsByStatus).map(([status, count]) => ({
				name: status,
				value: count,
			}))
		: [];

	if (loading) {
		return (
			<div className="flex items-center justify-center h-96">
				<Loader2 className="h-8 w-8 animate-spin text-sky-500" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex flex-col items-center justify-center h-96 text-red-500">
				<AlertTriangle className="h-12 w-12 mb-4" />
				<p>{error}</p>
				<Button
					variant="outline"
					onClick={fetchOverview}
					className="mt-4"
				>
					<RefreshCw className="h-4 w-4 mr-2" />
					Coba Lagi
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-3xl font-bold tracking-tight">
						Classroom Analytics
					</h2>
					<p className="text-muted-foreground">
						Deep insights into exam performance and student
						activity.
					</p>
				</div>
				<Button variant="outline" onClick={fetchOverview}>
					<RefreshCw className="h-4 w-4 mr-2" />
					Refresh
				</Button>
			</div>

			{/* Summary Cards */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Total Ujian
						</CardTitle>
						<FileText className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{overview?.summary.totalExams || 0}
						</div>
						<p className="text-xs text-muted-foreground">
							Ujian yang telah dibuat
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Total Materi
						</CardTitle>
						<BookOpen className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{overview?.summary.totalMaterials || 0}
						</div>
						<p className="text-xs text-muted-foreground">
							Materi pembelajaran
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Total Siswa
						</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{overview?.summary.totalStudents || 0}
						</div>
						<p className="text-xs text-muted-foreground">
							Siswa yang mengikuti ujian
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Rata-rata Nilai
						</CardTitle>
						<TrendingUp className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{overview?.summary.avgOverallScore?.toFixed(1) || 0}
						</div>
						<p className="text-xs text-muted-foreground">
							Dari semua ujian
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Performance Trend & Exam Status */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
				<Card className="col-span-4">
					<CardHeader>
						<CardTitle>Tren Performa Ujian</CardTitle>
						<CardDescription>
							Rata-rata nilai dari ujian terbaru.
						</CardDescription>
					</CardHeader>
					<CardContent className="pl-2">
						<div className="h-[300px] w-full">
							{performanceData.length > 0 ? (
								<ResponsiveContainer width="100%" height="100%">
									<AreaChart data={performanceData}>
										<defs>
											<linearGradient
												id="colorScore"
												x1="0"
												y1="0"
												x2="0"
												y2="1"
											>
												<stop
													offset="5%"
													stopColor="#059669"
													stopOpacity={0.8}
												/>
												<stop
													offset="95%"
													stopColor="#059669"
													stopOpacity={0}
												/>
											</linearGradient>
										</defs>
										<XAxis
											dataKey="name"
											stroke="#888888"
											fontSize={12}
											tickLine={false}
											axisLine={false}
										/>
										<YAxis
											stroke="#888888"
											fontSize={12}
											tickLine={false}
											axisLine={false}
											domain={[0, 100]}
										/>
										<CartesianGrid
											strokeDasharray="3 3"
											vertical={false}
										/>
										<Tooltip />
										<Area
											type="monotone"
											dataKey="score"
											stroke="#059669"
											fillOpacity={1}
											fill="url(#colorScore)"
										/>
									</AreaChart>
								</ResponsiveContainer>
							) : (
								<div className="flex items-center justify-center h-full text-muted-foreground">
									Tidak ada data ujian
								</div>
							)}
						</div>
					</CardContent>
				</Card>

				<Card className="col-span-3">
					<CardHeader>
						<CardTitle>Status Ujian</CardTitle>
						<CardDescription>
							Distribusi status ujian.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="h-[300px] w-full">
							{examStatusData.length > 0 ? (
								<ResponsiveContainer width="100%" height="100%">
									<PieChart>
										<Pie
											data={examStatusData}
											cx="50%"
											cy="50%"
											labelLine={false}
											outerRadius={80}
											fill="#8884d8"
											dataKey="value"
											label={({ name, percent }) =>
												`${name || ""} ${((percent || 0) * 100).toFixed(0)}%`
											}
										>
											{examStatusData.map((_, index) => (
												<Cell
													key={`cell-${index}`}
													fill={
														COLORS[
															index %
																COLORS.length
														]
													}
												/>
											))}
										</Pie>
										<Tooltip />
									</PieChart>
								</ResponsiveContainer>
							) : (
								<div className="flex items-center justify-center h-full text-muted-foreground">
									Tidak ada data
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Exam Detail Analytics */}
			{overview && overview.recentExams.length > 0 && (
				<>
					<div className="flex items-center gap-4">
						<h3 className="text-xl font-semibold">Detail Ujian</h3>
						<Select
							value={selectedExamId || undefined}
							onValueChange={setSelectedExamId}
						>
							<SelectTrigger className="w-[300px]">
								<SelectValue placeholder="Pilih ujian" />
							</SelectTrigger>
							<SelectContent>
								{overview.recentExams.map((exam) => (
									<SelectItem key={exam.id} value={exam.id}>
										{exam.title}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{loadingExam ? (
						<div className="flex items-center justify-center h-48">
							<Loader2 className="h-6 w-6 animate-spin text-sky-500" />
						</div>
					) : examAnalytics ? (
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
							{/* Score Distribution */}
							<Card className="col-span-4">
								<CardHeader>
									<div className="flex items-center justify-between">
										<div>
											<CardTitle>
												Distribusi Nilai
											</CardTitle>
											<CardDescription>
												{examAnalytics.exam.title}
											</CardDescription>
										</div>
										<Badge variant="outline">
											{
												examAnalytics.statistics
													.totalParticipants
											}{" "}
											peserta
										</Badge>
									</div>
								</CardHeader>
								<CardContent>
									<div className="h-[300px] w-full">
										<ResponsiveContainer
											width="100%"
											height="100%"
										>
											<BarChart
												data={scoreDistributionData}
											>
												<XAxis
													dataKey="name"
													stroke="#888888"
													fontSize={10}
													tickLine={false}
													axisLine={false}
												/>
												<YAxis
													stroke="#888888"
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
								</CardContent>
							</Card>

							{/* Proctoring Violations */}
							<Card className="col-span-3">
								<CardHeader>
									<CardTitle>
										Pelanggaran Proctoring
									</CardTitle>
									<CardDescription>
										{examAnalytics.suspiciousCount} siswa
										mencurigakan
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="h-[300px] w-full">
										{violationData.length > 0 ? (
											<ResponsiveContainer
												width="100%"
												height="100%"
											>
												<BarChart
													data={violationData}
													layout="vertical"
												>
													<XAxis type="number" />
													<YAxis
														dataKey="name"
														type="category"
														stroke="#888888"
														fontSize={10}
														tickLine={false}
														axisLine={false}
														width={80}
													/>
													<Tooltip
														cursor={{
															fill: "transparent",
														}}
													/>
													<Bar
														dataKey="count"
														fill="#EF4444"
														radius={[0, 4, 4, 0]}
													/>
												</BarChart>
											</ResponsiveContainer>
										) : (
											<div className="flex items-center justify-center h-full text-muted-foreground">
												Tidak ada pelanggaran
											</div>
										)}
									</div>
								</CardContent>
							</Card>

							{/* Exam Stats */}
							<Card className="col-span-7">
								<CardHeader>
									<CardTitle>Statistik Ujian</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
										<div className="bg-slate-50 rounded-lg p-4 text-center">
											<p className="text-2xl font-bold text-sky-600">
												{examAnalytics.statistics.avgScore.toFixed(
													1,
												)}
											</p>
											<p className="text-xs text-muted-foreground">
												Rata-rata
											</p>
										</div>
										<div className="bg-slate-50 rounded-lg p-4 text-center">
											<p className="text-2xl font-bold text-green-600">
												{
													examAnalytics.statistics
														.maxScore
												}
											</p>
											<p className="text-xs text-muted-foreground">
												Tertinggi
											</p>
										</div>
										<div className="bg-slate-50 rounded-lg p-4 text-center">
											<p className="text-2xl font-bold text-red-600">
												{
													examAnalytics.statistics
														.minScore
												}
											</p>
											<p className="text-xs text-muted-foreground">
												Terendah
											</p>
										</div>
										<div className="bg-slate-50 rounded-lg p-4 text-center">
											<p className="text-2xl font-bold text-amber-600">
												{
													examAnalytics.statistics
														.completionRate
												}
												%
											</p>
											<p className="text-xs text-muted-foreground">
												Penyelesaian
											</p>
										</div>
										<div className="bg-slate-50 rounded-lg p-4 text-center">
											<p className="text-2xl font-bold text-purple-600">
												{
													examAnalytics.statistics
														.scoredCount
												}
											</p>
											<p className="text-xs text-muted-foreground">
												Sudah Dinilai
											</p>
										</div>
										<div className="bg-slate-50 rounded-lg p-4 text-center">
											<p className="text-2xl font-bold text-slate-600">
												{
													examAnalytics.statistics
														.avgCompletionTime
												}{" "}
												min
											</p>
											<p className="text-xs text-muted-foreground">
												Avg. Waktu
											</p>
										</div>
									</div>
								</CardContent>
							</Card>
						</div>
					) : null}
				</>
			)}
		</div>
	);
}
