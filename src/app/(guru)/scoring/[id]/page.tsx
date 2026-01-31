"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
	ChevronLeft,
	ChevronRight,
	Flag,
	CheckCircle,
	AlertCircle,
	Bot,
	Eye,
	EyeOff,
	FileText,
	Loader2,
	ThumbsUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
	scoringApi,
	parseFeedback,
	type ParticipantScore,
	type AnswerDetail,
	type AIFeedback,
	type ExamListItem,
} from "@/lib/scoring-api";

export default function ExamReviewPage() {
	const router = useRouter();
	const params = useParams();
	const examId = params.id as string;

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [exam, setExam] = useState<ExamListItem | null>(null);
	const [participants, setParticipants] = useState<ParticipantScore[]>([]);
	const [selectedParticipantId, setSelectedParticipantId] = useState<
		string | null
	>(null);
	const [answers, setAnswers] = useState<AnswerDetail[]>([]);
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [showAI, setShowAI] = useState(true);
	const [loadingAnswers, setLoadingAnswers] = useState(false);
	const [overrideScore, setOverrideScore] = useState<string>("");
	const [savingScore, setSavingScore] = useState(false);

	// Fetch exam and participants
	const fetchExamData = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);

			const [examData, scoresData] = await Promise.all([
				scoringApi.getExamDetails(examId),
				scoringApi.getExamScores(examId),
			]);

			setExam(examData);
			// Sort participants alphabetically by student name
			const sortedParticipants = scoresData.participants.sort((a, b) =>
				a.student.name.localeCompare(b.student.name),
			);
			setParticipants(sortedParticipants);

			// Select first participant by default
			if (sortedParticipants.length > 0) {
				setSelectedParticipantId(sortedParticipants[0].id);
			}
		} catch (err) {
			setError("Gagal memuat data ujian");
			console.error(err);
		} finally {
			setLoading(false);
		}
	}, [examId]);

	// Fetch participant answers
	const fetchParticipantAnswers = useCallback(
		async (participantId: string) => {
			try {
				setLoadingAnswers(true);
				const data = await scoringApi.getParticipantAnswers(
					examId,
					participantId,
				);
				setAnswers(data.answers);
				setCurrentQuestionIndex(0);
			} catch (err) {
				console.error("Failed to load answers:", err);
			} finally {
				setLoadingAnswers(false);
			}
		},
		[examId],
	);

	useEffect(() => {
		fetchExamData();
	}, [fetchExamData]);

	useEffect(() => {
		if (selectedParticipantId) {
			fetchParticipantAnswers(selectedParticipantId);
		}
	}, [selectedParticipantId, fetchParticipantAnswers]);

	// Current data
	const currentParticipant = participants.find(
		(p) => p.id === selectedParticipantId,
	);
	const currentAnswer = answers[currentQuestionIndex];
	const currentFeedback: AIFeedback | null = currentAnswer
		? parseFeedback(currentAnswer.feedback)
		: null;

	// Update override score when answer changes
	useEffect(() => {
		if (
			currentAnswer &&
			currentAnswer.finalScore !== null &&
			currentAnswer.finalScore !== undefined
		) {
			setOverrideScore(currentAnswer.finalScore.toString());
		} else {
			setOverrideScore("");
		}
	}, [currentAnswer]);

	const handleNext = () => {
		if (currentQuestionIndex < answers.length - 1) {
			setCurrentQuestionIndex((prev) => prev + 1);
		}
	};

	const handlePrev = () => {
		if (currentQuestionIndex > 0) {
			setCurrentQuestionIndex((prev) => prev - 1);
		}
	};

	const handleOverrideScore = async (directScore?: number) => {
		if (!currentAnswer) return;

		const score = directScore ?? parseFloat(overrideScore);
		if (isNaN(score) || score < 0 || score > 100) {
			alert("Skor harus antara 0 dan 100");
			return;
		}

		try {
			setSavingScore(true);
			await scoringApi.overrideScore(currentAnswer.id, {
				finalScore: score,
			});
			// Update local state immediately
			setAnswers((prev) =>
				prev.map((a) =>
					a.id === currentAnswer.id
						? { ...a, finalScore: score, status: "SCORED" as const }
						: a,
				),
			);
			setOverrideScore(score.toString());
		} catch (err) {
			console.error("Failed to override score:", err);
			alert("Gagal menyimpan skor");
		} finally {
			setSavingScore(false);
		}
	};

	const handleAgree = async () => {
		if (!currentAnswer || currentAnswer.aiScore === null) return;
		await handleOverrideScore(currentAnswer.aiScore);
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center h-screen">
				<Loader2 className="h-8 w-8 animate-spin text-sky-500" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex flex-col items-center justify-center h-screen text-red-500">
				<p>{error}</p>
				<Button
					variant="outline"
					onClick={() => fetchExamData()}
					className="mt-4"
				>
					Coba Lagi
				</Button>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-screen bg-slate-50 rounded-lg overflow-hidden">
			{/* 1. Header */}
			<header className="h-16 bg-white border-b px-6 flex items-center justify-between shrink-0 z-10">
				<div className="flex items-center gap-4">
					<Button
						variant="ghost"
						size="sm"
						className="gap-2 text-slate-500"
						onClick={() => router.back()}
					>
						<ChevronLeft className="h-4 w-4" />
						Kembali
					</Button>
					<div>
						<h1 className="font-bold text-slate-900">
							{exam?.title || "Review Ujian"}
						</h1>
						<div className="flex items-center gap-2 text-xs text-slate-500">
							<span>
								Siswa{" "}
								{participants.findIndex(
									(s) => s.id === selectedParticipantId,
								) + 1}
								/{participants.length}
							</span>
							<span className="w-1 h-1 rounded-full bg-slate-300" />
							<span>
								Soal {currentQuestionIndex + 1}/
								{answers.length || 0}
							</span>
						</div>
					</div>
				</div>

				<div className="flex items-center gap-4">
					<div className="flex items-center gap-2">
						<span className="text-xs text-slate-500 font-medium">
							Progress:
						</span>
						<Progress
							value={
								answers.length
									? ((currentQuestionIndex + 1) /
											answers.length) *
										100
									: 0
							}
							className="w-32 h-2"
						/>
						<span className="text-xs text-slate-500">
							{answers.length
								? Math.round(
										((currentQuestionIndex + 1) /
											answers.length) *
											100,
									)
								: 0}
							%
						</span>
					</div>
					<Button
						variant="outline"
						size="sm"
						className={cn(
							"gap-2",
							!showAI && "bg-slate-100 text-slate-500",
						)}
						onClick={() => setShowAI(!showAI)}
					>
						{showAI ? (
							<EyeOff className="h-4 w-4" />
						) : (
							<Eye className="h-4 w-4" />
						)}
						{showAI ? "Hide AI" : "Show AI"}
					</Button>
				</div>
			</header>

			{/* Content Body */}
			<div className="flex-1 flex overflow-hidden">
				{/* 2. Left Sidebar: Student List */}
				<div className="w-64 bg-white border-r flex flex-col shrink-0">
					<div className="p-4 border-b">
						<h3 className="font-semibold text-sm text-slate-700">
							Daftar Siswa
						</h3>
					</div>
					<div className="flex-1 overflow-y-auto p-2 space-y-1">
						{participants.map((participant) => (
							<button
								key={participant.id}
								onClick={() =>
									setSelectedParticipantId(participant.id)
								}
								className={cn(
									"w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors",
									selectedParticipantId === participant.id
										? "bg-sky-50 border-sky-200"
										: "hover:bg-slate-50 border border-transparent",
								)}
							>
								<div className="flex items-center gap-3">
									<Avatar className="h-8 w-8 bg-sky-100 text-sky-600">
										<AvatarFallback className="text-xs font-bold">
											{participant.student.name
												.split(" ")
												.map((n) => n[0])
												.join("")
												.slice(0, 2)}
										</AvatarFallback>
									</Avatar>
									<div>
										<div
											className={cn(
												"text-sm font-medium",
												selectedParticipantId ===
													participant.id
													? "text-sky-700"
													: "text-slate-700",
											)}
										>
											{participant.student.name}
										</div>
										<div className="text-xs text-slate-500">
											{participant.score?.toFixed(1) ??
												"-"}{" "}
											poin
										</div>
									</div>
								</div>
								{participant.status === "flagged" && (
									<Flag className="h-4 w-4 text-red-500" />
								)}
							</button>
						))}
					</div>
				</div>

				{/* 3. Main Content: Question & Answer */}
				<main className="flex-1 overflow-y-auto p-6 scroll-smooth">
					{loadingAnswers ? (
						<div className="flex items-center justify-center h-full">
							<Loader2 className="h-8 w-8 animate-spin text-sky-500" />
						</div>
					) : answers.length === 0 ? (
						<div className="flex flex-col items-center justify-center h-full text-slate-500">
							<FileText className="h-12 w-12 mb-4 text-slate-300" />
							<p>Tidak ada jawaban untuk siswa ini</p>
						</div>
					) : currentAnswer ? (
						<div className="max-w-3xl mx-auto space-y-6">
							{/* Question Card */}
							<div className="bg-white border rounded-xl p-6 shadow-sm">
								<div className="flex items-start justify-between mb-4">
									<div className="flex items-center gap-3">
										<div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold shrink-0">
											<FileText className="h-5 w-5" />
										</div>
										<div>
											<h2 className="font-bold text-slate-900">
												Soal {currentQuestionIndex + 1}
											</h2>
											<div className="text-xs text-slate-500 flex items-center gap-2">
												<span className="capitalize">
													{currentAnswer.question
														.type === "PG"
														? "Pilihan Ganda"
														: "Essay"}
												</span>
											</div>
										</div>
									</div>
									{currentAnswer.question.difficulty && (
										<Badge
											variant="outline"
											className={cn(
												"font-normal",
												currentAnswer.question
													.difficulty === "mudah"
													? "bg-green-50 text-green-700 border-green-200"
													: currentAnswer.question
																.difficulty ===
														  "sulit"
														? "bg-red-50 text-red-700 border-red-200"
														: "bg-amber-50 text-amber-700 border-amber-200",
											)}
										>
											{currentAnswer.question.difficulty}
										</Badge>
									)}
								</div>

								<p className="text-slate-800 text-lg mb-6 leading-relaxed">
									{currentAnswer.question.question}
								</p>

								{/* Options if PG */}
								{currentAnswer.question.type === "PG" &&
									currentAnswer.question.options && (
										<div className="space-y-3">
											{Object.entries(
												currentAnswer.question.options,
											).map(([key, value]) => (
												<div
													key={key}
													className={cn(
														"p-4 rounded-lg border flex items-center gap-4 transition-colors",
														key ===
															currentAnswer
																.question
																.answerKey
															? "bg-green-50 border-green-200"
															: "bg-white border-slate-200",
													)}
												>
													<div
														className={cn(
															"w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border",
															key ===
																currentAnswer
																	.question
																	.answerKey
																? "bg-green-100 text-green-700 border-green-300"
																: "bg-slate-100 text-slate-500 border-slate-200",
														)}
													>
														{key}
													</div>
													<span
														className={cn(
															"font-medium",
															key ===
																currentAnswer
																	.question
																	.answerKey
																? "text-green-800"
																: "text-slate-700",
														)}
													>
														{value}
													</span>
													{key ===
														currentAnswer.question
															.answerKey && (
														<CheckCircle className="ml-auto h-5 w-5 text-green-600" />
													)}
												</div>
											))}
										</div>
									)}
							</div>

							{/* Student Answer */}
							<div className="bg-white border rounded-xl p-6 shadow-sm">
								<div className="flex items-center justify-between mb-4">
									<div className="flex items-center gap-2">
										<div className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold">
											{currentParticipant?.student.name
												.split(" ")
												.map((n) => n[0])
												.join("")
												.slice(0, 2)}
										</div>
										<span className="font-semibold text-slate-700">
											Jawaban{" "}
											{currentParticipant?.student.name}
										</span>
									</div>
									{currentAnswer.finalScore !== null &&
										(currentAnswer.finalScore === 100 ? (
											<CheckCircle className="h-5 w-5 text-green-500" />
										) : (
											<AlertCircle className="h-5 w-5 text-amber-500" />
										))}
								</div>

								{/* Render Answer Content */}
								<div className="bg-slate-50 rounded-lg p-5 mb-6 border border-slate-100">
									{currentAnswer.question.type === "PG" ? (
										<div className="text-lg font-medium text-slate-800">
											{currentAnswer.answerText || "-"}
										</div>
									) : (
										<p className="text-slate-800 leading-relaxed whitespace-pre-wrap">
											{currentAnswer.answerText ||
												"Tidak ada jawaban"}
										</p>
									)}
								</div>

								{/* Scoring Controls */}
								<div className="bg-white border rounded-lg p-4 flex items-center justify-between">
									<div>
										<div className="text-xs text-slate-400 font-medium uppercase mb-1">
											Skor AI
										</div>
										<div className="flex items-baseline gap-2">
											<span className="text-2xl font-bold text-sky-600">
												{currentAnswer.aiScore?.toFixed(
													0,
												) ?? "-"}
											</span>
											<span className="text-slate-400">
												/ 100
											</span>
										</div>
									</div>

									<div className="flex items-center gap-2">
										<Button
											variant="outline"
											size="sm"
											className="gap-2 text-slate-600 hover:text-green-600 hover:bg-green-50 hover:border-green-200"
											onClick={handleAgree}
											disabled={savingScore}
										>
											<ThumbsUp className="h-4 w-4" />{" "}
											Setuju
										</Button>
										<div className="flex items-center h-9 border rounded-md overflow-hidden w-24">
											<input
												className="w-full h-full text-center text-sm font-medium outline-none px-2"
												value={overrideScore}
												onChange={(e) =>
													setOverrideScore(
														e.target.value,
													)
												}
												type="number"
												min="0"
												max="100"
											/>
											<div className="bg-slate-50 px-2 h-full flex items-center text-xs text-slate-400 border-l">
												/100
											</div>
										</div>
										<Button
											size="sm"
											className="bg-sky-500 hover:bg-sky-600"
											onClick={() =>
												handleOverrideScore()
											}
											disabled={savingScore}
										>
											{savingScore ? (
												<Loader2 className="h-4 w-4 animate-spin" />
											) : (
												"Override"
											)}
										</Button>
									</div>
								</div>
							</div>

							{/* Bottom Nav */}
							<div className="flex items-center justify-between pt-4">
								<Button
									variant="outline"
									onClick={handlePrev}
									disabled={currentQuestionIndex === 0}
									className="gap-2"
								>
									<ChevronLeft className="h-4 w-4" />{" "}
									Sebelumnya
								</Button>
								<Button
									className="bg-sky-500 hover:bg-sky-600 gap-2"
									onClick={handleNext}
									disabled={
										currentQuestionIndex ===
										answers.length - 1
									}
								>
									{currentQuestionIndex === answers.length - 1
										? "Selesai"
										: "Selanjutnya"}{" "}
									<ChevronRight className="h-4 w-4" />
								</Button>
							</div>
						</div>
					) : null}
				</main>

				{/* 4. Right Sidebar: AI Analysis */}
				{showAI && currentFeedback && (
					<div className="w-80 bg-white border-l flex flex-col shrink-0 overflow-y-auto">
						<div className="p-4 border-b bg-sky-50/30">
							<div className="flex items-center gap-2 text-sky-700 font-bold">
								<Bot className="h-5 w-5" />
								<span>Analisis AI</span>
							</div>
						</div>

						<div className="p-5 space-y-6">
							{/* Feedback */}
							<div>
								<h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
									Feedback
								</h4>
								<p className="text-sm text-slate-700 leading-relaxed">
									{currentFeedback.overall}
								</p>
							</div>

							{/* Rubric Breakdown */}
							{currentFeedback.rubric_breakdown &&
								Object.keys(currentFeedback.rubric_breakdown)
									.length > 0 && (
									<div>
										<h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
											Breakdown Nilai
										</h4>
										<div className="space-y-3">
											{Object.entries(
												currentFeedback.rubric_breakdown,
											).map(([label, score]) => (
												<div
													key={label}
													className="flex items-center justify-between text-sm"
												>
													<span className="text-slate-600 capitalize">
														{label.replace(
															/_/g,
															" ",
														)}
													</span>
													<span className="font-semibold text-slate-900">
														{score}
													</span>
												</div>
											))}
										</div>
									</div>
								)}

							{/* Strengths */}
							{currentFeedback.strengths &&
								currentFeedback.strengths.length > 0 && (
									<div>
										<h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
											Kekuatan
										</h4>
										<ul className="space-y-2">
											{currentFeedback.strengths.map(
												(s, i) => (
													<li
														key={i}
														className="flex gap-2 text-sm text-slate-600"
													>
														<span className="text-green-500 mt-1">
															✓
														</span>
														{s}
													</li>
												),
											)}
										</ul>
									</div>
								)}

							{/* Improvements */}
							{currentFeedback.improvements &&
								currentFeedback.improvements.length > 0 && (
									<div>
										<h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
											Saran Perbaikan
										</h4>
										<ul className="space-y-2">
											{currentFeedback.improvements.map(
												(s, i) => (
													<li
														key={i}
														className="flex gap-2 text-sm text-slate-600"
													>
														<span className="text-sky-500 mt-1">
															•
														</span>
														{s}
													</li>
												),
											)}
										</ul>
									</div>
								)}

							{/* Score summary */}
							{currentFeedback.total_points !== undefined &&
								currentFeedback.max_points !== undefined && (
									<div className="p-3 bg-sky-50 rounded-lg border border-sky-100">
										<h4 className="text-xs font-bold text-sky-700 uppercase tracking-wider mb-1">
											Total Nilai
										</h4>
										<div className="flex items-center gap-2">
											<span className="text-lg font-bold text-sky-900">
												{currentFeedback.total_points}
											</span>
											<span className="text-sm text-sky-600">
												/ {currentFeedback.max_points}{" "}
												poin
											</span>
										</div>
									</div>
								)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
