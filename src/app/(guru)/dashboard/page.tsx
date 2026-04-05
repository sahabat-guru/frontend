"use client";

import { useState, useEffect, useCallback } from "react";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Users, BookOpen, Video, Activity, RefreshCw, AlertTriangle } from "lucide-react";
import { analyticsApi, type OverviewAnalytics } from "@/lib/analytics-api";

export default function DashboardPage() {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [overview, setOverview] = useState<OverviewAnalytics | null>(null);

	const fetchOverview = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const data = await analyticsApi.getOverview();
			setOverview(data);
		} catch (err) {
			console.error("Failed to fetch dashboard data:", err);
			setError("Gagal memuat data dashboard");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchOverview();
	}, [fetchOverview]);

	if (loading) {
		return (
			<div className="space-y-6">
				<div>
					<Skeleton className="h-9 w-64" />
					<Skeleton className="h-4 w-96 mt-2" />
				</div>
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					{[1, 2, 3, 4].map((i) => (
						<Card key={i}>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<Skeleton className="h-4 w-24" />
								<Skeleton className="h-4 w-4" />
							</CardHeader>
							<CardContent>
								<Skeleton className="h-8 w-16" />
								<Skeleton className="h-3 w-32 mt-2" />
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex flex-col items-center justify-center h-96">
				<AlertTriangle className="h-12 w-12 mb-4 text-red-500" />
				<p className="text-lg font-medium mb-2">Terjadi Kesalahan</p>
				<p className="text-sm text-muted-foreground mb-4">{error}</p>
				<Button variant="outline" onClick={fetchOverview}>
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
					<h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-green-400 bg-clip-text text-transparent w-fit">
						Teacher Dashboard
					</h2>
					<p className="text-muted-foreground">
						Overview of your classroom activities and material
						generation.
					</p>
				</div>
				<Button variant="outline" size="sm" onClick={fetchOverview}>
					<RefreshCw className="h-4 w-4 mr-2" />
					Refresh
				</Button>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Active Exams
						</CardTitle>
						<Video className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{overview?.examsByStatus?.ONGOING || 0}</div>
						<p className="text-xs text-muted-foreground">
							Ujian yang sedang berlangsung
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Materials Generated
						</CardTitle>
						<BookOpen className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{overview?.summary?.totalMaterials || 0}</div>
						<p className="text-xs text-muted-foreground">
							Total materi pembelajaran
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Total Students
						</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{overview?.summary?.totalStudents || 0}</div>
						<p className="text-xs text-muted-foreground">
							Siswa yang terdaftar
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Rata-rata Nilai
						</CardTitle>
						<Activity className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{overview?.summary?.avgOverallScore?.toFixed(1) || 0}</div>
						<p className="text-xs text-muted-foreground">
							Dari semua ujian
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Recent Activity */}
			<Card className="col-span-4">
				<CardHeader>
					<CardTitle>Aktivitas Terbaru</CardTitle>
					<CardDescription>
						Ujian terbaru yang telah dibuat
					</CardDescription>
				</CardHeader>
				<CardContent>
					{overview?.recentExams && overview.recentExams.length > 0 ? (
						<div className="space-y-4">
							{overview.recentExams.slice(0, 5).map((exam) => (
								<div key={exam.id} className="flex items-center justify-between border-b pb-3 last:border-0">
									<div>
										<p className="font-medium">{exam.title}</p>
										<p className="text-sm text-muted-foreground">
											{exam.participantCount} peserta • Rata-rata: {exam.avgScore?.toFixed(1) || '-'}
										</p>
									</div>
									<Badge variant={
										exam.status === "ONGOING" ? "default" :
										exam.status === "FINISHED" ? "secondary" : "outline"
									}>
										{exam.status}
									</Badge>
								</div>
							))}
						</div>
					) : (
						<p className="text-sm text-muted-foreground">
							Belum ada ujian terbaru
						</p>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
