"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, FileText, Users, Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";
import { scoringApi, ExamListItem } from "@/lib/scoring-api";
import { useToast } from "@/hooks/use-toast";

export default function ExamsListPage() {
	const [exams, setExams] = useState<ExamListItem[]>([]);
	const [loading, setLoading] = useState(true);
	const { toast } = useToast();

	useEffect(() => {
		loadOngoingExams();
	}, []);

	const loadOngoingExams = async () => {
		try {
			setLoading(true);
			const { exams: examsList } = await scoringApi.getExams({
				status: "ONGOING",
			});
			setExams(examsList);
		} catch (error) {
			console.error("Failed to load exams:", error);
			toast({
				title: "Gagal memuat ujian",
				description: "Silakan coba lagi atau hubungi guru",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	const formatDate = (dateString?: string) => {
		if (!dateString) return "-";
		return new Date(dateString).toLocaleDateString("id-ID", {
			day: "numeric",
			month: "long",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const formatDuration = (minutes?: number) => {
		if (!minutes) return "-";
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		if (hours > 0) {
			return `${hours} jam ${mins > 0 ? `${mins} menit` : ""}`;
		}
		return `${mins} menit`;
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[calc(100vh-100px)]">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
					<p className="text-muted-foreground">Memuat ujian...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-3xl font-bold tracking-tight">Ujian Berlangsung</h2>
				<p className="text-muted-foreground">
					Pilih ujian yang ingin Anda kerjakan
				</p>
			</div>

			{exams.length === 0 ? (
				<Card className="border-dashed">
					<CardContent className="flex flex-col items-center justify-center py-12">
						<FileText className="h-16 w-16 text-muted-foreground/50 mb-4" />
						<h3 className="text-lg font-semibold mb-2">Tidak Ada Ujian</h3>
						<p className="text-muted-foreground text-center max-w-md">
							Saat ini tidak ada ujian yang sedang berlangsung. Silakan cek kembali nanti.
						</p>
					</CardContent>
				</Card>
			) : (
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
					{exams.map((exam) => (
						<Card
							key={exam.id}
							className="flex flex-col hover:shadow-lg transition-shadow border-2 hover:border-primary/50"
						>
							<CardHeader>
								<div className="flex items-start justify-between mb-2">
									<Badge className="bg-green-500 hover:bg-green-600">
										Sedang Berlangsung
									</Badge>
									{exam.duration && (
										<div className="flex items-center gap-1 text-sm text-muted-foreground">
											<Clock className="h-4 w-4" />
											{formatDuration(exam.duration)}
										</div>
									)}
								</div>
								<CardTitle className="text-2xl">{exam.title}</CardTitle>
								{exam.description && (
									<CardDescription className="text-base mt-2">
										{exam.description}
									</CardDescription>
								)}
							</CardHeader>

							<CardContent className="flex-1 space-y-4">
								<div className="grid gap-3">
									{exam.startTime && (
										<div className="flex items-center gap-2 text-sm">
											<Calendar className="h-4 w-4 text-muted-foreground" />
											<span className="text-muted-foreground">Mulai:</span>
											<span className="font-medium">
												{formatDate(exam.startTime)}
											</span>
										</div>
									)}

									{exam.endTime && (
										<div className="flex items-center gap-2 text-sm">
											<Calendar className="h-4 w-4 text-muted-foreground" />
											<span className="text-muted-foreground">Berakhir:</span>
											<span className="font-medium">
												{formatDate(exam.endTime)}
											</span>
										</div>
									)}

									{exam.stats && (
										<div className="flex items-center gap-2 text-sm">
											<Users className="h-4 w-4 text-muted-foreground" />
											<span className="text-muted-foreground">Peserta:</span>
											<span className="font-medium">
												{exam.stats.submitted}/{exam.stats.total} telah mengumpulkan
											</span>
										</div>
									)}
								</div>

								<div className="pt-4 border-t">
									<Link href={`/exams/${exam.id}`}>
										<Button className="w-full bg-gradient-primary group">
											Mulai Ujian
											<ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
										</Button>
									</Link>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
