"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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
	DialogTitle 
} from "@/components/ui/dialog";
import { ExamTimer } from "@/components/features/exams/ExamTimer";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/lib/store";
import { tokenManager } from "@/lib/api";
import { 
	StudentProctoringSocket, 
	DetectionResult 
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
	X
} from "lucide-react";

// API base URL
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// Mock Questions (in real app, fetch from API)
const questions = [
	{ id: 1, text: "Apa hasil dari 5 + 5?", options: ["8", "10", "12", "15"] },
	{
		id: 2,
		text: "Ibukota Indonesia adalah?",
		options: ["Bandung", "Surabaya", "Jakarta", "Medan"],
	},
	{
		id: 3,
		text: "Siapa penemu lampu pijar?",
		options: ["Einstein", "Tesla", "Edison", "Newton"],
	},
];

// Label pelanggaran dalam Bahasa Indonesia
const violationLabels: Record<string, string> = {
	"face_absence": "Wajah Tidak Terdeteksi",
	"head_pose": "Menoleh",
	"eye_gaze": "Mata Melihat Lain",
	"object_detected": "HP Terdeteksi",
	"phone_detected": "HP Terdeteksi",
	"multi_face": "Banyak Wajah",
	"tab_switch": "Ganti Tab",
	"window_blur": "Ganti Jendela",
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

export default function ExamPage() {
	const [currentQuestion, setCurrentQuestion] = useState(0);
	const [answers, setAnswers] = useState<Record<number, string>>({});
	const [examStarted, setExamStarted] = useState(false);
	const [cameraExpanded, setCameraExpanded] = useState(false);
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

	// Calculate status based on score
	const getStatusFromScore = (score: number): "normal" | "warning" | "danger" => {
		if (score >= 70) return "danger";
		if (score >= 30) return "warning";
		return "normal";
	};

	// Start proctoring session
	const startProctoringSession = useCallback(async () => {
		if (!user) return;

		try {
			const token = tokenManager.getAccessToken();
			const response = await fetch(`${API_BASE}/proctoring/sessions/start`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${token}`,
				},
				body: JSON.stringify({
					examId: "exam-demo-001",
					examName: "Ujian Pengetahuan Umum",
				}),
			});

			if (!response.ok) {
				throw new Error("Failed to start proctoring session");
			}

			const result = await response.json();
			const sessionId = result.data.sessionId;

			// Connect to WebSocket
			const socket = new StudentProctoringSocket(
				sessionId,
				handleProctoringMessage,
				handleProctoringError,
				handleProctoringClose
			);
			socket.connect();
			proctoringSocketRef.current = socket;

			setProctoring(prev => ({
				...prev,
				sessionId,
				isConnected: true,
			}));

			// Start sending frames every 500ms
			frameIntervalRef.current = setInterval(() => {
				captureAndSendFrame();
			}, 500);

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
	}, [user, toast]);

	// Handle proctoring messages
	const handleProctoringMessage = useCallback((data: DetectionResult) => {
		if (data.type === "result") {
			const newScore = data.score || 0;
			const newAlertLevel = getStatusFromScore(newScore);
			
			// Extract current violation from events
			let currentViolation: string | null = null;
			if (data.events && data.events.length > 0) {
				const dangerEvent = data.events.find(e => e.level === "danger" || e.level === "warning");
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
				else if (data.detections.face && data.detections.face.count > 1) {
					currentViolation = "multi_face";
				}
				// Check for forbidden objects (phone)
				else if (data.detections.objects?.some(obj => obj.is_forbidden)) {
					currentViolation = "object_detected";
				}
			}
			
			// Extract detected objects (phones, etc.)
			const detectedObjects: string[] = [];
			if (data.detections?.objects) {
				data.detections.objects.forEach(obj => {
					if (obj.is_forbidden) {
						detectedObjects.push(obj.label);
					}
				});
			}
			
			setProctoring(prev => ({
				...prev,
				score: newScore,
				alertLevel: newAlertLevel,
				currentViolation,
				annotatedFrame: data.annotated_frame || null,
				detectedObjects,
				events: data.events 
					? [
						...data.events.map(e => ({
							type: e.type,
							level: e.level,
							timestamp: new Date(),
						})),
						...prev.events,
					].slice(0, 10)
					: prev.events,
			}));

			// Clear violation after 3 seconds (increased from 2s)
			if (currentViolation) {
				if (violationTimeoutRef.current) {
					clearTimeout(violationTimeoutRef.current);
				}
				violationTimeoutRef.current = setTimeout(() => {
					setProctoring(prev => ({ ...prev, currentViolation: null }));
				}, 3000);
			}

			// Show warning toast for suspicious activity
			if (newAlertLevel === "danger" && data.alert_level === "danger") {
				toast({
					title: "Aktivitas Mencurigakan Terdeteksi!",
					description: "Sistem mendeteksi perilaku yang tidak wajar",
					variant: "destructive",
				});
			}
		} else if (data.type === "connected") {
			setProctoring(prev => ({ ...prev, isConnected: true }));
		}
	}, [toast]);

	const handleProctoringError = useCallback((error: Event) => {
		console.error("Proctoring error:", error);
		setProctoring(prev => ({ ...prev, isConnected: false }));
	}, []);

	const handleProctoringClose = useCallback((event: CloseEvent) => {
		console.log("Proctoring closed:", event);
		setProctoring(prev => ({ ...prev, isConnected: false }));
	}, []);

	// Capture webcam frame and send to proctoring service
	const captureAndSendFrame = useCallback(() => {
		const webcam = cameraExpanded ? expandedWebcamRef.current : webcamRef.current;
		if (webcam && proctoringSocketRef.current?.isConnected()) {
			const imageSrc = webcam.getScreenshot();
			if (imageSrc) {
				proctoringSocketRef.current.sendFrame(imageSrc);
			}
		}
	}, [cameraExpanded]);

	// Detect tab switches
	useEffect(() => {
		const handleVisibilityChange = () => {
			if (document.hidden && proctoringSocketRef.current?.isConnected()) {
				proctoringSocketRef.current.sendBrowserEvent("tab_switch", {
					timestamp: new Date().toISOString(),
				});
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
			}
		};

		document.addEventListener("visibilitychange", handleVisibilityChange);
		window.addEventListener("blur", handleBlur);

		return () => {
			document.removeEventListener("visibilitychange", handleVisibilityChange);
			window.removeEventListener("blur", handleBlur);
		};
	}, [toast]);

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
		setExamStarted(true);
		await startProctoringSession();
	};

	const handleAnswer = (value: string) => {
		setAnswers({ ...answers, [currentQuestion]: value });
	};

	const handleSubmit = async () => {
		// End proctoring session
		if (proctoring.sessionId) {
			try {
				const token = tokenManager.getAccessToken();
				await fetch(`${API_BASE}/proctoring/sessions/${proctoring.sessionId}/end`, {
					method: "POST",
					headers: {
						"Authorization": `Bearer ${token}`,
					},
				});
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
	};

	// Pre-exam camera check
	if (!examStarted) {
		return (
			<div className="flex items-center justify-center min-h-[calc(100vh-100px)]">
				<Card className="w-full max-w-lg">
					<CardContent className="p-8 space-y-6">
						<div className="text-center">
							<h2 className="text-2xl font-bold mb-2">Persiapan Ujian</h2>
							<p className="text-muted-foreground">
								Pastikan kamera aktif sebelum memulai
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
									<li>Jangan bawa HP atau barang terlarang</li>
								</ul>
							</div>
						</div>

						<Button 
							onClick={handleStartExam} 
							className="w-full h-12 text-lg bg-gradient-primary"
						>
							<Camera className="mr-2 h-5 w-5" />
							Mulai Ujian
						</Button>
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

	return (
		<>
			<div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-100px)]">
				{/* Main Exam Area */}
				<div className="flex-1 flex flex-col gap-6">
					<div className="flex items-center justify-between bg-card p-4 rounded-lg border shadow-sm">
						<div>
							<h2 className="text-xl font-bold">
								Ujian Pengetahuan Umum
							</h2>
							<p className="text-sm text-muted-foreground">
								Soal {currentQuestion + 1} dari {questions.length}
							</p>
						</div>
						<ExamTimer durationMinutes={30} onTimeUp={handleSubmit} />
					</div>

					<Card className="flex-1">
						<CardContent className="p-8">
							<h3 className="text-lg font-medium mb-6">
								{questions[currentQuestion].text}
							</h3>
							<RadioGroup
								value={answers[currentQuestion]}
								onValueChange={handleAnswer}
								className="space-y-4"
							>
								{questions[currentQuestion].options.map(
									(opt, i) => (
										<div
											key={i}
											className="flex items-center space-x-2 border p-4 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
										>
											<RadioGroupItem
												value={opt}
												id={`opt-${i}`}
											/>
											<Label
												htmlFor={`opt-${i}`}
												className="flex-1 cursor-pointer"
											>
												{opt}
											</Label>
										</div>
									),
								)}
							</RadioGroup>
						</CardContent>
					</Card>

					<div className="flex justify-between">
						<Button
							variant="outline"
							disabled={currentQuestion === 0}
							onClick={() => setCurrentQuestion((prev) => prev - 1)}
						>
							Sebelumnya
						</Button>

						{currentQuestion === questions.length - 1 ? (
							<Button
								onClick={handleSubmit}
								className="bg-gradient-primary"
							>
								Kumpulkan
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
								<div className={`absolute inset-0 border-2 pointer-events-none ${
									currentStatus === "danger" ? "border-red-500/50" : "border-yellow-500/50"
								}`} />
							)}
							
							{/* REC indicator */}
							<div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] px-2 py-0.5 rounded animate-pulse">
								● REC
							</div>
							
							{/* Violation Label - Bottom Left */}
							{proctoring.currentViolation && (
								<div className="absolute bottom-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded font-bold animate-pulse flex items-center gap-1">
									⚠️ {getViolationLabel(proctoring.currentViolation)}
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
							
							{/* Violation type label - Top Right */}
							{proctoring.currentViolation && (
								<div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded font-medium animate-pulse">
									⚠ {getViolationLabel(proctoring.currentViolation)}
								</div>
							)}
							
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
								<span className="text-xs text-muted-foreground">Status:</span>
								{getAlertBadge()}
							</div>
							<div className="flex items-center justify-between">
								<span className="text-xs text-muted-foreground">Skor Pelanggaran:</span>
								<span className={`text-sm font-bold ${
									proctoring.score >= 70 ? "text-red-500" :
									proctoring.score >= 30 ? "text-yellow-500" : "text-green-500"
								}`}>
									{proctoring.score}/100
								</span>
							</div>
						</div>
					</Card>

					<Card>
						<CardContent className="p-4 grid grid-cols-5 gap-2">
							{questions.map((q, i) => (
								<Button
									key={i}
									size="sm"
									variant={
										i === currentQuestion
											? "default"
											: answers[i]
												? "secondary"
												: "outline"
									}
									className={
										answers[i]
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
								<h4 className="text-sm font-medium mb-2">Aktivitas Terakhir</h4>
								<div className="space-y-1 max-h-32 overflow-y-auto">
									{proctoring.events.slice(0, 5).map((event, i) => (
										<div 
											key={i} 
											className={`text-xs p-2 rounded ${
												event.level === "danger" ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400" :
												event.level === "warning" ? "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400" :
												"bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
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
								<span className={`text-sm font-bold ${
									proctoring.score >= 70 ? "text-red-500" :
									proctoring.score >= 30 ? "text-yellow-500" : "text-green-500"
								}`}>
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
							<div className={`absolute inset-0 border-2 pointer-events-none ${
								currentStatus === "danger" ? "border-red-500/50" : "border-yellow-500/50"
							}`} />
						)}
						
						{/* REC indicator */}
						<div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded animate-pulse">
							● REC
						</div>
						
						{/* Violation Label - Bottom Left */}
						{proctoring.currentViolation && (
							<div className="absolute bottom-2 left-2 bg-red-600 text-white text-sm px-3 py-1.5 rounded font-bold animate-pulse flex items-center gap-1">
								⚠️ {getViolationLabel(proctoring.currentViolation)}
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
						
						{/* Violation type label */}
						{proctoring.currentViolation && (
							<div className="absolute top-2 right-2 bg-red-600 text-white text-sm px-3 py-1 rounded font-medium animate-pulse">
								⚠ {getViolationLabel(proctoring.currentViolation)}
							</div>
						)}
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
