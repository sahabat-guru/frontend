"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
	ArrowLeft,
	CheckCircle,
	XCircle,
	Trophy,
	Brain,
	FileText,
	Loader2,
	ChevronLeft,
	ChevronRight,
	Lightbulb,
	AlertTriangle,
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Question {
	id: string;
	type: "PG" | "ESSAY";
	question: string;
	options?: Record<string, string>;
	answerKey?: string;
}

interface Answer {
	id: string;
	questionId: string;
	answerText?: string;
	answerFileUrl?: string;
	aiScore: number | null;
	finalScore: number | null;
	feedback: string | null;
	status: string;
	question: Question;
}

interface AIFeedback {
	overall: string;
	strengths: string[];
	improvements: string[];
	rubric_breakdown?: Record<string, number>;
	total_points?: number;
	max_points?: number;
}

interface ExamResult {
	exam: {
		id: string;
		title: string;
		description?: string;
	};
	participant: {
		score: number | null;
		submitTime?: string;
	};
	answers: Answer[];
}

export default function ExamResultsPage() {
	const params = useParams();
	const router = useRouter();
	const examId = params?.examId as string;
	const { toast } = useToast();

	const [loading, setLoading] = useState(true);
	const [result, setResult] = useState<ExamResult | null>(null);
	const [currentIndex, setCurrentIndex] = useState(0);

	const loadResults = useCallback(async () => {
		try {
			setLoading(true);

			// Get exam details
			const examRes = await api.get<{ success: boolean; data: any }>(
				`/exams/${examId}`,
			);

			// Get participant's answers
			const statusRes = await api.get<{ success: boolean; data: any }>(
				`/exams/${examId}/status`,
			);

			if (examRes.data.success && statusRes.data.success) {
				const examData = examRes.data.data;
				const statusData = statusRes.data.data;

				setResult({
					exam: {
						id: examData.id,
						title: examData.title,
						description: examData.description,
					},
					participant: {
						score: statusData.participant?.score,
						submitTime: statusData.participant?.submitTime,
					},
					answers: statusData.answers || [],
				});
			}
		} catch (error) {
			console.error("Failed to load results:", error);
			toast({
				title: "Gagal memuat hasil",
				description: "Silakan coba lagi",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	}, [examId, toast]);

	useEffect(() => {
		if (examId) {
			loadResults();
		}
	}, [examId, loadResults]);

	const parseFeedback = (feedbackStr: string | null): AIFeedback | null => {
		if (!feedbackStr) return null;
		try {
			return JSON.parse(feedbackStr);
		} catch {
			return null;
		}
	};

	const getScoreColor = (score: number | null) => {
		if (score === null) return "text-gray-500";
		if (score >= 80) return "text-green-600";
		if (score >= 60) return "text-yellow-600";
		return "text-red-600";
	};

	const getScoreBg = (score: number | null) => {
		if (score === null) return "bg-gray-100";
		if (score >= 80) return "bg-green-50 border-green-200";
		if (score >= 60) return "bg-yellow-50 border-yellow-200";
		return "bg-red-50 border-red-200";
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[calc(100vh-100px)]">
				<div className="text-center">
					<Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
					<p className="text-muted-foreground">
						Memuat hasil ujian...
					</p>
				</div>
			</div>
		);
	}

	if (!result) {
		return (
			<div className="flex items-center justify-center min-h-[calc(100vh-100px)]">
				<Card>
					<CardContent className="p-8 text-center">
						<h3 className="text-lg font-semibold mb-2">
							Hasil Tidak Ditemukan
						</h3>
						<p className="text-muted-foreground mb-4">
							Hasil ujian yang Anda cari tidak tersedia.
						</p>
						<Button onClick={() => router.push("/exams")}>
							Kembali ke Daftar Ujian
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	const currentAnswer = result.answers[currentIndex];
	const currentFeedback = currentAnswer
		? parseFeedback(currentAnswer.feedback)
		: null;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => router.back()}
					>
						<ArrowLeft className="h-5 w-5" />
					</Button>
					<div>
						<h2 className="text-2xl font-bold">
							{result.exam.title}
						</h2>
						<p className="text-muted-foreground">
							Hasil & Feedback AI
						</p>
					</div>
				</div>

				{/* Overall Score */}
				<Card
					className={`border-2 ${getScoreBg(result.participant.score)}`}
				>
					<CardContent className="p-4 flex items-center gap-4">
						<Trophy
							className={`h-8 w-8 ${getScoreColor(result.participant.score)}`}
						/>
						<div>
							<p className="text-sm text-muted-foreground">
								Nilai Akhir
							</p>
							<p
								className={`text-3xl font-bold ${getScoreColor(result.participant.score)}`}
							>
								{result.participant.score?.toFixed(0) || "-"}
							</p>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Progress Bar */}
			<div className="space-y-2">
				<div className="flex justify-between text-sm text-muted-foreground">
					<span>
						Soal {currentIndex + 1} dari {result.answers.length}
					</span>
					<span>
						{
							result.answers.filter(
								(a) =>
									a.finalScore !== null && a.finalScore >= 60,
							).length
						}{" "}
						benar
					</span>
				</div>
				<Progress
					value={((currentIndex + 1) / result.answers.length) * 100}
					className="h-2"
				/>
			</div>

			{/* Question Navigation */}
			<div className="flex gap-2 flex-wrap">
				{result.answers.map((answer, idx) => (
					<Button
						key={answer.id}
						variant={currentIndex === idx ? "default" : "outline"}
						size="sm"
						className={`w-10 h-10 p-0 ${
							answer.finalScore !== null &&
							answer.finalScore >= 60
								? "border-green-400"
								: answer.finalScore !== null
									? "border-red-400"
									: ""
						}`}
						onClick={() => setCurrentIndex(idx)}
					>
						{idx + 1}
					</Button>
				))}
			</div>

			{/* Current Question & Answer */}
			{currentAnswer && (
				<div className="grid gap-6 lg:grid-cols-2">
					{/* Question & Answer Section */}
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<Badge variant="secondary">
									{currentAnswer.question.type === "PG"
										? "Pilihan Ganda"
										: "Essay"}
								</Badge>
								<Badge
									className={
										currentAnswer.finalScore !== null &&
										currentAnswer.finalScore >= 60
											? "bg-green-500"
											: "bg-red-500"
									}
								>
									{currentAnswer.finalScore !== null
										? `${currentAnswer.finalScore.toFixed(0)} poin`
										: "Belum dinilai"}
								</Badge>
							</div>
							<CardTitle className="text-lg mt-2">
								{currentAnswer.question.question}
							</CardTitle>
						</CardHeader>

						<CardContent className="space-y-4">
							{/* Options for PG */}
							{currentAnswer.question.type === "PG" &&
								currentAnswer.question.options && (
									<div className="space-y-2">
										{Object.entries(
											currentAnswer.question.options,
										).map(([key, value]) => {
											const isSelected =
												currentAnswer.answerText?.toLowerCase() ===
												key.toLowerCase();
											const isCorrect =
												currentAnswer.question.answerKey?.toLowerCase() ===
												key.toLowerCase();

											return (
												<div
													key={key}
													className={`p-3 rounded-lg border-2 flex items-center gap-3 ${
														isCorrect
															? "border-green-500 bg-green-50"
															: isSelected
																? "border-red-500 bg-red-50"
																: "border-gray-200"
													}`}
												>
													{isCorrect ? (
														<CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
													) : isSelected ? (
														<XCircle className="h-5 w-5 text-red-600 shrink-0" />
													) : (
														<div className="w-5 h-5 rounded-full border-2 border-gray-300 shrink-0" />
													)}
													<span
														className={
															isCorrect
																? "text-green-800 font-medium"
																: isSelected
																	? "text-red-800"
																	: ""
														}
													>
														{key}. {value}
													</span>
												</div>
											);
										})}
									</div>
								)}

							{/* Essay Answer */}
							{currentAnswer.question.type === "ESSAY" && (
								<div className="space-y-3">
									<div>
										<p className="text-sm font-medium text-muted-foreground mb-1">
											Jawaban Anda:
										</p>
										<div className="p-4 bg-muted rounded-lg">
											<p className="whitespace-pre-wrap">
												{currentAnswer.answerText ||
													"Tidak ada jawaban"}
											</p>
										</div>
									</div>

									{currentAnswer.question.answerKey && (
										<div>
											<p className="text-sm font-medium text-green-600 mb-1">
												Kunci Jawaban:
											</p>
											<div className="p-4 bg-green-50 border border-green-200 rounded-lg">
												<p className="whitespace-pre-wrap text-green-800">
													{
														currentAnswer.question
															.answerKey
													}
												</p>
											</div>
										</div>
									)}
								</div>
							)}
						</CardContent>
					</Card>

					{/* AI Feedback Section */}
					<Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50/50 to-indigo-50/50">
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-purple-700">
								<Brain className="h-5 w-5" />
								Feedback AI
							</CardTitle>
						</CardHeader>

						<CardContent className="space-y-4">
							{currentFeedback ? (
								<>
									{/* Overall Feedback */}
									<div className="p-4 bg-white rounded-lg border">
										<p className="text-sm font-medium text-muted-foreground mb-1">
											Ringkasan
										</p>
										<p>{currentFeedback.overall}</p>
									</div>

									{/* Strengths */}
									{currentFeedback.strengths &&
										currentFeedback.strengths.length >
											0 && (
											<div className="p-4 bg-green-50 rounded-lg border border-green-200">
												<p className="text-sm font-medium text-green-700 mb-2 flex items-center gap-1">
													<Lightbulb className="h-4 w-4" />
													Kelebihan
												</p>
												<ul className="list-disc list-inside space-y-1 text-green-800">
													{currentFeedback.strengths.map(
														(s, i) => (
															<li key={i}>{s}</li>
														),
													)}
												</ul>
											</div>
										)}

									{/* Improvements */}
									{currentFeedback.improvements &&
										currentFeedback.improvements.length >
											0 && (
											<div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
												<p className="text-sm font-medium text-amber-700 mb-2 flex items-center gap-1">
													<AlertTriangle className="h-4 w-4" />
													Perlu Diperbaiki
												</p>
												<ul className="list-disc list-inside space-y-1 text-amber-800">
													{currentFeedback.improvements.map(
														(s, i) => (
															<li key={i}>{s}</li>
														),
													)}
												</ul>
											</div>
										)}

									{/* Rubric Breakdown */}
									{currentFeedback.rubric_breakdown && (
										<div className="p-4 bg-white rounded-lg border">
											<p className="text-sm font-medium text-muted-foreground mb-2">
												Breakdown Penilaian
											</p>
											<div className="space-y-2">
												{Object.entries(
													currentFeedback.rubric_breakdown,
												).map(([key, value]) => (
													<div
														key={key}
														className="flex justify-between items-center"
													>
														<span className="capitalize">
															{key.replace(
																/_/g,
																" ",
															)}
														</span>
														<Badge variant="outline">
															{value} poin
														</Badge>
													</div>
												))}
											</div>
										</div>
									)}
								</>
							) : (
								<div className="text-center py-8 text-muted-foreground">
									<FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
									<p>Tidak ada feedback AI tersedia</p>
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			)}

			{/* Navigation Buttons */}
			<div className="flex justify-between">
				<Button
					variant="outline"
					onClick={() =>
						setCurrentIndex((prev) => Math.max(0, prev - 1))
					}
					disabled={currentIndex === 0}
				>
					<ChevronLeft className="h-4 w-4 mr-2" />
					Sebelumnya
				</Button>

				<Button
					onClick={() =>
						setCurrentIndex((prev) =>
							Math.min(result.answers.length - 1, prev + 1),
						)
					}
					disabled={currentIndex === result.answers.length - 1}
				>
					Selanjutnya
					<ChevronRight className="h-4 w-4 ml-2" />
				</Button>
			</div>
		</div>
	);
}
