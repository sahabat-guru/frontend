"use client";

import { useEffect, useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Clock,
	FileText,
	Users,
	Calendar,
	ArrowRight,
	CheckCircle,
	Trophy,
	Eye,
	Lock,
	Loader2,
} from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface StudentExam {
	id: string;
	title: string;
	description?: string;
	status: "DRAFT" | "ONGOING" | "FINISHED" | "PUBLISHED";
	startTime?: string;
	endTime?: string;
	duration?: number;
	createdAt: string;
	teacher?: {
		id: string;
		name: string;
	};
	participantStatus?: string;
	participantScore?: number | null;
	submitTime?: string;
	answersCount?: number;
}

export default function ExamsListPage() {
	const [activeExams, setActiveExams] = useState<StudentExam[]>([]);
	const [historyExams, setHistoryExams] = useState<StudentExam[]>([]);
	const [publishedExams, setPublishedExams] = useState<StudentExam[]>([]);
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState("active");
	const { toast } = useToast();

	useEffect(() => {
		loadAllExams();
	}, []);

	const loadAllExams = async () => {
		try {
			setLoading(true);

			// Fetch available ongoing exams (public listing)
			const [availableRes, historyRes, publishedRes] = await Promise.all([
				api.get<{ success: boolean; data: StudentExam[] }>("/exams", {
					params: { status: "ONGOING" },
				}),
				api.get<{ success: boolean; data: StudentExam[] }>(
					"/exams/my-exams?status=FINISHED",
				),
				api.get<{ success: boolean; data: StudentExam[] }>(
					"/exams/my-exams?status=PUBLISHED",
				),
			]);

			setActiveExams(availableRes.data.data || []);
			setHistoryExams(historyRes.data.data || []);
			setPublishedExams(publishedRes.data.data || []);
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

	const isExamStartable = (exam: StudentExam) => {
		if (!exam.startTime) return true;
		const now = new Date();
		const start = new Date(exam.startTime);
		return now >= start;
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[calc(100vh-100px)]">
				<div className="text-center">
					<Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
					<p className="text-muted-foreground">Memuat ujian...</p>
				</div>
			</div>
		);
	}

	const renderActiveExamCard = (exam: StudentExam) => {
		const canStart = isExamStartable(exam);

		return (
			<Card
				key={exam.id}
				className={`flex flex-col transition-all ${
					canStart
						? "hover:shadow-lg border-2 hover:border-primary/50"
						: "opacity-60 bg-muted/30"
				}`}
			>
				<CardHeader>
					<div className="flex items-start justify-between mb-2">
						{canStart ? (
							<Badge className="bg-green-500 hover:bg-green-600">
								Sedang Berlangsung
							</Badge>
						) : (
							<Badge variant="secondary" className="gap-1">
								<Lock className="h-3 w-3" />
								Segera Hadir
							</Badge>
						)}
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
								<span className="text-muted-foreground">
									Mulai:
								</span>
								<span className="font-medium">
									{formatDate(exam.startTime)}
								</span>
							</div>
						)}

						{exam.endTime && (
							<div className="flex items-center gap-2 text-sm">
								<Calendar className="h-4 w-4 text-muted-foreground" />
								<span className="text-muted-foreground">
									Berakhir:
								</span>
								<span className="font-medium">
									{formatDate(exam.endTime)}
								</span>
							</div>
						)}

						{exam.teacher && (
							<div className="flex items-center gap-2 text-sm">
								<Users className="h-4 w-4 text-muted-foreground" />
								<span className="text-muted-foreground">
									Guru:
								</span>
								<span className="font-medium">
									{exam.teacher.name}
								</span>
							</div>
						)}
					</div>

					<div className="pt-4 border-t">
						{canStart ? (
							<Link href={`/exams/${exam.id}`}>
								<Button className="w-full bg-gradient-primary group">
									Mulai Ujian
									<ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
								</Button>
							</Link>
						) : (
							<Button disabled className="w-full">
								<Lock className="mr-2 h-4 w-4" />
								Belum Dimulai
							</Button>
						)}
					</div>
				</CardContent>
			</Card>
		);
	};

	const renderHistoryExamCard = (exam: StudentExam) => (
		<Card
			key={exam.id}
			className="flex flex-col border-2 border-blue-200/50"
		>
			<CardHeader>
				<div className="flex items-start justify-between mb-2">
					<Badge
						variant="secondary"
						className="bg-blue-100 text-blue-700"
					>
						<CheckCircle className="h-3 w-3 mr-1" />
						Selesai
					</Badge>
					{exam.duration && (
						<div className="flex items-center gap-1 text-sm text-muted-foreground">
							<Clock className="h-4 w-4" />
							{formatDuration(exam.duration)}
						</div>
					)}
				</div>
				<CardTitle className="text-xl">{exam.title}</CardTitle>
				{exam.description && (
					<CardDescription className="mt-1">
						{exam.description}
					</CardDescription>
				)}
			</CardHeader>

			<CardContent className="flex-1 space-y-3">
				{exam.submitTime && (
					<div className="flex items-center gap-2 text-sm">
						<Calendar className="h-4 w-4 text-muted-foreground" />
						<span className="text-muted-foreground">
							Dikumpulkan:
						</span>
						<span className="font-medium">
							{formatDate(exam.submitTime)}
						</span>
					</div>
				)}

				{exam.answersCount !== undefined && (
					<div className="flex items-center gap-2 text-sm">
						<FileText className="h-4 w-4 text-muted-foreground" />
						<span className="text-muted-foreground">Jawaban:</span>
						<span className="font-medium">
							{exam.answersCount} soal
						</span>
					</div>
				)}

				<div className="pt-3 border-t">
					<p className="text-sm text-muted-foreground text-center">
						Menunggu penilaian guru
					</p>
				</div>
			</CardContent>
		</Card>
	);

	const renderPublishedExamCard = (exam: StudentExam) => (
		<Card
			key={exam.id}
			className="flex flex-col border-2 border-purple-200/50 hover:shadow-lg transition-shadow"
		>
			<CardHeader>
				<div className="flex items-start justify-between mb-2">
					<Badge className="bg-purple-500 hover:bg-purple-600">
						<Trophy className="h-3 w-3 mr-1" />
						Hasil Tersedia
					</Badge>
					{exam.participantScore !== null &&
						exam.participantScore !== undefined && (
							<div className="text-2xl font-bold text-purple-600">
								{exam.participantScore.toFixed(0)}
							</div>
						)}
				</div>
				<CardTitle className="text-xl">{exam.title}</CardTitle>
				{exam.description && (
					<CardDescription className="mt-1">
						{exam.description}
					</CardDescription>
				)}
			</CardHeader>

			<CardContent className="flex-1 space-y-3">
				{exam.submitTime && (
					<div className="flex items-center gap-2 text-sm">
						<Calendar className="h-4 w-4 text-muted-foreground" />
						<span className="text-muted-foreground">
							Dikumpulkan:
						</span>
						<span className="font-medium">
							{formatDate(exam.submitTime)}
						</span>
					</div>
				)}

				<div className="pt-4 border-t">
					<Link href={`/exams/${exam.id}/results`}>
						<Button className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:opacity-90 text-white group">
							<Eye className="mr-2 h-4 w-4" />
							Lihat Hasil & Feedback
							<ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
						</Button>
					</Link>
				</div>
			</CardContent>
		</Card>
	);

	const EmptyState = ({
		icon: Icon,
		message,
	}: {
		icon: React.ElementType;
		message: string;
	}) => (
		<Card className="border-dashed">
			<CardContent className="flex flex-col items-center justify-center py-12">
				<Icon className="h-16 w-16 text-muted-foreground/50 mb-4" />
				<p className="text-muted-foreground text-center max-w-md">
					{message}
				</p>
			</CardContent>
		</Card>
	);

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-3xl font-bold tracking-tight">Ujian</h2>
				<p className="text-muted-foreground">
					Lihat ujian aktif, riwayat, dan hasil penilaian
				</p>
			</div>

			<Tabs
				value={activeTab}
				onValueChange={setActiveTab}
				className="w-full"
			>
				<TabsList className="grid w-full grid-cols-3">
					<TabsTrigger value="active" className="gap-2">
						<FileText className="h-4 w-4" />
						Aktif
						{activeExams.length > 0 && (
							<Badge variant="secondary" className="ml-1">
								{activeExams.length}
							</Badge>
						)}
					</TabsTrigger>
					<TabsTrigger value="history" className="gap-2">
						<CheckCircle className="h-4 w-4" />
						Riwayat
						{historyExams.length > 0 && (
							<Badge variant="secondary" className="ml-1">
								{historyExams.length}
							</Badge>
						)}
					</TabsTrigger>
					<TabsTrigger value="results" className="gap-2">
						<Trophy className="h-4 w-4" />
						Hasil
						{publishedExams.length > 0 && (
							<Badge variant="secondary" className="ml-1">
								{publishedExams.length}
							</Badge>
						)}
					</TabsTrigger>
				</TabsList>

				<TabsContent value="active" className="mt-6">
					{activeExams.length === 0 ? (
						<EmptyState
							icon={FileText}
							message="Saat ini tidak ada ujian yang sedang berlangsung. Silakan cek kembali nanti."
						/>
					) : (
						<div className="grid gap-6 md:grid-cols-2">
							{activeExams.map(renderActiveExamCard)}
						</div>
					)}
				</TabsContent>

				<TabsContent value="history" className="mt-6">
					{historyExams.length === 0 ? (
						<EmptyState
							icon={CheckCircle}
							message="Belum ada ujian yang selesai dikerjakan."
						/>
					) : (
						<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
							{historyExams.map(renderHistoryExamCard)}
						</div>
					)}
				</TabsContent>

				<TabsContent value="results" className="mt-6">
					{publishedExams.length === 0 ? (
						<EmptyState
							icon={Trophy}
							message="Belum ada hasil ujian yang dipublikasikan. Hasil akan muncul setelah guru menyelesaikan penilaian."
						/>
					) : (
						<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
							{publishedExams.map(renderPublishedExamCard)}
						</div>
					)}
				</TabsContent>
			</Tabs>
		</div>
	);
}
