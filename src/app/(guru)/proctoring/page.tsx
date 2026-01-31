"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
	AlertTriangle, 
	Fingerprint, 
	ScanFace, 
	Wifi, 
	WifiOff,
	User,
	AlertCircle,
	CheckCircle,
	Eye,
	Clock,
	RefreshCw,
	MonitorPlay,
	Users,
	Activity,
	Video,
	VideoOff,
} from "lucide-react";
import { 
	TeacherProctoringSocket, 
	StudentUpdate 
} from "@/lib/proctoring-socket";
import { scoringApi, ExamListItem } from "@/lib/scoring-api";
import { cn } from "@/lib/utils";

type StudentStatus = "safe" | "warning" | "suspicious";

interface ActiveStudent {
	sessionId: string;
	studentId: string;
	studentName: string;
	score: number;
	alertLevel: string;
	status: StudentStatus;
	alerts: Array<{ type: string; level: string; timestamp: string }>;
	annotatedFrame?: string;
	lastUpdate: Date;
	connected: boolean;
}

// Event icons mapping
const EVENT_ICONS: Record<string, string> = {
	head_pose: "🔄",
	eye_gaze: "👁️",
	face_absence: "🚫",
	multiple_faces: "👥",
	object_detected: "📱",
	forbidden_object: "📱",
	tab_switch: "🔀",
	window_blur: "🪟",
	lip_movement: "💬",
};

// Event names mapping
const EVENT_NAMES: Record<string, string> = {
	head_pose: "Head Movement",
	eye_gaze: "Looking Away",
	face_absence: "Face Not Detected",
	multiple_faces: "Multiple Faces",
	object_detected: "Forbidden Object",
	forbidden_object: "Forbidden Object",
	tab_switch: "Tab Switch",
	window_blur: "Window Lost Focus",
	lip_movement: "Talking Detected",
};

export default function ProctoringPage() {
	const [students, setStudents] = useState<ActiveStudent[]>([]);
	const [exams, setExams] = useState<ExamListItem[]>([]);
	const [selectedExam, setSelectedExam] = useState<string>("");
	const [isConnected, setIsConnected] = useState(false);
	const [isConnecting, setIsConnecting] = useState(false);
	const [viewMode, setViewMode] = useState<"grid" | "focus">("grid");
	const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
	const [examStartTime, setExamStartTime] = useState<Date | null>(null);
	const [examDuration, setExamDuration] = useState("00:00:00");
	const socketRef = useRef<TeacherProctoringSocket | null>(null);

	// Fetch available exams on mount
	useEffect(() => {
		const fetchExams = async () => {
			try {
				const { exams: examsList } = await scoringApi.getExams({
					status: "ONGOING",
				});
				setExams(examsList);
				// Auto-select first exam if available
				if (examsList.length > 0 && !selectedExam) {
					setSelectedExam(examsList[0].id);
				}
			} catch (error) {
				console.error("Failed to fetch exams:", error);
			}
		};
		fetchExams();
	}, [selectedExam]);

	// Handle student updates from WebSocket
	const handleStudentUpdate = useCallback((data: StudentUpdate) => {
		console.log("[Proctoring] Received message:", data.type, data);
		
		if (data.type === "initial_state" && data.active_sessions) {
			// Set initial students from active sessions
			console.log("[Proctoring] Initial state with", data.active_sessions.length, "students");
			const initialStudents = data.active_sessions.map(session => ({
				sessionId: session.session_id,
				studentId: session.student_id,
				studentName: session.student_name || "Unknown Student",
				score: session.current_score || 0,
				alertLevel: "normal",
				status: mapAlertToStatus("normal"),
				alerts: [],
				lastUpdate: new Date(session.started_at),
				connected: true,
			}));
			setStudents(initialStudents);
			setExamStartTime(new Date());
		} else if (data.type === "student_connected") {
			// Add new student
			setStudents(prev => {
				// Check if already exists
				if (prev.find(s => s.sessionId === data.session_id)) {
					return prev;
				}
				return [...prev, {
					sessionId: data.session_id || "",
					studentId: data.student_id || "",
					studentName: data.student_name || "Unknown Student",
					score: 0,
					alertLevel: "normal",
					status: "safe",
					alerts: [],
					lastUpdate: new Date(),
					connected: true,
				}];
			});
		} else if (data.type === "student_disconnected") {
			// Mark student as disconnected, remove after delay
			setStudents(prev => prev.map(s => 
				s.sessionId === data.session_id 
					? { ...s, connected: false }
					: s
			));
			// Remove after 5 seconds
			setTimeout(() => {
				setStudents(prev => prev.filter(s => s.sessionId !== data.session_id));
			}, 5000);
		} else if (data.type === "student_update") {
			// Update existing student
			console.log("[Proctoring] Student update:", data.session_id, "score:", data.score, "has_frame:", !!data.annotated_frame);
			setStudents(prev => prev.map(student => {
				if (student.sessionId === data.session_id) {
					const newAlerts = data.recent_events
						?.filter(e => e.level !== "info")
						.map(e => ({
							type: e.type,
							level: e.level,
							timestamp: e.timestamp,
						})) || [];
					
					return {
						...student,
						score: data.score || student.score,
						alertLevel: data.alert_level || student.alertLevel,
						status: mapAlertToStatus(data.alert_level || "normal"),
						alerts: newAlerts.length > 0 
							? [...newAlerts, ...student.alerts].slice(0, 5) 
							: student.alerts,
						annotatedFrame: data.annotated_frame,
						lastUpdate: new Date(),
						connected: true,
					};
				}
				return student;
			}));
		}
	}, []);

	const mapAlertToStatus = (alertLevel: string): StudentStatus => {
		switch (alertLevel) {
			case "danger":
			case "critical":
			case "alert": 
				return "suspicious";
			case "warning": 
				return "warning";
			default: 
				return "safe";
		}
	};

	// Connect to WebSocket when exam is selected
	useEffect(() => {
		if (!selectedExam) return;

		// Disconnect previous connection
		if (socketRef.current) {
			socketRef.current.disconnect();
		}

		setIsConnecting(true);
		setStudents([]);

		// Connect to teacher WebSocket
		const socket = new TeacherProctoringSocket(
			selectedExam,
			handleStudentUpdate,
			() => {
				setIsConnected(false);
				setIsConnecting(false);
			},
			() => {
				setIsConnected(false);
				setIsConnecting(false);
			}
		);
		
		socket.connect();
		socketRef.current = socket;
		
		// Wait a bit then check connection status
		setTimeout(() => {
			if (socket.isConnected()) {
				setIsConnected(true);
			}
			setIsConnecting(false);
		}, 1000);

		return () => {
			if (socketRef.current) {
				socketRef.current.disconnect();
			}
		};
	}, [selectedExam, handleStudentUpdate]);

	// Exam duration timer
	useEffect(() => {
		if (!examStartTime || !isConnected) return;

		const interval = setInterval(() => {
			const now = new Date();
			const diff = now.getTime() - examStartTime.getTime();
			const hours = Math.floor(diff / 3600000);
			const minutes = Math.floor((diff % 3600000) / 60000);
			const seconds = Math.floor((diff % 60000) / 1000);
			setExamDuration(
				`${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
			);
		}, 1000);

		return () => clearInterval(interval);
	}, [examStartTime, isConnected]);

	const suspiciousCount = students.filter(s => s.status === "suspicious").length;
	const warningCount = students.filter(s => s.status === "warning").length;
	const activeCount = students.filter(s => s.connected).length;

	const statusColor = {
		safe: "border-green-500/50 bg-green-500/5",
		warning: "border-yellow-500/50 bg-yellow-500/5",
		suspicious: "border-red-500/50 bg-red-500/5",
	};

	const selectedStudent = selectedStudentId 
		? students.find(s => s.sessionId === selectedStudentId)
		: null;

	const handleReconnect = () => {
		if (selectedExam && socketRef.current) {
			socketRef.current.disconnect();
			setIsConnecting(true);
			const socket = new TeacherProctoringSocket(
				selectedExam,
				handleStudentUpdate,
				() => setIsConnected(false),
				() => setIsConnected(false)
			);
			socket.connect();
			socketRef.current = socket;
			setTimeout(() => {
				if (socket.isConnected()) {
					setIsConnected(true);
				}
				setIsConnecting(false);
			}, 1000);
		}
	};

	const formatTime = (date: Date) => {
		return date.toLocaleTimeString("id-ID", {
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
		});
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
						<MonitorPlay className="h-8 w-8 text-primary" />
						Smart Proctoring
					</h2>
					<p className="text-muted-foreground">
						Live AI monitoring for active exams with real-time camera feeds.
					</p>
				</div>
				<div className="flex gap-4 items-center">
					{/* Connection Status */}
					<div className="flex items-center gap-2">
						{isConnecting ? (
							<Badge className="bg-yellow-500 gap-1">
								<RefreshCw className="h-3 w-3 animate-spin" />
								Connecting...
							</Badge>
						) : isConnected ? (
							<Badge className="bg-green-500 gap-1">
								<Wifi className="h-3 w-3" />
								Live Connected
							</Badge>
						) : (
							<Badge variant="destructive" className="gap-1 cursor-pointer" onClick={handleReconnect}>
								<WifiOff className="h-3 w-3" />
								Disconnected - Click to Reconnect
							</Badge>
						)}
					</div>

					{/* Exam Selector */}
					<Select
						value={selectedExam}
						onValueChange={setSelectedExam}
					>
						<SelectTrigger className="w-[280px]">
							<SelectValue placeholder="Select Exam to Monitor" />
						</SelectTrigger>
						<SelectContent>
							{exams.length === 0 ? (
								<SelectItem value="none" disabled>
									No active exams
								</SelectItem>
							) : (
								exams.map((exam) => (
									<SelectItem key={exam.id} value={exam.id}>
										{exam.title}
									</SelectItem>
								))
							)}
						</SelectContent>
					</Select>

					{/* View Mode Toggle */}
					<Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "grid" | "focus")}>
						<TabsList>
							<TabsTrigger value="grid">Grid</TabsTrigger>
							<TabsTrigger value="focus">Focus</TabsTrigger>
						</TabsList>
					</Tabs>
				</div>
			</div>

			{/* Stats Cards */}
			<div className="grid gap-4 md:grid-cols-4">
				<Card className="bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium text-red-600">
							Suspicious Activity
						</CardTitle>
						<AlertTriangle className="h-4 w-4 text-red-600" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-red-600">
							{suspiciousCount}
						</div>
						<p className="text-xs text-red-600/80">
							Students flagged as high risk
						</p>
					</CardContent>
				</Card>

				<Card className="bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-900">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium text-yellow-600">
							Warnings
						</CardTitle>
						<ScanFace className="h-4 w-4 text-yellow-600" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-yellow-600">
							{warningCount}
						</div>
						<p className="text-xs text-yellow-600/80">
							Minor deviations detected
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Active Students
						</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{activeCount}</div>
						<p className="text-xs text-muted-foreground">
							Currently in session
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Exam Duration
						</CardTitle>
						<Clock className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold font-mono">{examDuration}</div>
						<p className="text-xs text-muted-foreground">
							Time since monitoring started
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Main Content */}
			{viewMode === "grid" ? (
				// Grid View - All Students
				students.length > 0 ? (
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						{students.map((student) => (
							<StudentCard 
								key={student.sessionId} 
								student={student}
								statusColor={statusColor}
								onClick={() => {
									setSelectedStudentId(student.sessionId);
									setViewMode("focus");
								}}
							/>
						))}
					</div>
				) : (
					<EmptyState isConnected={isConnected} selectedExam={selectedExam} />
				)
			) : (
				// Focus View - Selected Student Detail
				<div className="grid gap-6 md:grid-cols-3">
					{/* Student List Sidebar */}
					<Card className="md:col-span-1">
						<CardHeader>
							<CardTitle className="text-sm font-medium">Students</CardTitle>
						</CardHeader>
						<CardContent className="p-0">
							<ScrollArea className="h-[500px]">
								<div className="space-y-1 p-4">
									{students.map((student) => (
										<div
											key={student.sessionId}
											className={cn(
												"flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
												selectedStudentId === student.sessionId
													? "bg-primary/10 border border-primary/20"
													: "hover:bg-muted"
											)}
											onClick={() => setSelectedStudentId(student.sessionId)}
										>
											<Avatar className="h-8 w-8">
												<AvatarFallback>{student.studentName[0]}</AvatarFallback>
											</Avatar>
											<div className="flex-1 min-w-0">
												<p className="text-sm font-medium truncate">{student.studentName}</p>
												<p className="text-xs text-muted-foreground">Score: {student.score}</p>
											</div>
											<StatusIndicator status={student.status} />
										</div>
									))}
								</div>
							</ScrollArea>
						</CardContent>
					</Card>

					{/* Selected Student Detail */}
					<Card className="md:col-span-2">
						{selectedStudent ? (
							<>
								<CardHeader className="flex flex-row items-center justify-between">
									<div className="flex items-center gap-3">
										<Avatar className="h-12 w-12">
											<AvatarFallback className="text-lg">{selectedStudent.studentName[0]}</AvatarFallback>
										</Avatar>
										<div>
											<CardTitle>{selectedStudent.studentName}</CardTitle>
											<p className="text-sm text-muted-foreground">ID: {selectedStudent.studentId}</p>
										</div>
									</div>
									<div className="flex items-center gap-2">
										<Badge
											variant={
												selectedStudent.status === "suspicious" ? "destructive" :
												selectedStudent.status === "warning" ? "secondary" : "secondary"
											}
											className={cn(
												selectedStudent.status === "safe" && "bg-green-500 hover:bg-green-600 text-white",
												selectedStudent.status === "warning" && "bg-yellow-500 hover:bg-yellow-600 text-white",
											)}
										>
											{selectedStudent.status.toUpperCase()}
										</Badge>
										<Badge variant="outline">Score: {selectedStudent.score}/100</Badge>
									</div>
								</CardHeader>
								<CardContent className="space-y-4">
									{/* Large Video Feed */}
									<div className="relative aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
										{selectedStudent.annotatedFrame ? (
											<img
												src={`data:image/jpeg;base64,${selectedStudent.annotatedFrame}`}
												alt={selectedStudent.studentName}
												className="w-full h-full object-cover"
											/>
										) : (
											<div className="flex flex-col items-center gap-2 text-muted-foreground">
												<VideoOff className="h-16 w-16" />
												<p>Waiting for camera feed...</p>
											</div>
										)}
										{/* Overlay badges */}
										<div className="absolute top-3 right-3 flex items-center gap-2">
											{selectedStudent.connected ? (
												<Badge className="bg-green-500/90"><Activity className="h-3 w-3 mr-1" /> Live</Badge>
											) : (
												<Badge variant="destructive"><VideoOff className="h-3 w-3 mr-1" /> Offline</Badge>
											)}
										</div>
									</div>

									{/* Recent Events */}
									<div>
										<h4 className="text-sm font-medium mb-2">Recent Events</h4>
										<div className="space-y-2">
											{selectedStudent.alerts.length > 0 ? (
												selectedStudent.alerts.map((alert, i) => (
													<div
														key={i}
														className={cn(
															"flex items-center gap-3 p-3 rounded-lg",
															alert.level === "warning" && "bg-yellow-50 dark:bg-yellow-900/10",
															alert.level === "danger" && "bg-red-50 dark:bg-red-900/10",
														)}
													>
														<span className="text-xl">{EVENT_ICONS[alert.type] || "⚠️"}</span>
														<div className="flex-1">
															<p className="text-sm font-medium">{EVENT_NAMES[alert.type] || alert.type}</p>
															<p className="text-xs text-muted-foreground">
																{new Date(alert.timestamp).toLocaleTimeString("id-ID")}
															</p>
														</div>
														<Badge variant={alert.level === "danger" ? "destructive" : "secondary"}>
															{alert.level}
														</Badge>
													</div>
												))
											) : (
												<p className="text-sm text-muted-foreground text-center py-4">No recent events</p>
											)}
										</div>
									</div>
								</CardContent>
							</>
						) : (
							<CardContent className="flex items-center justify-center h-[500px]">
								<div className="text-center text-muted-foreground">
									<User className="h-16 w-16 mx-auto mb-4 opacity-30" />
									<p>Select a student to view details</p>
								</div>
							</CardContent>
						)}
					</Card>
				</div>
			)}
		</div>
	);
}

// Student Card Component
function StudentCard({ 
	student, 
	statusColor, 
	onClick 
}: { 
	student: ActiveStudent; 
	statusColor: Record<string, string>;
	onClick: () => void;
}) {
	return (
		<Card
			className={cn(
				"overflow-hidden border-2 transition-all cursor-pointer hover:shadow-lg",
				statusColor[student.status],
				!student.connected && "opacity-60"
			)}
			onClick={onClick}
		>
			{/* Video Feed */}
			<div className="relative aspect-video bg-muted flex items-center justify-center">
				{student.annotatedFrame ? (
					<img
						src={`data:image/jpeg;base64,${student.annotatedFrame}`}
						alt={student.studentName}
						className="w-full h-full object-cover"
					/>
				) : (
					<div className="flex flex-col items-center gap-1 text-muted-foreground">
						{student.connected ? (
							<>
								<Video className="h-8 w-8 animate-pulse" />
								<span className="text-xs">Waiting for feed...</span>
							</>
						) : (
							<>
								<VideoOff className="h-8 w-8" />
								<span className="text-xs">Disconnected</span>
							</>
						)}
					</div>
				)}

				{/* Status Badge */}
				<div className="absolute top-2 right-2">
					<Badge
						variant={
							student.status === "suspicious" ? "destructive" :
							student.status === "warning" ? "secondary" : "secondary"
						}
						className={cn(
							student.status === "safe" && "bg-green-500 hover:bg-green-600 text-white",
							student.status === "warning" && "bg-yellow-500 hover:bg-yellow-600 text-white",
						)}
					>
						{student.status.toUpperCase()}
					</Badge>
				</div>

				{/* Score indicator */}
				<div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
					Score: {student.score}/100
				</div>

				{/* Live indicator */}
				{student.connected && (
					<div className="absolute top-2 left-2">
						<Badge className="bg-red-500 text-white gap-1">
							<span className="w-2 h-2 bg-white rounded-full animate-pulse" />
							LIVE
						</Badge>
					</div>
				)}
			</div>

			{/* Student Info */}
			<div className="p-3">
				<div className="flex items-center justify-between mb-2">
					<div className="flex items-center gap-2">
						<Avatar className="h-6 w-6">
							<AvatarFallback>{student.studentName[0]}</AvatarFallback>
						</Avatar>
						<span className="font-medium text-sm truncate max-w-[120px]">
							{student.studentName}
						</span>
					</div>
					<StatusIndicator status={student.status} />
				</div>

				{/* Recent Alerts */}
				<div className="space-y-1">
					{student.alerts.length > 0 ? (
						student.alerts.slice(0, 2).map((alert, i) => (
							<div
								key={i}
								className="text-xs flex items-center gap-1 text-red-500"
							>
								<span>{EVENT_ICONS[alert.type] || "⚠️"}</span>
								<span className="truncate">{EVENT_NAMES[alert.type] || alert.type}</span>
							</div>
						))
					) : (
						<div className="text-xs text-muted-foreground flex items-center gap-1">
							<CheckCircle className="h-3 w-3 text-green-500" />
							No active alerts
						</div>
					)}
				</div>
			</div>
		</Card>
	);
}

// Status Indicator Component
function StatusIndicator({ status }: { status: StudentStatus }) {
	switch (status) {
		case "safe":
			return <CheckCircle className="h-4 w-4 text-green-500" />;
		case "warning":
			return <AlertCircle className="h-4 w-4 text-yellow-500" />;
		case "suspicious":
			return <AlertTriangle className="h-4 w-4 text-red-500" />;
	}
}

// Empty State Component
function EmptyState({ isConnected, selectedExam }: { isConnected: boolean; selectedExam: string }) {
	return (
		<Card className="p-12">
			<div className="text-center text-muted-foreground">
				<User className="h-16 w-16 mx-auto mb-4 opacity-30" />
				{!selectedExam ? (
					<>
						<h3 className="text-lg font-medium mb-2">Pilih Ujian</h3>
						<p className="text-sm">
							Pilih ujian dari dropdown untuk mulai memantau siswa.
						</p>
					</>
				) : !isConnected ? (
					<>
						<h3 className="text-lg font-medium mb-2">Menghubungkan...</h3>
						<p className="text-sm">
							Menghubungkan ke server proctoring...
						</p>
					</>
				) : (
					<>
						<h3 className="text-lg font-medium mb-2">Belum Ada Siswa</h3>
						<p className="text-sm">
							Menunggu siswa untuk bergabung dalam sesi ujian...
						</p>
					</>
				)}
			</div>
		</Card>
	);
}
