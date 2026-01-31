"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { ExamTimer } from "@/components/features/exams/ExamTimer";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/lib/store";
import { tokenManager, api } from "@/lib/api";
import {
	StudentProctoringSocket,
	DetectionResult,
} from "@/lib/proctoring-socket";
import {
	AlertTriangle,
	Wifi,
	WifiOff,
	Camera,
	Shield,
	ShieldAlert,
	ShieldX,
	Maximize2,
	X,
	Loader2,
} from "lucide-react";

// API base URL
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// Types
interface Question {
	id: string;
	type: "PG" | "ESSAY";
	question: string;
	options?: Record<string, string>;
	order: number;
}

interface ExamData {
	id: string;
	title: string;
	description?: string;
	duration?: number;
	status: string;
	questions: Question[];
}

// Label pelanggaran dalam Bahasa Indonesia
const violationLabels: Record<string, string> = {
	face_absence: "Wajah Tidak Terdeteksi",
	head_pose: "Menoleh",
	eye_gaze: "Mata Melihat Lain",
	object_detected: "HP Terdeteksi",
	phone_detected: "HP Terdeteksi",
	multi_face: "Banyak Wajah",
	tab_switch: "Ganti Tab",
	window_blur: "Ganti Jendela",
};

interface ProctoringState {
	sessionId: string | null;
	score: number;
	alertLevel: "normal" | "warning" | "danger";
	isConnected: boolean;
	events: { type: string; level: string; timestamp: Date }[];
	currentViolation: string | null;
	annotatedFrame: string | null;
	detectedObjects: string[];
}

export default function ExamDetailPage() {
	const params = useParams();
	const router = useRouter();
	const examId = params?.examId as string;

	const [examData, setExamData] = useState<ExamData | null>(null);
	const [loading, setLoading] = useState(true);
	const [currentQuestion, setCurrentQuestion] = useState(0);
	const [answers, setAnswers] = useState<Record<string, string>>({});
	const [examStarted, setExamStarted] = useState(false);
	const [cameraExpanded, setCameraExpanded] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [essayInputMode, setEssayInputMode] = useState<
		Record<string, "text" | "image">
	>({});
	const [proctoring, setProctoring] = useState<ProctoringState>({
		sessionId: null,
		score: 0,
		alertLevel: "normal",
		isConnected: false,
		events: [],
		currentViolation: null,
		annotatedFrame: null,
		detectedObjects: [],
	});

	const webcamRef = useRef<Webcam>(null);
	const expandedWebcamRef = useRef<Webcam>(null);
	const proctoringSocketRef = useRef<StudentProctoringSocket | null>(null);
	const frameIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const violationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	const { toast } = useToast();
	const { user } = useAuthStore();

	// Load exam data
	useEffect(() => {
		if (examId) {
			loadExamData();
		}
	}, [examId]);

	const loadExamData = async () => {
		try {
			setLoading(true);
			const response = await api.get<{
				success: boolean;
				data: any;
			}>(`/exams/${examId}`);

			if (response.data.success) {
				const examRaw = response.data.data;

				// Transform examQuestions to questions array
				const questions: Question[] = [];
				if (
					examRaw.examQuestions &&
					Array.isArray(examRaw.examQuestions)
				) {
					examRaw.examQuestions.forEach((eq: any) => {
						if (eq.question) {
							questions.push({
								id: eq.question.id,
								type: eq.question.type,
								question: eq.question.question,
								options: eq.question.options,
								order: eq.order,
							});
						}
					});
				}

				// Sort by order
				questions.sort((a, b) => a.order - b.order);

				const exam: ExamData = {
					id: examRaw.id,
					title: examRaw.title,
					description: examRaw.description,
					duration: examRaw.duration,
					status: examRaw.status,
					questions,
				};

				// Check if student has already submitted this exam
				try {
					const statusResponse = await api.get<{
						success: boolean;
						data: any;
					}>(`/exams/${examId}/status`);

					if (
						statusResponse.data.success &&
						statusResponse.data.data.submitted
					) {
						// Student has already submitted this exam
						toast({
							title: "Ujian sudah dikumpulkan",
							description:
								"Anda sudah mengerjakan ujian ini sebelumnya.",
						});
						// Redirect to results if published, otherwise to exams list
						if (examRaw.status === "PUBLISHED") {
							router.push(`/exams/${examId}/results`);
						} else {
							router.push("/exams");
						}
						return;
					}
				} catch (statusError) {
					// Status check failed, continue with exam display
					console.log("Status check skipped:", statusError);
				}

				setExamData(exam);
			}
		} catch (error) {
			console.error("Failed to load exam:", error);
			toast({
				title: "Gagal memuat ujian",
				description: "Silakan coba lagi atau hubungi guru",
				variant: "destructive",
			});
			router.push("/exams");
		} finally {
			setLoading(false);
		}
	};

	// Calculate status based on score
	const getStatusFromScore = (
		score: number,
	): "normal" | "warning" | "danger" => {
		if (score >= 70) return "danger";
		if (score >= 30) return "warning";
		return "normal";
	};

	// Start proctoring session
	const startProctoringSession = useCallback(async () => {
		if (!user || !examData) return;

		// Cheating detection service URL (Cloud Run)
		const CHEATING_DETECTION_URL =
			process.env.NEXT_PUBLIC_PROCTORING_WS_URL?.replace(
				"wss://",
				"https://",
			).replace("ws://", "http://") ||
			"https://cheating-detection-865275048150.asia-southeast2.run.app";

		try {
			// Create session on Cloud Run cheating detection service
			const response = await fetch(
				`${CHEATING_DETECTION_URL}/api/sessions/start`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						student_id: user.id,
						exam_id: examData.id,
						student_name: user.name,
						exam_name: examData.title,
					}),
				},
			);

			if (!response.ok) {
				throw new Error(
					"Failed to start proctoring session on Cloud Run",
				);
			}

			const result = await response.json();
			const sessionId = result.session_id;

			console.log(
				"[Proctoring] Session created on Cloud Run:",
				sessionId,
			);

			// Connect to WebSocket
			const socket = new StudentProctoringSocket(
				sessionId,
				handleProctoringMessage,
				handleProctoringError,
				handleProctoringClose,
			);
			socket.connect();
			proctoringSocketRef.current = socket;

			setProctoring((prev) => ({
				...prev,
				sessionId,
				isConnected: true,
			}));

			// Start sending frames every 250ms (4 FPS for smoother feed)
			frameIntervalRef.current = setInterval(() => {
				captureAndSendFrame();
			}, 250);

			toast({
				title: "Proctoring Aktif",
				description: "Kamera sedang dipantau oleh sistem AI",
			});
		} catch (error) {
			console.error("Failed to start proctoring:", error);
			toast({
				title: "Gagal memulai proctoring",
				description: "Silakan coba lagi atau hubungi guru",
				variant: "destructive",
			});
		}
	}, [user, examData, toast]);

	// Handle proctoring messages
	const handleProctoringMessage = useCallback(
		(data: DetectionResult) => {
			if (data.type === "result") {
				const newScore = data.score || 0;
				const newAlertLevel = getStatusFromScore(newScore);

				// Extract current violation from events
				let currentViolation: string | null = null;
				if (data.events && data.events.length > 0) {
					const dangerEvent = data.events.find(
						(e) => e.level === "danger" || e.level === "warning",
					);
					if (dangerEvent) {
						currentViolation = dangerEvent.type;
					}
				}

				// Also check detections for violations
				if (!currentViolation && data.detections) {
					// Check for face absence
					if (data.detections.face && !data.detections.face.present) {
						currentViolation = "face_absence";
					}
					// Check for head pose (looking away)
					else if (data.detections.head_pose?.is_suspicious) {
						currentViolation = "head_pose";
					}
					// Check for eye gaze (looking away)
					else if (data.detections.eye_gaze?.is_looking_away) {
						currentViolation = "eye_gaze";
					}
					// Check for multiple faces
					else if (
						data.detections.face &&
						data.detections.face.count > 1
					) {
						currentViolation = "multi_face";
					}
					// Check for forbidden objects (phone)
					else if (
						data.detections.objects?.some((obj) => obj.is_forbidden)
					) {
						currentViolation = "object_detected";
					}
				}

				// Extract detected objects (phones, etc.)
				const detectedObjects: string[] = [];
				if (data.detections?.objects) {
					data.detections.objects.forEach((obj) => {
						if (obj.is_forbidden) {
							detectedObjects.push(obj.label);
						}
					});
				}

				// Build events list - include events from server AND current violation
				setProctoring((prev) => {
					let updatedEvents = [...prev.events];

					// Add events from server response
					if (data.events && data.events.length > 0) {
						const newServerEvents = data.events.map((e) => ({
							type: e.type,
							level: e.level,
							timestamp: new Date(),
						}));
						updatedEvents = [...newServerEvents, ...updatedEvents];
					}

					// If there's a current violation detected, add it to events if not already present
					if (currentViolation) {
						const violationExists = updatedEvents.some(
							(e) =>
								e.type === currentViolation &&
								new Date().getTime() - e.timestamp.getTime() <
									1000,
						);

						if (!violationExists) {
							const level =
								newAlertLevel === "danger"
									? "danger"
									: newAlertLevel === "warning"
										? "warning"
										: "info";
							updatedEvents = [
								{
									type: currentViolation,
									level,
									timestamp: new Date(),
								},
								...updatedEvents,
							];
						}
					}

					// Keep only last 10 events
					updatedEvents = updatedEvents.slice(0, 10);

					return {
						...prev,
						score: newScore,
						alertLevel: newAlertLevel,
						currentViolation,
						annotatedFrame: data.annotated_frame || null,
						detectedObjects,
						events: updatedEvents,
					};
				});

				// Clear violation after 3 seconds
				if (currentViolation) {
					if (violationTimeoutRef.current) {
						clearTimeout(violationTimeoutRef.current);
					}
					violationTimeoutRef.current = setTimeout(() => {
						setProctoring((prev) => ({
							...prev,
							currentViolation: null,
						}));
					}, 3000);
				}

				// Show warning toast for suspicious activity
				if (
					newAlertLevel === "danger" &&
					data.alert_level === "danger"
				) {
					toast({
						title: "Aktivitas Mencurigakan Terdeteksi!",
						description:
							"Sistem mendeteksi perilaku yang tidak wajar",
						variant: "destructive",
					});
				}
			} else if (data.type === "connected") {
				setProctoring((prev) => ({ ...prev, isConnected: true }));
			}
		},
		[toast],
	);

	const handleProctoringError = useCallback((error: Event) => {
		console.error("Proctoring error:", error);
		setProctoring((prev) => ({ ...prev, isConnected: false }));
	}, []);

	const handleProctoringClose = useCallback((event: CloseEvent) => {
		console.log("Proctoring closed:", event);
		setProctoring((prev) => ({ ...prev, isConnected: false }));
	}, []);

	// Capture webcam frame and send to proctoring service
	const captureAndSendFrame = useCallback(() => {
		const webcam = cameraExpanded
			? expandedWebcamRef.current
			: webcamRef.current;
		if (webcam && proctoringSocketRef.current?.isConnected()) {
			const imageSrc = webcam.getScreenshot();
			if (imageSrc) {
				proctoringSocketRef.current.sendFrame(imageSrc);
			}
		}
	}, [cameraExpanded]);

	// Detect tab switches
	useEffect(() => {
		if (!examStarted) return;

		const handleVisibilityChange = () => {
			if (document.hidden && proctoringSocketRef.current?.isConnected()) {
				proctoringSocketRef.current.sendBrowserEvent("tab_switch", {
					timestamp: new Date().toISOString(),
				});

				// Add to local events list
				setProctoring((prev) => ({
					...prev,
					events: [
						{
							type: "tab_switch",
							level: "danger",
							timestamp: new Date(),
						},
						...prev.events,
					].slice(0, 10),
				}));

				toast({
					title: "Peringatan!",
					description: "Ganti tab terdeteksi dan dicatat",
					variant: "destructive",
				});
			}
		};

		const handleBlur = () => {
			if (proctoringSocketRef.current?.isConnected()) {
				proctoringSocketRef.current.sendBrowserEvent("window_blur", {
					timestamp: new Date().toISOString(),
				});

				// Add to local events list
				setProctoring((prev) => ({
					...prev,
					events: [
						{
							type: "window_blur",
							level: "warning",
							timestamp: new Date(),
						},
						...prev.events,
					].slice(0, 10),
				}));
			}
		};

		document.addEventListener("visibilitychange", handleVisibilityChange);
		window.addEventListener("blur", handleBlur);

		return () => {
			document.removeEventListener(
				"visibilitychange",
				handleVisibilityChange,
			);
			window.removeEventListener("blur", handleBlur);
		};
	}, [examStarted, toast]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (frameIntervalRef.current) {
				clearInterval(frameIntervalRef.current);
			}
			if (violationTimeoutRef.current) {
				clearTimeout(violationTimeoutRef.current);
			}
			if (proctoringSocketRef.current) {
				proctoringSocketRef.current.disconnect();
			}
		};
	}, []);

	const handleStartExam = async () => {
		try {
			// Join exam
			await api.post(`/exams/${examId}/join`);

			setExamStarted(true);
			await startProctoringSession();
		} catch (error) {
			console.error("Failed to join exam:", error);
			toast({
				title: "Gagal memulai ujian",
				description: "Silakan coba lagi atau hubungi guru",
				variant: "destructive",
			});
		}
	};

	const handleAnswer = (value: string) => {
		if (!examData) return;
		const currentQuestionId = examData.questions[currentQuestion].id;
		setAnswers({ ...answers, [currentQuestionId]: value });
	};

	const handleSubmit = async () => {
		if (!examData) return;

		setSubmitting(true);

		try {
			// Submit all answers in batch
			const answersArray = Object.entries(answers).map(
				([questionId, answerText]) => ({
					questionId,
					answerText,
				}),
			);

			await api.post(`/exams/${examId}/submit-batch`, {
				answers: answersArray,
			});

			// Finish exam
			await api.post(`/exams/${examId}/finish`);

			// End proctoring session on Cloud Run
			if (proctoring.sessionId) {
				try {
					const CHEATING_DETECTION_URL =
						process.env.NEXT_PUBLIC_PROCTORING_WS_URL?.replace(
							"wss://",
							"https://",
						).replace("ws://", "http://") ||
						"https://cheating-detection-865275048150.asia-southeast2.run.app";
					await fetch(
						`${CHEATING_DETECTION_URL}/api/sessions/${proctoring.sessionId}/end`,
						{
							method: "POST",
						},
					);
				} catch (error) {
					console.error("Failed to end proctoring session:", error);
				}
			}

			// Cleanup
			if (frameIntervalRef.current) {
				clearInterval(frameIntervalRef.current);
			}
			if (proctoringSocketRef.current) {
				proctoringSocketRef.current.disconnect();
			}

			toast({
				title: "Ujian Selesai!",
				description: "Jawaban Anda telah disimpan.",
			});

			// Redirect to exams list
			router.push("/exams");
		} catch (error) {
			console.error("Failed to submit exam:", error);
			toast({
				title: "Gagal mengumpulkan ujian",
				description: "Silakan coba lagi",
				variant: "destructive",
			});
		} finally {
			setSubmitting(false);
		}
	};

	// Loading state
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

	// No exam data
	if (!examData) {
		return (
			<div className="flex items-center justify-center min-h-[calc(100vh-100px)]">
				<Card>
					<CardContent className="p-8 text-center">
						<h3 className="text-lg font-semibold mb-2">
							Ujian Tidak Ditemukan
						</h3>
						<p className="text-muted-foreground mb-4">
							Ujian yang Anda cari tidak tersedia.
						</p>
						<Button onClick={() => router.push("/exams")}>
							Kembali ke Daftar Ujian
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	// Pre-exam camera check
	if (!examStarted) {
		return (
			<div className="flex items-center justify-center min-h-[calc(100vh-100px)]">
				<Card className="w-full max-w-lg">
					<CardContent className="p-8 space-y-6">
						<div className="text-center">
							<h2 className="text-2xl font-bold mb-2">
								{examData.title}
							</h2>
							{examData.description && (
								<p className="text-muted-foreground mb-4">
									{examData.description}
								</p>
							)}
							<p className="text-sm text-muted-foreground">
								{examData.questions.length} Soal
								{examData.duration &&
									` • ${examData.duration} Menit`}
							</p>
						</div>

						<div className="aspect-video bg-black rounded-lg overflow-hidden">
							<Webcam
								audio={false}
								screenshotFormat="image/jpeg"
								className="w-full h-full object-cover"
								mirrored
							/>
						</div>

						<div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
							<AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
							<div className="text-sm">
								<p className="font-medium text-yellow-800 dark:text-yellow-200">
									Perhatian:
								</p>
								<ul className="text-yellow-700 dark:text-yellow-300 mt-1 list-disc list-inside space-y-1">
									<li>Kamera akan merekam selama ujian</li>
									<li>Jangan berpindah tab</li>
									<li>Pastikan wajah terlihat jelas</li>
									<li>
										Jangan bawa HP atau barang terlarang
									</li>
								</ul>
							</div>
						</div>

						<div className="flex gap-3">
							<Button
								variant="outline"
								onClick={() => router.push("/exams")}
								className="flex-1"
							>
								Batal
							</Button>
							<Button
								onClick={handleStartExam}
								className="flex-1 bg-gradient-primary"
							>
								<Camera className="mr-2 h-5 w-5" />
								Mulai Ujian
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	const getAlertBadge = () => {
		const status = getStatusFromScore(proctoring.score);
		switch (status) {
			case "danger":
				return (
					<Badge variant="destructive" className="gap-1">
						<ShieldX className="h-3 w-3" />
						Mencurigakan
					</Badge>
				);
			case "warning":
				return (
					<Badge className="bg-yellow-500 hover:bg-yellow-600 gap-1">
						<ShieldAlert className="h-3 w-3" />
						Peringatan
					</Badge>
				);
			default:
				return (
					<Badge className="bg-green-500 hover:bg-green-600 gap-1">
						<Shield className="h-3 w-3" />
						Aman
					</Badge>
				);
		}
	};

	const getViolationLabel = (type: string): string => {
		return violationLabels[type.toLowerCase()] || type.replace(/_/g, " ");
	};

	// Calculate current status
	const currentStatus = getStatusFromScore(proctoring.score);
	const hasViolation = proctoring.currentViolation !== null;
	const currentQuestionData = examData.questions[currentQuestion];

	return (
		<>
			<div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-100px)]">
				{/* Main Exam Area */}
				<div className="flex-1 flex flex-col gap-6">
					<div className="flex items-center justify-between bg-card p-4 rounded-lg border shadow-sm">
						<div>
							<h2 className="text-xl font-bold">
								{examData.title}
							</h2>
							<p className="text-sm text-muted-foreground">
								Soal {currentQuestion + 1} dari{" "}
								{examData.questions.length}
							</p>
						</div>
						{examData.duration && (
							<ExamTimer
								durationMinutes={examData.duration}
								onTimeUp={handleSubmit}
							/>
						)}
					</div>

					<Card className="flex-1">
						<CardContent className="p-8">
							<h3 className="text-lg font-medium mb-6">
								{currentQuestionData.question}
							</h3>

							{currentQuestionData.type === "PG" &&
							currentQuestionData.options ? (
								<RadioGroup
									value={
										answers[currentQuestionData.id] || ""
									}
									onValueChange={handleAnswer}
									className="space-y-4"
								>
									{Object.entries(
										currentQuestionData.options,
									).map(([key, value]) => (
										<div
											key={key}
											className="flex items-center space-x-2 border p-4 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
										>
											<RadioGroupItem
												value={key}
												id={`opt-${key}`}
											/>
											<Label
												htmlFor={`opt-${key}`}
												className="flex-1 cursor-pointer"
											>
												{key}. {value}
											</Label>
										</div>
									))}
								</RadioGroup>
							) : (
								<div className="space-y-4">
									{/* Input Mode Toggle */}
									<div className="flex gap-2">
										<Button
											type="button"
											variant={
												essayInputMode[
													currentQuestionData.id
												] !== "image"
													? "default"
													: "outline"
											}
											size="sm"
											onClick={() => {
												setEssayInputMode((prev) => ({
													...prev,
													[currentQuestionData.id]:
														"text",
												}));
												// Clear image answer if switching to text
												setAnswers((prev) => ({
													...prev,
													[currentQuestionData.id]:
														"",
												}));
											}}
										>
											Tulis Teks
										</Button>
										<Button
											type="button"
											variant={
												essayInputMode[
													currentQuestionData.id
												] === "image"
													? "default"
													: "outline"
											}
											size="sm"
											onClick={() => {
												setEssayInputMode((prev) => ({
													...prev,
													[currentQuestionData.id]:
														"image",
												}));
												// Clear text answer if switching to image
												setAnswers((prev) => ({
													...prev,
													[currentQuestionData.id]:
														"",
												}));
											}}
										>
											Upload Gambar
										</Button>
									</div>

									{/* Text Input */}
									{essayInputMode[currentQuestionData.id] !==
										"image" && (
										<textarea
											value={
												answers[
													currentQuestionData.id
												] || ""
											}
											onChange={(e) =>
												handleAnswer(e.target.value)
											}
											className="w-full min-h-[200px] p-4 border rounded-md"
											placeholder="Tulis jawaban Anda di sini..."
										/>
									)}

									{/* Image Upload */}
									{essayInputMode[currentQuestionData.id] ===
										"image" && (
										<div className="space-y-4">
											<div className="border-2 border-dashed rounded-lg p-8 text-center">
												<input
													type="file"
													accept="image/*"
													className="hidden"
													id={`essay-image-${currentQuestionData.id}`}
													onChange={(e) => {
														const file =
															e.target.files?.[0];
														if (file) {
															const reader =
																new FileReader();
															reader.onloadend =
																() => {
																	const base64 =
																		reader.result as string;
																	handleAnswer(
																		`[IMAGE]${base64}`,
																	);
																};
															reader.readAsDataURL(
																file,
															);
														}
													}}
												/>
												{answers[
													currentQuestionData.id
												]?.startsWith("[IMAGE]") ? (
													<div className="space-y-2">
														<img
															src={answers[
																currentQuestionData
																	.id
															].replace(
																"[IMAGE]",
																"",
															)}
															alt="Uploaded answer"
															className="max-h-48 mx-auto rounded"
														/>
														<Button
															type="button"
															variant="outline"
															size="sm"
															onClick={() =>
																handleAnswer("")
															}
														>
															Hapus Gambar
														</Button>
													</div>
												) : (
													<label
														htmlFor={`essay-image-${currentQuestionData.id}`}
														className="cursor-pointer"
													>
														<div className="text-muted-foreground">
															<svg
																xmlns="http://www.w3.org/2000/svg"
																className="h-12 w-12 mx-auto mb-2"
																fill="none"
																viewBox="0 0 24 24"
																stroke="currentColor"
															>
																<path
																	strokeLinecap="round"
																	strokeLinejoin="round"
																	strokeWidth={
																		2
																	}
																	d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
																/>
															</svg>
															<p>
																Klik untuk
																upload gambar
															</p>
															<p className="text-xs">
																JPG, PNG, atau
																GIF
															</p>
														</div>
													</label>
												)}
											</div>
										</div>
									)}
								</div>
							)}
						</CardContent>
					</Card>

					<div className="flex justify-between">
						<Button
							variant="outline"
							disabled={currentQuestion === 0}
							onClick={() =>
								setCurrentQuestion((prev) => prev - 1)
							}
						>
							Sebelumnya
						</Button>

						{currentQuestion === examData.questions.length - 1 ? (
							<Button
								onClick={handleSubmit}
								disabled={submitting}
								className="bg-gradient-primary"
							>
								{submitting ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Mengumpulkan...
									</>
								) : (
									"Kumpulkan"
								)}
							</Button>
						) : (
							<Button
								onClick={() =>
									setCurrentQuestion((prev) => prev + 1)
								}
							>
								Selanjutnya
							</Button>
						)}
					</div>
				</div>

				{/* Side Panel (Camera & Nav) */}
				<div className="w-full lg:w-80 space-y-6">
					<Card className="overflow-hidden border-2 border-primary/20">
						{/* Inline Camera */}
						<div className="bg-black relative aspect-video">
							<Webcam
								ref={webcamRef}
								audio={false}
								screenshotFormat="image/jpeg"
								className="w-full h-full object-cover"
								mirrored
							/>

							{/* Violation border overlay */}
							{hasViolation && (
								<div className="absolute inset-0 border-4 border-red-500 animate-pulse pointer-events-none" />
							)}

							{/* Status-based border */}
							{!hasViolation && currentStatus !== "normal" && (
								<div
									className={`absolute inset-0 border-2 pointer-events-none ${
										currentStatus === "danger"
											? "border-red-500/50"
											: "border-yellow-500/50"
									}`}
								/>
							)}

							{/* REC indicator */}
							<div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] px-2 py-0.5 rounded animate-pulse">
								● REC
							</div>

							{/* Violation Label - Bottom Left */}
							{proctoring.currentViolation && (
								<div className="absolute bottom-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded font-bold animate-pulse flex items-center gap-1">
									⚠️{" "}
									{getViolationLabel(
										proctoring.currentViolation,
									)}
								</div>
							)}

							{/* Connection status */}
							<div className="absolute top-2 right-12">
								{proctoring.isConnected ? (
									<div className="bg-green-600 text-white text-[10px] px-2 py-0.5 rounded flex items-center gap-1">
										<Wifi className="h-3 w-3" />
										Live
									</div>
								) : (
									<div className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded flex items-center gap-1">
										<WifiOff className="h-3 w-3" />
										Offline
									</div>
								)}
							</div>

							{/* Tombol expand */}
							<button
								onClick={() => setCameraExpanded(true)}
								className="absolute bottom-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded transition-colors"
								title="Perbesar Kamera"
							>
								<Maximize2 className="h-4 w-4" />
							</button>
						</div>
						<div className="p-3 bg-muted/30 space-y-2">
							<div className="flex items-center justify-between">
								<span className="text-xs text-muted-foreground">
									Status:
								</span>
								{getAlertBadge()}
							</div>
							<div className="flex items-center justify-between">
								<span className="text-xs text-muted-foreground">
									Skor Pelanggaran:
								</span>
								<span
									className={`text-sm font-bold ${
										proctoring.score >= 70
											? "text-red-500"
											: proctoring.score >= 30
												? "text-yellow-500"
												: "text-green-500"
									}`}
								>
									{proctoring.score}/100
								</span>
							</div>
						</div>
					</Card>

					<Card>
						<CardContent className="p-4 grid grid-cols-5 gap-2">
							{examData.questions.map((q, i) => (
								<Button
									key={q.id}
									size="sm"
									variant={
										i === currentQuestion
											? "default"
											: answers[q.id]
												? "secondary"
												: "outline"
									}
									className={
										answers[q.id]
											? "border-green-500 text-green-600"
											: ""
									}
									onClick={() => setCurrentQuestion(i)}
								>
									{i + 1}
								</Button>
							))}
						</CardContent>
					</Card>

					{/* Recent Events */}
					{proctoring.events.length > 0 && (
						<Card>
							<CardContent className="p-4">
								<h4 className="text-sm font-medium mb-2">
									Aktivitas Terakhir
								</h4>
								<div className="space-y-1 max-h-32 overflow-y-auto">
									{proctoring.events
										.slice(0, 5)
										.map((event, i) => (
											<div
												key={i}
												className={`text-xs p-2 rounded ${
													event.level === "danger"
														? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
														: event.level ===
															  "warning"
															? "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
															: "bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
												}`}
											>
												{getViolationLabel(event.type)}
											</div>
										))}
								</div>
							</CardContent>
						</Card>
					)}
				</div>
			</div>

			{/* Expanded Camera Modal */}
			<Dialog open={cameraExpanded} onOpenChange={setCameraExpanded}>
				<DialogContent className="max-w-4xl">
					<DialogHeader>
						<DialogTitle className="flex items-center justify-between">
							<span>Tampilan Kamera</span>
							<div className="flex items-center gap-2">
								{getAlertBadge()}
								<span
									className={`text-sm font-bold ${
										proctoring.score >= 70
											? "text-red-500"
											: proctoring.score >= 30
												? "text-yellow-500"
												: "text-green-500"
									}`}
								>
									Skor: {proctoring.score}/100
								</span>
							</div>
						</DialogTitle>
					</DialogHeader>
					<div className="bg-black relative aspect-video w-full">
						<Webcam
							ref={expandedWebcamRef}
							audio={false}
							screenshotFormat="image/jpeg"
							className="w-full h-full object-cover"
							mirrored
						/>

						{/* Violation border overlay */}
						{hasViolation && (
							<div className="absolute inset-0 border-4 border-red-500 animate-pulse pointer-events-none" />
						)}

						{/* Status-based border */}
						{!hasViolation && currentStatus !== "normal" && (
							<div
								className={`absolute inset-0 border-2 pointer-events-none ${
									currentStatus === "danger"
										? "border-red-500/50"
										: "border-yellow-500/50"
								}`}
							/>
						)}

						{/* REC indicator */}
						<div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded animate-pulse">
							● REC
						</div>

						{/* Violation Label - Bottom Left */}
						{proctoring.currentViolation && (
							<div className="absolute bottom-2 left-2 bg-red-600 text-white text-sm px-3 py-1.5 rounded font-bold animate-pulse flex items-center gap-1">
								⚠️{" "}
								{getViolationLabel(proctoring.currentViolation)}
							</div>
						)}

						{/* Connection status */}
						<div className="absolute top-2 right-12">
							{proctoring.isConnected ? (
								<div className="bg-green-600 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
									<Wifi className="h-3 w-3" />
									Live
								</div>
							) : (
								<div className="bg-red-600 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
									<WifiOff className="h-3 w-3" />
									Offline
								</div>
							)}
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
