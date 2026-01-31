"use client";

// Proctoring WebSocket client for cheating detection service
// Connects to: https://cheating-detection-865275048150.asia-southeast2.run.app

const PROCTORING_WS_BASE = process.env.NEXT_PUBLIC_PROCTORING_WS_URL || 
	"wss://cheating-detection-865275048150.asia-southeast2.run.app";

// Detection result from the cheating detection service
export interface DetectionResult {
	type: "result" | "connected" | "error";
	timestamp?: string;
	score?: number;
	alert_level?: "normal" | "warning" | "danger";
	annotated_frame?: string; // base64 encoded annotated frame
	detections?: {
		head_pose?: {
			yaw: number | null;
			pitch: number | null;
			direction: string | null;
			is_suspicious: boolean;
		};
		eye_gaze?: {
			direction: string | null;
			is_looking_away: boolean;
			frequency: number;
		};
		face?: {
			count: number;
			present: boolean;
			absence_duration: number;
		};
		objects?: {
			label: string;
			confidence: number;
			is_forbidden: boolean;
		}[];
	};
	events?: {
		type: string;
		level: string;
		score_delta: number;
		details?: Record<string, unknown>;
	}[];
	message?: string;
}

// Student update for teachers
export interface StudentUpdate {
	type: "student_update" | "student_connected" | "student_disconnected" | "initial_state";
	session_id?: string;
	student_id?: string;
	student_name?: string;
	score?: number;
	alert_level?: string;
	timestamp?: string;
	annotated_frame?: string;
	recent_events?: {
		type: string;
		level: string;
		score_delta: number;
		timestamp: string;
	}[];
	// For initial_state
	exam_id?: string;
	active_sessions?: {
		session_id: string;
		student_id: string;
		student_name: string;
		current_score: number;
		started_at: string;
	}[];
}

export type ProctoringMessageHandler = (data: DetectionResult | StudentUpdate) => void;
export type ProctoringErrorHandler = (error: Event) => void;
export type ProctoringCloseHandler = (event: CloseEvent) => void;

// Student Proctoring Socket - connects to /ws/exam/{session_id}
export class StudentProctoringSocket {
	private ws: WebSocket | null = null;
	private sessionId: string;
	private onMessage: ProctoringMessageHandler;
	private onError?: ProctoringErrorHandler;
	private onClose?: ProctoringCloseHandler;
	private reconnectAttempts = 0;
	private maxReconnectAttempts = 5;
	private isManualClose = false;

	constructor(
		sessionId: string,
		onMessage: ProctoringMessageHandler,
		onError?: ProctoringErrorHandler,
		onClose?: ProctoringCloseHandler
	) {
		this.sessionId = sessionId;
		this.onMessage = onMessage;
		this.onError = onError;
		this.onClose = onClose;
	}

	connect(): void {
		this.isManualClose = false;
		const url = `${PROCTORING_WS_BASE}/ws/exam/${this.sessionId}`;
		
		try {
			this.ws = new WebSocket(url);

			this.ws.onopen = () => {
				console.log(`[Proctoring] Connected to session ${this.sessionId}`);
				this.reconnectAttempts = 0;
			};

			this.ws.onmessage = (event) => {
				try {
					const data = JSON.parse(event.data);
					this.onMessage(data);
				} catch (e) {
					console.error("[Proctoring] Failed to parse message:", e);
				}
			};

			this.ws.onerror = (error) => {
				console.error("[Proctoring] WebSocket error:", error);
				this.onError?.(error);
			};

			this.ws.onclose = (event) => {
				console.log(`[Proctoring] Connection closed: ${event.code}`);
				this.onClose?.(event);
				
				// Auto-reconnect if not manually closed
				if (!this.isManualClose && this.reconnectAttempts < this.maxReconnectAttempts) {
					this.reconnectAttempts++;
					console.log(`[Proctoring] Reconnecting (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
					setTimeout(() => this.connect(), 2000 * this.reconnectAttempts);
				}
			};
		} catch (error) {
			console.error("[Proctoring] Failed to create WebSocket:", error);
		}
	}

	// Send video frame for analysis
	sendFrame(frameData: string): void {
		if (this.ws?.readyState === WebSocket.OPEN) {
			this.ws.send(JSON.stringify({
				type: "frame",
				data: frameData,
			}));
		}
	}

	// Report browser event (tab switch, etc.)
	sendBrowserEvent(eventType: string, details?: Record<string, unknown>): void {
		if (this.ws?.readyState === WebSocket.OPEN) {
			this.ws.send(JSON.stringify({
				type: "browser_event",
				event_type: eventType,
				details,
			}));
		}
	}

	// Ping to keep connection alive
	ping(): void {
		if (this.ws?.readyState === WebSocket.OPEN) {
			this.ws.send(JSON.stringify({ type: "ping" }));
		}
	}

	disconnect(): void {
		this.isManualClose = true;
		if (this.ws) {
			this.ws.close();
			this.ws = null;
		}
	}

	isConnected(): boolean {
		return this.ws?.readyState === WebSocket.OPEN;
	}
}

// Teacher Proctoring Socket - connects to /ws/teacher/{exam_id}
export class TeacherProctoringSocket {
	private ws: WebSocket | null = null;
	private examId: string;
	private onMessage: (data: StudentUpdate) => void;
	private onError?: ProctoringErrorHandler;
	private onClose?: ProctoringCloseHandler;
	private reconnectAttempts = 0;
	private maxReconnectAttempts = 5;
	private isManualClose = false;
	private pingInterval: NodeJS.Timeout | null = null;

	constructor(
		examId: string,
		onMessage: (data: StudentUpdate) => void,
		onError?: ProctoringErrorHandler,
		onClose?: ProctoringCloseHandler
	) {
		this.examId = examId;
		this.onMessage = onMessage;
		this.onError = onError;
		this.onClose = onClose;
	}

	connect(): void {
		this.isManualClose = false;
		const url = `${PROCTORING_WS_BASE}/ws/teacher/${this.examId}`;
		
		try {
			this.ws = new WebSocket(url);

			this.ws.onopen = () => {
				console.log(`[TeacherProctor] Connected to exam ${this.examId}`);
				this.reconnectAttempts = 0;
				
				// Start ping interval
				this.pingInterval = setInterval(() => {
					this.ping();
				}, 30000);
			};

			this.ws.onmessage = (event) => {
				try {
					const data = JSON.parse(event.data);
					if (data.type !== "pong") {
						this.onMessage(data);
					}
				} catch (e) {
					console.error("[TeacherProctor] Failed to parse message:", e);
				}
			};

			this.ws.onerror = (error) => {
				console.error("[TeacherProctor] WebSocket error:", error);
				this.onError?.(error);
			};

			this.ws.onclose = (event) => {
				console.log(`[TeacherProctor] Connection closed: ${event.code}`);
				if (this.pingInterval) {
					clearInterval(this.pingInterval);
					this.pingInterval = null;
				}
				this.onClose?.(event);
				
				// Auto-reconnect if not manually closed
				if (!this.isManualClose && this.reconnectAttempts < this.maxReconnectAttempts) {
					this.reconnectAttempts++;
					console.log(`[TeacherProctor] Reconnecting (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
					setTimeout(() => this.connect(), 2000 * this.reconnectAttempts);
				}
			};
		} catch (error) {
			console.error("[TeacherProctor] Failed to create WebSocket:", error);
		}
	}

	ping(): void {
		if (this.ws?.readyState === WebSocket.OPEN) {
			this.ws.send(JSON.stringify({ type: "ping" }));
		}
	}

	disconnect(): void {
		this.isManualClose = true;
		if (this.pingInterval) {
			clearInterval(this.pingInterval);
			this.pingInterval = null;
		}
		if (this.ws) {
			this.ws.close();
			this.ws = null;
		}
	}

	isConnected(): boolean {
		return this.ws?.readyState === WebSocket.OPEN;
	}
}
