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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
	AlertTriangle, 
	Fingerprint, 
	ScanFace, 
	Wifi, 
	WifiOff,
	User,
	AlertCircle,
	CheckCircle,
	Eye
} from "lucide-react";
import { 
	TeacherProctoringSocket, 
	StudentUpdate 
} from "@/lib/proctoring-socket";
import { cn } from "@/lib/utils";

// API base URL
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

type StudentStatus = "safe" | "warning" | "suspicious";

interface ActiveStudent {
	sessionId: string;
	studentId: string;
	studentName: string;
	score: number;
	alertLevel: string;
	status: StudentStatus;
	alerts: string[];
	annotatedFrame?: string;
	lastUpdate: Date;
}

export default function ProctoringPage() {
	const [students, setStudents] = useState<ActiveStudent[]>([]);
	const [selectedExam, setSelectedExam] = useState("exam-demo-001");
	const [isConnected, setIsConnected] = useState(false);
	const socketRef = useRef<TeacherProctoringSocket | null>(null);

	// Handle student updates from WebSocket
	const handleStudentUpdate = useCallback((data: StudentUpdate) => {
		if (data.type === "initial_state" && data.active_sessions) {
			// Set initial students from active sessions
			const initialStudents = data.active_sessions.map(session => ({
				sessionId: session.session_id,
				studentId: session.student_id,
				studentName: session.student_name || "Unknown Student",
				score: session.current_score || 0,
				alertLevel: "normal",
				status: mapAlertToStatus("normal"),
				alerts: [],
				lastUpdate: new Date(session.started_at),
			}));
			setStudents(initialStudents);
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
				}];
			});
		} else if (data.type === "student_disconnected") {
			// Remove student
			setStudents(prev => prev.filter(s => s.sessionId !== data.session_id));
		} else if (data.type === "student_update") {
			// Update existing student
			setStudents(prev => prev.map(student => {
				if (student.sessionId === data.session_id) {
					const newAlerts = data.recent_events
						?.filter(e => e.level !== "info")
						.map(e => e.type.replace(/_/g, " ")) || [];
					
					return {
						...student,
						score: data.score || student.score,
						alertLevel: data.alert_level || student.alertLevel,
						status: mapAlertToStatus(data.alert_level || "normal"),
						alerts: newAlerts.length > 0 ? newAlerts : student.alerts,
						annotatedFrame: data.annotated_frame,
						lastUpdate: new Date(),
					};
				}
				return student;
			}));
		}
	}, []);

	const mapAlertToStatus = (alertLevel: string): StudentStatus => {
		switch (alertLevel) {
			case "danger": return "suspicious";
			case "warning": return "warning";
			default: return "safe";
		}
	};

	// Connect to WebSocket when exam is selected
	useEffect(() => {
		// Disconnect previous connection
		if (socketRef.current) {
			socketRef.current.disconnect();
		}

		// Connect to teacher WebSocket
		const socket = new TeacherProctoringSocket(
			selectedExam,
			handleStudentUpdate,
			() => setIsConnected(false),
			() => setIsConnected(false)
		);
		socket.connect();
		socketRef.current = socket;
		setIsConnected(true);

		return () => {
			if (socketRef.current) {
				socketRef.current.disconnect();
			}
		};
	}, [selectedExam, handleStudentUpdate]);

	const suspiciousCount = students.filter(
		(s) => s.status === "suspicious",
	).length;
	const warningCount = students.filter((s) => s.status === "warning").length;

	const statusColor = {
		safe: "border-green-500/50 bg-green-500/5",
		warning: "border-yellow-500/50 bg-yellow-500/5",
		suspicious: "border-red-500/50 bg-red-500/5",
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-3xl font-bold tracking-tight">
						Smart Proctoring
					</h2>
					<p className="text-muted-foreground">
						Live AI monitoring for active exams.
					</p>
				</div>
				<div className="flex gap-4 items-center">
					<div className="flex items-center gap-2">
						{isConnected ? (
							<Badge className="bg-green-500 gap-1">
								<Wifi className="h-3 w-3" />
								Live Connected
							</Badge>
						) : (
							<Badge variant="destructive" className="gap-1">
								<WifiOff className="h-3 w-3" />
								Disconnected
							</Badge>
						)}
					</div>
					<Select
						value={selectedExam}
						onValueChange={setSelectedExam}
					>
						<SelectTrigger className="w-[200px]">
							<SelectValue placeholder="Select Exam" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="exam-demo-001">
								Ujian Pengetahuan Umum
							</SelectItem>
							<SelectItem value="exam-math-001">
								Ujian Matematika (X-A)
							</SelectItem>
							<SelectItem value="exam-physics-001">
								Ujian Fisika (XI-B)
							</SelectItem>
						</SelectContent>
					</Select>
					<Button variant="destructive">End Exam Session</Button>
				</div>
			</div>

			<div className="grid gap-4 md:grid-cols-3">
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
							Total Active
						</CardTitle>
						<Fingerprint className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{students.length}
						</div>
						<p className="text-xs text-muted-foreground">
							Students in session
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Live Camera Grid */}
			{students.length > 0 ? (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{students.map((student) => (
						<Card
							key={student.sessionId}
							className={cn(
								"overflow-hidden border-2 transition-all",
								statusColor[student.status],
							)}
						>
							<div className="relative aspect-video bg-muted flex items-center justify-center">
								{student.annotatedFrame ? (
									<img
										src={student.annotatedFrame}
										alt={student.studentName}
										className="w-full h-full object-cover"
									/>
								) : (
									<User className="h-12 w-12 text-muted-foreground/50" />
								)}

								<div className="absolute top-2 right-2">
									<Badge
										variant={
											student.status === "suspicious" ? "destructive" :
											student.status === "warning" ? "secondary" : "secondary"
										}
										className={cn(
											student.status === "safe" &&
												"bg-green-500 hover:bg-green-600 text-white",
											student.status === "warning" &&
												"bg-yellow-500 hover:bg-yellow-600 text-white",
										)}
									>
										{student.status.toUpperCase()}
									</Badge>
								</div>

								{/* Score indicator */}
								<div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
									Score: {student.score}/100
								</div>
							</div>

							<div className="p-3">
								<div className="flex items-center justify-between mb-2">
									<div className="flex items-center gap-2">
										<Avatar className="h-6 w-6">
											<AvatarFallback>{student.studentName[0]}</AvatarFallback>
										</Avatar>
										<span className="font-medium text-sm truncate">
											{student.studentName}
										</span>
									</div>
									{student.status === "safe" ? (
										<CheckCircle className="h-4 w-4 text-green-500" />
									) : (
										<AlertCircle
											className={cn(
												"h-4 w-4",
												student.status === "suspicious"
													? "text-red-500"
													: "text-yellow-500",
											)}
										/>
									)}
								</div>

								<div className="space-y-1">
									{student.alerts.length > 0 ? (
										student.alerts.slice(0, 2).map((alert, i) => (
											<div
												key={i}
												className="text-xs text-red-500 flex items-center gap-1"
											>
												<Eye className="h-3 w-3" /> {alert}
											</div>
										))
									) : (
										<div className="text-xs text-muted-foreground">
											No active alerts
										</div>
									)}
								</div>
							</div>
						</Card>
					))}
				</div>
			) : (
				<Card className="p-12">
					<div className="text-center text-muted-foreground">
						<User className="h-16 w-16 mx-auto mb-4 opacity-30" />
						<h3 className="text-lg font-medium mb-2">Belum Ada Siswa</h3>
						<p className="text-sm">
							Menunggu siswa untuk bergabung dalam sesi ujian...
						</p>
					</div>
				</Card>
			)}
		</div>
	);
}
