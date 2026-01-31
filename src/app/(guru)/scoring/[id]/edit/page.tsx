"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
	ChevronLeft,
	Save,
	Loader2,
	Plus,
	Trash2,
	GripVertical,
	Check,
	X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { scoringApi, type ExamListItem } from "@/lib/scoring-api";

interface Question {
	id: string;
	type: "PG" | "ESSAY";
	question: string;
	options?: Record<string, string>;
	answerKey?: string;
	rubric?: Record<string, number> | null;
	difficulty?: string;
	category?: string;
}

interface ExamQuestion {
	id: string;
	order: number;
	points: number;
	question: Question;
}

export default function EditQuestionsPage() {
	const router = useRouter();
	const params = useParams();
	const examId = params.id as string;
	const { toast } = useToast();

	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState<string | null>(null);
	const [exam, setExam] = useState<ExamListItem | null>(null);
	const [questions, setQuestions] = useState<ExamQuestion[]>([]);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editForm, setEditForm] = useState<Partial<Question>>({});

	const loadData = useCallback(async () => {
		try {
			setLoading(true);
			const examData = await scoringApi.getExamDetails(examId);
			console.log("Exam data:", examData);
			setExam(examData);

			// Get questions from exam details
			const examQuestions = await scoringApi.getExamQuestions(examId);
			console.log("Exam questions:", examQuestions);
			setQuestions(examQuestions || []);
		} catch (error) {
			console.error("Failed to load exam:", error);
			toast({
				title: "Gagal memuat data",
				description: "Silakan coba lagi",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	}, [examId, toast]);

	useEffect(() => {
		loadData();
	}, [loadData]);

	const startEdit = (question: Question) => {
		setEditingId(question.id);
		setEditForm({
			question: question.question,
			type: question.type,
			options: question.options ? { ...question.options } : {},
			answerKey: question.answerKey,
			difficulty: question.difficulty,
			category: question.category,
		});
	};

	const cancelEdit = () => {
		setEditingId(null);
		setEditForm({});
	};

	const saveQuestion = async (questionId: string) => {
		try {
			setSaving(questionId);

			await scoringApi.updateQuestion(questionId, {
				question: editForm.question,
				type: editForm.type,
				options: editForm.type === "PG" ? editForm.options : undefined,
				answerKey: editForm.answerKey,
				difficulty: editForm.difficulty,
				category: editForm.category,
			});

			toast({
				title: "Soal berhasil disimpan",
				description: "Perubahan telah disimpan",
			});

			// Refresh data
			await loadData();
			setEditingId(null);
			setEditForm({});
		} catch (error) {
			console.error("Failed to save question:", error);
			toast({
				title: "Gagal menyimpan",
				description: "Silakan coba lagi",
				variant: "destructive",
			});
		} finally {
			setSaving(null);
		}
	};

	const updateOption = (key: string, value: string) => {
		setEditForm((prev) => ({
			...prev,
			options: {
				...prev.options,
				[key]: value,
			},
		}));
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[calc(100vh-100px)]">
				<div className="text-center">
					<Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
					<p className="text-muted-foreground">Memuat soal...</p>
				</div>
			</div>
		);
	}

	if (exam?.status !== "DRAFT") {
		return (
			<div className="flex items-center justify-center min-h-[calc(100vh-100px)]">
				<Card>
					<CardContent className="p-8 text-center">
						<h3 className="text-lg font-semibold mb-2">
							Tidak Dapat Mengedit
						</h3>
						<p className="text-muted-foreground mb-4">
							Soal hanya dapat diedit saat ujian berstatus DRAFT.
						</p>
						<Button onClick={() => router.back()}>Kembali</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

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
						<ChevronLeft className="h-5 w-5" />
					</Button>
					<div>
						<h2 className="text-2xl font-bold">Edit Soal</h2>
						<p className="text-muted-foreground">{exam?.title}</p>
					</div>
				</div>
				<Badge
					variant="secondary"
					className="bg-yellow-100 text-yellow-700"
				>
					DRAFT
				</Badge>
			</div>

			{/* Questions List */}
			<div className="space-y-4">
				{questions.length === 0 ? (
					<Card className="border-dashed">
						<CardContent className="flex flex-col items-center justify-center py-12">
							<p className="text-muted-foreground">
								Tidak ada soal untuk ujian ini.
							</p>
						</CardContent>
					</Card>
				) : (
					<Accordion type="single" collapsible className="w-full">
						{questions.map((eq, idx) => (
							<AccordionItem
								key={
									eq.id ||
									eq.question?.id ||
									`question-${idx}`
								}
								value={
									eq.id ||
									eq.question?.id ||
									`question-${idx}`
								}
								className="border rounded-lg bg-white mb-4"
							>
								<AccordionTrigger className="px-4 hover:no-underline">
									<div className="flex items-center gap-4 text-left">
										<span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
											{idx + 1}
										</span>
										<div className="flex-1">
											<p className="font-medium line-clamp-1">
												{eq.question.question}
											</p>
											<div className="flex items-center gap-2 mt-1">
												<Badge
													variant="outline"
													className="text-xs"
												>
													{eq.question.type === "PG"
														? "Pilihan Ganda"
														: "Essay"}
												</Badge>
												{eq.question.difficulty && (
													<Badge
														variant="secondary"
														className="text-xs"
													>
														{eq.question.difficulty}
													</Badge>
												)}
											</div>
										</div>
									</div>
								</AccordionTrigger>
								<AccordionContent className="px-4 pb-4">
									{editingId === eq.question.id ? (
										<div className="space-y-4 pt-4 border-t">
											{/* Edit Form */}
											<div className="space-y-2">
												<Label>Pertanyaan</Label>
												<Textarea
													value={
														editForm.question || ""
													}
													onChange={(e) =>
														setEditForm((prev) => ({
															...prev,
															question:
																e.target.value,
														}))
													}
													rows={3}
												/>
											</div>

											<div className="grid grid-cols-2 gap-4">
												<div className="space-y-2">
													<Label>Tipe</Label>
													<Select
														value={editForm.type}
														onValueChange={(v) =>
															setEditForm(
																(prev) => ({
																	...prev,
																	type: v as
																		| "PG"
																		| "ESSAY",
																}),
															)
														}
													>
														<SelectTrigger>
															<SelectValue />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="PG">
																Pilihan Ganda
															</SelectItem>
															<SelectItem value="ESSAY">
																Essay
															</SelectItem>
														</SelectContent>
													</Select>
												</div>

												<div className="space-y-2">
													<Label>
														Tingkat Kesulitan
													</Label>
													<Select
														value={
															editForm.difficulty ||
															""
														}
														onValueChange={(v) =>
															setEditForm(
																(prev) => ({
																	...prev,
																	difficulty:
																		v,
																}),
															)
														}
													>
														<SelectTrigger>
															<SelectValue placeholder="Pilih tingkat" />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="mudah">
																Mudah
															</SelectItem>
															<SelectItem value="sedang">
																Sedang
															</SelectItem>
															<SelectItem value="sulit">
																Sulit
															</SelectItem>
														</SelectContent>
													</Select>
												</div>
											</div>

											{/* Options for PG */}
											{editForm.type === "PG" && (
												<div className="space-y-2">
													<Label>Opsi Jawaban</Label>
													<div className="space-y-2">
														{[
															"A",
															"B",
															"C",
															"D",
															"E",
														].map((key) => (
															<div
																key={key}
																className="flex items-center gap-2"
															>
																<span className="w-8 text-center font-medium">
																	{key}.
																</span>
																<Input
																	value={
																		editForm
																			.options?.[
																			key
																		] || ""
																	}
																	onChange={(
																		e,
																	) =>
																		updateOption(
																			key,
																			e
																				.target
																				.value,
																		)
																	}
																	placeholder={`Opsi ${key}`}
																/>
															</div>
														))}
													</div>
												</div>
											)}

											{/* Answer Key */}
											<div className="space-y-2">
												<Label>Kunci Jawaban</Label>
												{editForm.type === "PG" ? (
													<Select
														value={
															editForm.answerKey ||
															""
														}
														onValueChange={(v) =>
															setEditForm(
																(prev) => ({
																	...prev,
																	answerKey:
																		v,
																}),
															)
														}
													>
														<SelectTrigger>
															<SelectValue placeholder="Pilih kunci jawaban" />
														</SelectTrigger>
														<SelectContent>
															{[
																"A",
																"B",
																"C",
																"D",
																"E",
															].map((key) => (
																<SelectItem
																	key={key}
																	value={key}
																>
																	{key}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
												) : (
													<Textarea
														value={
															editForm.answerKey ||
															""
														}
														onChange={(e) =>
															setEditForm(
																(prev) => ({
																	...prev,
																	answerKey:
																		e.target
																			.value,
																}),
															)
														}
														rows={2}
														placeholder="Kunci jawaban essay"
													/>
												)}
											</div>

											{/* Action Buttons */}
											<div className="flex justify-end gap-2 pt-2">
												<Button
													variant="outline"
													size="sm"
													onClick={cancelEdit}
												>
													<X className="h-4 w-4 mr-1" />
													Batal
												</Button>
												<Button
													size="sm"
													onClick={() =>
														saveQuestion(
															eq.question.id,
														)
													}
													disabled={
														saving ===
														eq.question.id
													}
												>
													{saving ===
													eq.question.id ? (
														<Loader2 className="h-4 w-4 mr-1 animate-spin" />
													) : (
														<Check className="h-4 w-4 mr-1" />
													)}
													Simpan
												</Button>
											</div>
										</div>
									) : (
										<div className="space-y-4 pt-4 border-t">
											{/* Display Question Details */}
											<div>
												<p className="text-sm text-muted-foreground font-medium mb-1">
													Pertanyaan:
												</p>
												<p className="whitespace-pre-wrap">
													{eq.question.question}
												</p>
											</div>

											{/* Options for PG */}
											{eq.question.type === "PG" &&
												eq.question.options && (
													<div>
														<p className="text-sm text-muted-foreground font-medium mb-2">
															Opsi:
														</p>
														<div className="space-y-1">
															{Object.entries(
																eq.question
																	.options,
															).map(
																([
																	key,
																	value,
																]) => (
																	<div
																		key={
																			key
																		}
																		className={`p-2 rounded ${
																			eq
																				.question
																				.answerKey ===
																			key
																				? "bg-green-50 border border-green-200"
																				: "bg-gray-50"
																		}`}
																	>
																		<span className="font-medium">
																			{
																				key
																			}
																			.
																		</span>{" "}
																		{value}
																		{eq
																			.question
																			.answerKey ===
																			key && (
																			<Badge
																				className="ml-2 bg-green-500"
																				variant="default"
																			>
																				Kunci
																			</Badge>
																		)}
																	</div>
																),
															)}
														</div>
													</div>
												)}

											{/* Answer Key for Essay */}
											{eq.question.type === "ESSAY" &&
												eq.question.answerKey && (
													<div>
														<p className="text-sm text-muted-foreground font-medium mb-1">
															Kunci Jawaban:
														</p>
														<p className="whitespace-pre-wrap p-3 bg-green-50 rounded border border-green-200">
															{
																eq.question
																	.answerKey
															}
														</p>
													</div>
												)}

											{/* Edit Button */}
											<Button
												variant="outline"
												size="sm"
												onClick={() =>
													startEdit(eq.question)
												}
											>
												Edit Soal
											</Button>
										</div>
									)}
								</AccordionContent>
							</AccordionItem>
						))}
					</Accordion>
				)}
			</div>
		</div>
	);
}
